import { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";
import { FeeStructure } from "../../../types";
import { convertToCSV, downloadCSV } from "../../../utils/feePlan";

interface UseFeePlanSelectionParams {
  feeStructures: FeeStructure[];
  classOptions: Array<{ id: number; name: string }>;
  refetchFeeStructures: () => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
}

interface UseFeePlanSelectionReturn {
  selectedFeePlanIds: number[];
  setSelectedFeePlanIds: React.Dispatch<React.SetStateAction<number[]>>;
  isSelectAll: boolean;
  setIsSelectAll: React.Dispatch<React.SetStateAction<boolean>>;
  handleSelectAll: (checked: boolean) => void;
  handleSelectFeePlan: (id: number, checked: boolean) => void;
  handleExport: () => void;
  handleBulkDelete: () => Promise<void>;
}

export function useFeePlanSelection({
  feeStructures,
  classOptions,
  refetchFeeStructures,
  setError,
  setSuccess,
}: UseFeePlanSelectionParams): UseFeePlanSelectionReturn {
  const [selectedFeePlanIds, setSelectedFeePlanIds] = useState<number[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);

  // Update select all state when selection changes
  useEffect(() => {
    if (feeStructures.length > 0) {
      setIsSelectAll(
        selectedFeePlanIds.length === feeStructures.length &&
          feeStructures.every((s) => selectedFeePlanIds.includes(s.id))
      );
    }
  }, [selectedFeePlanIds, feeStructures]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIds = feeStructures.map((s) => s.id);
        setSelectedFeePlanIds(allIds);
        setIsSelectAll(true);
      } else {
        setSelectedFeePlanIds([]);
        setIsSelectAll(false);
      }
    },
    [feeStructures]
  );

  const handleSelectFeePlan = useCallback(
    (id: number, checked: boolean) => {
      if (checked) {
        setSelectedFeePlanIds((prev) => [...prev, id]);
      } else {
        setSelectedFeePlanIds((prev) => prev.filter((fid) => fid !== id));
        setIsSelectAll(false);
      }
    },
    []
  );

  const handleExport = useCallback(() => {
    if (selectedFeePlanIds.length === 0) {
      setError("Please select at least one fee plan to export");
      return;
    }

    // Get selected fee plans
    const selectedPlans = feeStructures.filter((s) =>
      selectedFeePlanIds.includes(s.id)
    );

    // Convert to CSV
    const headers = [
      "Plan Name",
      "School",
      "Class",
      "Category Head",
      "Fee Heading",
      "Amount",
      "Status",
      "Created At",
    ];

    const rows = selectedPlans.map((plan) => {
      // Get class name from classId
      const className = plan.classId
        ? classOptions.find((cls) => cls.id === plan.classId)?.name || ""
        : "";
      return [
        plan.name,
        plan.school?.name || `School ID: ${plan.schoolId}`,
        className,
        plan.categoryHead?.name || "General",
        plan.category?.name || `Category ID: ${plan.feeCategoryId}`,
        plan.amount.toString(),
        plan.status,
        new Date(plan.createdAt).toLocaleDateString(),
      ];
    });

    // Use utility function to convert and download CSV
    const csvContent = convertToCSV(headers, rows);
    downloadCSV(
      csvContent,
      `fee-plans-${new Date().toISOString().split("T")[0]}.csv`
    );

    setSuccess(
      `Exported ${selectedFeePlanIds.length} fee plan(s) successfully!`
    );
    setTimeout(() => setSuccess(""), 3000);
  }, [selectedFeePlanIds, feeStructures, classOptions, setError, setSuccess]);

  const handleBulkDelete = useCallback(async () => {
    try {
      setError("");
      setSuccess("");

      // Delete all selected fee plans
      const deletePromises = selectedFeePlanIds.map(async (id) => {
        const structure = feeStructures.find((s) => s.id === id);
        if (structure) {
          return api.instance.delete(
            `/super-admin/fee-structures/${id}?schoolId=${structure.schoolId}`
          );
        }
      });

      await Promise.all(deletePromises);
      setSuccess(
        `Successfully deleted ${selectedFeePlanIds.length} fee plan(s)!`
      );
      setSelectedFeePlanIds([]);
      setIsSelectAll(false);
      refetchFeeStructures();
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
          : "Failed to delete fee plans";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  }, [
    selectedFeePlanIds,
    feeStructures,
    refetchFeeStructures,
    setError,
    setSuccess,
  ]);

  return {
    selectedFeePlanIds,
    setSelectedFeePlanIds,
    isSelectAll,
    setIsSelectAll,
    handleSelectAll,
    handleSelectFeePlan,
    handleExport,
    handleBulkDelete,
  };
}

