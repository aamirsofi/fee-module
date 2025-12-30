import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { School } from '../schools/entities/school.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(School)
    private schoolsRepository: Repository<School>,
  ) {}

  async create(createStudentDto: CreateStudentDto, schoolId: number): Promise<Student> {
    if (!schoolId) {
      throw new BadRequestException('School ID is required to create a student');
    }

    // Validate that the school exists
    const school = await this.schoolsRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new BadRequestException(
        `School with ID ${schoolId} does not exist. Please ensure you have a valid school assigned.`,
      );
    }

    // Validate required fields
    if (!createStudentDto.studentId || !createStudentDto.studentId.trim()) {
      throw new BadRequestException('Student ID is required');
    }
    if (!createStudentDto.firstName || !createStudentDto.firstName.trim()) {
      throw new BadRequestException('First name is required');
    }
    if (!createStudentDto.lastName || !createStudentDto.lastName.trim()) {
      throw new BadRequestException('Last name is required');
    }
    if (!createStudentDto.email || !createStudentDto.email.trim()) {
      throw new BadRequestException('Email is required');
    }
    if (!createStudentDto.class || !createStudentDto.class.trim()) {
      throw new BadRequestException('Class is required');
    }

    // Check if studentId already exists for this school
    const existingStudentId = await this.studentsRepository.findOne({
      where: { studentId: createStudentDto.studentId.trim(), schoolId },
    });
    if (existingStudentId) {
      throw new BadRequestException(
        `Student ID "${createStudentDto.studentId}" already exists for this school`,
      );
    }

    // Check if email already exists for this school
    const existingEmail = await this.studentsRepository.findOne({
      where: { email: createStudentDto.email.trim().toLowerCase(), schoolId },
    });
    if (existingEmail) {
      throw new BadRequestException(
        `Email "${createStudentDto.email}" already exists for this school`,
      );
    }

    try {
      // Ensure status is set (default to ACTIVE if not provided)
      const status = createStudentDto.status || 'active';

      const student = this.studentsRepository.create({
        studentId: createStudentDto.studentId.trim(),
        firstName: createStudentDto.firstName.trim(),
        lastName: createStudentDto.lastName.trim(),
        email: createStudentDto.email.trim().toLowerCase(),
        phone: createStudentDto.phone?.trim() || null,
        address: createStudentDto.address?.trim() || null,
        class: createStudentDto.class.trim(),
        section: createStudentDto.section?.trim() || null,
        status: status as any,
        schoolId,
      } as Student);
      return await this.studentsRepository.save(student);
    } catch (error: any) {
      // Log the error for debugging
      console.error('Error creating student:', error);
      console.error('Error code:', error.code);
      console.error('Error detail:', error.detail);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      // Handle database constraint violations
      if (error.code === '23505') {
        // PostgreSQL unique violation
        if (error.detail?.includes('studentId') || error.detail?.includes('student_id')) {
          throw new BadRequestException(
            `Student ID "${createStudentDto.studentId}" already exists`,
          );
        }
        if (error.detail?.includes('email')) {
          throw new BadRequestException(`Email "${createStudentDto.email}" already exists`);
        }
        throw new BadRequestException('A student with this information already exists');
      }

      // Handle other database errors
      if (error.code === '23503') {
        // Foreign key violation
        throw new BadRequestException('Invalid school ID or related record not found');
      }

      // Handle validation errors
      if (error.name === 'QueryFailedError') {
        throw new BadRequestException(`Database error: ${error.message}`);
      }

      // Re-throw other errors with more context
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create student: ${error.message || 'Unknown error'}`,
      );
    }
  }

  async findAll(schoolId?: number): Promise<Student[]> {
    const where: any = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await this.studentsRepository.find({
      where,
      relations: ['school', 'user'],
      order: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<Student> {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    const student = await this.studentsRepository.findOne({
      where,
      relations: ['school', 'user', 'payments', 'feeStructures'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async update(
    id: number,
    updateStudentDto: UpdateStudentDto,
    schoolId?: number,
  ): Promise<Student> {
    const student = await this.findOne(id, schoolId);
    Object.assign(student, updateStudentDto);
    return await this.studentsRepository.save(student);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const student = await this.findOne(id, schoolId);
    await this.studentsRepository.remove(student);
  }
}
