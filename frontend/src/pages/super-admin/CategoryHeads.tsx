import { useState, useEffect } from "react";
import {
  FiEdit,
  FiTrash2,
  FiLoader,
  FiTag,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiSearch,
} from "react-icons/fi";
import api from "../../services/api";
import CustomDropdown from "../../components/ui/CustomDropdown";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CategoryHead {
  id: number;
  name: string;
  description?: string;
  status: string;
  schoolId: number;
  school?: {
    id: number;
    name: string;
    subdomain: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface School {
  id: number;
  name: string;
  subdomain: string;
  email?: string;
  status: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function CategoryHeads() {
  const [categoryHeads, setCategoryHeads] = useState<CategoryHead[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [editingCategoryHead, setEditingCategoryHead] = useState<CategoryHead | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as string,
    schoolId: "" as string | number,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | number>("");
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );

  useEffect(() => {
    loadCategoryHeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, selectedSchoolId]);

  useEffect(() => {
    loadSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSchools = async () => {
    try {
      setLoadingSchools(true);
      setError("");

      let allSchools: School[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const pageLimit = 100;

      while (hasMorePages) {
        const response = await api.instance.get("/super-admin/schools", {
          params: { page: currentPage, limit: pageLimit, status: "active" },
        });

        if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          allSchools = [...allSchools, ...response.data.data];

          const meta = response.data.meta;
          if (meta && meta.hasNextPage) {
            currentPage++;
          } else {
            hasMorePages = false;
          }
        } else if (Array.isArray(response.data)) {
          allSchools = [...allSchools, ...response.data];
          hasMorePages = false;
        } else {
          hasMorePages = false;
        }
      }

      setSchools(allSchools);
    } catch (err: any) {
      console.error("Error loading schools:", err);
      setSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadCategoryHeads = async () => {
    try {
      setLoading(true);
      setError("");

      const params: any = { page, limit };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedSchoolId) {
        params.schoolId = selectedSchoolId;
      }

      const response = await api.instance.get("/super-admin/category-heads", {
        params,
      });

      if (response.data.data && response.data.meta) {
        setCategoryHeads(response.data.data);
        setPaginationMeta(response.data.meta);
      } else if (Array.isArray(response.data)) {
        setCategoryHeads(response.data);
        setPaginationMeta({
          total: response.data.length,
          page: 1,
          limit: response.data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load category heads");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      if (!formData.schoolId) {
        setError("Please select a school");
        return;
      }

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
      };

      if (editingCategoryHead) {
        await api.instance.patch(
          `/super-admin/category-heads/${editingCategoryHead.id}?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Category head updated successfully!");
      } else {
        await api.instance.post(
          `/super-admin/category-heads?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Category head created successfully!");
      }

      const currentSchoolId = formData.schoolId;
      
      if (editingCategoryHead) {
        setEditingCategoryHead(null);
        resetForm();
      } else {
        resetForm(true, currentSchoolId);
      }

      loadCategoryHeads();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save category head";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const resetForm = (
    retainSchool: boolean = false,
    schoolId?: string | number
  ) => {
    setFormData({
      name: "",
      description: "",
      status: "active",
      schoolId: retainSchool && schoolId ? schoolId : "",
    });
  };

  const handleEdit = (categoryHead: CategoryHead) => {
    setEditingCategoryHead(categoryHead);
    setFormData({
      name: categoryHead.name,
      description: categoryHead.description || "",
      status: categoryHead.status,
      schoolId: categoryHead.schoolId,
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: number, schoolId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this category head? This action cannot be undone."
      )
    )
      return;

    try {
      setError("");
      await api.instance.delete(
        `/super-admin/category-heads/${id}?schoolId=${schoolId}`
      );
      setSuccess("Category head deleted successfully!");
      loadCategoryHeads();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete category head";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancel = () => {
    setEditingCategoryHead(null);
    resetForm();
    setError("");
    setSuccess("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Category Heads Management
          </CardTitle>
          <CardDescription>
            Manage category heads (e.g., General, Sponsored) for fee plans
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages - Below header banner */}
      {success && (
        <div className="card-modern rounded-xl p-4 bg-green-50 border-l-4 border-green-400">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="card-modern rounded-xl p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Add/Edit Form */}
        <div className="card-modern rounded-xl p-6 lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingCategoryHead ? "Edit Category Head" : "Add Category Head"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School <span className="text-red-500">*</span>
              </label>
              {loadingSchools ? (
                <div className="flex items-center justify-center py-4">
                  <FiLoader className="w-5 h-5 animate-spin text-indigo-600" />
                  <span className="ml-2 text-gray-600">Loading schools...</span>
                </div>
              ) : (
                <CustomDropdown
                  options={schools.map((school) => ({
                    value: school.id.toString(),
                    label: school.name,
                  }))}
                  value={formData.schoolId?.toString() || ""}
                  onChange={(value) => {
                    const numValue =
                      typeof value === "string" ? parseInt(value, 10) : value;
                    setFormData({ ...formData, schoolId: numValue || "" });
                  }}
                  placeholder="Select a school..."
                  className="w-full"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Head Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., General, Sponsored"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                value={formData.status}
                onChange={(value) =>
                  setFormData({ ...formData, status: String(value) })
                }
                className="w-full"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {editingCategoryHead ? "Update" : "Create"}
              </button>
              {editingCategoryHead && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-smooth"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side - List */}
        <div className="card-modern rounded-xl p-6 lg:col-span-2">
          {/* Search and Filter */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or description..."
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by School
              </label>
              <CustomDropdown
                options={[
                  { value: "", label: "All Schools" },
                  ...schools.map((school) => ({
                    value: school.id.toString(),
                    label: school.name,
                  })),
                ]}
                value={selectedSchoolId?.toString() || ""}
                onChange={(value) => {
                  const numValue =
                    typeof value === "string" ? parseInt(value, 10) : value;
                  setSelectedSchoolId(numValue || "");
                  setPage(1);
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : categoryHeads.length === 0 ? (
            <div className="text-center py-12">
              <FiTag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {search || selectedSchoolId
                  ? "No category heads found matching your criteria"
                  : "No category heads found. Create one to get started."}
              </p>
            </div>
          ) : (
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
                                handleDelete(categoryHead.id, categoryHead.schoolId)
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
                      <CustomDropdown
                        options={[
                          { value: "10", label: "10" },
                          { value: "20", label: "20" },
                          { value: "50", label: "50" },
                          { value: "100", label: "100" },
                        ]}
                        value={limit.toString()}
                        onChange={(value) => {
                          const numValue =
                            typeof value === "string"
                              ? parseInt(value, 10)
                              : value;
                          setLimit(numValue || 10);
                          setPage(1);
                        }}
                        className="w-20"
                      />
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
          )}
        </div>
      </div>
    </div>
  );
}

