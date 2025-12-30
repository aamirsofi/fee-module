import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginationProps {
  paginationMeta: PaginationMeta | null;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  itemName?: string; // e.g., "users", "schools", "fee plans"
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  paginationMeta,
  page,
  limit,
  onPageChange,
  onLimitChange,
  itemName = 'items',
  className = '',
}) => {
  if (!paginationMeta) return null;

  return (
    <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Info and Per Page Selector */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to{' '}
            {Math.min(page * limit, paginationMeta.total)} of{' '}
            {paginationMeta.total} {itemName}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Per page:</label>
            <select
              value={limit}
              onChange={(e) => {
                onLimitChange(Number(e.target.value));
                onPageChange(1); // Reset to first page when changing limit
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-0 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Right: Page Navigation - Always show when there's data */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={
              !paginationMeta.hasPrevPage ||
              paginationMeta.totalPages <= 1
            }
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-smooth border ${
              paginationMeta.hasPrevPage &&
              paginationMeta.totalPages > 1
                ? 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 bg-white'
                : 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
            }`}
            title="Previous page"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers - Only show if more than 1 page */}
          {paginationMeta.totalPages > 1 && (
            <div className="flex items-center gap-1">
              {Array.from(
                { length: paginationMeta.totalPages },
                (_, i) => i + 1
              )
                .filter((p) => {
                  // Show first page, last page, current page, and pages around current
                  return (
                    p === 1 ||
                    p === paginationMeta.totalPages ||
                    (p >= page - 1 && p <= page + 1)
                  );
                })
                .map((p, idx, arr) => {
                  // Add ellipsis if there's a gap
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => onPageChange(p)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-smooth border ${
                          p === page
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={
              !paginationMeta.hasNextPage ||
              paginationMeta.totalPages <= 1
            }
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-smooth border ${
              paginationMeta.hasNextPage &&
              paginationMeta.totalPages > 1
                ? 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 bg-white'
                : 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
            }`}
            title="Next page"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

