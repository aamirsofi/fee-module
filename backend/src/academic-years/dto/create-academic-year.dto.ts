import { IsString, IsDateString, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAcademicYearDto {
  @ApiProperty({ example: '2024-2025' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: '2024-04-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2025-03-31' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

