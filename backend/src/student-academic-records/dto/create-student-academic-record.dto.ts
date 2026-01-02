import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AcademicRecordStatus } from '../entities/student-academic-record.entity';

export class CreateStudentAcademicRecordDto {
  @ApiProperty()
  @IsNumber()
  studentId!: number;

  @ApiProperty()
  @IsNumber()
  academicYearId!: number;

  @ApiProperty()
  @IsNumber()
  classId!: number;

  @ApiProperty()
  @IsNumber()
  schoolId!: number;

  @ApiProperty({ required: false, example: 'A' })
  @IsString()
  @IsOptional()
  section?: string;

  @ApiProperty({ required: false, example: '001' })
  @IsString()
  @IsOptional()
  rollNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  admissionNumber?: string;

  @ApiProperty({ enum: AcademicRecordStatus, required: false, default: AcademicRecordStatus.ACTIVE })
  @IsEnum(AcademicRecordStatus)
  @IsOptional()
  status?: AcademicRecordStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}

