import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, ILike } from 'typeorm';
import { School, SchoolStatus } from '../schools/entities/school.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateSchoolDto } from '../schools/dto/create-school.dto';
import { UpdateSchoolDto } from '../schools/dto/update-school.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { SchoolsService } from '../schools/schools.service';
import { UsersService } from '../users/users.service';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { FeeStructure } from '../fee-structures/entities/fee-structure.entity';
import { FeeCategory, CategoryStatus, FeeCategoryType } from '../fee-categories/entities/fee-category.entity';
import { getPaginationParams, createPaginatedResponse } from '../common/utils/pagination.util';
import { BulkImportStudentsDto } from './dto/bulk-import-students.dto';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { CreateFeeCategoryDto } from '../fee-categories/dto/create-fee-category.dto';
import { UpdateFeeCategoryDto } from '../fee-categories/dto/update-fee-category.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(School)
    private schoolsRepository: Repository<School>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(FeeStructure)
    private feeStructuresRepository: Repository<FeeStructure>,
    @InjectRepository(FeeCategory)
    private feeCategoriesRepository: Repository<FeeCategory>,
    private schoolsService: SchoolsService,
    private usersService: UsersService,
  ) {}

  // ========== SCHOOL MANAGEMENT ==========
  async createSchool(createSchoolDto: CreateSchoolDto, createdById: number) {
    return await this.schoolsService.create(createSchoolDto, createdById);
  }

  async getAllSchools(page: number = 1, limit: number = 10, status?: string) {
    try {
      const { skip, limit: take } = getPaginationParams(page, limit);
      
      // Build where clause
      const whereConditions: any = {};
      if (status) {
        whereConditions.status = status as SchoolStatus;
      }
      
      // Debug logging
      console.log('getAllSchools service called with:', { page, limit, skip, status });
      
      const [schools, total] = await this.schoolsRepository.findAndCount({
        where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
        relations: { createdBy: true },
        order: { createdAt: 'desc' },
        skip,
        take,
      });

      // Debug logging
      console.log('Query result:', { schoolsCount: schools.length, total, page, limit });

      return createPaginatedResponse(schools, total, page, limit);
    } catch (error) {
      console.error('Error in getAllSchools:', error);
      throw error;
    }
  }

  async getSchool(id: number) {
    return await this.schoolsService.findOne(id);
  }

  async getSchoolDetails(id: number) {
    // Get school with creator info
    const school = await this.schoolsRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    // Get all related data in parallel
    const [students, users, payments, feeStructures] = await Promise.all([
      // Students
      this.studentsRepository.find({
        where: { schoolId: id },
        order: { createdAt: 'desc' },
        take: 100, // Limit to recent 100 for performance
      }),
      // Users assigned to this school
      this.usersRepository.find({
        where: { schoolId: id },
        select: ['id', 'name', 'email', 'role', 'schoolId', 'createdAt', 'updatedAt'],
        order: { createdAt: 'desc' },
      }),
      // Payments
      this.paymentsRepository.find({
        where: { schoolId: id },
        relations: ['student', 'feeStructure'],
        order: { createdAt: 'desc' },
        take: 100, // Limit to recent 100 for performance
      }),
      // Fee Structures
      this.feeStructuresRepository.find({
        where: { schoolId: id },
        relations: ['category'],
        order: { createdAt: 'desc' },
      }),
    ]);

    // Calculate statistics
    const stats = {
      totalStudents: await this.studentsRepository.count({ where: { schoolId: id } }),
      activeStudents: await this.studentsRepository.count({
        where: { schoolId: id, status: StudentStatus.ACTIVE },
      }),
      totalUsers: users.length,
      totalPayments: await this.paymentsRepository.count({ where: { schoolId: id } }),
      completedPayments: await this.paymentsRepository.count({
        where: { schoolId: id, status: PaymentStatus.COMPLETED },
      }),
      totalRevenue: await this.paymentsRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.schoolId = :schoolId', { schoolId: id })
        .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne()
        .then((result) => parseFloat(result?.total || '0')),
      totalFeeStructures: feeStructures.length,
      activeFeeStructures: feeStructures.filter((fs) => fs.status === 'active').length,
    };

    return {
      school,
      students,
      users,
      payments,
      feeStructures,
      stats,
    };
  }

  async updateSchool(id: number, updateSchoolDto: UpdateSchoolDto) {
    return await this.schoolsService.update(id, updateSchoolDto);
  }

  async deleteSchool(id: number) {
    return await this.schoolsService.remove(id);
  }

  // ========== USER MANAGEMENT ==========
  /**
   * Check if a school has at least one administrator
   */
  private async hasAdministrator(schoolId: number): Promise<boolean> {
    const adminCount = await this.usersRepository.count({
      where: {
        schoolId,
        role: UserRole.ADMINISTRATOR,
      },
    });
    return adminCount > 0;
  }

  async createUser(createUserDto: CreateUserDto) {
    // If user has a schoolId and is not an administrator, ensure school has at least one administrator
    if (createUserDto.schoolId && createUserDto.role !== UserRole.ADMINISTRATOR) {
      const hasAdmin = await this.hasAdministrator(createUserDto.schoolId);
      if (!hasAdmin) {
        throw new BadRequestException(
          'Each school must have at least one administrator. Please assign an administrator role to this user or ensure the school has an existing administrator.'
        );
      }
    }
    return await this.usersService.create(createUserDto);
  }

  async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    try {
      const { skip, limit: take } = getPaginationParams(page, limit);
      
      // Build where clause - exclude super_admin users
      let whereConditions: any = {
        role: Not(UserRole.SUPER_ADMIN),
      };

      // Add search filter if provided
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        whereConditions = [
          {
            role: Not(UserRole.SUPER_ADMIN),
            name: ILike(searchTerm),
          },
          {
            role: Not(UserRole.SUPER_ADMIN),
            email: ILike(searchTerm),
          },
        ];
      }

      const [users, total] = await this.usersRepository.findAndCount({
        relations: ['school'],
        where: whereConditions,
        order: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          schoolId: true,
          createdAt: true,
          updatedAt: true,
          school: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      });

      return createPaginatedResponse(users, total, page, limit);
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  async getUser(id: number) {
    return await this.usersService.findOne(id);
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersService.findOne(id);
    
    // Prevent changing SUPER_ADMIN role
    if (user.role === UserRole.SUPER_ADMIN && updateUserDto.role && updateUserDto.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot change SUPER_ADMIN role');
    }

    // Check if changing role from administrator to something else
    const schoolId = updateUserDto.schoolId !== undefined ? updateUserDto.schoolId : user.schoolId;
    const newRole = updateUserDto.role !== undefined ? updateUserDto.role : user.role;
    
    // If user is currently an administrator and role is being changed to non-administrator
    if (user.role === UserRole.ADMINISTRATOR && newRole !== UserRole.ADMINISTRATOR && schoolId) {
      // Count other administrators for this school (excluding current user)
      const adminCount = await this.usersRepository.count({
        where: {
          schoolId,
          role: UserRole.ADMINISTRATOR,
        },
      });

      // If this is the only administrator, prevent the change
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot change role: Each school must have at least one administrator. Please assign another user as administrator first.'
        );
      }
    }

    // If schoolId is being removed and user is an administrator, check if they're the last administrator
    if (updateUserDto.schoolId === null && user.role === UserRole.ADMINISTRATOR && user.schoolId) {
      const adminCount = await this.usersRepository.count({
        where: {
          schoolId: user.schoolId,
          role: UserRole.ADMINISTRATOR,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot remove user from school: Each school must have at least one administrator. Please assign another user as administrator first.'
        );
      }
    }

    // If schoolId is being changed and new role is not administrator, ensure new school has an administrator
    if (updateUserDto.schoolId !== undefined && updateUserDto.schoolId !== null && updateUserDto.schoolId !== user.schoolId && newRole !== UserRole.ADMINISTRATOR) {
      const hasAdmin = await this.hasAdministrator(updateUserDto.schoolId);
      if (!hasAdmin) {
        throw new BadRequestException(
          'Cannot assign user to this school: Each school must have at least one administrator. Please assign an administrator role to this user or ensure the school has an existing administrator.'
        );
      }
    }

    return await this.usersService.update(id, updateUserDto);
  }

  async deleteUser(id: number) {
    const user = await this.usersService.findOne(id);
    
    // Prevent deleting SUPER_ADMIN
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot delete SUPER_ADMIN user');
    }

    // Prevent deleting the last administrator of a school
    if (user.role === UserRole.ADMINISTRATOR && user.schoolId) {
      const adminCount = await this.usersRepository.count({
        where: {
          schoolId: user.schoolId,
          role: UserRole.ADMINISTRATOR,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot delete user: Each school must have at least one administrator. Please assign another user as administrator before deleting this user.'
        );
      }
    }

    return await this.usersService.remove(id);
  }

  // ========== DASHBOARD & STATS ==========
  async getDashboardStats() {
    const [totalSchools, totalUsers, totalStudents, totalPayments] = await Promise.all([
      this.schoolsRepository.count(),
      this.usersRepository.count(),
      this.studentsRepository.count(),
      this.paymentsRepository.count(),
    ]);

    const [totalRevenue, recentSchools] = await Promise.all([
      this.paymentsRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne(),
      this.schoolsRepository.find({
        take: 5,
        order: { createdAt: 'desc' },
      }),
    ]);

    return {
      totalSchools,
      totalUsers,
      totalStudents,
      totalPayments,
      totalRevenue: totalRevenue?.total || 0,
      recentSchools,
    };
  }

  async bulkImportStudents(
    schoolId: number,
    bulkImportDto: BulkImportStudentsDto,
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; studentId?: string; email?: string; error: string }>;
    created: Array<{ studentId: string; email: string; name: string }>;
  }> {
    // Verify school exists
    const school = await this.schoolsRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; studentId?: string; email?: string; error: string }>,
      created: [] as Array<{ studentId: string; email: string; name: string }>,
    };

    // Process each student
    for (let i = 0; i < bulkImportDto.students.length; i++) {
      const studentDto = bulkImportDto.students[i];
      const rowNumber = i + 1; // 1-indexed for user-friendly error messages

      try {
        // Validate required fields
        if (!studentDto.studentId?.trim()) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Student ID is required',
          });
          continue;
        }

        if (!studentDto.firstName?.trim() || !studentDto.lastName?.trim()) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentDto.studentId,
            error: 'First name and last name are required',
          });
          continue;
        }

        if (!studentDto.email?.trim()) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentDto.studentId,
            error: 'Email is required',
          });
          continue;
        }

        if (!studentDto.class?.trim()) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentDto.studentId,
            error: 'Class is required',
          });
          continue;
        }

        // Check for duplicates within the import batch
        const duplicateInBatch = bulkImportDto.students
          .slice(0, i)
          .some(
            (s) =>
              s.studentId?.trim().toLowerCase() === studentDto.studentId.trim().toLowerCase() ||
              s.email?.trim().toLowerCase() === studentDto.email.trim().toLowerCase(),
          );

        if (duplicateInBatch) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentDto.studentId,
            email: studentDto.email,
            error: 'Duplicate student ID or email in import file',
          });
          continue;
        }

        // Check if student already exists in database
        const existingStudentId = await this.studentsRepository.findOne({
          where: {
            studentId: studentDto.studentId.trim(),
            schoolId,
          },
        });

        if (existingStudentId) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentDto.studentId,
            error: `Student ID "${studentDto.studentId}" already exists for this school`,
          });
          continue;
        }

        const existingEmail = await this.studentsRepository.findOne({
          where: {
            email: studentDto.email.trim().toLowerCase(),
            schoolId,
          },
        });

        if (existingEmail) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            studentId: studentDto.studentId,
            email: studentDto.email,
            error: `Email "${studentDto.email}" already exists for this school`,
          });
          continue;
        }

        // Create the student
        const studentData: Partial<Student> = {
          studentId: studentDto.studentId.trim(),
          firstName: studentDto.firstName.trim(),
          lastName: studentDto.lastName.trim(),
          email: studentDto.email.trim().toLowerCase(),
          phone: studentDto.phone?.trim() || undefined,
          address: studentDto.address?.trim() || undefined,
          class: studentDto.class.trim(),
          section: studentDto.section?.trim() || undefined,
          status: (studentDto.status || StudentStatus.ACTIVE) as StudentStatus,
          schoolId,
        };

        const student = this.studentsRepository.create(studentData);
        const savedStudent = await this.studentsRepository.save(student);
        results.success++;
        results.created.push({
          studentId: savedStudent.studentId,
          email: savedStudent.email,
          name: `${savedStudent.firstName} ${savedStudent.lastName}`,
        });
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          studentId: studentDto.studentId,
          email: studentDto.email,
          error: error.message || 'Failed to create student',
        });
      }
    }

    return results;
  }

  // ========== FEE CATEGORIES MANAGEMENT ==========
  async getAllFeeCategories(
    page: number = 1,
    limit: number = 10,
    search?: string,
    schoolId?: number,
    type?: FeeCategoryType,
  ) {
    const { skip, limit: take } = getPaginationParams(page, limit);

    const queryBuilder = this.feeCategoriesRepository
      .createQueryBuilder('feeCategory')
      .leftJoinAndSelect('feeCategory.school', 'school')
      .orderBy('feeCategory.createdAt', 'DESC');

    // Build where conditions
    const whereConditions: any[] = [];
    const whereParams: any = {};

    // Filter by school if provided
    if (schoolId) {
      whereConditions.push('feeCategory.schoolId = :schoolId');
      whereParams.schoolId = schoolId;
    }

    // Filter by type if provided
    if (type) {
      whereConditions.push('feeCategory.type = :type');
      whereParams.type = type;
    }

    // Apply where conditions
    if (whereConditions.length > 0) {
      queryBuilder.where(whereConditions.join(' AND '), whereParams);
    }

    // Search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      if (whereConditions.length > 0) {
        queryBuilder.andWhere(
          '(feeCategory.name ILIKE :search OR feeCategory.description ILIKE :search)',
          { search: searchTerm },
        );
      } else {
        queryBuilder.where(
          '(feeCategory.name ILIKE :search OR feeCategory.description ILIKE :search)',
          { search: searchTerm },
        );
      }
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return createPaginatedResponse(data, total, page, take);
  }

  async getFeeCategoryById(id: number) {
    const feeCategory = await this.feeCategoriesRepository.findOne({
      where: { id },
      relations: ['school', 'feeStructures'],
    });

    if (!feeCategory) {
      throw new NotFoundException(`Fee category with ID ${id} not found`);
    }

    return feeCategory;
  }

  async createFeeCategory(createFeeCategoryDto: CreateFeeCategoryDto, schoolId: number) {
    // Verify school exists
    const school = await this.schoolsRepository.findOne({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    // Check for duplicate name within the same school
    const existing = await this.feeCategoriesRepository.findOne({
      where: {
        name: createFeeCategoryDto.name.trim(),
        schoolId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Fee category with name "${createFeeCategoryDto.name}" already exists for this school`,
      );
    }

    const feeCategory = this.feeCategoriesRepository.create({
      ...createFeeCategoryDto,
      name: createFeeCategoryDto.name.trim(),
      type: createFeeCategoryDto.type || FeeCategoryType.SCHOOL,
      schoolId,
    });

    return await this.feeCategoriesRepository.save(feeCategory);
  }

  async updateFeeCategory(
    id: number,
    updateFeeCategoryDto: UpdateFeeCategoryDto,
    schoolId?: number,
  ) {
    const feeCategory = await this.feeCategoriesRepository.findOne({
      where: { id },
    });

    if (!feeCategory) {
      throw new NotFoundException(`Fee category with ID ${id} not found`);
    }

    // If schoolId is provided, verify it matches
    if (schoolId && feeCategory.schoolId !== schoolId) {
      throw new BadRequestException(
        `Fee category does not belong to school with ID ${schoolId}`,
      );
    }

    // Check for duplicate name if name is being updated
    if (updateFeeCategoryDto.name && updateFeeCategoryDto.name.trim() !== feeCategory.name) {
      const existing = await this.feeCategoriesRepository.findOne({
        where: {
          name: updateFeeCategoryDto.name.trim(),
          schoolId: feeCategory.schoolId,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Fee category with name "${updateFeeCategoryDto.name}" already exists for this school`,
        );
      }
    }

    Object.assign(feeCategory, {
      ...updateFeeCategoryDto,
      name: updateFeeCategoryDto.name?.trim() || feeCategory.name,
    });

    return await this.feeCategoriesRepository.save(feeCategory);
  }

  async deleteFeeCategory(id: number, schoolId?: number) {
    const feeCategory = await this.feeCategoriesRepository.findOne({
      where: { id },
      relations: ['feeStructures'],
    });

    if (!feeCategory) {
      throw new NotFoundException(`Fee category with ID ${id} not found`);
    }

    // If schoolId is provided, verify it matches
    if (schoolId && feeCategory.schoolId !== schoolId) {
      throw new BadRequestException(
        `Fee category does not belong to school with ID ${schoolId}`,
      );
    }

    // Check if fee category has associated fee structures
    if (feeCategory.feeStructures && feeCategory.feeStructures.length > 0) {
      throw new BadRequestException(
        `Cannot delete fee category. It has ${feeCategory.feeStructures.length} associated fee structure(s). Please remove or reassign them first.`,
      );
    }

    await this.feeCategoriesRepository.remove(feeCategory);
    return { message: 'Fee category deleted successfully' };
  }
}

