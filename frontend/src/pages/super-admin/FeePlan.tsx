import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiLoader, FiDownload, FiUpload } from "react-icons/fi";
// useDropzone is now in useFeePlanImport hook
import api from "../../services/api";
import { FeeStructure } from "../../types";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  validateSingleModeForm,
  validateMultipleModeForm,
  validateEditForm,
  generateCombinations,
  filterDuplicates,
  generatePlanNameFromIds,
} from "../../utils/feePlan";
import { useFeePlanData } from "../../hooks/pages/super-admin/useFeePlanData";
import { useFeePlanImport } from "../../hooks/pages/super-admin/useFeePlanImport";
import { useFeePlanSelection } from "../../hooks/pages/super-admin/useFeePlanSelection";
import { useSchool } from "../../contexts/SchoolContext";
// import { useFeePlanForm } from "../../hooks/pages/super-admin/useFeePlanForm"; // TODO: Fix circular dependency
import { FeePlanFilters } from "./components/FeePlanFilters";
import { FeePlanDialogs } from "./components/FeePlanDialogs";
import { FeePlanTable } from "./components/FeePlanTable";
import { FeePlanForm } from "./components/FeePlanForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function FeePlan() {
  const [mode, setMode] = useState<"add" | "import">("add");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const { selectedSchoolId, selectedSchool } = useSchool();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: number;
    schoolId: number;
  } | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Initialize form state first (needed for formSchoolId)
  const [formData, setFormData] = useState({
    feeCategoryId: "" as string | number,
    categoryHeadId: "" as string | number | null,
    amount: "",
    classId: "" as string | number,
    status: "active" as "active" | "inactive",
    schoolId: "" as string | number,
  });
  const [createMode, setCreateMode] = useState<"single" | "multiple">("single");
  const [selectedFeeCategoryIds, setSelectedFeeCategoryIds] = useState<
    number[]
  >([]);
  const [selectedCategoryHeadIds, setSelectedCategoryHeadIds] = useState<
    number[]
  >([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(
    null
  );
  const [formResetKey, setFormResetKey] = useState(0);

  // Use custom hook for all data fetching
  const {
    feeStructures,
    paginationMeta,
    loadingFeeStructures: loading,
    refetchFeeStructures,
    feeCategories,
    loadingCategories,
    categoryHeads,
    loadingCategoryHeads,
    classOptions,
    availableClasses,
    loadingClasses,
  } = useFeePlanData({
    page,
    limit,
    search,
    selectedSchoolId: selectedSchoolId || "",
    formSchoolId: formData.schoolId,
  });

  // Use custom hook for import functionality
  const {
    importSchoolId: hookImportSchoolId,
    setImportSchoolId: setHookImportSchoolId,
    importFile,
    setImportFile,
    importPreview,
    setImportPreview,
    isImporting,
    importResult,
    getRootProps,
    getInputProps,
    isDragActive,
    downloadSampleCSV,
    handleBulkImport,
  } = useFeePlanImport({
    refetchFeeStructures,
    setError,
    setSuccess,
  });

  // Sync importSchoolId with context school
  const importSchoolId = selectedSchoolId || hookImportSchoolId;
  const setImportSchoolId = (schoolId: string | number) => {
    setHookImportSchoolId(schoolId);
  };

  // Use custom hook for selection functionality
  const {
    selectedFeePlanIds,
    setSelectedFeePlanIds,
    isSelectAll,
    setIsSelectAll,
    handleSelectAll,
    handleSelectFeePlan,
    handleExport,
    handleBulkDelete,
  } = useFeePlanSelection({
    feeStructures,
    classOptions,
    refetchFeeStructures,
    setError,
    setSuccess,
  });

  useEffect(() => {
    if (!formData.schoolId) {
      setFormData((prev) => ({ ...prev, classId: "" }));
    }
  }, [formData.schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      // Validate form using utility functions
      let validation;
      if (editingStructure) {
        validation = validateEditForm(formData);
      } else if (createMode === "multiple") {
        validation = validateMultipleModeForm(
          formData,
          selectedFeeCategoryIds,
          selectedClasses
        );
      } else {
        validation = validateSingleModeForm(formData);
      }

      if (!validation.isValid) {
        setError(validation.error || "Validation failed");
        return;
      }

      // Convert schoolId to number
      const schoolIdNum =
        typeof formData.schoolId === "string"
          ? parseInt(formData.schoolId, 10)
          : formData.schoolId;

      const currentSchoolId = schoolIdNum;

      if (editingStructure) {
        // Single edit mode
        if (!formData.classId) {
          setError("Please select a class");
          return;
        }

        const classIdNum =
          typeof formData.classId === "number"
            ? formData.classId
            : parseInt(formData.classId as string);

        // Generate plan name using utility function
        const planName = generatePlanNameFromIds(
          parseInt(formData.feeCategoryId as string),
          formData.categoryHeadId
            ? parseInt(formData.categoryHeadId as string)
            : null,
          classIdNum,
          feeCategories,
          categoryHeads,
          classOptions
        );

        const payload: any = {
          name: planName,
          feeCategoryId: parseInt(formData.feeCategoryId as string),
          amount: parseFloat(formData.amount),
          status: formData.status,
        };

        if (formData.categoryHeadId) {
          payload.categoryHeadId = parseInt(formData.categoryHeadId as string);
        }

        if (classIdNum) {
          payload.classId = classIdNum;
        }

        await api.instance.patch(
          `/super-admin/fee-structures/${editingStructure.id}?schoolId=${currentSchoolId}`,
          payload
        );
        setEditingStructure(null);
        resetForm(true, currentSchoolId);
        setSuccess("Fee plan updated successfully!");
      } else {
        // Create mode
        if (createMode === "multiple") {
          // Generate all combinations using utility function
          const combinations = generateCombinations(
            selectedFeeCategoryIds,
            selectedCategoryHeadIds,
            selectedClasses
          );

          // Check for existing fee structures to avoid duplicates
          const existingStructuresResponse = await api.instance.get(
            "/super-admin/fee-structures",
            {
              params: {
                schoolId: currentSchoolId,
                limit: 10000, // Get all to check duplicates
                page: 1,
              },
            }
          );

          const existingStructures = Array.isArray(
            existingStructuresResponse.data.data
          )
            ? existingStructuresResponse.data.data
            : Array.isArray(existingStructuresResponse.data)
            ? existingStructuresResponse.data
            : [];

          // Filter out duplicates using utility function
          const newCombinations = filterDuplicates(
            combinations,
            existingStructures
          );

          const duplicateCount = combinations.length - newCombinations.length;

          if (newCombinations.length === 0) {
            setError(
              `All ${combinations.length} fee plan(s) already exist. No new plans created.`
            );
            setTimeout(() => setError(""), 5000);
            return;
          }

          // Create only new combinations with error handling
          let successCount = 0;
          let failedCount = 0;
          const failedNames: string[] = [];

          for (const combo of newCombinations) {
            try {
              // Generate plan name using utility function
              const planName = generatePlanNameFromIds(
                combo.feeCategoryId,
                combo.categoryHeadId,
                combo.classId,
                feeCategories,
                categoryHeads,
                classOptions
              );

              const payload: any = {
                name: planName,
                feeCategoryId: combo.feeCategoryId,
                amount: parseFloat(formData.amount),
                status: formData.status,
              };

              if (combo.categoryHeadId) {
                payload.categoryHeadId = combo.categoryHeadId;
              }

              if (combo.classId) {
                payload.classId = combo.classId;
              }

              await api.instance.post(
                `/super-admin/fee-structures?schoolId=${currentSchoolId}`,
                payload
              );
              successCount++;
            } catch (err: any) {
              failedCount++;
              // Generate plan name using utility function
              const planName = generatePlanNameFromIds(
                combo.feeCategoryId,
                combo.categoryHeadId,
                combo.classId,
                feeCategories,
                categoryHeads,
                classOptions
              );

              // Check if it's a duplicate error (400) or other error
              if (err.response?.status === 400) {
                // Likely a duplicate, skip it
                failedNames.push(planName);
              } else {
                // Other error, add to failed list
                failedNames.push(planName);
              }
            }
          }

          // Build success message
          let successMessage = "";
          if (successCount > 0) {
            successMessage = `Successfully created ${successCount} fee plan(s)!`;
          }
          if (duplicateCount > 0 || failedCount > 0) {
            const totalSkipped = duplicateCount + failedCount;
            if (successMessage) {
              successMessage += ` (${totalSkipped} already existed or failed and were skipped)`;
            } else {
              successMessage = `All ${combinations.length} fee plan(s) already exist or failed. No new plans created.`;
            }
          }
          if (successMessage) {
            setSuccess(successMessage);
          } else {
            setError("Failed to create fee plans. Please try again.");
          }
          setSelectedFeeCategoryIds([]);
          setSelectedCategoryHeadIds([]);
          setSelectedClasses([]);
        } else {
          // Single create mode
          const classIdNum =
            typeof formData.classId === "number"
              ? formData.classId
              : parseInt(formData.classId as string);

          // Generate plan name using utility function
          const planName = generatePlanNameFromIds(
            parseInt(formData.feeCategoryId as string),
            formData.categoryHeadId
              ? parseInt(formData.categoryHeadId as string)
              : null,
            classIdNum,
            feeCategories,
            categoryHeads,
            classOptions
          );

          const payload: any = {
            name: planName,
            feeCategoryId: parseInt(formData.feeCategoryId as string),
            amount: parseFloat(formData.amount),
            status: formData.status,
          };

          if (formData.categoryHeadId) {
            payload.categoryHeadId = parseInt(
              formData.categoryHeadId as string
            );
          }

          if (classIdNum) {
            payload.classId = classIdNum;
          }

          await api.instance.post(
            `/super-admin/fee-structures?schoolId=${currentSchoolId}`,
            payload
          );
        }
        resetForm(true, currentSchoolId);
        setSuccess("Fee plan created successfully!");
      }

      refetchFeeStructures();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save fee plan";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const resetForm = (
    retainSchool: boolean = false,
    schoolId?: string | number
  ) => {
    setFormData({
      feeCategoryId: "" as string | number,
      categoryHeadId: null,
      amount: "",
      classId: "",
      status: "active" as "active" | "inactive",
      schoolId: retainSchool && schoolId ? schoolId : ("" as string | number),
    });
    setCreateMode("single");
    setSelectedFeeCategoryIds([]);
    setSelectedCategoryHeadIds([]);
    setSelectedClasses([]);
    setError("");
    // Don't clear success here - let the caller manage success messages
    // Force re-render of Select components
    setFormResetKey((prev) => prev + 1);
  };

  const handleEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    // Use classId directly
    const classId: string | number = structure.classId || "";

    setFormData({
      feeCategoryId: structure.feeCategoryId,
      categoryHeadId: structure.categoryHeadId || null,
      amount: structure.amount.toString(),
      classId: classId,
      status: structure.status,
      schoolId: structure.schoolId,
    });
    setError("");
    setSuccess("");
  };

  const handleDeleteClick = (id: number, schoolId: number) => {
    setDeleteItem({ id, schoolId });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setError("");
      await api.instance.delete(
        `/super-admin/fee-structures/${deleteItem.id}?schoolId=${deleteItem.schoolId}`
      );
      setSuccess("Fee plan deleted successfully!");
      setDeleteDialogOpen(false);
      setDeleteItem(null);
      refetchFeeStructures();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete fee plan";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancel = () => {
    setEditingStructure(null);
    resetForm();
    setError("");
    setSuccess("");
  };

  // Bulk operations are now in useFeePlanSelection hook
  const handleBulkDeleteClick = () => {
    if (selectedFeePlanIds.length === 0) {
      setError("Please select at least one fee plan to delete");
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteWithDialog = async () => {
    await handleBulkDelete();
    setBulkDeleteDialogOpen(false);
  };

  // Import functions are now in useFeePlanImport hook

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
              <Link to="/super-admin/settings/fee-settings/fee-plan">Settings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Fee Plan</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Fee Plan Management
          </CardTitle>
          <CardDescription>
            Create and manage fee plans by combining fee categories with
            category heads
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Add/Edit Form or Import */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800 mb-4">
              {editingStructure ? "Edit Fee Plan" : "Fee Plan Management"}
            </CardTitle>
            <Tabs
              value={mode}
              onValueChange={(value) => {
                if (value === "add") {
                  setMode("add");
                  setError("");
                  setSuccess("");
                  setImportFile(null);
                  setImportPreview([]);
                } else if (value === "import") {
                  setMode("import");
                  setError("");
                  setSuccess("");
                  resetForm();
                }
              }}
            >
              <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 p-1 rounded-lg border border-gray-200">
                <TabsTrigger
                  value="add"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all font-semibold"
                >
                  Add Fee Plan
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all font-semibold"
                >
                  Import Fee Plans
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as "add" | "import")}
            >
              <TabsContent value="add" className="mt-0">
                <FeePlanForm
                  formData={formData}
                  setFormData={setFormData}
                  createMode={createMode}
                  setCreateMode={setCreateMode}
                  selectedFeeCategoryIds={selectedFeeCategoryIds}
                  setSelectedFeeCategoryIds={setSelectedFeeCategoryIds}
                  selectedCategoryHeadIds={selectedCategoryHeadIds}
                  setSelectedCategoryHeadIds={setSelectedCategoryHeadIds}
                  selectedClasses={selectedClasses}
                  setSelectedClasses={setSelectedClasses}
                  editingStructure={editingStructure}
                  formResetKey={formResetKey}
                  handleSubmit={handleSubmit}
                  handleCancel={handleCancel}
                  feeCategories={feeCategories}
                  loadingCategories={loadingCategories}
                  categoryHeads={categoryHeads}
                  loadingCategoryHeads={loadingCategoryHeads}
                  classOptions={classOptions}
                  availableClasses={availableClasses}
                  loadingClasses={loadingClasses}
                />
              </TabsContent>
              <TabsContent value="import" className="mt-0">
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadSampleCSV}
                        className="w-full"
                      >
                        <FiDownload className="w-4 h-4 mr-2" />
                        Download Sample CSV
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        Download a sample CSV template. Use names (not IDs) for
                        fee categories, category heads, and classes.
                      </p>
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 mb-1">
                          CSV Format:
                        </p>
                        <ul className="text-xs text-blue-800 space-y-0.5 list-disc list-inside">
                          <li>
                            <strong>feeCategoryName</strong> - Name of fee
                            category (e.g., "Tuition Fee")
                          </li>
                          <li>
                            <strong>categoryHeadName</strong> - Name of category
                            head (optional, leave empty for "General")
                          </li>
                          <li>
                            <strong>className</strong> - Name of class (e.g.,
                            "1st", "2nd")
                          </li>
                          <li>
                            <strong>amount</strong> - Fee amount (e.g.,
                            "5000.00")
                          </li>
                          <li>
                            <strong>status</strong> - "active" or "inactive"
                          </li>
                          <li>
                            <strong>name</strong> - Plan name (optional,
                            auto-generated if empty)
                          </li>
                        </ul>
                        <p className="text-xs text-blue-700 mt-1 font-medium">
                          Note: All names must belong to the selected school.
                          The system will validate and show errors if names
                          don't match.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* File Upload */}
                  {importSchoolId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Upload CSV File <span className="text-red-500">*</span>
                      </label>
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-smooth ${
                          isDragActive
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                        }`}
                      >
                        <input {...getInputProps()} />
                        <FiUpload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                        {importFile ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-700">
                              {importFile.name}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImportFile(null);
                                setImportPreview([]);
                                setError("");
                                setSuccess("");
                              }}
                              className="mt-1 text-xs"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-600">
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
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Preview ({importPreview.length} rows)
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left">
                                Fee Category
                              </th>
                              <th className="px-2 py-1 text-left">
                                Category Head
                              </th>
                              <th className="px-2 py-1 text-left">Class</th>
                              <th className="px-2 py-1 text-left">Amount</th>
                              <th className="px-2 py-1 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.map((row, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-2 py-1">
                                  {row.feeCategoryName ||
                                    `ID: ${row.feeCategoryId}`}
                                </td>
                                <td className="px-2 py-1">
                                  {row.categoryHeadName || "General"}
                                </td>
                                <td className="px-2 py-1">
                                  {row.className || `ID: ${row.classId}`}
                                </td>
                                <td className="px-2 py-1">{row.amount}</td>
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
                    <Button
                      type="button"
                      onClick={handleBulkImport}
                      disabled={isImporting}
                      className="w-full"
                    >
                      {isImporting ? (
                        <span className="flex items-center justify-center gap-2">
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Importing...
                        </span>
                      ) : (
                        "Import Fee Plans"
                      )}
                    </Button>
                  )}

                  {/* Import Results */}
                  {importResult && (
                    <div className="space-y-2">
                      {importResult.success > 0 && (
                        <Card className="border-l-4 border-l-green-400 bg-green-50">
                          <CardContent className="py-2 px-3">
                            <p className="text-xs font-semibold text-green-800">
                              Successfully imported: {importResult.success} fee
                              plan(s)
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      {importResult.skipped > 0 && (
                        <Card className="border-l-4 border-l-yellow-400 bg-yellow-50">
                          <CardContent className="py-2 px-3">
                            <p className="text-xs font-semibold text-yellow-800 mb-1">
                              Skipped (duplicates): {importResult.skipped} fee
                              plan(s)
                            </p>
                            <div className="max-h-24 overflow-y-auto text-xs text-yellow-700">
                              {importResult.duplicates.map((dup, idx) => (
                                <div key={idx} className="mb-0.5">
                                  Row {dup.row} - "{dup.name}": {dup.reason}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {importResult.failed > 0 && (
                        <Card className="border-l-4 border-l-red-400 bg-red-50">
                          <CardContent className="py-2 px-3">
                            <p className="text-xs font-semibold text-red-800 mb-1">
                              Failed: {importResult.failed} fee plan(s)
                            </p>
                            <div className="max-h-24 overflow-y-auto text-xs text-red-700">
                              {importResult.errors.map((err, idx) => (
                                <div key={idx} className="mb-0.5">
                                  Row {err.row}: {err.error}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Side - List */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            {/* Search and Filter */}
            <FeePlanFilters
              search={search}
              setSearch={setSearch}
              setPage={setPage}
            />

            {/* Table */}
            <FeePlanTable
              feeStructures={feeStructures}
              loading={loading}
              paginationMeta={paginationMeta}
              page={page}
              limit={limit}
              setPage={setPage}
              setLimit={setLimit}
              search={search}
              selectedSchoolId={selectedSchoolId}
              selectedFeePlanIds={selectedFeePlanIds}
              setSelectedFeePlanIds={setSelectedFeePlanIds}
              setIsSelectAll={setIsSelectAll}
              isSelectAll={isSelectAll}
              handleSelectAll={handleSelectAll}
              handleSelectFeePlan={handleSelectFeePlan}
              handleEdit={handleEdit}
              handleDeleteClick={handleDeleteClick}
              handleExport={handleExport}
              handleBulkDeleteClick={handleBulkDeleteClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <FeePlanDialogs
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        setDeleteItem={setDeleteItem}
        handleDelete={handleDelete}
        bulkDeleteDialogOpen={bulkDeleteDialogOpen}
        setBulkDeleteDialogOpen={setBulkDeleteDialogOpen}
        selectedFeePlanIds={selectedFeePlanIds}
        handleBulkDeleteWithDialog={handleBulkDeleteWithDialog}
      />
    </div>
  );
}
