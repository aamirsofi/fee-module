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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
      if (submitData.schoolId === "" || submitData.schoolId === "__EMPTY__") {
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

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.instance.delete(`/super-admin/users/${userToDelete.id}`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
      setSuccess("User deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Users Management
          </CardTitle>
          <CardDescription>Manage all users in the system</CardDescription>
        </CardHeader>
      </Card>

      {/* Success Message */}
      {success && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm text-green-700">{success}</p>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Split Layout: Form on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Add/Edit Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-800">
                  {editingUser ? "Edit User" : "Add User"}
                </CardTitle>
                {editingUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    className="h-auto p-1 text-gray-400 hover:text-gray-600"
                    title="Cancel editing"
                  >
                    <FiX className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Name *
                  </label>
                  <Input
                    type="text"
                    required
                    className="text-sm"
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
                  <Input
                    type="email"
                    required
                    className="text-sm"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Password{" "}
                    {editingUser ? "(leave blank to keep current)" : "*"}
                  </label>
                  <Input
                    type="password"
                    required={!editingUser}
                    className="text-sm"
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
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrator">Administrator</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <div className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                      <FiLoader className="w-4 h-4 animate-spin text-indigo-600" />
                      <span className="text-gray-500">Loading schools...</span>
                    </div>
                  ) : schools.length === 0 ? (
                    <div className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500 flex items-center">
                      No schools available. Please create a school first.
                    </div>
                  ) : (
                    <Select
                      value={
                        formData.schoolId === "" || formData.schoolId === "__EMPTY__"
                          ? "__EMPTY__"
                          : formData.schoolId.toString()
                      }
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          schoolId: value === "__EMPTY__" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a school..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="__EMPTY__">
                          Select a school...
                        </SelectItem>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id.toString()}>
                            {school.name}
                            {school.subdomain ? ` (${school.subdomain})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
                  >
                    {editingUser ? "Update" : "Create"}
                  </Button>
                  {editingUser && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Users List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 pr-10"
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
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="pt-6">
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
                <>
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
                              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                                {user.role.replace("_", " ")}
                              </Badge>
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(user)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-100"
                                  title="Edit"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(user)}
                                  className="p-2 text-red-600 hover:bg-red-100"
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
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-600">
                            Showing {(page - 1) * limit + 1} to{" "}
                            {Math.min(page * limit, paginationMeta.total)} of{" "}
                            {paginationMeta.total} users
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">
                              Per page:
                            </label>
                            <Select
                              value={limit.toString()}
                              onValueChange={(value) => {
                                setLimit(Number(value));
                                setPage(1);
                              }}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={
                              !paginationMeta.hasPrevPage ||
                              paginationMeta.totalPages <= 1
                            }
                          >
                            <FiChevronLeft className="w-4 h-4" />
                          </Button>

                          {paginationMeta.totalPages > 1 && (
                            <div className="flex items-center gap-1">
                              {Array.from(
                                { length: paginationMeta.totalPages },
                                (_, i) => i + 1
                              )
                                .filter((p) => {
                                  return (
                                    p === 1 ||
                                    p === paginationMeta.totalPages ||
                                    (p >= page - 1 && p <= page + 1)
                                  );
                                })
                                .map((p, idx, arr) => {
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
                                      <Button
                                        variant={p === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(p)}
                                        className={
                                          p === page
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : ""
                                        }
                                      >
                                        {p}
                                      </Button>
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={
                              !paginationMeta.hasNextPage ||
                              paginationMeta.totalPages <= 1
                            }
                          >
                            <FiChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{userToDelete?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
