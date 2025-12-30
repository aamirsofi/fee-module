import { IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ClassStatus } from '../entities/class.entity';

export class CreateClassDto {
  @ApiProperty({ example: 'Grade 1' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ required: false, example: 'First grade class' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ClassStatus, required: false })
  @IsEnum(ClassStatus)
  @IsOptional()
  status?: ClassStatus;
}

