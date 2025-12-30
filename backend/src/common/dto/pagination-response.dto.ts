import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 100, description: 'Total number of items' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page!: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit!: number;

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages!: number;

  @ApiProperty({ example: true, description: 'Whether there is a next page' })
  hasNextPage!: boolean;

  @ApiProperty({ example: false, description: 'Whether there is a previous page' })
  hasPrevPage!: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items', isArray: true })
  data!: T[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}
