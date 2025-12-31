import {
  IsNumber,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StructureStatus } from '../entities/fee-structure.entity';

export class CreateFeeStructureDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  feeCategoryId!: number;

  @ApiProperty({ required: false, example: 1 })
  @IsNumber()
  @IsOptional()
  categoryHeadId?: number;

  @ApiProperty({ example: 'Annual Tuition Fee 2024' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 5000.0 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ required: false, example: 1 })
  @IsNumber()
  @IsOptional()
  classId?: number;

  @ApiProperty({ required: false, example: '2024-2025' })
  @IsString()
  @IsOptional()
  academicYear?: string;

  @ApiProperty({ required: false, example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ enum: StructureStatus, required: false })
  @IsEnum(StructureStatus)
  @IsOptional()
  status?: StructureStatus;
}
