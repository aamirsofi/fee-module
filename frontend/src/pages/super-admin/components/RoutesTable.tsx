import { FiEdit, FiTrash2, FiLoader, FiMapPin, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Route } from "../../../hooks/pages/super-admin/useRoutesData";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface RoutesTableProps {
  routes: Route[];
  loading: boolean;
  paginationMeta: PaginationMeta | null;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  search: string;
  selectedSchoolId: string | number;
  handleEdit: (route: Route) => void;
  handleDeleteClick: (id: number, schoolId: number) => void;
}

export default function RoutesTable({
  routes,
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
}: RoutesTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading routes...</span>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="text-center py-12">
        <FiMapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          {search || selectedSchoolId
            ? "No routes found matching your criteria"
            : "No routes found. Add your first route to get started."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Route Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                School
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Description
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
            {routes.map((route) => (
              <tr
                key={route.id}
                className="hover:bg-indigo-50/50 transition-all duration-150 group"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{route.name}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {route.school?.name || `School ID: ${route.schoolId}`}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {route.description || (
                    <span className="text-gray-400 italic">No description</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      route.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(route)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-smooth"
                      title="Edit"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(route.id, route.schoolId)}
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
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                setLimit(parseInt(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {paginationMeta.page} of {paginationMeta.totalPages} (
              {paginationMeta.total} total)
            </span>
            <button
              onClick={() => setPage(page - 1)}
              disabled={!paginationMeta.hasPrevPage}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!paginationMeta.hasNextPage}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

