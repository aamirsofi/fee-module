import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoutePlanStatus } from '../entities/route-plan.entity';

export class CreateRoutePlanDto {
  @ApiProperty({ example: 1, description: 'Route ID' })
  @IsNumber()
  routeId!: number;

  @ApiProperty({ example: 1, description: 'Transport Fee Category ID (Fee Heading of type transport)' })
  @IsNumber()
  feeCategoryId!: number;

  @ApiProperty({ required: false, example: 1, description: 'Category Head ID' })
  @IsNumber()
  @IsOptional()
  categoryHeadId?: number;

  @ApiProperty({ required: false, example: 1, description: 'Class ID' })
  @IsNumber()
  @IsOptional()
  classId?: number;

  @ApiProperty({ example: 'Route A - Transport - General (1st)' })
  @IsString()
  name!: string;

  @ApiProperty({ required: false, example: 'Transport fee for Route A' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 5000.00 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: RoutePlanStatus, required: false })
  @IsEnum(RoutePlanStatus)
  @IsOptional()
  status?: RoutePlanStatus;
}

