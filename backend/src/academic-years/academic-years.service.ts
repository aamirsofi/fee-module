import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from './entities/academic-year.entity';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(
    @InjectRepository(AcademicYear)
    private academicYearsRepository: Repository<AcademicYear>,
  ) {}

  async create(createAcademicYearDto: CreateAcademicYearDto, schoolId: number): Promise<AcademicYear> {
    // Validate dates
    const startDate = new Date(createAcademicYearDto.startDate);
    const endDate = new Date(createAcademicYearDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // If setting as current, unset other current academic years for this school
    if (createAcademicYearDto.isCurrent) {
      await this.academicYearsRepository.update(
        { schoolId, isCurrent: true },
        { isCurrent: false },
      );
    }

    const academicYear = this.academicYearsRepository.create({
      ...createAcademicYearDto,
      startDate,
      endDate,
      schoolId,
    });

    return await this.academicYearsRepository.save(academicYear);
  }

  async findAll(schoolId: number): Promise<AcademicYear[]> {
    return await this.academicYearsRepository.find({
      where: { schoolId },
      order: { startDate: 'DESC' },
    });
  }

  async findCurrent(schoolId: number): Promise<AcademicYear | null> {
    return await this.academicYearsRepository.findOne({
      where: { schoolId, isCurrent: true },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<AcademicYear> {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }

    const academicYear = await this.academicYearsRepository.findOne({ where });

    if (!academicYear) {
      throw new NotFoundException(`Academic year with ID ${id} not found`);
    }

    return academicYear;
  }

  async update(
    id: number,
    updateAcademicYearDto: UpdateAcademicYearDto,
    schoolId?: number,
  ): Promise<AcademicYear> {
    const academicYear = await this.findOne(id, schoolId);

    // If setting as current, unset other current academic years for this school
    if (updateAcademicYearDto.isCurrent) {
      await this.academicYearsRepository
        .createQueryBuilder()
        .update(AcademicYear)
        .set({ isCurrent: false })
        .where('schoolId = :schoolId', { schoolId: academicYear.schoolId })
        .andWhere('isCurrent = :isCurrent', { isCurrent: true })
        .andWhere('id != :id', { id })
        .execute();
    }

    // Validate dates if provided
    if (updateAcademicYearDto.startDate || updateAcademicYearDto.endDate) {
      const startDate = updateAcademicYearDto.startDate
        ? new Date(updateAcademicYearDto.startDate)
        : academicYear.startDate;
      const endDate = updateAcademicYearDto.endDate
        ? new Date(updateAcademicYearDto.endDate)
        : academicYear.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    Object.assign(academicYear, {
      ...updateAcademicYearDto,
      startDate: updateAcademicYearDto.startDate
        ? new Date(updateAcademicYearDto.startDate)
        : academicYear.startDate,
      endDate: updateAcademicYearDto.endDate
        ? new Date(updateAcademicYearDto.endDate)
        : academicYear.endDate,
    });

    return await this.academicYearsRepository.save(academicYear);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const academicYear = await this.findOne(id, schoolId);
    await this.academicYearsRepository.remove(academicYear);
  }

  /**
   * Get or create current academic year for a school
   * If no current year exists, creates one based on current date
   */
  async getOrCreateCurrent(schoolId: number): Promise<AcademicYear> {
    let currentYear = await this.findCurrent(schoolId);

    if (!currentYear) {
      // Create a default academic year based on current date
      const now = new Date();
      const currentYearNum = now.getFullYear();
      const month = now.getMonth(); // 0-11

      // If before April, academic year is previous year to current year
      // If April or after, academic year is current year to next year
      let startYear: number;
      let endYear: number;

      if (month < 3) {
        // Jan-Mar: Academic year is previous year to current year
        startYear = currentYearNum - 1;
        endYear = currentYearNum;
      } else {
        // Apr-Dec: Academic year is current year to next year
        startYear = currentYearNum;
        endYear = currentYearNum + 1;
      }

      const startDate = new Date(startYear, 3, 1); // April 1
      const endDate = new Date(endYear, 2, 31); // March 31

      currentYear = await this.create(
        {
          name: `${startYear}-${endYear}`,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          isCurrent: true,
        },
        schoolId,
      );
    }

    return currentYear;
  }
}

