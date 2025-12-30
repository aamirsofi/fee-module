import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryHead } from './entities/category-head.entity';
import { CreateCategoryHeadDto } from './dto/create-category-head.dto';
import { UpdateCategoryHeadDto } from './dto/update-category-head.dto';
import { getPaginationParams, createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class CategoryHeadsService {
  constructor(
    @InjectRepository(CategoryHead)
    private categoryHeadsRepository: Repository<CategoryHead>,
  ) {}

  async create(
    createCategoryHeadDto: CreateCategoryHeadDto,
    schoolId: number,
  ): Promise<CategoryHead> {
    // Check for duplicate name within the same school
    const existing = await this.categoryHeadsRepository.findOne({
      where: {
        name: createCategoryHeadDto.name.trim(),
        schoolId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Category head with name "${createCategoryHeadDto.name}" already exists for this school`,
      );
    }

    const categoryHead = this.categoryHeadsRepository.create({
      ...createCategoryHeadDto,
      name: createCategoryHeadDto.name.trim(),
      schoolId,
    });

    return await this.categoryHeadsRepository.save(categoryHead);
  }

  async findAll(page: number = 1, limit: number = 10, search?: string, schoolId?: number) {
    const { skip, limit: take } = getPaginationParams(page, limit);

    const queryBuilder = this.categoryHeadsRepository
      .createQueryBuilder('categoryHead')
      .leftJoinAndSelect('categoryHead.school', 'school');

    if (schoolId) {
      queryBuilder.where('categoryHead.schoolId = :schoolId', { schoolId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(categoryHead.name ILIKE :search OR categoryHead.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('categoryHead.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return createPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: number, schoolId?: number): Promise<CategoryHead> {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }

    const categoryHead = await this.categoryHeadsRepository.findOne({
      where,
      relations: ['school', 'feeStructures'],
    });

    if (!categoryHead) {
      throw new NotFoundException(`Category head with ID ${id} not found`);
    }

    return categoryHead;
  }

  async update(
    id: number,
    updateCategoryHeadDto: UpdateCategoryHeadDto,
    schoolId?: number,
  ): Promise<CategoryHead> {
    const categoryHead = await this.findOne(id, schoolId);

    // If name is being updated, check for duplicates
    if (updateCategoryHeadDto.name && updateCategoryHeadDto.name.trim() !== categoryHead.name) {
      const existing = await this.categoryHeadsRepository.findOne({
        where: {
          name: updateCategoryHeadDto.name.trim(),
          schoolId: categoryHead.schoolId,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Category head with name "${updateCategoryHeadDto.name}" already exists for this school`,
        );
      }
    }

    Object.assign(categoryHead, {
      ...updateCategoryHeadDto,
      name: updateCategoryHeadDto.name?.trim() || categoryHead.name,
    });

    return await this.categoryHeadsRepository.save(categoryHead);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const categoryHead = await this.findOne(id, schoolId);

    // Check if category head is being used by any fee structures
    if (categoryHead.feeStructures && categoryHead.feeStructures.length > 0) {
      throw new BadRequestException(
        `Cannot delete category head. It is being used by ${categoryHead.feeStructures.length} fee structure(s)`,
      );
    }

    await this.categoryHeadsRepository.remove(categoryHead);
  }
}
