import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeStructure } from './entities/fee-structure.entity';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';

@Injectable()
export class FeeStructuresService {
  constructor(
    @InjectRepository(FeeStructure)
    private feeStructuresRepository: Repository<FeeStructure>,
  ) {}

  async create(
    createFeeStructureDto: CreateFeeStructureDto,
    schoolId: number,
  ): Promise<FeeStructure> {
    const feeStructure = this.feeStructuresRepository.create({
      ...createFeeStructureDto,
      schoolId,
      dueDate: createFeeStructureDto.dueDate ? new Date(createFeeStructureDto.dueDate) : undefined,
    });
    return await this.feeStructuresRepository.save(feeStructure);
  }

  async findAll(schoolId?: number): Promise<FeeStructure[]> {
    const where: any = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }
    return await this.feeStructuresRepository.find({
      where,
      relations: ['school', 'category', 'class'],
      order: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<FeeStructure> {
    const where: any = { id };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    const feeStructure = await this.feeStructuresRepository.findOne({
      where,
      relations: ['school', 'category', 'class', 'payments', 'studentStructures'],
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure with ID ${id} not found`);
    }

    return feeStructure;
  }

  async update(
    id: number,
    updateFeeStructureDto: UpdateFeeStructureDto,
    schoolId?: number,
  ): Promise<FeeStructure> {
    const feeStructure = await this.findOne(id, schoolId);
    const updateData: any = { ...updateFeeStructureDto };
    if (updateFeeStructureDto.dueDate) {
      updateData.dueDate = new Date(updateFeeStructureDto.dueDate);
    }
    Object.assign(feeStructure, updateData);
    return await this.feeStructuresRepository.save(feeStructure);
  }

  async remove(id: number, schoolId?: number): Promise<void> {
    const feeStructure = await this.findOne(id, schoolId);
    await this.feeStructuresRepository.remove(feeStructure);
  }
}
