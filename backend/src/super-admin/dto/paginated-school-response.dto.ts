import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-response.dto';

export class SchoolResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'ABC School' })
  name!: string;

  @ApiProperty({ example: 'abc-school' })
  subdomain!: string;

  @ApiProperty({ example: 'info@abcschool.com', required: false })
  email?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  phone?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  address?: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive', 'suspended'] })
  status!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}

export class PaginatedSchoolResponseDto {
  @ApiProperty({ type: [SchoolResponseDto], description: 'Array of schools' })
  data!: SchoolResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}
