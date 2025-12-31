import { FiEdit, FiTrash2, FiLoader, FiTag, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryHead } from "../../../hooks/pages/super-admin/useCategoryHeadsData";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface CategoryHeadsTableProps {
  categoryHeads: CategoryHead[];
  loading: boolean;
  paginationMeta: PaginationMeta | null;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  search: string;
  selectedSchoolId: string | number;
  handleEdit: (categoryHead: CategoryHead) => void;
  handleDeleteClick: (id: number, schoolId: number) => void;
}

export default function CategoryHeadsTable({
  categoryHeads,
  loading,
  paginationMeta,
  page,
  limit,
  setPage,
  setLimit,
  search,
  selectedSchoolId,
  handleEdit,
  handleDeleteClick,
}: CategoryHeadsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (categoryHeads.length === 0) {
    return (
      <div className="text-center py-12">
        <FiTag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">
          {search || selectedSchoolId
            ? "No category heads found matching your criteria"
            : "No category heads found. Create one to get started."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                School
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {categoryHeads.map((categoryHead) => (
              <tr
                key={categoryHead.id}
                className="hover:bg-indigo-50/50 transition-all duration-150 group"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">
                    {categoryHead.name}
                  </div>
                  {categoryHead.description && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {categoryHead.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {categoryHead.school?.name ||
                    `School ID: ${categoryHead.schoolId}`}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      categoryHead.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {categoryHead.status.charAt(0).toUpperCase() +
                      categoryHead.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(categoryHead)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-smooth"
                      title="Edit"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteClick(categoryHead.id, categoryHead.schoolId)
                      }
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-smooth"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginationMeta && paginationMeta.totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * limit + 1} to{" "}
            {Math.min(page * limit, paginationMeta.total)} of{" "}
            {paginationMeta.total} results
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-800 whitespace-nowrap">
              Per page:
            </label>
            <div className="relative z-10">
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  const numValue = parseInt(value, 10);
                  setLimit(numValue || 10);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!paginationMeta.hasPrevPage}
              className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold ${
                paginationMeta.hasPrevPage
                  ? "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 border border-gray-200"
                  : "bg-gray-100/50 text-gray-400 cursor-not-allowed opacity-50"
              }`}
            >
              <FiChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(7, paginationMeta.totalPages) },
                (_, i) => {
                  let pageNum: number;
                  if (paginationMeta.totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= paginationMeta.totalPages - 3) {
                    pageNum = paginationMeta.totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }

                  const isActive = pageNum === page;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`min-w-[40px] h-10 rounded-xl transition-all duration-200 text-sm font-semibold ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-110 ring-2 ring-indigo-300/50"
                          : "bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white hover:scale-105 hover:shadow-md border border-gray-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={() =>
                setPage((p) =>
                  Math.min(paginationMeta.totalPages, p + 1)
                )
              }
              disabled={!paginationMeta.hasNextPage}
              className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold ${
                paginationMeta.hasNextPage
                  ? "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 border border-gray-200"
                  : "bg-gray-100/50 text-gray-400 cursor-not-allowed opacity-50"
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

