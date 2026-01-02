import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Modal from "../../components/Modal";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function AcademicYears() {
  const { user } = useAuth();
  const { selectedSchoolId } = useSchool();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
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
      // For super admin, don't load until school is selected
      setLoading(false);
      setAcademicYears([]);
    }
  }, [user, selectedSchoolId]);

  useEffect(() => {
    if (user?.role === "super_admin") {
      // Only load if a school is selected
      if (selectedSchoolId) {
        loadAcademicYears();
      } else {
        // No school selected, show empty state
        setAcademicYears([]);
        setLoading(false);
        setError("");
      }
    } else if (user?.schoolId) {
      // For school admin, load immediately
      loadAcademicYears();
    }
  }, [selectedSchoolId, user]);

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
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load academic years");
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

      setShowModal(false);
      setEditingYear(null);
      resetForm();
      loadAcademicYears();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save academic year";
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
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this academic year?")) return;
    try {
      await academicYearsService.delete(id);
      setSuccess("Academic year deleted successfully");
      loadAcademicYears();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete academic year");
    }
  };

  const handleSetCurrent = async (id: number) => {
    try {
      setError("");
      setSuccess("");
      await academicYearsService.update(id, { isCurrent: true });
      setSuccess("Current academic year updated");
      loadAcademicYears();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to set current academic year"
      );
    }
  };

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
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  setEditingYear(null);
                  resetForm();
                  setError("");
                  setSuccess("");
                  setShowModal(true);
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
          </div>
        </CardHeader>
      </Card>

      {/* Success Message */}
      {success && (
        <Card className="border-green-500 border-l-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FiCheck className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && !showModal && (
        <Card className="border-destructive border-l-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5"
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
                <p className="text-sm font-semibold text-destructive mb-1">
                  Error
                </p>
                <p className="text-sm text-destructive/90">{error}</p>
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
      ) : academicYears.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-4 shadow-lg">
              <FiCalendar className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="mb-2">No academic years found</CardTitle>
            <CardDescription className="mb-4">
              Get started by creating a new academic year.
            </CardDescription>
            <Button
              onClick={() => {
                resetForm();
                setError("");
                setSuccess("");
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Academic Year
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200">
                {academicYears.map((year) => (
                  <tr
                    key={year.id}
                    className="hover:bg-white/80 transition-smooth"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(year.startDate).toLocaleDateString()} -{" "}
                        {new Date(year.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {year.isCurrent ? (
                        <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0">
                          Current
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                          size="icon"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          title="Edit"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(year.id)}
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingYear(null);
          resetForm();
          setError("");
          setSuccess("");
        }}
        title={editingYear ? "Edit Academic Year" : "Add New Academic Year"}
      >
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
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
            <input
              type="checkbox"
              id="isCurrent"
              checked={formData.isCurrent}
              onChange={(e) =>
                setFormData({ ...formData, isCurrent: e.target.checked })
              }
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label
              htmlFor="isCurrent"
              className="text-sm font-semibold text-gray-700"
            >
              Set as current academic year
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
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
          </div>
        </form>
      </Modal>
    </div>
  );
}
