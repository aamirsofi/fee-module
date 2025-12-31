import { FiEdit, FiTrash2, FiLoader, FiDollarSign, FiDownload } from "react-icons/fi";
import { Button } from "../../../components/ui/button";
import Pagination from "../../../components/Pagination";
import { FeeCategory } from "../../../hooks/pages/super-admin/useFeeHeadingData";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FeeHeadingTableProps {
  feeCategories: FeeCategory[];
  loading: boolean;
  paginationMeta: PaginationMeta | null;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  search: string;
  selectedSchoolId: string | number;
  selectedCategoryIds: number[];
  setSelectedCategoryIds: React.Dispatch<React.SetStateAction<number[]>>;
  setIsSelectAll: React.Dispatch<React.SetStateAction<boolean>>;
  isSelectAll: boolean;
  handleSelectAll: (checked: boolean) => void;
  handleSelectCategory: (id: number, checked: boolean) => void;
  handleEdit: (category: FeeCategory) => void;
  handleDeleteClick: (id: number, schoolId: number) => void;
  handleExport: () => void;
  handleBulkDeleteClick: () => void;
}

export function FeeHeadingTable({
  feeCategories,
  loading,
  paginationMeta,
  page,
  limit,
  setPage,
  setLimit,
  selectedCategoryIds,
  setSelectedCategoryIds,
  setIsSelectAll,
  isSelectAll,
  handleSelectAll,
  handleSelectCategory,
  handleEdit,
  handleDeleteClick,
  handleExport,
  handleBulkDeleteClick,
}: FeeHeadingTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (feeCategories.length === 0) {
    return (
      <div className="text-center py-12">
        <FiDollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No fee categories found. Create one to get started.</p>
      </div>
    );
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      {selectedCategoryIds.length > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-indigo-900">
              {selectedCategoryIds.length} fee category(es) selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={handleBulkDeleteClick}
              variant="destructive"
              size="sm"
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Delete ({selectedCategoryIds.length})
            </Button>
            <Button
              onClick={() => {
                setSelectedCategoryIds([]);
                setIsSelectAll(false);
              }}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-12">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </label>
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Applicable Months
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
            {feeCategories.map((category) => (
              <tr
                key={category.id}
                className={`hover:bg-indigo-50/50 transition-all duration-150 group ${
                  selectedCategoryIds.includes(category.id)
                    ? "bg-indigo-50"
                    : ""
                }`}
              >
                <td className="px-4 py-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={(e) =>
                        handleSelectCategory(category.id, e.target.checked)
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </label>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">
                    {category.name}
                  </div>
                  {category.description && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {category.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      category.type === "transport"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {category.type === "transport" ? "Transport" : "School"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {category.applicableMonths &&
                  category.applicableMonths.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {category.applicableMonths.map((month) => {
                        const monthNames = [
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ];
                        return (
                          <span
                            key={month}
                            className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded"
                          >
                            {monthNames[month - 1]}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 italic">
                      All months
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {category.school?.name ||
                    `School ID: ${category.schoolId}`}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      category.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {category.status.charAt(0).toUpperCase() +
                      category.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleEdit(category)}
                      variant="ghost"
                      size="sm"
                      className="p-1.5 text-indigo-600 hover:bg-indigo-100"
                      title="Edit"
                    >
                      <FiEdit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() =>
                        handleDeleteClick(category.id, category.schoolId)
                      }
                      variant="ghost"
                      size="sm"
                      className="p-1.5 text-red-600 hover:bg-red-100"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginationMeta && (
        <Pagination
          paginationMeta={paginationMeta}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit: number) => {
            setLimit(newLimit);
            setPage(1);
          }}
          itemName="fee categories"
        />
      )}
    </>
  );
}

