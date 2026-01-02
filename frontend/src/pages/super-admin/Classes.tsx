import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiEdit,
  FiTrash2,
  FiLoader,
  FiBook,
  FiSearch,
  FiUpload,
  FiDownload,
} from "react-icons/fi";
import { useDropzone } from "react-dropzone";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import api from "../../services/api";
import { useSchool } from "../../contexts/SchoolContext";
import { DataTable } from "@/components/DataTable";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [loading, setLoading] = useState(true);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [mode, setMode] = useState<"add" | "import">("add");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as string,
    schoolId: "" as string | number,
  });
  const [importSchoolId, setImportSchoolId] = useState<string | number>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
    errors: Array<{ row: number; error: string }>;
    duplicates: Array<{ row: number; name: string; reason: string }>;
  } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const { selectedSchoolId, selectedSchool } = useSchool();
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, selectedSchoolId]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, string | number> = { page, limit };
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
    setError("");
    setSuccess("");
  };

  const handleDelete = useCallback(async (id: number, schoolId?: number) => {
    if (!window.confirm("Are you sure you want to delete this class?")) {
      return;
    }

    try {
      const urlParams = schoolId ? `?schoolId=${schoolId}` : "";
      await api.instance.delete(`/classes/${id}${urlParams}`);
      setSuccess("Class deleted successfully");
      loadClasses();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : "Failed to delete class";
      setError(errorMessage);
    }
  }, []);

  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPage(pageIndex + 1);
    setLimit(pageSize);
  }, []);

  const handleSearchChange = useCallback((searchValue: string) => {
    setSearch(searchValue);
    setPage(1);
  }, []);

  const columns: ColumnDef<Class>[] = useMemo(
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
              Class Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return (
            <div className="font-semibold text-gray-900">
              {row.getValue("name")}
            </div>
          );
        },
      },
      {
        accessorKey: "school",
        header: "School",
        cell: ({ row }) => {
          const school = row.original.school;
          return (
            <div className="text-sm text-gray-600">
              {school?.name || `School ID: ${row.original.schoolId}`}
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const description = row.getValue("description") as string | undefined;
          return (
            <div className="text-sm text-gray-600">
              {description || (
                <span className="text-gray-400 italic">No description</span>
              )}
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
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
        filterConfig: {
          column: "status",
          title: "Status",
          options: [
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ],
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const classItem = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(classItem)}
                className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                title="Edit"
              >
                <FiEdit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(classItem.id, classItem.schoolId)}
                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                title="Delete"
              >
                <FiTrash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [handleDelete]
  );

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

  // Download sample CSV
  const downloadSampleCSV = () => {
    if (!importSchoolId) {
      setError("Please select a school first");
      return;
    }

    const headers = ["schoolId", "name", "description", "status"];
    const sampleRow = [
      importSchoolId.toString(),
      "Grade 1",
      "First grade class",
      "active",
    ];

    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `classes_sample_${importSchoolId}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV file
  const parseCSV = useCallback(
    (file: File): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const lines = text.split("\n").filter((line) => line.trim());

            if (lines.length < 2) {
              reject(
                new Error(
                  "CSV file must have at least a header row and one data row"
                )
              );
              return;
            }

            const headers = lines[0]
              .split(",")
              .map((h) => h.trim().toLowerCase());
            const data: any[] = [];

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(",").map((v) => v.trim());
              const row: any = {};

              headers.forEach((header, index) => {
                row[header] = values[index] || "";
              });

              if (row.name) {
                data.push({
                  schoolId: row.schoolid || importSchoolId,
                  name: row.name,
                  description: row.description || "",
                  status: row.status || "active",
                });
              }
            }

            resolve(data);
          } catch (err) {
            reject(new Error("Failed to parse CSV file"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
    },
    [importSchoolId]
  );

  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!importSchoolId) {
        setError("Please select a school first");
        return;
      }

      if (!file.name.match(/\.(csv)$/i)) {
        setError("Please upload a CSV file");
        return;
      }

      try {
        setImportFile(file);
        const data = await parseCSV(file);
        setImportPreview(data.slice(0, 10)); // Preview first 10 rows
        setError("");
      } catch (err: any) {
        setError(err.message || "Failed to parse CSV file");
        setImportFile(null);
        setImportPreview([]);
      }
    },
    [importSchoolId, parseCSV]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  // Handle bulk import
  const handleBulkImport = async () => {
    if (!importFile || !importSchoolId) {
      setError("Please select a school and upload a CSV file");
      return;
    }

    try {
      setIsImporting(true);
      setError("");
      setSuccess("");
      setImportResult(null);

      const classesData = await parseCSV(importFile);

      if (classesData.length === 0) {
        setError("No valid classes found in CSV file");
        return;
      }

      // Fetch existing classes for duplicate checking
      const existingClassesResponse = await api.instance.get("/classes", {
        params: { schoolId: importSchoolId, limit: 1000 },
      });
      const existingClasses =
        existingClassesResponse.data.data || existingClassesResponse.data || [];
      const existingClassNames = new Set(
        existingClasses.map((cls: Class) => cls.name.toLowerCase().trim())
      );

      // Check for duplicates within CSV
      const csvClassNames = new Map<string, number[]>(); // name -> array of row numbers
      classesData.forEach((classData, index) => {
        const name = classData.name.toLowerCase().trim();
        if (!csvClassNames.has(name)) {
          csvClassNames.set(name, []);
        }
        csvClassNames.get(name)!.push(index + 2); // +2 because row 1 is header
      });

      const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [] as Array<{ row: number; error: string }>,
        duplicates: [] as Array<{ row: number; name: string; reason: string }>,
      };

      // Import classes one by one
      for (let i = 0; i < classesData.length; i++) {
        const classData = classesData[i];
        const className = classData.name.trim();
        const classNameLower = className.toLowerCase();
        const rowNumber = i + 2; // +2 because row 1 is header

        // Check for duplicates within CSV (skip if not first occurrence)
        const occurrences = csvClassNames.get(classNameLower) || [];
        if (occurrences.length > 1 && occurrences[0] !== rowNumber) {
          results.skipped++;
          results.duplicates.push({
            row: rowNumber,
            name: className,
            reason: `Duplicate name in CSV (first occurrence at row ${occurrences[0]})`,
          });
          continue;
        }

        // Check for duplicates against existing classes
        if (existingClassNames.has(classNameLower)) {
          results.skipped++;
          results.duplicates.push({
            row: rowNumber,
            name: className,
            reason: "Class already exists in database",
          });
          continue;
        }

        try {
          await api.instance.post(`/classes?schoolId=${importSchoolId}`, {
            name: classData.name,
            description: classData.description || undefined,
            status: classData.status || "active",
          });
          results.success++;
          // Add to existing set to prevent duplicates within the same import batch
          existingClassNames.add(classNameLower);
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message || "Failed to create class";

          // Check if it's a duplicate error
          if (errorMessage.toLowerCase().includes("already exists")) {
            results.skipped++;
            results.duplicates.push({
              row: rowNumber,
              name: className,
              reason: "Class already exists in database",
            });
          } else {
            results.failed++;
            results.errors.push({
              row: rowNumber,
              error: errorMessage,
            });
          }
        }
      }

      setImportResult(results);
      if (results.success > 0) {
        setSuccess(`Successfully imported ${results.success} class(es)`);
        if (results.skipped > 0) {
          setSuccess(
            `Successfully imported ${results.success} class(es). ${results.skipped} duplicate(s) skipped.`
          );
        }
        setImportFile(null);
        setImportPreview([]);
        loadClasses();
      }
      if (results.failed > 0) {
        setError(
          `${results.failed} class(es) failed to import. Check errors below.`
        );
      }
      if (results.skipped > 0 && results.success === 0) {
        setError(
          `All ${results.skipped} class(es) were duplicates and skipped.`
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to import classes");
    } finally {
      setIsImporting(false);
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
              <Link to="/super-admin/settings/academics/class">Settings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Classes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Class Management
          </CardTitle>
          <CardDescription>
            Create and manage classes for schools
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-700">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Add/Edit Form or Import */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800">
              {editingClass ? "Edit Class" : "Class Management"}
            </CardTitle>
          </CardHeader>
          <CardContent>
          <Tabs
            value={mode}
            onValueChange={(value) => {
              if (value === "add") {
                setMode("add");
                setError("");
                setSuccess("");
                setImportFile(null);
                setImportPreview([]);
                setImportResult(null);
              } else if (value === "import") {
                setMode("import");
                setError("");
                setSuccess("");
                resetForm();
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 p-1 rounded-lg border border-gray-200 mb-4">
              <TabsTrigger
                value="add"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all font-semibold"
              >
                Add Class
              </TabsTrigger>
              <TabsTrigger
                value="import"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all font-semibold"
              >
                Import Classes
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as "add" | "import")}
          >
            <TabsContent value="add" className="mt-0">
              <>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      School <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={selectedSchool?.name || "No school selected"}
                      disabled
                      className="bg-gray-50 cursor-not-allowed text-xs"
                    />
                    {!selectedSchool && (
                      <p className="text-xs text-red-500 mt-1">
                        Please select a school from the top navigation bar
                      </p>
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
                      Description{" "}
                      <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
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
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          status: value as "active" | "inactive",
                        })
                      }
                      disabled={!formData.schoolId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
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
              </>
            </TabsContent>
            <TabsContent value="import" className="mt-0">
              <>
                <div className="space-y-4">
                  {/* School Selection for Import */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      School <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={selectedSchool?.name || "No school selected"}
                      disabled
                      className="bg-gray-50 cursor-not-allowed text-xs"
                    />
                    {!selectedSchool && (
                      <p className="text-xs text-red-500 mt-1">
                        Please select a school from the top navigation bar
                      </p>
                    )}
                  </div>

                  {/* Download Sample CSV */}
                  {importSchoolId && (
                    <div>
                      <button
                        type="button"
                        onClick={downloadSampleCSV}
                        className="w-full px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-smooth flex items-center justify-center gap-2"
                      >
                        <FiDownload className="w-4 h-4" />
                        Download Sample CSV
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        Download a sample CSV with school ID pre-filled
                      </p>
                    </div>
                  )}

                  {/* File Upload */}
                  {importSchoolId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Upload CSV File <span className="text-red-500">*</span>
                      </label>
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-smooth ${
                          isDragActive
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                        }`}
                      >
                        <input {...getInputProps()} />
                        <FiUpload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        {importFile ? (
                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              {importFile.name}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImportFile(null);
                                setImportPreview([]);
                              }}
                              className="mt-2 text-xs text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-600">
                              {isDragActive
                                ? "Drop your CSV file here"
                                : "Drag & drop your CSV file here"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              or click to browse
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {importPreview.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Preview ({importPreview.length} rows)
                      </label>
                      <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left">Name</th>
                              <th className="px-2 py-1 text-left">
                                Description
                              </th>
                              <th className="px-2 py-1 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.map((row, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-2 py-1">{row.name}</td>
                                <td className="px-2 py-1">
                                  {row.description || "-"}
                                </td>
                                <td className="px-2 py-1">{row.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Import Button */}
                  {importFile && importSchoolId && (
                    <button
                      type="button"
                      onClick={handleBulkImport}
                      disabled={isImporting}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-semibold shadow transition-all ${
                        isImporting
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-md"
                      }`}
                    >
                      {isImporting ? (
                        <span className="flex items-center justify-center gap-2">
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Importing...
                        </span>
                      ) : (
                        "Import Classes"
                      )}
                    </button>
                  )}

                  {/* Import Results */}
                  {importResult && (
                    <div className="space-y-2">
                      {importResult.success > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-semibold text-green-800">
                            Successfully imported: {importResult.success}{" "}
                            class(es)
                          </p>
                        </div>
                      )}
                      {importResult.skipped > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-semibold text-yellow-800 mb-2">
                            Skipped (duplicates): {importResult.skipped}{" "}
                            class(es)
                          </p>
                          <div className="max-h-32 overflow-y-auto text-xs text-yellow-700">
                            {importResult.duplicates.map((dup, idx) => (
                              <div key={idx} className="mb-1">
                                Row {dup.row} - "{dup.name}": {dup.reason}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {importResult.failed > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-semibold text-red-800 mb-2">
                            Failed: {importResult.failed} class(es)
                          </p>
                          <div className="max-h-32 overflow-y-auto text-xs text-red-700">
                            {importResult.errors.map((err, idx) => (
                              <div key={idx} className="mb-1">
                                Row {err.row}: {err.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            </TabsContent>
          </Tabs>
          </CardContent>
        </Card>

        {/* Right Side - Listing */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={classes}
                searchKey="name"
                searchPlaceholder="Search classes..."
                enableRowSelection={false}
                manualPagination={true}
                pageCount={paginationMeta?.totalPages || 0}
                totalRows={paginationMeta?.total || 0}
                onPaginationChange={handlePaginationChange}
                onSearchChange={handleSearchChange}
                externalPageIndex={page - 1}
                externalPageSize={limit}
                externalSearchValue={search}
                exportFileName="classes"
                exportTitle="Classes List"
                enableExport={true}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
