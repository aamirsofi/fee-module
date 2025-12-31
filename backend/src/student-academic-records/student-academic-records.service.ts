import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentAcademicRecord, AcademicRecordStatus } from './entities/student-academic-record.entity';
import { CreateStudentAcademicRecordDto } from './dto/create-student-academic-record.dto';
import { UpdateStudentAcademicRecordDto } from './dto/update-student-academic-record.dto';

@Injectable()
export class StudentAcademicRecordsService {
  constructor(
    @InjectRepository(StudentAcademicRecord)
    private studentAcademicRecordsRepository: Repository<StudentAcademicRecord>,
  ) {}

  async create(createDto: CreateStudentAcademicRecordDto): Promise<StudentAcademicRecord> {
    // Check if record already exists for this student and academic year
    const existing = await this.studentAcademicRecordsRepository.findOne({
      where: {
        studentId: createDto.studentId,
        academicYearId: createDto.academicYearId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Academic record already exists for this student and academic year`,
      );
    }

    const record = this.studentAcademicRecordsRepository.create(createDto);
    return await this.studentAcademicRecordsRepository.save(record);
  }

  async findAll(studentId?: number, academicYearId?: number): Promise<StudentAcademicRecord[]> {
    const queryBuilder = this.studentAcademicRecordsRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.student', 'student')
      .leftJoinAndSelect('record.academicYear', 'academicYear')
      .leftJoinAndSelect('record.class', 'class')
      .leftJoinAndSelect('record.feeStructures', 'feeStructures');

    if (studentId) {
      queryBuilder.where('record.studentId = :studentId', { studentId });
    }
    if (academicYearId) {
      if (studentId) {
        queryBuilder.andWhere('record.academicYearId = :academicYearId', { academicYearId });
      } else {
        queryBuilder.where('record.academicYearId = :academicYearId', { academicYearId });
      }
    }

    return await queryBuilder.orderBy('academicYear.startDate', 'DESC').getMany();
  }

  async findCurrent(studentId: number): Promise<StudentAcademicRecord | null> {
    return await this.studentAcademicRecordsRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.academicYear', 'academicYear')
      .leftJoinAndSelect('record.class', 'class')
      .where('record.studentId = :studentId', { studentId })
      .andWhere('record.status = :status', { status: AcademicRecordStatus.ACTIVE })
      .andWhere('academicYear.isCurrent = :isCurrent', { isCurrent: true })
      .getOne();
  }

  async findOne(id: number): Promise<StudentAcademicRecord> {
    const record = await this.studentAcademicRecordsRepository.findOne({
      where: { id },
      relations: ['student', 'academicYear', 'class', 'feeStructures'],
    });

    if (!record) {
      throw new NotFoundException(`Student academic record with ID ${id} not found`);
    }

    return record;
  }

  async update(
    id: number,
    updateDto: UpdateStudentAcademicRecordDto,
  ): Promise<StudentAcademicRecord> {
    const record = await this.findOne(id);
    Object.assign(record, updateDto);
    return await this.studentAcademicRecordsRepository.save(record);
  }

  async remove(id: number): Promise<void> {
    const record = await this.findOne(id);
    await this.studentAcademicRecordsRepository.remove(record);
  }

  /**
   * Promote student to next academic year
   */
  async promoteStudent(
    studentId: number,
    currentAcademicYearId: number,
    nextAcademicYearId: number,
    nextClassId: number,
    section?: string,
  ): Promise<StudentAcademicRecord> {
    // Mark current record as promoted
    const currentRecord = await this.studentAcademicRecordsRepository.findOne({
      where: {
        studentId,
        academicYearId: currentAcademicYearId,
      },
    });

    if (currentRecord) {
      currentRecord.status = AcademicRecordStatus.PROMOTED;
      await this.studentAcademicRecordsRepository.save(currentRecord);
    }

    // Create new record for next academic year
    return await this.create({
      studentId,
      academicYearId: nextAcademicYearId,
      classId: nextClassId,
      section,
      status: AcademicRecordStatus.ACTIVE,
    });
  }
}

