import { useState } from "react";
import api from "../../services/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  useFeeHeadingData,
  FeeCategory,
} from "../../hooks/pages/super-admin/useFeeHeadingData";
import { useFeeHeadingImport } from "../../hooks/pages/super-admin/useFeeHeadingImport";
import { useFeeHeadingSelection } from "../../hooks/pages/super-admin/useFeeHeadingSelection";
import FeeHeadingForm from "./components/FeeHeadingForm";
import { FeeHeadingFilters } from "./components/FeeHeadingFilters";
import { FeeHeadingTable } from "./components/FeeHeadingTable";
import { FeeHeadingDialogs } from "./components/FeeHeadingDialogs";

export default function FeeHeading() {
  const [mode, setMode] = useState<"add" | "import">("add");
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "school" as "school" | "transport",
    status: "active" as string,
    schoolId: "" as string | number,
    applicableMonths: [] as number[],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | number>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: number;
    schoolId: number;
  } | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Use custom hook for data fetching
  const {
    feeCategories,
    paginationMeta,
    loadingFeeCategories,
    refetchFeeCategories,
    schools,
    loadingSchools,
  } = useFeeHeadingData({
    page,
    limit,
    search,
    selectedSchoolId,
    selectedType,
  });

  // Use custom hook for import
  const {
    importSchoolId,
    setImportSchoolId,
    importFile,
    setImportFile,
    importPreview,
    isImporting,
    importResult,
    getRootProps,
    getInputProps,
    isDragActive,
    downloadSampleCSV,
    handleBulkImport,
  } = useFeeHeadingImport({
    refetchFeeCategories,
    setError,
    setSuccess,
  });

  // Use custom hook for selection
  const {
    selectedCategoryIds,
    setSelectedCategoryIds,
    isSelectAll,
    setIsSelectAll,
    handleSelectAll,
    handleSelectCategory,
    handleExport,
    handleBulkDelete: handleBulkDeleteFromHook,
  } = useFeeHeadingSelection({
    feeCategories,
    refetchFeeCategories,
    setError,
    setSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      if (!formData.schoolId) {
        setError("Please select a school");
        return;
      }

      const basePayload: Record<string, unknown> = {
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

      refetchFeeCategories();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: unknown) {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
          ? err.response.data.message
          : "Failed to save fee category";
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

  const handleDeleteClick = (id: number, schoolId: number) => {
    setDeleteItem({ id, schoolId });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setError("");
      await api.instance.delete(
        `/super-admin/fee-categories/${deleteItem.id}?schoolId=${deleteItem.schoolId}`
      );
      setSuccess("Fee category deleted successfully!");
      refetchFeeCategories();
      setDeleteDialogOpen(false);
      setDeleteItem(null);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: unknown) {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
          ? err.response.data.message
          : "Failed to delete fee category";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedCategoryIds.length === 0) {
      setError("Please select at least one fee category to delete");
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteWithDialog = async () => {
    await handleBulkDeleteFromHook();
    setBulkDeleteDialogOpen(false);
    setSelectedCategoryIds([]);
    setIsSelectAll(false);
  };

  const handleCancel = () => {
    setEditingCategory(null);
    resetForm();
    setError("");
    setSuccess("");
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
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-green-700">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Add/Edit Form or Import */}
        <FeeHeadingForm
          mode={mode}
          setMode={setMode}
          formData={formData}
          setFormData={setFormData}
          editingCategory={editingCategory}
          schools={schools}
          loadingSchools={loadingSchools}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
          importSchoolId={importSchoolId}
          setImportSchoolId={setImportSchoolId}
          importFile={importFile}
          setImportFile={setImportFile}
          importPreview={importPreview}
          isImporting={isImporting}
          importResult={importResult}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
          downloadSampleCSV={downloadSampleCSV}
          handleBulkImport={handleBulkImport}
        />

        {/* Right Side - List */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            {/* Search and Filter */}
            <FeeHeadingFilters
            search={search}
            setSearch={setSearch}
            selectedSchoolId={selectedSchoolId}
            setSelectedSchoolId={setSelectedSchoolId}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            schools={schools}
            setPage={setPage}
          />

          {/* Table */}
          <FeeHeadingTable
            feeCategories={feeCategories}
            loading={loadingFeeCategories}
            paginationMeta={paginationMeta}
            page={page}
            limit={limit}
            setPage={setPage}
            setLimit={setLimit}
            search={search}
            selectedSchoolId={selectedSchoolId}
            selectedCategoryIds={selectedCategoryIds}
            setSelectedCategoryIds={setSelectedCategoryIds}
            setIsSelectAll={setIsSelectAll}
            isSelectAll={isSelectAll}
            handleSelectAll={handleSelectAll}
            handleSelectCategory={handleSelectCategory}
            handleEdit={handleEdit}
            handleDeleteClick={handleDeleteClick}
            handleExport={handleExport}
            handleBulkDeleteClick={handleBulkDeleteClick}
          />
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <FeeHeadingDialogs
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        handleDelete={handleDelete}
        bulkDeleteDialogOpen={bulkDeleteDialogOpen}
        setBulkDeleteDialogOpen={setBulkDeleteDialogOpen}
        selectedCount={selectedCategoryIds.length}
        handleBulkDelete={handleBulkDeleteWithDialog}
      />
    </div>
  );
}
