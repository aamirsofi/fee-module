import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../schools/entities/school.entity';
import { User } from '../users/entities/user.entity';
import { CreateSchoolDto } from '../schools/dto/create-school.dto';
import { UpdateSchoolDto } from '../schools/dto/update-school.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { SchoolsService } from '../schools/schools.service';
import { UsersService } from '../users/users.service';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { FeeStructure } from '../fee-structures/entities/fee-structure.entity';
import { getPaginationParams, createPaginatedResponse } from '../common/utils/pagination.util';

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
    private schoolsService: SchoolsService,
    private usersService: UsersService,
  ) {}

  // ========== SCHOOL MANAGEMENT ==========
  async createSchool(createSchoolDto: CreateSchoolDto, createdById: number) {
    return await this.schoolsService.create(createSchoolDto, createdById);
  }

  async getAllSchools(page: number = 1, limit: number = 10) {
    try {
      const { skip, limit: take } = getPaginationParams(page, limit);
      
      // Debug logging
      console.log('getAllSchools service called with:', { page, limit, skip });
      
      const [schools, total] = await this.schoolsRepository.findAndCount({
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
  async createUser(createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  async getAllUsers() {
    return await this.usersRepository.find({
      select: ['id', 'name', 'email', 'role', 'schoolId', 'createdAt', 'updatedAt'],
      relations: ['schools'],
      order: { createdAt: 'desc' },
    });
  }

  async getUser(id: number) {
    return await this.usersService.findOne(id);
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    // Prevent changing SUPER_ADMIN role
    const user = await this.usersService.findOne(id);
    if (user.role === 'super_admin' && updateUserDto.role && updateUserDto.role !== 'super_admin') {
      throw new BadRequestException('Cannot change SUPER_ADMIN role');
    }
    return await this.usersService.update(id, updateUserDto);
  }

  async deleteUser(id: number) {
    const user = await this.usersService.findOne(id);
    if (user.role === 'super_admin') {
      throw new BadRequestException('Cannot delete SUPER_ADMIN user');
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
}

