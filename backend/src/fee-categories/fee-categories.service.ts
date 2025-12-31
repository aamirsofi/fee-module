import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeCategory } from './entities/fee-category.entity';
import { CreateFeeCategoryDto } from './dto/create-fee-category.dto';
import { UpdateFeeCategoryDto } from './dto/update-fee-category.dto';

@Injectable()
export class FeeCategoriesService {
  constructor(
    @InjectRepository(FeeCategory)
    private feeCategoriesRepository: Repository<FeeCategory>,
  ) {}

  async create(createFeeCategoryDto: CreateFeeCategoryDto, schoolId: number): Promise<FeeCategory> {
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

    const category = this.feeCategoriesRepository.create({
      ...createFeeCategoryDto,
      name: createFeeCategoryDto.name.trim(),
      schoolId,
    });
    return await this.feeCategoriesRepository.save(category);
  }

  async findAll(schoolId?: number): Promise<FeeCategory[]> {
    const where: any = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await this.feeCategoriesRepository.find({
      where,
      relations: ['school'],
      order: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<FeeCategory> {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    const category = await this.feeCategoriesRepository.findOne({
      where,
      relations: ['school', 'feeStructures'],
    });

    if (!category) {
      throw new NotFoundException(`Fee category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: number,
    updateFeeCategoryDto: UpdateFeeCategoryDto,
    schoolId?: number,
  ): Promise<FeeCategory> {
    const category = await this.findOne(id, schoolId);
    
    // If name is being updated, check for duplicate name within the same school
    if (updateFeeCategoryDto.name && updateFeeCategoryDto.name.trim() !== category.name) {
      const existing = await this.feeCategoriesRepository.findOne({
        where: {
          name: updateFeeCategoryDto.name.trim(),
          schoolId: category.schoolId,
        },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Fee category with name "${updateFeeCategoryDto.name}" already exists for this school`,
        );
      }
    }
    
    Object.assign(category, {
      ...updateFeeCategoryDto,
      name: updateFeeCategoryDto.name ? updateFeeCategoryDto.name.trim() : category.name,
    });
    return await this.feeCategoriesRepository.save(category);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const category = await this.findOne(id, schoolId);
    await this.feeCategoriesRepository.remove(category);
  }
}
