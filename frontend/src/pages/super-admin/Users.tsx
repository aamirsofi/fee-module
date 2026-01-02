import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiEdit,
  FiTrash2,
  FiLoader,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import api from "../../services/api";
import { schoolService, School } from "../../services/schoolService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { DataTable } from "@/components/DataTable";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [paginationMeta, setPaginationMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);

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
        setUsers([]);
        setPaginationMeta(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPage(pageIndex + 1); // API uses 1-based indexing
    setLimit(pageSize);
  }, []);

  const handleSearchChange = useCallback((searchValue: string) => {
    setSearch(searchValue);
    setPage(1); // Reset to first page on search
  }, []);

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

  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password
      role: user.role,
      schoolId: user.schoolId || "",
    });
    setError("");
  }, []);

  const handleDelete = useCallback((user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }, []);

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

  // Define columns for the data table
  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-semibold text-gray-900">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-gray-600">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Role
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
            {role.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "school",
      header: "School",
      cell: ({ row }) => {
        const school = row.original.school;
        return school ? (
          <span className="font-medium text-gray-900">{school.name}</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
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
        );
      },
    },
  ], [handleEdit, handleDelete]);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/super-admin/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
        <div className="lg:col-span-2">
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
                <DataTable
                  columns={columns}
                  data={users}
                  searchKey="name"
                  searchPlaceholder="Search users by name or email..."
                  manualPagination={true}
                  pageCount={paginationMeta?.totalPages || 0}
                  totalRows={paginationMeta?.total || 0}
                  externalPageIndex={page - 1}
                  externalPageSize={limit}
                  externalSearchValue={search}
                  onPaginationChange={handlePaginationChange}
                  onSearchChange={handleSearchChange}
                  exportFileName="users"
                  exportTitle="Users List"
                />
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
