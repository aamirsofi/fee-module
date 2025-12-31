import { useState, useEffect, useCallback } from "react";
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
        {students.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No students found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-indigo-50/50 transition-all duration-150 group"
                  >
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900 font-mono">
                      {student.studentId}
                    </td>
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {student.class}
                      {student.section && ` - ${student.section}`}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        className={
                          student.status === "active"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : student.status === "graduated"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }
                      >
                        {student.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
        {users.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No users found</p>
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
                    Created
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
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 capitalize">
                        {user.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
        {payments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No payments found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Fee Structure
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-indigo-50/50 transition-all duration-150 group"
                  >
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                      {payment.student ? (
                        `${payment.student.firstName} ${payment.student.lastName}`
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {payment.feeStructure?.name || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-indigo-600">
                      ${payment.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 capitalize">
                      {payment.paymentMethod.replace("_", " ")}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        className={
                          payment.status === "completed"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : payment.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : payment.status === "failed"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
        {feeStructures.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No fee structures found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {feeStructures.map((fs) => (
                  <tr
                    key={fs.id}
                    className="hover:bg-indigo-50/50 transition-all duration-150 group"
                  >
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                      {fs.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {fs.category?.name || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-indigo-600">
                      ${fs.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {fs.academicYear}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {fs.class || "All"}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        className={
                          fs.status === "active"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }
                      >
                        {fs.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
