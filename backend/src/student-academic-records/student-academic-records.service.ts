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
    // If schoolId is not provided, fetch it from student, class, or academicYear
    let schoolId = createDto.schoolId;
    
    if (!schoolId) {
      // Try to get schoolId from student
      const { Student } = await import('../students/entities/student.entity');
      const studentRepo = this.studentAcademicRecordsRepository.manager.getRepository(Student);
      const student = await studentRepo.findOne({ where: { id: createDto.studentId } });
      
      if (student) {
        schoolId = student.schoolId;
      } else {
        // Try to get from class
        const { Class } = await import('../classes/entities/class.entity');
        const classRepo = this.studentAcademicRecordsRepository.manager.getRepository(Class);
        const classEntity = await classRepo.findOne({ where: { id: createDto.classId } });
        
        if (classEntity) {
          schoolId = classEntity.schoolId;
        } else {
          // Try to get from academicYear
          const { AcademicYear } = await import('../academic-years/entities/academic-year.entity');
          const academicYearRepo = this.studentAcademicRecordsRepository.manager.getRepository(AcademicYear);
          const academicYear = await academicYearRepo.findOne({ where: { id: createDto.academicYearId } });
          
          if (academicYear) {
            schoolId = academicYear.schoolId;
          }
        }
      }
    }

    if (!schoolId) {
      throw new BadRequestException('School ID is required. Could not determine school from student, class, or academic year.');
    }

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

    const record = this.studentAcademicRecordsRepository.create({
      ...createDto,
      schoolId,
    });
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
    console.log('Updating academic record:', id, 'with data:', JSON.stringify(updateDto, null, 2));
    console.log('Current record before update:', JSON.stringify({
      id: record.id,
      studentId: record.studentId,
      academicYearId: record.academicYearId,
      classId: record.classId,
      schoolId: record.schoolId,
      status: record.status
    }, null, 2));
    
    Object.assign(record, updateDto);
    
    const saved = await this.studentAcademicRecordsRepository.save(record);
    
    // Reload the record with relations to get the updated class
    const updated = await this.studentAcademicRecordsRepository.findOne({
      where: { id: saved.id },
      relations: ['student', 'academicYear', 'class', 'feeStructures'],
    });
    
    if (!updated) {
      throw new NotFoundException(`Student academic record with ID ${id} not found after update`);
    }
    
    console.log('Academic record after save and reload:', JSON.stringify({
      id: updated.id,
      studentId: updated.studentId,
      academicYearId: updated.academicYearId,
      classId: updated.classId,
      className: updated.class?.name,
      schoolId: updated.schoolId,
      status: updated.status
    }, null, 2));
    
    return updated;
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
      relations: ['student'],
    });

    if (currentRecord) {
      currentRecord.status = AcademicRecordStatus.PROMOTED;
      await this.studentAcademicRecordsRepository.save(currentRecord);
    }

    // Get schoolId from current record or fetch from student
    let schoolId: number | undefined;
    if (currentRecord?.student) {
      schoolId = currentRecord.student.schoolId;
    } else {
      // If still no schoolId, fetch from student
      const { Student } = await import('../students/entities/student.entity');
      const studentRepo = this.studentAcademicRecordsRepository.manager.getRepository(Student);
      const student = await studentRepo.findOne({ where: { id: studentId } });
      if (student) {
        schoolId = student.schoolId;
      }
    }

    if (!schoolId) {
      throw new BadRequestException('Could not determine school ID for promotion');
    }

    // Create new record for next academic year
    return await this.create({
      studentId,
      academicYearId: nextAcademicYearId,
      classId: nextClassId,
      schoolId,
      section,
      status: AcademicRecordStatus.ACTIVE,
    });
  }
}

