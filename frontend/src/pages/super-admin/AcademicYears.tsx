import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { academicYearsService } from "../../services/academicYears.service";
import { useAuth } from "../../contexts/AuthContext";
import { useSchool } from "../../contexts/SchoolContext";
import { AcademicYear } from "../../types";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCalendar,
  FiLoader,
  FiCheck,
} from "react-icons/fi";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DataTable } from "@/components/DataTable";

export default function AcademicYears() {
  const { user } = useAuth();
  const { selectedSchoolId } = useSchool();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  // Set loading state based on school selection
  useEffect(() => {
    if (user?.role === "super_admin" && !selectedSchoolId) {
      setLoading(false);
      setAcademicYears([]);
    }
  }, [user, selectedSchoolId]);

  useEffect(() => {
    if (user?.role === "super_admin") {
      if (selectedSchoolId) {
        loadAcademicYears();
      } else {
        setAcademicYears([]);
        setLoading(false);
        setError("");
      }
    } else if (user?.schoolId) {
      loadAcademicYears();
    }
  }, [selectedSchoolId, user]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadAcademicYears = async () => {
    try {
      setLoading(true);
      setError("");
      const schoolId =
        user?.role === "super_admin"
          ? selectedSchoolId && selectedSchoolId !== "all"
            ? +selectedSchoolId
            : undefined
          : user?.schoolId;

      if (!schoolId && user?.role === "super_admin") {
        setError("Please select a school to view academic years");
        setLoading(false);
        return;
      }

      const data = await academicYearsService.getAll(schoolId);
      setAcademicYears(data);
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : "Failed to load academic years";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      const schoolId =
        user?.role === "super_admin"
          ? selectedSchoolId && selectedSchoolId !== "all"
            ? +selectedSchoolId
            : undefined
          : user?.schoolId;

      if (!schoolId) {
        setError("Please select a school");
        return;
      }

      if (editingYear) {
        await academicYearsService.update(editingYear.id, formData);
        setSuccess("Academic year updated successfully");
      } else {
        await academicYearsService.create(formData, schoolId);
        setSuccess("Academic year created successfully");
      }

      setShowDialog(false);
      setEditingYear(null);
      resetForm();
      loadAcademicYears();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : "Failed to save academic year";
      setError(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    });
  };

  const handleEdit = (year: AcademicYear) => {
    setError("");
    setSuccess("");
    setEditingYear(year);
    setFormData({
      name: year.name,
      startDate: year.startDate.split("T")[0],
      endDate: year.endDate.split("T")[0],
      isCurrent: year.isCurrent,
      description: year.description || "",
    });
    setShowDialog(true);
  };

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;
    try {
      await academicYearsService.delete(id);
      setSuccess("Academic year deleted successfully");
      loadAcademicYears();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : "Failed to delete academic year";
      setError(errorMessage);
    }
  }, []);

  const handleSetCurrent = useCallback(async (id: number) => {
    try {
      setError("");
      setSuccess("");
      await academicYearsService.update(id, { isCurrent: true });
      setSuccess("Current academic year updated");
      loadAcademicYears();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : "Failed to set current academic year";
      setError(errorMessage);
    }
  }, []);

  const columns: ColumnDef<AcademicYear>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Academic Year
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const year = row.original;
          return (
            <div className="flex items-center">
              <FiCalendar className="w-5 h-5 mr-3 text-indigo-500" />
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {year.name}
                </div>
                {year.description && (
                  <div className="text-sm text-gray-500">
                    {year.description}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "period",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Period
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const year = row.original;
          return (
            <div className="text-sm text-gray-900">
              {new Date(year.startDate).toLocaleDateString()} -{" "}
              {new Date(year.endDate).toLocaleDateString()}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.startDate).getTime();
          const dateB = new Date(rowB.original.startDate).getTime();
          return dateA - dateB;
        },
      },
      {
        accessorKey: "isCurrent",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const isCurrent = row.getValue("isCurrent") as boolean;
          return isCurrent ? (
            <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0">
              Current
            </Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const year = row.original;
          return (
            <div className="flex items-center justify-end space-x-2">
              {!year.isCurrent && (
                <Button
                  onClick={() => handleSetCurrent(year.id)}
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  Set Current
                </Button>
              )}
              <Button
                onClick={() => handleEdit(year)}
                variant="ghost"
                size="sm"
                className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                title="Edit"
              >
                <FiEdit2 className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => handleDelete(year.id)}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                title="Delete"
              >
                <FiTrash2 className="w-5 h-5" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [handleDelete, handleSetCurrent]
  );

  return (
    <div className="space-y-6">
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
            <BreadcrumbLink asChild>
              <Link to="/super-admin/settings/academics/academic-years">Settings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Academic Years</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Academic Years
              </CardTitle>
              <CardDescription className="mt-1">
                Manage academic years and set the current year
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingYear(null);
                resetForm();
                setError("");
                setSuccess("");
                setShowDialog(true);
              }}
              disabled={
                user?.role === "super_admin" &&
                (!selectedSchoolId || selectedSchoolId === "all")
              }
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
            >
              <FiPlus className="w-5 h-5 mr-2" />
              Add Academic Year
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Success Message */}
      {success && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FiCheck className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && !showDialog && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700 mb-1">
                  Error
                </p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <Card className="p-12">
          <CardContent className="flex items-center justify-center">
            <FiLoader className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-3 text-muted-foreground">
              Loading academic years...
            </span>
          </CardContent>
        </Card>
      ) : user?.role === "super_admin" && !selectedSchoolId ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-4 shadow-lg">
              <FiCalendar className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="mb-2">Select a School</CardTitle>
            <CardDescription className="mb-4">
              Please select a school from the dropdown above to view or manage
              academic years.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={academicYears}
              searchKey="name"
              searchPlaceholder="Search academic years..."
              enableRowSelection={false}
              exportFileName="academic-years"
              exportTitle="Academic Years List"
              enableExport={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            setEditingYear(null);
            resetForm();
            setError("");
            setSuccess("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingYear ? "Edit Academic Year" : "Add New Academic Year"}
            </DialogTitle>
            <DialogDescription>
              {editingYear
                ? "Update academic year information"
                : "Create a new academic year"}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Academic Year Name *
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="2024-2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date *
                </label>
                <Input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date *
                </label>
                <Input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCurrent"
                checked={formData.isCurrent}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isCurrent: !!checked })
                }
              />
              <label
                htmlFor="isCurrent"
                className="text-sm font-semibold text-gray-700 cursor-pointer"
              >
                Set as current academic year
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingYear(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                {editingYear ? "Update Academic Year" : "Create Academic Year"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
