import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(`A user with email "${createUserDto.email}" already exists.`);
    }

    try {
      const user = this.usersRepository.create(createUserDto);
      return await this.usersRepository.save(user);
    } catch (error: any) {
      // Handle PostgreSQL unique constraint violations (error code 23505)
      if (
        error.code === '23505' ||
        (error instanceof QueryFailedError && error.message.includes('unique constraint'))
      ) {
        // Check error detail for specific field information
        const errorDetail = error.detail || error.message || '';

        if (
          errorDetail.includes('email') ||
          errorDetail.includes('UQ_') ||
          error.message.includes('email')
        ) {
          throw new ConflictException(`A user with email "${createUserDto.email}" already exists.`);
        }
        // Generic unique constraint violation
        throw new ConflictException('A record with the same unique value already exists.');
      }
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      select: ['id', 'name', 'email', 'role', 'schoolId', 'createdAt', 'updatedAt'],
      order: { createdAt: 'desc' },
    });
  }

  async findBySchool(schoolId: number): Promise<User[]> {
    return await this.usersRepository.find({
      where: { schoolId },
      select: ['id', 'name', 'email', 'role', 'schoolId', 'createdAt', 'updatedAt'],
      order: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'schoolId', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'role', 'schoolId', 'createdAt', 'updatedAt'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`A user with email "${updateUserDto.email}" already exists.`);
      }
    }

    try {
      Object.assign(user, updateUserDto);
      return await this.usersRepository.save(user);
    } catch (error: any) {
      // Handle PostgreSQL unique constraint violations (error code 23505)
      if (
        error.code === '23505' ||
        (error instanceof QueryFailedError && error.message.includes('unique constraint'))
      ) {
        // Check error detail for specific field information
        const errorDetail = error.detail || error.message || '';

        if (
          errorDetail.includes('email') ||
          errorDetail.includes('UQ_') ||
          error.message.includes('email')
        ) {
          throw new ConflictException(
            `A user with email "${updateUserDto.email || user.email}" already exists.`,
          );
        }
        // Generic unique constraint violation
        throw new ConflictException('A record with the same unique value already exists.');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
