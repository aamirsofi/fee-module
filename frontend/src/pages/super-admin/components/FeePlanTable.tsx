import { FiEdit, FiTrash2, FiLoader, FiDollarSign, FiDownload } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { FeeStructure } from "../../../types";
import Pagination from "../../../components/Pagination";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FeePlanTableProps {
  feeStructures: FeeStructure[];
  loading: boolean;
  paginationMeta: PaginationMeta | null;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  search: string;
  selectedSchoolId: string | number;
  selectedFeePlanIds: number[];
  setSelectedFeePlanIds: React.Dispatch<React.SetStateAction<number[]>>;
  setIsSelectAll: React.Dispatch<React.SetStateAction<boolean>>;
  isSelectAll: boolean;
  handleSelectAll: (checked: boolean) => void;
  handleSelectFeePlan: (id: number, checked: boolean) => void;
  handleEdit: (structure: FeeStructure) => void;
  handleDeleteClick: (id: number, schoolId: number) => void;
  handleExport: () => void;
  handleBulkDeleteClick: () => void;
}

export function FeePlanTable({
  feeStructures,
  loading,
  paginationMeta,
  page,
  limit,
  setPage,
  setLimit,
  search,
  selectedSchoolId,
  selectedFeePlanIds,
  setSelectedFeePlanIds,
  setIsSelectAll,
  isSelectAll,
  handleSelectAll,
  handleSelectFeePlan,
  handleEdit,
  handleDeleteClick,
  handleExport,
  handleBulkDeleteClick,
}: FeePlanTableProps) {
  return (
    <>
      {/* Bulk Actions Bar */}
      {selectedFeePlanIds.length > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-indigo-900">
              {selectedFeePlanIds.length} fee plan(s) selected
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
              className="bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Delete ({selectedFeePlanIds.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFeePlanIds([]);
                setIsSelectAll(false);
              }}
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : feeStructures.length === 0 ? (
        <div className="text-center py-12">
          <FiDollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {search || selectedSchoolId
              ? "No fee plans found matching your criteria"
              : "No fee plans found. Create one to get started."}
          </p>
        </div>
      ) : (
        <>
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
                    Plan Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Category Head
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Amount
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
                {feeStructures.map((structure) => (
                  <tr
                    key={structure.id}
                    className={`hover:bg-indigo-50/50 transition-all duration-150 group ${
                      selectedFeePlanIds.includes(structure.id)
                        ? "bg-indigo-50"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFeePlanIds.includes(structure.id)}
                          onChange={(e) =>
                            handleSelectFeePlan(structure.id, e.target.checked)
                          }
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {structure.name}
                      </div>
                      {structure.description && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {structure.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {structure.school?.name ||
                        `School ID: ${structure.schoolId}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {structure.categoryHead?.name || "General"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">
                        ₹
                        {parseFloat(structure.amount.toString()).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          structure.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {structure.status.charAt(0).toUpperCase() +
                          structure.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(structure)}
                          className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100"
                          title="Edit"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteClick(structure.id, structure.schoolId)
                          }
                          className="text-red-600 hover:text-red-900 hover:bg-red-100"
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
          <Pagination
            paginationMeta={paginationMeta}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            itemName="fee plans"
            className="mt-6"
          />
        </>
      )}
    </>
  );
}

