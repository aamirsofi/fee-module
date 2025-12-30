import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './entities/school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { User, UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private schoolsRepository: Repository<School>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createSchoolDto: CreateSchoolDto, createdById: number): Promise<School> {
    // Create the school
    const school = this.schoolsRepository.create({
      ...createSchoolDto,
      createdById,
    });
    const savedSchool = await this.schoolsRepository.save(school);

    // Auto-create default admin user for the school
    await this.createDefaultAdminUser(savedSchool);

    return savedSchool;
  }

  private async createDefaultAdminUser(school: School): Promise<User> {
    // Generate default admin email: admin@<subdomain>.school
    const defaultEmail = `admin@${school.subdomain}.school`;
    const defaultPassword = `${school.subdomain}_admin123`; // Default password, should be changed on first login

    // Check if admin user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: defaultEmail },
    });

    if (existingUser) {
      // If user exists, just update schoolId if needed
      if (!existingUser.schoolId) {
        existingUser.schoolId = school.id;
        await this.usersRepository.save(existingUser);
      }
      return existingUser;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const adminUser = this.usersRepository.create({
      name: `${school.name} Administrator`,
      email: defaultEmail,
      password: hashedPassword,
      role: UserRole.ADMINISTRATOR,
      schoolId: school.id,
    });

    const savedUser = await this.usersRepository.save(adminUser);

    // Log credentials (in production, send via email or secure channel)
    console.log(`\n✅ Default admin user created for school: ${school.name}`);
    console.log(`📧 Email: ${defaultEmail}`);
    console.log(`🔑 Password: ${defaultPassword}`);
    console.log(`⚠️  Please change password on first login!\n`);

    return savedUser;
  }

  async findAll(): Promise<School[]> {
    return await this.schoolsRepository.find({
      relations: ['createdBy'],
      order: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<School> {
    const school = await this.schoolsRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    return school;
  }

  async findBySubdomain(subdomain: string): Promise<School | null> {
    return await this.schoolsRepository.findOne({
      where: { subdomain },
    });
  }

  async update(id: number, updateSchoolDto: UpdateSchoolDto): Promise<School> {
    const school = await this.findOne(id);
    Object.assign(school, updateSchoolDto);
    return await this.schoolsRepository.save(school);
  }

  async remove(id: number): Promise<void> {
    const school = await this.findOne(id);
    await this.schoolsRepository.remove(school);
  }
}
