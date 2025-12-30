import { Injectable, NotFoundException } from '@nestjs/common';
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
    const category = this.feeCategoriesRepository.create({
      ...createFeeCategoryDto,
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
    Object.assign(category, updateFeeCategoryDto);
    return await this.feeCategoriesRepository.save(category);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const category = await this.findOne(id, schoolId);
    await this.feeCategoriesRepository.remove(category);
  }
}
