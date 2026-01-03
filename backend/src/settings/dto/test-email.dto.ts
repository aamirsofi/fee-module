import { IsEmail, IsString, IsOptional } from 'class-validator';

export class TestEmailDto {
  @IsEmail()
  to!: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

