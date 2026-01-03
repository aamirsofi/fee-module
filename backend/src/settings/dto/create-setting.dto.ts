import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSettingDto {
  @IsString()
  key!: string;

  @IsOptional()
  value?: string | number | boolean;

  @IsEnum(['string', 'number', 'boolean', 'json'])
  type: 'string' | 'number' | 'boolean' | 'json' = 'string';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

