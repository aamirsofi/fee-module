import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiLoader,
  FiDownload,
  FiUpload,
  FiEdit,
  FiTrash2,
  FiDollarSign,
} from "react-icons/fi";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
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
import { useFeePlanForm } from "../../hooks/pages/super-admin/useFeePlanForm";
import { FeePlanDialogs } from "./components/FeePlanDialogs";
import { FeePlanForm } from "./components/FeePlanForm";
import { DataTable } from "@/components/DataTable";
import { getErrorMessage } from "@/utils/errorHandling";
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
    formSchoolId: "", // Will be updated when form hook is initialized
  });

  // Use custom hook for form functionality (after data is loaded)
  const {
    formData,
    setFormData,
    createMode,
    setCreateMode,
    selectedFeeCategoryIds,
    setSelectedFeeCategoryIds,
    selectedCategoryHeadIds,
    setSelectedCategoryHeadIds,
    selectedClasses,
    setSelectedClasses,
    editingStructure,
    setEditingStructure,
    formResetKey,
    handleSubmit,
    resetForm,
    handleEdit,
    handleCancel,
  } = useFeePlanForm({
    feeCategories,
    categoryHeads,
    classOptions,
    refetchFeeStructures,
    setError,
    setSuccess,
  });

  // Use custom hook for import functionality
  const {
    importSchoolId: hookImportSchoolId,
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

  // Use custom hook for selection functionality
  const {
    selectedFeePlanIds,
    setSelectedFeePlanIds,
    setIsSelectAll,
    handleExport,
    handleBulkDelete,
  } = useFeePlanSelection({
    feeStructures,
    classOptions,
    refetchFeeStructures,
    setError,
    setSuccess,
  });

  // Update formSchoolId for useFeePlanData when formData.schoolId changes
  useEffect(() => {
    // This ensures categories/heads/classes are loaded for the selected school in the form
  }, [formData.schoolId]);

  const handleDeleteClick = useCallback((id: number, schoolId: number) => {
    setDeleteItem({ id, schoolId });
    setDeleteDialogOpen(true);
  }, []);

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
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, "Failed to delete fee plan");
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };


  // Bulk operations are now in useFeePlanSelection hook
  const handleBulkDeleteClick = () => {
    if (selectedFeePlanIds.length === 0) {
      setError("Please select at least one fee plan to delete");
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handlePaginationChange = useCallback(
    (pageIndex: number, pageSize: number) => {
      setPage(pageIndex + 1);
      setLimit(pageSize);
    },
    []
  );

  const handleSearchChange = useCallback((searchValue: string) => {
    setSearch(searchValue);
    setPage(1);
  }, []);

  const columns: ColumnDef<FeeStructure>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              Plan Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return <div className="font-semibold">{row.getValue("name")}</div>;
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
        accessorKey: "classId",
        header: "Class",
        cell: ({ row }) => {
          const classId = row.original.classId;
          const className = classId
            ? classOptions.find((c) => c.id === classId)?.name
            : null;
          return (
            <div className="text-sm text-gray-600">{className || "-"}</div>
          );
        },
      },
      {
        accessorKey: "categoryHead",
        header: "Category Head",
        cell: ({ row }) => {
          const categoryHead = row.original.categoryHead;
          return (
            <div className="text-sm text-gray-600">
              {categoryHead?.name || "General"}
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Fee Heading",
        cell: ({ row }) => {
          const category = row.original.category;
          return (
            <div className="text-sm text-gray-600">
              {category?.name || `Category ID: ${row.original.feeCategoryId}`}
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
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("amount") as string);
          return (
            <div className="flex items-center text-sm font-semibold">
              <FiDollarSign className="w-4 h-4 mr-1 text-indigo-500" />
              {amount.toLocaleString()}
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
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
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
          const structure = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(structure)}
                className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                title="Edit"
              >
                <FiEdit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  handleDeleteClick(structure.id, structure.schoolId)
                }
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
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
    [classOptions, handleEdit, handleDeleteClick]
  );

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
              <Link to="/super-admin/settings/fee-settings/fee-plan">
                Settings
              </Link>
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
            {/* Bulk Actions Bar */}
            {selectedFeePlanIds.length > 0 && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-indigo-900">
                    {selectedFeePlanIds.length} fee plan(s) selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    onClick={handleBulkDeleteClick}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <FiTrash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedFeePlanIds.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFeePlanIds([]);
                      setIsSelectAll(false);
                    }}
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={feeStructures}
                searchKey="name"
                searchPlaceholder="Search fee plans..."
                enableRowSelection={true}
                onRowSelectionChange={(selectedRows) => {
                  const selectedIds = selectedRows.map((row) => row.id);
                  setSelectedFeePlanIds(selectedIds);
                  setIsSelectAll(
                    selectedIds.length === feeStructures.length &&
                      feeStructures.length > 0
                  );
                }}
                rowSelection={selectedFeePlanIds.reduce((acc, id) => {
                  acc[id] = true;
                  return acc;
                }, {} as Record<number, boolean>)}
                manualPagination={true}
                pageCount={paginationMeta?.totalPages || 0}
                totalRows={paginationMeta?.total || 0}
                onPaginationChange={handlePaginationChange}
                onSearchChange={handleSearchChange}
                externalPageIndex={page - 1}
                externalPageSize={limit}
                externalSearchValue={search}
                exportFileName="fee-plans"
                exportTitle="Fee Plans List"
                enableExport={true}
              />
            )}
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
