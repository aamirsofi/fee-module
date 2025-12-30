import { IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryHeadStatus } from '../entities/category-head.entity';

export class CreateCategoryHeadDto {
  @ApiProperty({ example: 'General' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ required: false, example: 'Regular students category' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: CategoryHeadStatus, required: false })
  @IsEnum(CategoryHeadStatus)
  @IsOptional()
  status?: CategoryHeadStatus;
}
