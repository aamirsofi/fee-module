import { useState, useEffect, useCallback } from "react";
import { FeeCategory } from "./useFeeHeadingData";
import { convertToCSV, downloadCSV } from "../../../utils/feePlan";
import api from "../../../services/api";

interface UseFeeHeadingSelectionParams {
  feeCategories: FeeCategory[];
  refetchFeeCategories: () => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
}

interface UseFeeHeadingSelectionReturn {
  selectedCategoryIds: number[];
  setSelectedCategoryIds: React.Dispatch<React.SetStateAction<number[]>>;
  isSelectAll: boolean;
  setIsSelectAll: React.Dispatch<React.SetStateAction<boolean>>;
  handleSelectAll: (checked: boolean) => void;
  handleSelectCategory: (id: number, checked: boolean) => void;
  handleExport: () => void;
  handleBulkDelete: () => Promise<void>;
}

export function useFeeHeadingSelection({
  feeCategories,
  refetchFeeCategories,
  setError,
  setSuccess,
}: UseFeeHeadingSelectionParams): UseFeeHeadingSelectionReturn {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);

  // Sync select all checkbox
  useEffect(() => {
    if (feeCategories.length > 0) {
      setIsSelectAll(
        selectedCategoryIds.length === feeCategories.length &&
          feeCategories.every((c) => selectedCategoryIds.includes(c.id))
      );
    }
  }, [selectedCategoryIds, feeCategories]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIds = feeCategories.map((c) => c.id);
        setSelectedCategoryIds(allIds);
      } else {
        setSelectedCategoryIds([]);
      }
      setIsSelectAll(checked);
    },
    [feeCategories]
  );

  const handleSelectCategory = useCallback(
    (id: number, checked: boolean) => {
      if (checked) {
        setSelectedCategoryIds([...selectedCategoryIds, id]);
      } else {
        setSelectedCategoryIds(selectedCategoryIds.filter((cid) => cid !== id));
        setIsSelectAll(false);
      }
    },
    [selectedCategoryIds]
  );

  const handleExport = useCallback(() => {
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

    // Use utility function to convert and download CSV
    const csvContent = convertToCSV(headers, rows);
    downloadCSV(
      csvContent,
      `fee_categories_export_${new Date().toISOString().split("T")[0]}.csv`
    );

    setSuccess(
      `Exported ${selectedCategoryIds.length} fee category(es) successfully!`
    );
    setTimeout(() => setSuccess(""), 3000);
  }, [selectedCategoryIds, feeCategories, setError, setSuccess]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedCategoryIds.length === 0) {
      setError("Please select at least one fee category to delete");
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
      refetchFeeCategories();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete fee categories";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  }, [
    selectedCategoryIds,
    feeCategories,
    refetchFeeCategories,
    setError,
    setSuccess,
  ]);

  return {
    selectedCategoryIds,
    setSelectedCategoryIds,
    isSelectAll,
    setIsSelectAll,
    handleSelectAll,
    handleSelectCategory,
    handleExport,
    handleBulkDelete,
  };
}

