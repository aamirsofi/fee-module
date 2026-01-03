import { IsObject, IsNotEmpty } from 'class-validator';

export class BulkUpdateSettingsDto {
  @IsObject()
  @IsNotEmpty()
  settings!: Record<string, { value?: string | number | boolean }>;
}

