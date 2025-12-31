import { useState, useEffect, useMemo } from "react";
import {
  FiEdit,
  FiTrash2,
  FiLoader,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiSearch,
} from "react-icons/fi";
import { useInfiniteQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { schoolService, School } from "../../services/schoolService";
import CustomDropdown from "../../components/ui/CustomDropdown";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  schoolId?: number;
  school?: {
    id: number;
    name: string;
    subdomain: string;
  };
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "administrator" as string,
    schoolId: "" as string | number,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );

  // Use TanStack Query for schools (using infinite query for pagination)
  const { data: schoolsData, isLoading: loadingSchools } = useInfiniteQuery({
    queryKey: ["schools", "active"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await schoolService.getSchools({
        page: pageParam,
        limit: 100,
        status: "active",
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta && lastPage.meta.hasNextPage) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const schools: School[] = useMemo(() => {
    if (!schoolsData?.pages) return [];
    return schoolsData.pages.flatMap((page) => page.data || []);
  }, [schoolsData]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params: any = { page, limit };
      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.instance.get("/super-admin/users", {
        params,
      });

      // Handle both old format (array) and new format (paginated)
      if (response.data.data && response.data.meta) {
        // Backend already filters out super_admin users, so use data as-is
        setUsers(response.data.data);
        setPaginationMeta(response.data.meta);
      } else if (Array.isArray(response.data)) {
        // Fallback for old format (array)
        console.warn(
          "Received old format (array), converting to paginated format"
        );
        // Filter out super_admin users (fallback for old backend)
        const filteredUsers = response.data.filter(
          (user: User) => user.role !== "super_admin"
        );
        setUsers(filteredUsers);
        setPaginationMeta({
          total: filteredUsers.length,
          page: 1,
          limit: filteredUsers.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      } else {
        // Handle unexpected format
        console.error("Unexpected response format:", response.data);
        setUsers([]);
        setPaginationMeta(null);
      }
    } catch (err: any) {
      console.error("Error loading users:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "administrator",
      schoolId: "",
    });
    setEditingUser(null);
    setError("");
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password
      role: user.role,
      schoolId: user.schoolId || "",
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");
      const submitData: any = { ...formData };
      if (editingUser && !submitData.password) {
        delete submitData.password; // Don't update password if not provided
      }
      if (submitData.schoolId === "") {
        delete submitData.schoolId;
      } else {
        submitData.schoolId = Number(submitData.schoolId);
      }

      if (editingUser) {
        await api.instance.patch(
          `/super-admin/users/${editingUser.id}`,
          submitData
        );
        setSuccess("User updated successfully!");
      } else {
        await api.instance.post("/super-admin/users", submitData);
        setSuccess("User created successfully!");
      }
      resetForm();
      loadUsers();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save user");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.instance.delete(`/super-admin/users/${id}`);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Users Management
          </CardTitle>
          <CardDescription>Manage all users in the system</CardDescription>
        </CardHeader>
      </Card>

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
                {editingUser ? "Edit User" : "Add User"}
              </h2>
              {editingUser && (
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
                  Name *
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
                  Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password {editingUser ? "(leave blank to keep current)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Role *
                </label>
                <CustomDropdown
                  options={[
                    { value: "administrator", label: "Administrator" },
                    { value: "accountant", label: "Accountant" },
                    { value: "student", label: "Student" },
                    { value: "parent", label: "Parent" },
                  ]}
                  value={formData.role}
                  onChange={(value) =>
                    setFormData({ ...formData, role: value as string })
                  }
                  placeholder="Select a role..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  School (optional)
                  {import.meta.env.DEV && (
                    <span className="ml-2 text-xs text-gray-400">
                      ({schools.length} loaded)
                    </span>
                  )}
                </label>
                {loadingSchools ? (
                  <div className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                    <FiLoader className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-gray-500">Loading schools...</span>
                  </div>
                ) : schools.length === 0 ? (
                  <div className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    No schools available. Please create a school first.
                  </div>
                ) : (
                  <CustomDropdown
                    options={[
                      { value: "", label: "Select a school..." },
                      ...schools.map((school) => ({
                        value: school.id,
                        label: `${school.name}${
                          school.subdomain ? ` (${school.subdomain})` : ""
                        }`,
                      })),
                    ]}
                    value={formData.schoolId || ""}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        schoolId: value === "" ? "" : Number(value),
                      })
                    }
                    placeholder="Select a school..."
                    className="w-full"
                  />
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="btn-primary flex-1 text-sm py-2"
                >
                  {editingUser ? "Update" : "Create"}
                </button>
                {editingUser && (
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

        {/* Right Side - Users List */}
        <div className="lg:col-span-2">
          <div className="card-modern rounded-xl overflow-hidden border border-gray-200 shadow-lg">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1); // Reset to first page when searching
                    }}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-smooth bg-white"
                  />
                </div>
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-smooth"
                    title="Clear search"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <FiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-indigo-50/50 transition-all duration-150 group"
                      >
                        <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                            {user.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {user.school ? (
                            <span className="font-medium text-gray-900">
                              {user.school.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-md transition-all duration-150 hover:scale-110"
                              title="Edit"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
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
            )}

            {/* Pagination - Always show when there's data */}
            {paginationMeta && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Left: Info and Per Page Selector */}
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {(page - 1) * limit + 1} to{" "}
                      {Math.min(page * limit, paginationMeta.total)} of{" "}
                      {paginationMeta.total} users
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Per page:</label>
                      <select
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value));
                          setPage(1); // Reset to first page when changing limit
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
                              <div key={p} className="flex items-center gap-1">
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
          </div>
        </div>
      </div>
    </div>
  );
}
