import { IsString, MinLength, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StudentStatus } from '../entities/student.entity';

export class CreateStudentDto {
  @ApiProperty({ example: 'STU001' })
  @IsString()
  @MinLength(1)
  studentId!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '10th Grade' })
  @IsString()
  class!: string;

  @ApiProperty({ required: false, example: 'A' })
  @IsString()
  @IsOptional()
  section?: string;

  @ApiProperty({ enum: StudentStatus, required: false })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  userId?: number;
}
