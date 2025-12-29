import { PaginationMeta, PaginatedResponse } from '../dto/pagination.dto';

export function createPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: createPaginationMeta(total, page, limit),
  };
}

export function getPaginationParams(page?: number, limit?: number) {
  const pageNum = page ? Math.max(1, page) : 1;
  const limitNum = limit ? Math.max(1, Math.min(100, limit)) : 10;
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip,
  };
}

