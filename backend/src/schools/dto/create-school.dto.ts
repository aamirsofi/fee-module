import { IsString, MinLength, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SchoolStatus } from '../entities/school.entity';

export class CreateSchoolDto {
  @ApiProperty({ example: 'ABC School' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'abc-school' })
  @IsString()
  @MinLength(2)
  subdomain!: string;

  @ApiProperty({ required: false, example: 'info@abcschool.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  settings?: Record<string, any>;

  @ApiProperty({ enum: SchoolStatus, required: false })
  @IsEnum(SchoolStatus)
  @IsOptional()
  status?: SchoolStatus;
}
