import { useState, useEffect, useCallback } from "react";
import {
  FiEdit,
  FiTrash2,
  FiLoader,
  FiDollarSign,
  FiX,
  FiSearch,
  FiUpload,
  FiDownload,
} from "react-icons/fi";
import { useDropzone } from "react-dropzone";
import api from "../../services/api";
import CustomDropdown from "../../components/ui/CustomDropdown";
import Pagination from "../../components/Pagination";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface FeeCategory {
  id: number;
  name: string;
  description?: string;
  type: "school" | "transport";
  status: string;
  applicableMonths?: number[]; // Array of month numbers (1-12)
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

export default function FeeHeading() {
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(
    null
  );
  const [mode, setMode] = useState<"add" | "import">("add");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "school" as "school" | "transport",
    status: "active" as string,
    schoolId: "" as string | number,
    applicableMonths: [] as number[],
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
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | number>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );

  useEffect(() => {
    loadFeeCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, selectedSchoolId, selectedType]);

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
      setSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadFeeCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const params: any = { page, limit };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedSchoolId) {
        params.schoolId = selectedSchoolId;
      }
      if (selectedType) {
        params.type = selectedType;
      }

      const response = await api.instance.get("/super-admin/fee-categories", {
        params,
      });

      if (response.data.data && response.data.meta) {
        setFeeCategories(response.data.data);
        setPaginationMeta(response.data.meta);
      } else if (Array.isArray(response.data)) {
        setFeeCategories(response.data);
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
      setError(err.response?.data?.message || "Failed to load fee categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      if (!formData.schoolId) {
        setError("Please select a school");
        return;
      }

      const basePayload: any = {
        description: formData.description.trim() || undefined,
        type: formData.type,
        status: formData.status,
      };

      // Include applicableMonths if selected, otherwise send empty array (means all months)
      if (formData.applicableMonths.length > 0) {
        basePayload.applicableMonths = formData.applicableMonths;
      } else {
        basePayload.applicableMonths = [];
      }

      const currentSchoolId = formData.schoolId;

      if (editingCategory) {
        const payload = {
          ...basePayload,
          name: formData.name.trim(),
        };
        await api.instance.patch(
          `/super-admin/fee-categories/${editingCategory.id}?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Fee category updated successfully!");
        setEditingCategory(null);
        resetForm();
      } else {
        const payload = {
          ...basePayload,
          name: formData.name.trim(),
        };
        await api.instance.post(
          `/super-admin/fee-categories?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Fee category created successfully!");
        // Retain school selection when creating new category
        resetForm(true, currentSchoolId);
      }

      loadFeeCategories();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save fee category";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const resetForm = (
    retainSchool: boolean = false,
    schoolId?: string | number
  ) => {
    setFormData({
      name: "",
      description: "",
      type: "school",
      status: "active",
      schoolId: retainSchool && schoolId ? schoolId : "",
      applicableMonths: [],
    });
  };

  const handleEdit = (category: FeeCategory) => {
    setMode("add"); // Switch to Add Fee Category tab
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      type: category.type || "school",
      status: category.status,
      schoolId: category.schoolId,
      applicableMonths: category.applicableMonths || [],
    });
    setSelectedSchoolId(category.schoolId); // Set selected school for filtering
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: number, schoolId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this fee category? This action cannot be undone."
      )
    )
      return;

    try {
      setError("");
      await api.instance.delete(
        `/super-admin/fee-categories/${id}?schoolId=${schoolId}`
      );
      setSuccess("Fee category deleted successfully!");
      loadFeeCategories();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete fee category";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    resetForm();
    setError("");
    setSuccess("");
  };

  // Bulk operations
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = feeCategories.map((c) => c.id);
      setSelectedCategoryIds(allIds);
    } else {
      setSelectedCategoryIds([]);
    }
    setIsSelectAll(checked);
  };

  const handleSelectCategory = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    } else {
      setSelectedCategoryIds(selectedCategoryIds.filter((cid) => cid !== id));
      setIsSelectAll(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategoryIds.length === 0) {
      setError("Please select at least one fee category to delete");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedCategoryIds.length} fee category(es)? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const deletePromises = selectedCategoryIds.map(async (id) => {
        const category = feeCategories.find((c) => c.id === id);
        if (category) {
          return api.instance.delete(
            `/super-admin/fee-categories/${id}?schoolId=${category.schoolId}`
          );
        }
      });

      await Promise.all(deletePromises);
      setSelectedCategoryIds([]);
      setIsSelectAll(false);
      setSuccess(
        `Successfully deleted ${selectedCategoryIds.length} fee category(es)!`
      );
      loadFeeCategories();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete fee categories";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleExport = () => {
    if (selectedCategoryIds.length === 0) {
      setError("Please select at least one fee category to export");
      return;
    }

    const selectedCategories = feeCategories.filter((c) =>
      selectedCategoryIds.includes(c.id)
    );

    // Convert to CSV
    const headers = [
      "Name",
      "Description",
      "Type",
      "Status",
      "School",
      "Applicable Months",
      "Created At",
    ];

    const rows = selectedCategories.map((category) => [
      category.name,
      category.description || "",
      category.type,
      category.status,
      category.school?.name || `School ID: ${category.schoolId}`,
      category.applicableMonths && category.applicableMonths.length > 0
        ? category.applicableMonths.join(",")
        : "All months",
      new Date(category.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `fee_categories_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess(
      `Exported ${selectedCategoryIds.length} fee category(es) successfully!`
    );
    setTimeout(() => setSuccess(""), 3000);
  };

  // Sync select all checkbox
  useEffect(() => {
    if (feeCategories.length > 0) {
      setIsSelectAll(
        selectedCategoryIds.length === feeCategories.length &&
          feeCategories.every((c) => selectedCategoryIds.includes(c.id))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryIds, feeCategories]);

  // Download sample CSV
  const downloadSampleCSV = () => {
    if (!importSchoolId) {
      setError("Please select a school first");
      return;
    }

    const headers = [
      "schoolId",
      "name",
      "description",
      "type",
      "status",
      "applicableMonths",
    ];
    const sampleRow = [
      importSchoolId.toString(),
      "Tuition Fee",
      "Monthly tuition fee",
      "school",
      "active",
      "1,2,3,4,5,6,7,8,9,10,11,12", // All months (comma-separated numbers 1-12)
    ];

    // Properly quote CSV cells to handle commas in applicableMonths
    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      sampleRow.map((cell) => `"${cell}"`).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `fee_categories_sample_${importSchoolId}.csv`
    );
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
                // Parse applicable months if provided
                let applicableMonths: number[] = [];
                if (row.applicablemonths) {
                  const monthsStr = row.applicablemonths;
                  if (monthsStr) {
                    applicableMonths = monthsStr
                      .split(",")
                      .map((m: string) => parseInt(m.trim()))
                      .filter((m: number) => !isNaN(m) && m >= 1 && m <= 12);
                  }
                }

                data.push({
                  schoolId: row.schoolid || importSchoolId,
                  name: row.name,
                  description: row.description || "",
                  type: (row.type || "school").toLowerCase(),
                  status: row.status || "active",
                  applicableMonths:
                    applicableMonths.length > 0 ? applicableMonths : undefined,
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

      const categoriesData = await parseCSV(importFile);

      if (categoriesData.length === 0) {
        setError("No valid fee categories found in CSV file");
        return;
      }

      // Fetch existing categories for duplicate checking
      const existingCategoriesResponse = await api.instance.get(
        "/super-admin/fee-categories",
        {
          params: { schoolId: importSchoolId, limit: 1000 },
        }
      );
      const existingCategories =
        existingCategoriesResponse.data.data ||
        existingCategoriesResponse.data ||
        [];
      // Create a Set using composite key: name + type (since same name can exist with different types)
      const existingCategoryKeys = new Set(
        existingCategories.map(
          (cat: FeeCategory) =>
            `${cat.name.toLowerCase().trim()}_${cat.type.toLowerCase()}`
        )
      );

      // Check for duplicates within CSV using composite key: name + type
      const csvCategoryKeys = new Map<string, number[]>(); // "name_type" -> array of row numbers
      categoriesData.forEach((categoryData, index) => {
        const name = categoryData.name.toLowerCase().trim();
        const type = (categoryData.type || "school").toLowerCase();
        const key = `${name}_${type}`;
        if (!csvCategoryKeys.has(key)) {
          csvCategoryKeys.set(key, []);
        }
        csvCategoryKeys.get(key)!.push(index + 2); // +2 because row 1 is header
      });

      const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [] as Array<{ row: number; error: string }>,
        duplicates: [] as Array<{ row: number; name: string; reason: string }>,
      };

      // Import categories one by one
      for (let i = 0; i < categoriesData.length; i++) {
        const categoryData = categoriesData[i];
        const categoryName = categoryData.name.trim();
        const categoryNameLower = categoryName.toLowerCase();
        const categoryType = (categoryData.type || "school").toLowerCase();
        const categoryKey = `${categoryNameLower}_${categoryType}`;
        const rowNumber = i + 2; // +2 because row 1 is header

        // Check for duplicates within CSV (skip if not first occurrence)
        const occurrences = csvCategoryKeys.get(categoryKey) || [];
        if (occurrences.length > 1 && occurrences[0] !== rowNumber) {
          results.skipped++;
          results.duplicates.push({
            row: rowNumber,
            name: categoryName,
            reason: `Duplicate name and type in CSV (first occurrence at row ${occurrences[0]})`,
          });
          continue;
        }

        // Check for duplicates against existing categories (name + type combination)
        if (existingCategoryKeys.has(categoryKey)) {
          results.skipped++;
          results.duplicates.push({
            row: rowNumber,
            name: categoryName,
            reason: `Fee category with name "${categoryName}" and type "${categoryType}" already exists in database`,
          });
          continue;
        }

        try {
          const payload: any = {
            name: categoryData.name,
            description: categoryData.description || undefined,
            type: categoryData.type || "school",
            status: categoryData.status || "active",
          };

          if (
            categoryData.applicableMonths &&
            categoryData.applicableMonths.length > 0
          ) {
            payload.applicableMonths = categoryData.applicableMonths;
          }

          await api.instance.post(
            `/super-admin/fee-categories?schoolId=${importSchoolId}`,
            payload
          );
          results.success++;
          // Add to existing set to prevent duplicates within the same import batch
          existingCategoryKeys.add(categoryKey);
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message || "Failed to create fee category";

          // Check if it's a duplicate error
          if (errorMessage.toLowerCase().includes("already exists")) {
            results.skipped++;
            results.duplicates.push({
              row: rowNumber,
              name: categoryName,
              reason: "Fee category already exists in database",
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
        setSuccess(`Successfully imported ${results.success} fee category(es)`);
        if (results.skipped > 0) {
          setSuccess(
            `Successfully imported ${results.success} fee category(es). ${results.skipped} duplicate(s) skipped.`
          );
        }
        setImportFile(null);
        setImportPreview([]);
        loadFeeCategories();
      }
      if (results.failed > 0) {
        setError(
          `${results.failed} fee category(es) failed to import. Check errors below.`
        );
      }
      if (results.skipped > 0 && results.success === 0) {
        setError(
          `All ${results.skipped} fee category(es) were duplicates and skipped.`
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to import fee categories"
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Fee Heading Management
          </CardTitle>
          <CardDescription>
            Manage fee categories (headings) for schools
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages - Below header banner */}
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
        {/* Left Side - Add/Edit Form or Import */}
        <div className="card-modern rounded-xl p-4 lg:col-span-1">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => {
                setMode("add");
                setError("");
                setSuccess("");
                setImportFile(null);
                setImportPreview([]);
                setImportResult(null);
              }}
              className={`px-4 py-2 text-sm font-semibold transition-smooth ${
                mode === "add"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Add Fee Heading
            </button>
            <button
              onClick={() => {
                setMode("import");
                setError("");
                setSuccess("");
                resetForm();
              }}
              className={`px-4 py-2 text-sm font-semibold transition-smooth ${
                mode === "import"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Import Fee Headings
            </button>
          </div>

          {mode === "add" ? (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingCategory ? "Edit Fee Heading" : "Add Fee Heading"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School <span className="text-red-500">*</span>
                  </label>
                  {loadingSchools ? (
                    <div className="flex items-center justify-center py-4">
                      <FiLoader className="w-5 h-5 animate-spin text-indigo-600" />
                      <span className="ml-2 text-gray-600">
                        Loading schools...
                      </span>
                    </div>
                  ) : (
                    <CustomDropdown
                      options={schools.map((school) => ({
                        value: school.id.toString(),
                        label: school.name,
                      }))}
                      value={formData.schoolId?.toString() || ""}
                      onChange={(value) => {
                        const numValue =
                          typeof value === "string"
                            ? parseInt(value, 10)
                            : value;
                        setFormData({ ...formData, schoolId: numValue || "" });
                      }}
                      placeholder="Select a school..."
                      className="w-full"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Tuition Fee, Library Fee"
                    required
                    disabled={!formData.schoolId}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth ${
                      !formData.schoolId
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                        : "bg-white"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Type <span className="text-red-500">*</span>
                  </label>
                  <CustomDropdown
                    options={[
                      { value: "school", label: "School Fee" },
                      { value: "transport", label: "Transport Fee" },
                    ]}
                    value={formData.type}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        type: value as "school" | "transport",
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <CustomDropdown
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                    value={formData.status}
                    onChange={(value) =>
                      setFormData({ ...formData, status: String(value) })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Applicable Months
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Select months when this fee is applicable. Leave empty for
                    all months.
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                    {[
                      { num: 1, name: "Jan" },
                      { num: 2, name: "Feb" },
                      { num: 3, name: "Mar" },
                      { num: 4, name: "Apr" },
                      { num: 5, name: "May" },
                      { num: 6, name: "Jun" },
                      { num: 7, name: "Jul" },
                      { num: 8, name: "Aug" },
                      { num: 9, name: "Sep" },
                      { num: 10, name: "Oct" },
                      { num: 11, name: "Nov" },
                      { num: 12, name: "Dec" },
                    ].map((month) => {
                      const isSelected = formData.applicableMonths.includes(
                        month.num
                      );
                      return (
                        <button
                          key={month.num}
                          type="button"
                          onClick={() => {
                            const newMonths = isSelected
                              ? formData.applicableMonths.filter(
                                  (m) => m !== month.num
                                )
                              : [...formData.applicableMonths, month.num].sort(
                                  (a, b) => a - b
                                );
                            setFormData({
                              ...formData,
                              applicableMonths: newMonths,
                            });
                          }}
                          className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-md"
                              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                          }`}
                        >
                          {month.name}
                        </button>
                      );
                    })}
                  </div>
                  {formData.applicableMonths.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-600">Selected:</span>
                      <span className="text-xs font-medium text-indigo-600">
                        {formData.applicableMonths
                          .map((m) => {
                            const monthNames = [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec",
                            ];
                            return monthNames[m - 1];
                          })
                          .join(", ")}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, applicableMonths: [] })
                        }
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {editingCategory ? "Update" : "Create"}
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-smooth"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Import Fee Headings from CSV
              </h2>

              <div className="space-y-4">
                {/* School Selection for Import */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School <span className="text-red-500">*</span>
                  </label>
                  {loadingSchools ? (
                    <div className="flex items-center justify-center py-2">
                      <FiLoader className="w-4 h-4 animate-spin text-indigo-600" />
                      <span className="ml-2 text-sm text-gray-600">
                        Loading...
                      </span>
                    </div>
                  ) : (
                    <CustomDropdown
                      options={schools.map((school) => ({
                        value: school.id.toString(),
                        label: school.name,
                      }))}
                      value={importSchoolId?.toString() || ""}
                      onChange={(value) => {
                        const schoolId = value ? parseInt(value as string) : "";
                        setImportSchoolId(schoolId);
                        setImportFile(null);
                        setImportPreview([]);
                        setImportResult(null);
                      }}
                      placeholder="Select a school..."
                      className="w-full"
                    />
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                              setImportResult(null);
                              setError("");
                              setSuccess("");
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview ({importPreview.length} rows)
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-1 text-left">Name</th>
                            <th className="px-2 py-1 text-left">Type</th>
                            <th className="px-2 py-1 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-2 py-1">{row.name}</td>
                              <td className="px-2 py-1">{row.type}</td>
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
                      "Import Fee Categories"
                    )}
                  </button>
                )}

                {/* Import Results */}
                {importResult && (
                  <div className="space-y-2">
                    {importResult.success > 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800">
                          Successfully imported: {importResult.success} fee
                          category(es)
                        </p>
                      </div>
                    )}
                    {importResult.skipped > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-semibold text-yellow-800 mb-2">
                          Skipped (duplicates): {importResult.skipped} fee
                          category(es)
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
                          Failed: {importResult.failed} fee category(es)
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
          )}
        </div>

        {/* Right Side - List */}
        <div className="card-modern rounded-xl p-4 lg:col-span-2">
          {/* Search and Filter */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or description..."
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by School
                </label>
                <CustomDropdown
                  options={[
                    { value: "", label: "All Schools" },
                    ...schools.map((school) => ({
                      value: school.id.toString(),
                      label: school.name,
                    })),
                  ]}
                  value={selectedSchoolId?.toString() || ""}
                  onChange={(value) => {
                    const numValue =
                      typeof value === "string" ? parseInt(value, 10) : value;
                    setSelectedSchoolId(numValue || "");
                    setPage(1);
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Type
                </label>
                <CustomDropdown
                  options={[
                    { value: "", label: "All Types" },
                    { value: "school", label: "School Fee" },
                    { value: "transport", label: "Transport Fee" },
                  ]}
                  value={selectedType}
                  onChange={(value) => {
                    setSelectedType(String(value));
                    setPage(1);
                  }}
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
          ) : feeCategories.length === 0 ? (
            <div className="text-center py-12">
              <FiDollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {search || selectedSchoolId || selectedType
                  ? "No fee categories found matching your criteria"
                  : "No fee categories found. Create one to get started."}
              </p>
            </div>
          ) : (
            <>
              {/* Bulk Actions Bar */}
              {selectedCategoryIds.length > 0 && (
                <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-indigo-900">
                      {selectedCategoryIds.length} fee category(es) selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExport}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-smooth flex items-center gap-2"
                    >
                      <FiDownload className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-smooth flex items-center gap-2"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete ({selectedCategoryIds.length})
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategoryIds([]);
                        setIsSelectAll(false);
                      }}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-smooth"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-12">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelectAll}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                        </label>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Applicable Months
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        School
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
                    {feeCategories.map((category) => (
                      <tr
                        key={category.id}
                        className={`hover:bg-indigo-50/50 transition-all duration-150 group ${
                          selectedCategoryIds.includes(category.id)
                            ? "bg-indigo-50"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategoryIds.includes(
                                category.id
                              )}
                              onChange={(e) =>
                                handleSelectCategory(
                                  category.id,
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">
                            {category.name}
                          </div>
                          {category.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {category.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              category.type === "transport"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {category.type === "transport"
                              ? "Transport"
                              : "School"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {category.applicableMonths &&
                          category.applicableMonths.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {category.applicableMonths.map((month) => {
                                const monthNames = [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec",
                                ];
                                return (
                                  <span
                                    key={month}
                                    className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded"
                                  >
                                    {monthNames[month - 1]}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">
                              All months
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {category.school?.name ||
                            `School ID: ${category.schoolId}`}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              category.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {category.status.charAt(0).toUpperCase() +
                              category.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-smooth"
                              title="Edit"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(category.id, category.schoolId)
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
              {paginationMeta && (
                <Pagination
                  paginationMeta={paginationMeta}
                  page={page}
                  limit={limit}
                  onPageChange={setPage}
                  onLimitChange={(newLimit: number) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                  itemName="fee categories"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
