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
import { Student } from '../students/entities/student.entity';
import { Payment } from '../payments/entities/payment.entity';

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
    private schoolsService: SchoolsService,
    private usersService: UsersService,
  ) {}

  // ========== SCHOOL MANAGEMENT ==========
  async createSchool(createSchoolDto: CreateSchoolDto, createdById: number) {
    return await this.schoolsService.create(createSchoolDto, createdById);
  }

  async getAllSchools() {
    return await this.schoolsService.findAll();
  }

  async getSchool(id: number) {
    return await this.schoolsService.findOne(id);
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
        .where('payment.status = :status', { status: 'completed' })
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

