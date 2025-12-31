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
  useCategoryHeadsData,
  CategoryHead,
} from "../../hooks/pages/super-admin/useCategoryHeadsData";
import { useCategoryHeadsImport } from "../../hooks/pages/super-admin/useCategoryHeadsImport";
import CategoryHeadsForm from "./components/CategoryHeadsForm";
import CategoryHeadsFilters from "./components/CategoryHeadsFilters";
import CategoryHeadsTable from "./components/CategoryHeadsTable";
import CategoryHeadsDialogs from "./components/CategoryHeadsDialogs";

export default function CategoryHeads() {
  const [mode, setMode] = useState<"add" | "import">("add");
  const [editingCategoryHead, setEditingCategoryHead] =
    useState<CategoryHead | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as string,
    schoolId: "" as string | number,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | number>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: number;
    schoolId: number;
  } | null>(null);

  // Use custom hook for data fetching
  const {
    categoryHeads,
    paginationMeta,
    loadingCategoryHeads,
    refetchCategoryHeads,
    schools,
    loadingSchools,
  } = useCategoryHeadsData({
    page,
    limit,
    search,
    selectedSchoolId,
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
  } = useCategoryHeadsImport({
    refetchCategoryHeads,
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

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
      };

      if (editingCategoryHead) {
        await api.instance.patch(
          `/super-admin/category-heads/${editingCategoryHead.id}?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Category head updated successfully!");
      } else {
        await api.instance.post(
          `/super-admin/category-heads?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Category head created successfully!");
      }

      const currentSchoolId = formData.schoolId;

      if (editingCategoryHead) {
        setEditingCategoryHead(null);
        resetForm();
      } else {
        resetForm(true, currentSchoolId);
      }

      refetchCategoryHeads();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save category head";
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
      status: "active",
      schoolId: retainSchool && schoolId ? schoolId : "",
    });
  };

  const handleEdit = (categoryHead: CategoryHead) => {
    setEditingCategoryHead(categoryHead);
    setFormData({
      name: categoryHead.name,
      description: categoryHead.description || "",
      status: categoryHead.status,
      schoolId: categoryHead.schoolId,
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
        `/super-admin/category-heads/${deleteItem.id}?schoolId=${deleteItem.schoolId}`
      );
      setSuccess("Category head deleted successfully!");
      setDeleteDialogOpen(false);
      setDeleteItem(null);
      refetchCategoryHeads();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete category head";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancel = () => {
    setEditingCategoryHead(null);
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
            Category Heads Management
          </CardTitle>
          <CardDescription>
            Manage category heads (e.g., General, Sponsored) for fee plans
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages - Below header banner */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side - Add/Edit Form */}
        <CategoryHeadsForm
          mode={mode}
          setMode={setMode}
          formData={formData}
          setFormData={setFormData}
          editingCategoryHead={editingCategoryHead}
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
            <CategoryHeadsFilters
            search={search}
            setSearch={setSearch}
            selectedSchoolId={selectedSchoolId}
            setSelectedSchoolId={setSelectedSchoolId}
            schools={schools}
            setPage={setPage}
          />

          {/* Table */}
          <CategoryHeadsTable
            categoryHeads={categoryHeads}
            loading={loadingCategoryHeads}
            paginationMeta={paginationMeta}
            page={page}
            limit={limit}
            setPage={setPage}
            setLimit={setLimit}
            search={search}
            selectedSchoolId={selectedSchoolId}
            handleEdit={handleEdit}
            handleDeleteClick={handleDeleteClick}
          />
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CategoryHeadsDialogs
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        handleDelete={handleDelete}
      />
    </div>
  );
}
