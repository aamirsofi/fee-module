import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiEdit,
  FiTrash2,
  FiLoader,
  FiHome,
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import api from "../../services/api";
import { School } from "../../types";
import CustomDropdown from "../../components/ui/CustomDropdown";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function SuperAdminSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    email: "",
    phone: "",
    address: "",
    status: "active" as "active" | "inactive" | "suspended",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );

  useEffect(() => {
    loadSchools();
  }, [page, limit]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      setError("");

      // Debug: Log the params being sent
      console.log("Loading schools with params:", { page, limit });

      const response = await api.instance.get("/super-admin/schools", {
        params: { page, limit },
      });

      // Debug: Log the response
      console.log("Schools API response:", response.data);

      // Handle both old format (array) and new format (paginated)
      if (response.data.data && response.data.meta) {
        setSchools(response.data.data);
        setPaginationMeta(response.data.meta);
        console.log("Pagination meta:", response.data.meta);
      } else if (Array.isArray(response.data)) {
        // Fallback for old format (array)
        console.warn(
          "Received old format (array), converting to paginated format"
        );
        setSchools(response.data);
        setPaginationMeta({
          total: response.data.length,
          page: 1,
          limit: response.data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      } else {
        // Handle unexpected format
        console.error("Unexpected response format:", response.data);
        setSchools([]);
        setPaginationMeta(null);
      }
    } catch (err: any) {
      console.error("Error loading schools:", err);
      setError(err.response?.data?.message || "Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      subdomain: "",
      email: "",
      phone: "",
      address: "",
      status: "active",
    });
    setEditingSchool(null);
    setError("");
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      subdomain: school.subdomain,
      email: school.email || "",
      phone: school.phone || "",
      address: school.address || "",
      status: school.status,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");
      if (editingSchool) {
        await api.instance.patch(
          `/super-admin/schools/${editingSchool.id}`,
          formData
        );
        setSuccess("School updated successfully!");
      } else {
        await api.instance.post("/super-admin/schools", formData);
        setSuccess("School created successfully!");
      }
      resetForm();
      loadSchools();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save school");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this school?")) return;
    try {
      await api.instance.delete(`/super-admin/schools/${id}`);
      loadSchools();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete school");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card-modern rounded-xl p-4">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Schools Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage all schools in the system
          </p>
        </div>
      </div>

      {/* Success Message - At the top */}
      {success && (
        <div className="card-modern rounded-xl p-3 bg-green-50 border-l-2 border-green-400">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Error Message - At the top */}
      {error && (
        <div className="card-modern rounded-xl p-3 bg-red-50 border-l-2 border-red-400">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Split Layout: Form on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Add/Edit Form */}
        <div className="lg:col-span-1">
          <div className="card-modern rounded-xl p-4 sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">
                {editingSchool ? "Edit School" : "Add School"}
              </h2>
              {editingSchool && (
                <button
                  onClick={resetForm}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-smooth"
                  title="Cancel editing"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subdomain *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                  value={formData.subdomain}
                  onChange={(e) =>
                    setFormData({ ...formData, subdomain: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white resize-none"
                  rows={2}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="btn-primary flex-1 text-sm py-2"
                >
                  {editingSchool ? "Update" : "Create"}
                </button>
                {editingSchool && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Schools List */}
        <div className="lg:col-span-2">
          <div className="card-modern rounded-xl overflow-hidden border border-gray-200 shadow-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : schools.length === 0 ? (
              <div className="text-center py-12">
                <FiHome className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No schools found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Subdomain
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Email
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
                      {schools.map((school) => (
                        <tr
                          key={school.id}
                          className="hover:bg-indigo-50/50 transition-all duration-150 group"
                        >
                          <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                            {school.name}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 font-mono">
                            {school.subdomain}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {school.email || (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${
                                school.status === "active"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : school.status === "suspended"
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}
                            >
                              {school.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/super-admin/schools/${school.id}/details`}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-all duration-150 hover:scale-110"
                                title="View Details"
                              >
                                <FiEye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleEdit(school)}
                                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-md transition-all duration-150 hover:scale-110"
                                title="Edit"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(school.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-all duration-150 hover:scale-110"
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

                {/* Pagination - Always show when there's data */}
                {paginationMeta && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Left: Info and Per Page Selector */}
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                          Showing {(page - 1) * limit + 1} to{" "}
                          {Math.min(page * limit, paginationMeta.total)} of{" "}
                          {paginationMeta.total} schools
                        </div>
                        <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Per page:</label>
                      <select
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value));
                          setPage(1); // Reset to first page when changing limit
                        }}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
                          onClick={() => setPage(page - 1)}
                          disabled={
                            !paginationMeta.hasPrevPage ||
                            paginationMeta.totalPages <= 1
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-smooth border ${
                            paginationMeta.hasPrevPage &&
                            paginationMeta.totalPages > 1
                              ? "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 bg-white"
                              : "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
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
                                  <div
                                    key={p}
                                    className="flex items-center gap-1"
                                  >
                                    {showEllipsis && (
                                      <span className="px-2 text-gray-400">
                                        ...
                                      </span>
                                    )}
                                    <button
                                      onClick={() => setPage(p)}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-smooth border ${
                                        p === page
                                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                          : "border-gray-300 text-gray-700 hover:bg-gray-100 bg-white"
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
                          onClick={() => setPage(page + 1)}
                          disabled={
                            !paginationMeta.hasNextPage ||
                            paginationMeta.totalPages <= 1
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-smooth border ${
                            paginationMeta.hasNextPage &&
                            paginationMeta.totalPages > 1
                              ? "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 bg-white"
                              : "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                          }`}
                          title="Next page"
                        >
                          <FiChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
