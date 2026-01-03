import { IsString, IsOptional, Matches } from 'class-validator';

export class TestSmsDto {
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +1234567890)',
  })
  to!: string;

  @IsOptional()
  @IsString()
  message?: string;
}

