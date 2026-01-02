import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiLoader,
  FiUsers,
  FiDollarSign,
  FiBook,
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiRefreshCw,
  FiEdit,
  FiUpload,
} from "react-icons/fi";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import api from "../../services/api";
import StudentBulkImport from "../../components/StudentBulkImport";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/DataTable";

interface SchoolDetails {
  school: {
    id: number;
    name: string;
    subdomain: string;
    email?: string;
    phone?: string;
    address?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: {
      id: number;
      name: string;
      email: string;
    };
  };
  students: Array<{
    id: number;
    studentId: string;
    firstName: string;
    lastName: string;
    email: string;
    class: string;
    section?: string;
    status: string;
    createdAt: string;
  }>;
  users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  payments: Array<{
    id: number;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    status: string;
    student?: {
      id: number;
      firstName: string;
      lastName: string;
    };
    feeStructure?: {
      id: number;
      name: string;
    };
    createdAt: string;
  }>;
  feeStructures: Array<{
    id: number;
    name: string;
    amount: number;
    academicYear: string;
    class?: string;
    status: string;
    category?: {
      id: number;
      name: string;
    };
    createdAt: string;
  }>;
  stats: {
    totalStudents: number;
    activeStudents: number;
    totalUsers: number;
    totalPayments: number;
    completedPayments: number;
    totalRevenue: number;
    totalFeeStructures: number;
    activeFeeStructures: number;
  };
}

export default function SchoolDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SchoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  const loadSchoolDetails = useCallback(
    async (isRefresh = false) => {
      if (!id) return;
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError("");
        const response = await api.instance.get(
          `/super-admin/schools/${id}/details`
        );
        setData(response.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load school details"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  const handleRefresh = () => {
    loadSchoolDetails(true);
  };

  const handleEdit = () => {
    // Navigate to schools page with school data in state for editing
    navigate("/super-admin/schools", {
      state: { editSchoolId: id, schoolData: data?.school },
    });
  };

  const handleImportSuccess = () => {
    setImportSuccess("Students imported successfully!");
    setImportError("");
    setShowBulkImport(false);
    // Reload school details to show new students
    loadSchoolDetails(true);
    // Clear success message after 5 seconds
    setTimeout(() => setImportSuccess(""), 5000);
  };

  const handleImportError = (error: string) => {
    setImportError(error);
    setImportSuccess("");
    // Clear error message after 5 seconds
    setTimeout(() => setImportError(""), 5000);
  };

  // Column definitions for Students table
  const studentColumns: ColumnDef<SchoolDetails['students'][0]>[] = useMemo(
    () => [
      {
        accessorKey: "studentId",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Student ID
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return (
            <div className="text-sm font-semibold text-gray-900 font-mono">
              {row.getValue("studentId")}
            </div>
          );
        },
      },
      {
        id: "name",
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
        cell: ({ row }) => {
          return (
            <div className="text-sm font-semibold text-gray-900">
              {row.original.firstName} {row.original.lastName}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const nameA = `${rowA.original.firstName} ${rowA.original.lastName}`;
          const nameB = `${rowB.original.firstName} ${rowB.original.lastName}`;
          return nameA.localeCompare(nameB);
        },
      },
      {
        accessorKey: "class",
        header: "Class",
        cell: ({ row }) => {
          return (
            <div className="text-sm text-gray-600">
              {row.getValue("class")}
              {row.original.section && ` - ${row.original.section}`}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
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
          const status = row.getValue("status") as string;
          return (
            <Badge
              className={
                status === "active"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : status === "graduated"
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-gray-100 text-gray-700 border-gray-200"
              }
            >
              {status}
            </Badge>
          );
        },
      },
    ],
    []
  );

  // Column definitions for Users table
  const userColumns: ColumnDef<SchoolDetails['users'][0]>[] = useMemo(
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
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return (
            <div className="text-sm font-semibold text-gray-900">
              {row.getValue("name")}
            </div>
          );
        },
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
        cell: ({ row }) => {
          return <div className="text-sm text-gray-600">{row.getValue("email")}</div>;
        },
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
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 capitalize">
              {role.replace("_", " ")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Created
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return (
            <div className="text-sm text-gray-600">
              {new Date(row.getValue("createdAt")).toLocaleDateString()}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.createdAt).getTime();
          const dateB = new Date(rowB.original.createdAt).getTime();
          return dateA - dateB;
        },
      },
    ],
    []
  );

  // Column definitions for Payments table
  const paymentColumns: ColumnDef<SchoolDetails['payments'][0]>[] = useMemo(
    () => [
      {
        id: "student",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Student
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const student = row.original.student;
          return (
            <div className="text-sm font-semibold text-gray-900">
              {student ? `${student.firstName} ${student.lastName}` : <span className="text-gray-400">N/A</span>}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const nameA = rowA.original.student ? `${rowA.original.student.firstName} ${rowA.original.student.lastName}` : "";
          const nameB = rowB.original.student ? `${rowB.original.student.firstName} ${rowB.original.student.lastName}` : "";
          return nameA.localeCompare(nameB);
        },
      },
      {
        id: "feeStructure",
        header: "Fee Structure",
        cell: ({ row }) => {
          return (
            <div className="text-sm text-gray-600">
              {row.original.feeStructure?.name || <span className="text-gray-400">N/A</span>}
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = row.getValue("amount") as number;
          return (
            <div className="text-sm font-bold text-indigo-600">
              ${amount.toLocaleString()}
            </div>
          );
        },
      },
      {
        accessorKey: "paymentMethod",
        header: "Method",
        cell: ({ row }) => {
          const method = row.getValue("paymentMethod") as string;
          return (
            <div className="text-sm text-gray-600 capitalize">
              {method.replace("_", " ")}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
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
          const status = row.getValue("status") as string;
          return (
            <Badge
              className={
                status === "completed"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : status === "pending"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                  : status === "failed"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-gray-100 text-gray-700 border-gray-200"
              }
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "paymentDate",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return (
            <div className="text-sm text-gray-600">
              {new Date(row.getValue("paymentDate")).toLocaleDateString()}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.paymentDate).getTime();
          const dateB = new Date(rowB.original.paymentDate).getTime();
          return dateA - dateB;
        },
      },
    ],
    []
  );

  // Column definitions for Fee Structures table
  const feeStructureColumns: ColumnDef<SchoolDetails['feeStructures'][0]>[] = useMemo(
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
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return (
            <div className="text-sm font-semibold text-gray-900">
              {row.getValue("name")}
            </div>
          );
        },
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => {
          return (
            <div className="text-sm text-gray-600">
              {row.original.category?.name || <span className="text-gray-400">N/A</span>}
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = row.getValue("amount") as number;
          return (
            <div className="text-sm font-bold text-indigo-600">
              ${amount.toLocaleString()}
            </div>
          );
        },
      },
      {
        accessorKey: "academicYear",
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
          return <div className="text-sm text-gray-600">{row.getValue("academicYear")}</div>;
        },
      },
      {
        accessorKey: "class",
        header: "Class",
        cell: ({ row }) => {
          return <div className="text-sm text-gray-600">{row.getValue("class") || "All"}</div>;
        },
      },
      {
        accessorKey: "status",
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
          const status = row.getValue("status") as string;
          return (
            <Badge
              className={
                status === "active"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-700 border-gray-200"
              }
            >
              {status}
            </Badge>
          );
        },
      },
    ],
    []
  );

  useEffect(() => {
    loadSchoolDetails();
  }, [loadSchoolDetails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700 mb-4">{error || "School not found"}</p>
            <Link
              to="/super-admin/schools"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to Schools
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { school, students, users, payments, feeStructures, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/super-admin/schools"
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-smooth"
              >
                <FiArrowLeft className="w-4 h-4 text-gray-600" />
              </Link>
              <div>
                <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  {school.name}
                </CardTitle>
                <CardDescription>School Details & Analytics</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                title="Edit school"
              >
                <FiEdit className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                title="Refresh data"
              >
                <FiRefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
              <Badge
                className={
                  school.status === "active"
                    ? "bg-green-100 text-green-800"
                    : school.status === "suspended"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {stats.totalStudents}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeStudents} active
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.completedPayments} completed payments
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Fee Structures</p>
                <p className="text-3xl font-bold text-pink-600">
                  {stats.totalFeeStructures}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeFeeStructures} active
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <FiBook className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">
            School Information
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Subdomain</p>
            <p className="text-lg font-semibold text-gray-900">
              {school.subdomain}
            </p>
          </div>
          {school.email && (
            <div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <FiMail className="w-4 h-4" />
                Email
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {school.email}
              </p>
            </div>
          )}
          {school.phone && (
            <div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <FiPhone className="w-4 h-4" />
                Phone
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {school.phone}
              </p>
            </div>
          )}
          {school.address && (
            <div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <FiMapPin className="w-4 h-4" />
                Address
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {school.address}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
              <FiCalendar className="w-4 h-4" />
              Created At
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(school.createdAt).toLocaleDateString()}
            </p>
          </div>
          {school.createdBy && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Created By</p>
              <p className="text-lg font-semibold text-gray-900">
                {school.createdBy.name}
              </p>
              <p className="text-sm text-gray-500">{school.createdBy.email}</p>
            </div>
          )}
        </div>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {importSuccess && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-700">{importSuccess}</p>
          </CardContent>
        </Card>
      )}
      {importError && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{importError}</p>
          </CardContent>
        </Card>
      )}

      {/* Students Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Students ({students.length})
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Showing {students.length} of {stats.totalStudents}
              </span>
              <Button
                onClick={() => setShowBulkImport(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <FiUpload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={studentColumns}
            data={students}
            searchKey="studentId"
            searchPlaceholder="Search students..."
            enableRowSelection={false}
            exportFileName={`school-${school.id}-students`}
            exportTitle={`Students - ${school.name}`}
            enableExport={true}
          />
        </CardContent>
      </Card>

      {/* Users Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={userColumns}
            data={users}
            searchKey="name"
            searchPlaceholder="Search users..."
            enableRowSelection={false}
            exportFileName={`school-${school.id}-users`}
            exportTitle={`Users - ${school.name}`}
            enableExport={true}
          />
        </CardContent>
      </Card>

      {/* Payments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Recent Payments ({payments.length})
            </CardTitle>
            <span className="text-sm text-gray-500">
              Showing {payments.length} of {stats.totalPayments}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={paymentColumns}
            data={payments}
            searchKey="feeStructure"
            searchPlaceholder="Search payments..."
            enableRowSelection={false}
            exportFileName={`school-${school.id}-payments`}
            exportTitle={`Payments - ${school.name}`}
            enableExport={true}
          />
        </CardContent>
      </Card>

      {/* Fee Structures Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">
            Fee Structures ({feeStructures.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={feeStructureColumns}
            data={feeStructures}
            searchKey="name"
            searchPlaceholder="Search fee structures..."
            enableRowSelection={false}
            exportFileName={`school-${school.id}-fee-structures`}
            exportTitle={`Fee Structures - ${school.name}`}
            enableExport={true}
          />
        </CardContent>
      </Card>

      {/* Bulk Import Modal */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Students</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple students at once
            </DialogDescription>
          </DialogHeader>
          <StudentBulkImport
            schoolId={school.id}
            onImportSuccess={handleImportSuccess}
            onImportError={handleImportError}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
