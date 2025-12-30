import { useState, useEffect } from "react";
import {
  FiEdit,
  FiTrash2,
  FiLoader,
  FiBook,
  FiX,
  FiSearch,
} from "react-icons/fi";
import api from "../../services/api";
import CustomDropdown from "../../components/ui/CustomDropdown";
import Pagination from "../../components/Pagination";

interface Class {
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

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
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
    loadClasses();
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
      setError(err.response?.data?.message || "Failed to load schools");
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadClasses = async () => {
    if (!selectedSchoolId) {
      setClasses([]);
      setPaginationMeta(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params: any = { page, limit };
      if (selectedSchoolId) {
        params.schoolId = selectedSchoolId;
      }
      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.instance.get("/classes", { params });

      if (response.data.data && response.data.meta) {
        setClasses(response.data.data);
        setPaginationMeta(response.data.meta);
      } else if (Array.isArray(response.data)) {
        setClasses(response.data);
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
      setError(err.response?.data?.message || "Failed to load classes");
      setClasses([]);
      setPaginationMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.schoolId) {
      setError("Please select a school");
      return;
    }

    try {
      const urlParams = `?schoolId=${formData.schoolId}`;
      
      // Exclude schoolId from the request body - it comes from query param
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
      };
      
      if (editingClass) {
        await api.instance.patch(
          `/classes/${editingClass.id}${urlParams}`,
          payload
        );
        setSuccess("Class updated successfully");
      } else {
        await api.instance.post(`/classes${urlParams}`, payload);
        setSuccess("Class created successfully");
      }

      resetForm();
      loadClasses();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Failed to ${editingClass ? "update" : "create"} class`
      );
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || "",
      status: classItem.status,
      schoolId: classItem.schoolId,
    });
    setSelectedSchoolId(classItem.schoolId);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: number, schoolId?: number) => {
    if (!window.confirm("Are you sure you want to delete this class?")) {
      return;
    }

    try {
      const urlParams = schoolId ? `?schoolId=${schoolId}` : '';
      await api.instance.delete(`/classes/${id}${urlParams}`);
      setSuccess("Class deleted successfully");
      loadClasses();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to delete class"
      );
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({
      name: "",
      description: "",
      status: "active",
      schoolId: selectedSchoolId || "",
    });
    setError("");
    setSuccess("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-modern rounded-xl p-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          Class Management
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Create and manage classes for schools
        </p>
      </div>

      {/* Success/Error Messages */}
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
        <div className="card-modern rounded-xl p-4 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            {editingClass ? "Edit Class" : "Add Class"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                School <span className="text-red-500">*</span>
              </label>
              {loadingSchools ? (
                <div className="flex items-center justify-center py-2">
                  <FiLoader className="w-4 h-4 animate-spin text-indigo-600" />
                  <span className="ml-2 text-xs text-gray-600">Loading...</span>
                </div>
              ) : (
                <CustomDropdown
                  options={schools.map((school) => ({
                    value: school.id.toString(),
                    label: school.name,
                  }))}
                  value={formData.schoolId?.toString() || ""}
                  onChange={(value) => {
                    const schoolId = value ? parseInt(value as string) : "";
                    setFormData({ ...formData, schoolId });
                    setSelectedSchoolId(schoolId);
                    setPage(1);
                  }}
                  placeholder="Select a school..."
                  className="w-full"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Class Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Grade 1"
                required
                disabled={!formData.schoolId}
                className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth ${
                  !formData.schoolId
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "bg-white"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Description <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Class description..."
                rows={3}
                disabled={!formData.schoolId}
                className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth resize-none ${
                  !formData.schoolId
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "bg-white"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Status <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                value={formData.status}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as "active" | "inactive",
                  })
                }
                className="w-full"
                disabled={!formData.schoolId}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={!formData.schoolId}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold shadow transition-all ${
                  !formData.schoolId
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-md"
                }`}
              >
                {editingClass ? "Update" : "Create"}
              </button>
              {editingClass && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-smooth"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side - Listing */}
        <div className="card-modern rounded-xl p-4 lg:col-span-2">
          {/* Filters */}
          <div className="mb-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search classes..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth"
                  />
                </div>
              </div>
              <div className="w-full sm:w-64">
                <CustomDropdown
                  options={schools.map((school) => ({
                    value: school.id.toString(),
                    label: school.name,
                  }))}
                  value={selectedSchoolId?.toString() || ""}
                  onChange={(value) => {
                    setSelectedSchoolId(value ? parseInt(value as string) : "");
                    setPage(1);
                  }}
                  placeholder="Filter by school..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : !selectedSchoolId ? (
            <div className="text-center py-12">
              <FiBook className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Please select a school to view classes</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <FiBook className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {search
                  ? "No classes found matching your search"
                  : "No classes found. Create one to get started."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Class Name
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
                    {classes.map((classItem) => (
                      <tr
                        key={classItem.id}
                        className="hover:bg-indigo-50/50 transition-all duration-150 group"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">
                            {classItem.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {classItem.description || (
                            <span className="text-gray-400 italic">No description</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              classItem.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {classItem.status.charAt(0).toUpperCase() +
                              classItem.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(classItem)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-smooth"
                              title="Edit"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(classItem.id, classItem.schoolId)
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
              <Pagination
                paginationMeta={paginationMeta}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
                itemName="classes"
                className="mt-6"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

