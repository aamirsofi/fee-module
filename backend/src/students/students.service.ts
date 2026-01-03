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
    if (!createStudentDto.admissionDate) {
      throw new BadRequestException('Admission date is required');
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
        dateOfBirth: createStudentDto.dateOfBirth ? new Date(createStudentDto.dateOfBirth) : null,
        gender: createStudentDto.gender?.trim() || null,
        bloodGroup: createStudentDto.bloodGroup?.trim() || null,
        phone: createStudentDto.phone?.trim() || null,
        address: createStudentDto.address?.trim() || null,
        admissionDate: new Date(createStudentDto.admissionDate),
        admissionNumber: createStudentDto.admissionNumber?.trim() || null,
        photoUrl: createStudentDto.photoUrl?.trim() || null,
        parentName: createStudentDto.parentName?.trim() || null,
        parentEmail: createStudentDto.parentEmail?.trim().toLowerCase() || null,
        parentPhone: createStudentDto.parentPhone?.trim() || null,
        parentRelation: createStudentDto.parentRelation?.trim() || null,
        status: status as any,
        schoolId,
        userId: createStudentDto.userId || null,
        // Route and Transport - only set if valid positive integer
        routeId: (createStudentDto.routeId && createStudentDto.routeId > 0) ? createStudentDto.routeId : null,
        routePlanId: (createStudentDto.routePlanId && createStudentDto.routePlanId > 0) ? createStudentDto.routePlanId : null,
        busNumber: createStudentDto.busNumber?.trim() || null,
        busSeatNumber: createStudentDto.busSeatNumber?.trim() || null,
        shift: createStudentDto.shift?.trim() || null,
        // Financial
        openingBalance: createStudentDto.openingBalance !== undefined ? createStudentDto.openingBalance : null,
        // Bank Account
        bankName: createStudentDto.bankName?.trim() || null,
        branchName: createStudentDto.branchName?.trim() || null,
        bankIfsc: createStudentDto.bankIfsc?.trim() || null,
        bankAccountNumber: createStudentDto.bankAccountNumber?.trim() || null,
        // Additional
        penNumber: createStudentDto.penNumber?.trim() || null,
        aadharNumber: createStudentDto.aadharNumber?.trim() || null,
        admissionFormNumber: createStudentDto.admissionFormNumber?.trim() || null,
        whatsappNo: createStudentDto.whatsappNo?.trim() || null,
        categoryHeadId: (createStudentDto.categoryHeadId && createStudentDto.categoryHeadId > 0) ? createStudentDto.categoryHeadId : null,
        isSibling: createStudentDto.isSibling !== undefined ? createStudentDto.isSibling : false,
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
      relations: ['school', 'user', 'academicRecords', 'academicRecords.academicYear', 'academicRecords.class'],
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
      relations: [
        'school',
        'user',
        'academicRecords',
        'academicRecords.academicYear',
        'academicRecords.class',
        'payments',
        'feeStructures',
      ],
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
    
    // Validate and sanitize foreign key fields before assignment
    const sanitizedDto: any = { ...updateStudentDto };
    
    // Only set foreign key fields if they are valid positive integers
    if (sanitizedDto.routeId !== undefined) {
      sanitizedDto.routeId = (sanitizedDto.routeId && sanitizedDto.routeId > 0) ? sanitizedDto.routeId : null;
    }
    
    if (sanitizedDto.routePlanId !== undefined) {
      sanitizedDto.routePlanId = (sanitizedDto.routePlanId && sanitizedDto.routePlanId > 0) ? sanitizedDto.routePlanId : null;
    }
    
    if (sanitizedDto.categoryHeadId !== undefined) {
      sanitizedDto.categoryHeadId = (sanitizedDto.categoryHeadId && sanitizedDto.categoryHeadId > 0) ? sanitizedDto.categoryHeadId : null;
    }

    // Handle string fields - trim if they exist
    if (sanitizedDto.studentId !== undefined) sanitizedDto.studentId = sanitizedDto.studentId?.trim();
    if (sanitizedDto.firstName !== undefined) sanitizedDto.firstName = sanitizedDto.firstName?.trim();
    if (sanitizedDto.lastName !== undefined) sanitizedDto.lastName = sanitizedDto.lastName?.trim();
    if (sanitizedDto.email !== undefined) sanitizedDto.email = sanitizedDto.email?.trim().toLowerCase();
    if (sanitizedDto.phone !== undefined) sanitizedDto.phone = sanitizedDto.phone?.trim() || null;
    if (sanitizedDto.address !== undefined) sanitizedDto.address = sanitizedDto.address?.trim() || null;
    if (sanitizedDto.admissionNumber !== undefined) sanitizedDto.admissionNumber = sanitizedDto.admissionNumber?.trim() || null;
    if (sanitizedDto.photoUrl !== undefined) sanitizedDto.photoUrl = sanitizedDto.photoUrl?.trim() || null;
    if (sanitizedDto.parentName !== undefined) sanitizedDto.parentName = sanitizedDto.parentName?.trim() || null;
    if (sanitizedDto.parentEmail !== undefined) sanitizedDto.parentEmail = sanitizedDto.parentEmail?.trim().toLowerCase() || null;
    if (sanitizedDto.parentPhone !== undefined) sanitizedDto.parentPhone = sanitizedDto.parentPhone?.trim() || null;
    if (sanitizedDto.parentRelation !== undefined) sanitizedDto.parentRelation = sanitizedDto.parentRelation?.trim() || null;
    if (sanitizedDto.busNumber !== undefined) sanitizedDto.busNumber = sanitizedDto.busNumber?.trim() || null;
    if (sanitizedDto.busSeatNumber !== undefined) sanitizedDto.busSeatNumber = sanitizedDto.busSeatNumber?.trim() || null;
    if (sanitizedDto.shift !== undefined) sanitizedDto.shift = sanitizedDto.shift?.trim() || null;
    if (sanitizedDto.bankName !== undefined) sanitizedDto.bankName = sanitizedDto.bankName?.trim() || null;
    if (sanitizedDto.branchName !== undefined) sanitizedDto.branchName = sanitizedDto.branchName?.trim() || null;
    if (sanitizedDto.bankIfsc !== undefined) sanitizedDto.bankIfsc = sanitizedDto.bankIfsc?.trim() || null;
    if (sanitizedDto.bankAccountNumber !== undefined) sanitizedDto.bankAccountNumber = sanitizedDto.bankAccountNumber?.trim() || null;
    if (sanitizedDto.penNumber !== undefined) sanitizedDto.penNumber = sanitizedDto.penNumber?.trim() || null;
    if (sanitizedDto.aadharNumber !== undefined) sanitizedDto.aadharNumber = sanitizedDto.aadharNumber?.trim() || null;
    if (sanitizedDto.admissionFormNumber !== undefined) sanitizedDto.admissionFormNumber = sanitizedDto.admissionFormNumber?.trim() || null;
    if (sanitizedDto.whatsappNo !== undefined) sanitizedDto.whatsappNo = sanitizedDto.whatsappNo?.trim() || null;
    
    // Handle date fields
    if (sanitizedDto.dateOfBirth !== undefined) {
      sanitizedDto.dateOfBirth = sanitizedDto.dateOfBirth ? new Date(sanitizedDto.dateOfBirth) : null;
    }
    if (sanitizedDto.admissionDate !== undefined) {
      sanitizedDto.admissionDate = sanitizedDto.admissionDate ? new Date(sanitizedDto.admissionDate) : student.admissionDate;
    }
    
    // Handle openingBalance
    if (sanitizedDto.openingBalance !== undefined) {
      sanitizedDto.openingBalance = sanitizedDto.openingBalance !== null && sanitizedDto.openingBalance !== undefined ? sanitizedDto.openingBalance : null;
    }
    
    // Debug: Log the update data
    console.log('Updating student with data:', JSON.stringify(sanitizedDto, null, 2));
    
    Object.assign(student, sanitizedDto);
    return await this.studentsRepository.save(student);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const student = await this.findOne(id, schoolId);
    await this.studentsRepository.remove(student);
  }

  async getLastStudentId(schoolId: number): Promise<number | null> {
    const where: any = { schoolId };
    
    // Get all students for this school, ordered by id descending (most recent first)
    // Then we'll extract the numeric part from studentId
    const students = await this.studentsRepository.find({
      where,
      select: ['studentId'],
      order: { id: 'DESC' },
      take: 100, // Get more to find the highest numeric ID
    });

    if (students.length === 0) {
      return null;
    }

    // Extract numeric parts from all studentIds and find the maximum
    let maxNumericId = 0;
    for (const student of students) {
      // Extract numeric part from studentId (assuming format like "31970" or "STU31970")
      const numericMatch = student.studentId.match(/\d+/);
      if (numericMatch) {
        const numericId = parseInt(numericMatch[0], 10);
        if (numericId > maxNumericId) {
          maxNumericId = numericId;
        }
      }
    }

    return maxNumericId > 0 ? maxNumericId : null;
  }

  async getNextStudentId(schoolId: number): Promise<number> {
    const lastId = await this.getLastStudentId(schoolId);
    return lastId ? lastId + 1 : 1;
  }
}
