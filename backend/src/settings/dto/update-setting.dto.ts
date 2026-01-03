import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingDto {
  @IsOptional()
  value?: string | number | boolean;

  @IsOptional()
  @IsEnum(['string', 'number', 'boolean', 'json'])
  type?: 'string' | 'number' | 'boolean' | 'json';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

