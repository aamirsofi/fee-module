import { IsString, MinLength, IsEmail, IsOptional, IsEnum, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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

  @ApiProperty({ required: false, example: '2005-05-15' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ required: false, example: 'male' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ required: false, example: 'O+' })
  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '2024-04-01' })
  @IsDateString()
  admissionDate!: string;

  @ApiProperty({ required: false, example: 'ADM001' })
  @IsString()
  @IsOptional()
  admissionNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ required: false, example: 'John Doe Sr.' })
  @IsString()
  @IsOptional()
  parentName?: string;

  @ApiProperty({ required: false, example: 'parent@example.com' })
  @IsEmail()
  @IsOptional()
  parentEmail?: string;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsString()
  @IsOptional()
  parentPhone?: string;

  @ApiProperty({ required: false, example: 'father' })
  @IsString()
  @IsOptional()
  parentRelation?: string;

  @ApiProperty({ enum: StudentStatus, required: false })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  userId?: number;

  // Route and Transport
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  routeId?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  routePlanId?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  busNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  busSeatNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  shift?: string;

  // Financial
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  openingBalance?: number;

  // Bank Account
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  branchName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bankIfsc?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  // Additional
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  penNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  aadharNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  admissionFormNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  whatsappNo?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  categoryHeadId?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isSibling?: boolean;
}
