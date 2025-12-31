import { PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ required: false, description: 'Current password (required when updating password)' })
  @IsString()
  @IsOptional()
  @MinLength(8)
  currentPassword?: string;
}
