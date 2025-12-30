import {
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMaxSize,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CategoryStatus, FeeCategoryType } from '../entities/fee-category.entity';

export class CreateFeeCategoryDto {
  @ApiProperty({ example: 'Tuition Fee' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ required: false, example: 'Regular tuition fees' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: FeeCategoryType,
    required: false,
    default: FeeCategoryType.SCHOOL,
    example: 'school',
  })
  @IsEnum(FeeCategoryType)
  @IsOptional()
  type?: FeeCategoryType;

  @ApiProperty({ enum: CategoryStatus, required: false })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;

  @ApiProperty({
    required: false,
    description: 'Array of applicable months (1-12). Empty array means applicable to all months.',
    example: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    type: [Number],
  })
  @IsArray()
  @ArrayMaxSize(12)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(12, { each: true })
  @IsOptional()
  @Type(() => Number)
  applicableMonths?: number[];
}
