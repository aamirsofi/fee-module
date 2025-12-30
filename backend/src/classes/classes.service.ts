import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Class } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { getPaginationParams, createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
  ) {}

  async create(createClassDto: CreateClassDto, schoolId: number) {
    // Check for duplicate name within the same school
    const existing = await this.classesRepository.findOne({
      where: {
        name: createClassDto.name.trim(),
        schoolId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Class with name "${createClassDto.name}" already exists for this school`,
      );
    }

    const classEntity = this.classesRepository.create({
      ...createClassDto,
      name: createClassDto.name.trim(),
      schoolId,
    });

    return await this.classesRepository.save(classEntity);
  }

  async findAll(
    schoolId: number | undefined,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const { skip, limit: take } = getPaginationParams(page, limit);

    const queryBuilder = this.classesRepository
      .createQueryBuilder('class');
    
    if (schoolId) {
      queryBuilder.where('class.schoolId = :schoolId', { schoolId });
    }

    // Search by name or description
    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(class.name ILike :search OR class.description ILike :search)',
        { search: `%${search.trim()}%` },
      );
    }

    queryBuilder.orderBy('class.name', 'ASC');

    const [classes, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return createPaginatedResponse(classes, total, page, limit);
  }

  async findOne(id: number, schoolId: number) {
    const classEntity = await this.classesRepository.findOne({
      where: { id, schoolId },
      relations: ['school'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return classEntity;
  }

  async update(id: number, updateClassDto: UpdateClassDto, schoolId: number) {
    const classEntity = await this.classesRepository.findOne({
      where: { id, schoolId },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    // Check for duplicate name if name is being updated
    if (updateClassDto.name && updateClassDto.name.trim() !== classEntity.name) {
      const existing = await this.classesRepository.findOne({
        where: {
          name: updateClassDto.name.trim(),
          schoolId,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Class with name "${updateClassDto.name}" already exists for this school`,
        );
      }
    }

    Object.assign(classEntity, {
      ...updateClassDto,
      name: updateClassDto.name?.trim() || classEntity.name,
    });

    return await this.classesRepository.save(classEntity);
  }

  async remove(id: number, schoolId: number) {
    const classEntity = await this.classesRepository.findOne({
      where: { id, schoolId },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    // Note: We can't check for students yet since Student entity uses string field
    // This check can be added later when Student entity is updated to use Class relation

    await this.classesRepository.remove(classEntity);
    return { message: 'Class deleted successfully' };
  }
}

