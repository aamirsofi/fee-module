import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiEdit,
  FiLoader,
  FiHome,
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiPower,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../services/api";
import { School } from "../../types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function SuperAdminSchools() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const editProcessedRef = useRef(false);
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active"); // Default to active only
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [schoolToAction, setSchoolToAction] = useState<School | null>(null);

  // Fetch schools with TanStack Query - Backend handles pagination and filtering
  const { data: schoolsData, isLoading: loading } = useQuery({
    queryKey: ["schools", page, limit, search, statusFilter],
    queryFn: async () => {
      // Note: By default, we only show active schools to prevent accidentally adding data to inactive/suspended schools
      // Use the status filter dropdown to view inactive/suspended schools if needed
      const response = await api.instance.get("/super-admin/schools", {
        params: {
          page,
          limit,
          includeInactive: statusFilter === "all" ? "true" : undefined, // Only include inactive when showing "all"
          search: search.trim() || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });

      // Backend returns paginated response: { data: [], meta: {} }
      if (response.data.data && response.data.meta) {
        return {
          schools: response.data.data,
          meta: response.data.meta,
        };
      }

      // Fallback for non-paginated response
      return {
        schools: Array.isArray(response.data) ? response.data : [],
        meta: null,
      };
    },
  });

  const schools = schoolsData?.schools || [];
  const paginationMeta = schoolsData?.meta || null;
  const filteredSchools = schools; // Already filtered by backend

  // Create/Update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingSchool) {
        return api.instance.patch(
          `/super-admin/schools/${editingSchool.id}`,
          data
        );
      } else {
        return api.instance.post("/super-admin/schools", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setSuccess(
        editingSchool
          ? "School updated successfully!"
          : "School created successfully!"
      );
      resetForm();
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to save school");
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: async ({ id, suspend }: { id: number; suspend?: boolean }) => {
      return api.instance.delete(
        `/super-admin/schools/${id}${suspend ? "?suspend=true" : ""}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setSuccess("School deactivated successfully!");
      setDeleteDialogOpen(false);
      setSchoolToAction(null);
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to deactivate school");
    },
  });

  // Reactivate mutation
  const reactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.instance.patch(`/super-admin/schools/${id}/reactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setSuccess("School reactivated successfully!");
      setReactivateDialogOpen(false);
      setSchoolToAction(null);
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to reactivate school");
    },
  });

  // Handle navigation from School Details page with edit intent
  useEffect(() => {
    const state = location.state as { editSchoolId?: string; schoolData?: any };
    if (state?.editSchoolId && state?.schoolData && !editProcessedRef.current) {
      const schoolToEdit = state.schoolData;
      if (schoolToEdit && schoolToEdit.id) {
        editProcessedRef.current = true;
        setEditingSchool(schoolToEdit);
        setFormData({
          name: schoolToEdit.name,
          subdomain: schoolToEdit.subdomain,
          email: schoolToEdit.email || "",
          phone: schoolToEdit.phone || "",
          address: schoolToEdit.address || "",
          status: schoolToEdit.status,
        });
        setError("");
      }
    }
  }, [location.state]);

  // Reset edit processed flag when location changes
  useEffect(() => {
    if (!location.state) {
      editProcessedRef.current = false;
    }
  }, [location.pathname]);

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
    setError("");
    setSuccess("");
    createUpdateMutation.mutate(formData);
  };

  const handleDeactivate = (school: School, suspend: boolean = false) => {
    setSchoolToAction(school);
    setDeleteDialogOpen(true);
  };

  const handleReactivate = (school: School) => {
    setSchoolToAction(school);
    setReactivateDialogOpen(true);
  };

  const confirmDeactivate = () => {
    if (schoolToAction) {
      const suspend = schoolToAction.status === "suspended";
      deactivateMutation.mutate({ id: schoolToAction.id, suspend });
    }
  };

  const confirmReactivate = () => {
    if (schoolToAction) {
      reactivateMutation.mutate(schoolToAction.id);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "suspended":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "suspended":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Schools Management
          </CardTitle>
          <CardDescription>Manage all schools in the system</CardDescription>
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
                  {editingSchool ? "Edit School" : "Add School"}
                </CardTitle>
                {editingSchool && (
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
                    School Name *
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
                    Subdomain *
                  </label>
                  <Input
                    type="text"
                    required
                    className="text-sm font-mono"
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
                  <Input
                    type="email"
                    className="text-sm"
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
                  <Input
                    type="tel"
                    className="text-sm"
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
                  <Textarea
                    className="text-sm resize-none"
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
                  <Select
                    value={formData.status}
                    onValueChange={(
                      value: "active" | "inactive" | "suspended"
                    ) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
                    disabled={createUpdateMutation.isPending}
                  >
                    {createUpdateMutation.isPending ? (
                      <FiLoader className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {editingSchool ? "Update" : "Create"}
                  </Button>
                  {editingSchool && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Schools List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1); // Reset to first page on search
                    }}
                    placeholder="Search by name, subdomain, or email..."
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
                <div>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setPage(1); // Reset to first page on filter change
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        Active Only (Default)
                      </SelectItem>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schools Table */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : filteredSchools.length === 0 ? (
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
                        {filteredSchools.map((school) => (
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
                              <Badge
                                variant={getStatusBadgeVariant(school.status)}
                                className={getStatusBadgeClass(school.status)}
                              >
                                {school.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="p-2 text-blue-600 hover:bg-blue-100"
                                  title="View Details"
                                >
                                  <Link
                                    to={`/super-admin/schools/${school.id}/details`}
                                  >
                                    <FiEye className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(school)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-100"
                                  title="Edit"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </Button>
                                {school.status === "active" ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeactivate(school)}
                                    className="p-2 text-red-600 hover:bg-red-100"
                                    title="Deactivate"
                                  >
                                    <FiPower className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReactivate(school)}
                                    className="p-2 text-green-600 hover:bg-green-100"
                                    title="Reactivate"
                                  >
                                    <FiRefreshCw className="w-4 h-4" />
                                  </Button>
                                )}
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
                            {paginationMeta.total} schools
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
                                        variant={
                                          p === page ? "default" : "outline"
                                        }
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

      {/* Deactivate Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate School</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate "{schoolToAction?.name}"? This
              will set the school status to inactive. All data will be
              preserved, and the school can be reactivated later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeactivate}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? (
                <FiLoader className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog
        open={reactivateDialogOpen}
        onOpenChange={setReactivateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate School</DialogTitle>
            <DialogDescription>
              Are you sure you want to reactivate "{schoolToAction?.name}"? This
              will set the school status back to active.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReactivateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReactivate}
              disabled={reactivateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {reactivateMutation.isPending ? (
                <FiLoader className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Reactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
