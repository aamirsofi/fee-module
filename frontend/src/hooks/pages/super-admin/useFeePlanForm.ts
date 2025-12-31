import { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";
import { FeeStructure, FeeCategory, CategoryHead } from "../../../types";

interface FormData {
  feeCategoryId: string | number;
  categoryHeadId: string | number | null;
  amount: string;
  classId: string | number;
  status: "active" | "inactive";
  schoolId: string | number;
}

interface UseFeePlanFormParams {
  feeCategories: FeeCategory[];
  categoryHeads: CategoryHead[];
  classOptions: Array<{ id: number; name: string }>;
  refetchFeeStructures: () => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
}

interface UseFeePlanFormReturn {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  createMode: "single" | "multiple";
  setCreateMode: React.Dispatch<React.SetStateAction<"single" | "multiple">>;
  selectedFeeCategoryIds: number[];
  setSelectedFeeCategoryIds: React.Dispatch<React.SetStateAction<number[]>>;
  selectedCategoryHeadIds: number[];
  setSelectedCategoryHeadIds: React.Dispatch<React.SetStateAction<number[]>>;
  selectedClasses: number[];
  setSelectedClasses: React.Dispatch<React.SetStateAction<number[]>>;
  editingStructure: FeeStructure | null;
  setEditingStructure: React.Dispatch<React.SetStateAction<FeeStructure | null>>;
  formResetKey: number;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: (retainSchool?: boolean, schoolId?: string | number) => void;
  handleEdit: (structure: FeeStructure) => void;
  handleCancel: () => void;
}

export function useFeePlanForm({
  feeCategories,
  categoryHeads,
  classOptions,
  refetchFeeStructures,
  setError,
  setSuccess,
}: UseFeePlanFormParams): UseFeePlanFormReturn {
  const [formData, setFormData] = useState<FormData>({
    feeCategoryId: "" as string | number,
    categoryHeadId: "" as string | number | null,
    amount: "",
    classId: "" as string | number,
    status: "active" as "active" | "inactive",
    schoolId: "" as string | number,
  });
  const [createMode, setCreateMode] = useState<"single" | "multiple">("single");
  const [selectedFeeCategoryIds, setSelectedFeeCategoryIds] = useState<number[]>([]);
  const [selectedCategoryHeadIds, setSelectedCategoryHeadIds] = useState<number[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);

  useEffect(() => {
    if (!formData.schoolId) {
      setFormData((prev) => ({ ...prev, classId: "" }));
    }
  }, [formData.schoolId]);

  const resetForm = useCallback(
    (retainSchool: boolean = false, schoolId?: string | number) => {
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
      // Force re-render of Select components
      setFormResetKey((prev) => prev + 1);
    },
    [setError]
  );

  const handleEdit = useCallback(
    (structure: FeeStructure) => {
      setEditingStructure(structure);
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
    },
    [setError, setSuccess]
  );

  const handleCancel = useCallback(() => {
    setEditingStructure(null);
    resetForm();
    setError("");
    setSuccess("");
  }, [resetForm, setError, setSuccess]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setError("");
        setSuccess("");

        // Convert to number if string, then validate
        const schoolIdNum =
          typeof formData.schoolId === "string"
            ? parseInt(formData.schoolId, 10)
            : formData.schoolId;
        if (!schoolIdNum || schoolIdNum === 0 || isNaN(schoolIdNum)) {
          setError("Please select a school");
          return;
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
          setError("Please enter a valid amount");
          return;
        }

        // Validate based on mode
        if (createMode === "multiple") {
          if (selectedFeeCategoryIds.length === 0) {
            setError("Please select at least one fee heading");
            return;
          }
          if (selectedClasses.length === 0) {
            setError("Please select at least one class");
            return;
          }
        } else {
          const feeCategoryIdNum =
            typeof formData.feeCategoryId === "string"
              ? parseInt(formData.feeCategoryId, 10)
              : formData.feeCategoryId;
          if (
            !feeCategoryIdNum ||
            feeCategoryIdNum === 0 ||
            isNaN(feeCategoryIdNum)
          ) {
            setError("Please select a fee heading");
            return;
          }
          if (!formData.classId) {
            setError("Please select a class");
            return;
          }
        }

        const currentSchoolId = formData.schoolId;

        if (editingStructure) {
          // Single edit mode
          if (!formData.classId) {
            setError("Please select a class");
            return;
          }

          const selectedCategory = feeCategories.find(
            (cat) => cat.id === parseInt(formData.feeCategoryId as string)
          );
          const selectedCategoryHead = categoryHeads.find(
            (ch) => ch.id === parseInt(formData.categoryHeadId as string)
          );
          const classIdNum =
            typeof formData.classId === "number"
              ? formData.classId
              : parseInt(formData.classId as string);
          const selectedClass = classOptions.find((cls) => cls.id === classIdNum);

          const basePlanName = selectedCategory
            ? `${selectedCategory.name}${
                selectedCategoryHead ? ` - ${selectedCategoryHead.name}` : ""
              }`
            : "Fee Plan";

          const planName = `${basePlanName}${
            selectedClass ? ` (${selectedClass.name})` : ""
          }`;

          const payload: Record<string, unknown> = {
            name: planName,
            feeCategoryId: parseInt(formData.feeCategoryId as string),
            amount: parseFloat(formData.amount),
            status: formData.status,
          };

          if (formData.categoryHeadId) {
            payload.categoryHeadId = parseInt(formData.categoryHeadId as string);
          }

          if (selectedClass?.id) {
            payload.classId = selectedClass.id;
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
            // Generate all combinations
            const combinations: Array<{
              feeCategoryId: number;
              categoryHeadId: number | null;
              classId: number;
            }> = [];

            // If no category heads selected, include null (General)
            const categoryHeadIdsToUse =
              selectedCategoryHeadIds.length > 0
                ? selectedCategoryHeadIds
                : [null];

            selectedFeeCategoryIds.forEach((feeCategoryId) => {
              categoryHeadIdsToUse.forEach((categoryHeadId) => {
                selectedClasses.forEach((classId) => {
                  combinations.push({
                    feeCategoryId,
                    categoryHeadId,
                    classId,
                  });
                });
              });
            });

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

            // Filter out duplicates
            const newCombinations = combinations.filter((combo) => {
              return !existingStructures.some((existing: FeeStructure) => {
                const matchesFeeCategory =
                  existing.feeCategoryId === combo.feeCategoryId;
                const matchesCategoryHead =
                  existing.categoryHeadId === combo.categoryHeadId ||
                  (!existing.categoryHeadId && !combo.categoryHeadId);
                const matchesClass =
                  existing.classId === combo.classId ||
                  (!existing.classId && !combo.classId);

                return matchesFeeCategory && matchesCategoryHead && matchesClass;
              });
            });

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
                const feeCategory = feeCategories.find(
                  (cat) => cat.id === combo.feeCategoryId
                );
                const categoryHead = combo.categoryHeadId
                  ? categoryHeads.find((ch) => ch.id === combo.categoryHeadId)
                  : null;
                const selectedClass = classOptions.find(
                  (cls) => cls.id === combo.classId
                );

                const planName = `${feeCategory?.name || "Fee Plan"}${
                  categoryHead ? ` - ${categoryHead.name}` : ""
                }${selectedClass ? ` (${selectedClass.name})` : ""}`;

                const payload: Record<string, unknown> = {
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
              } catch (err: unknown) {
                failedCount++;
                const feeCategory = feeCategories.find(
                  (cat) => cat.id === combo.feeCategoryId
                );
                const categoryHead = combo.categoryHeadId
                  ? categoryHeads.find((ch) => ch.id === combo.categoryHeadId)
                  : null;
                const selectedClass = classOptions.find(
                  (cls) => cls.id === combo.classId
                );
                const planName = `${feeCategory?.name || "Fee Plan"}${
                  categoryHead ? ` - ${categoryHead.name}` : ""
                }${selectedClass ? ` (${selectedClass.name})` : ""}`;

                // Check if it's a duplicate error (400) or other error
                if (
                  err &&
                  typeof err === "object" &&
                  "response" in err &&
                  err.response &&
                  typeof err.response === "object" &&
                  "status" in err.response &&
                  err.response.status === 400
                ) {
                  // Likely a duplicate, skip it
                  failedNames.push(planName);
                } else {
                  // Other error, log it
                  console.error(`Failed to create ${planName}:`, err);
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
            const selectedCategory = feeCategories.find(
              (cat) => cat.id === parseInt(formData.feeCategoryId as string)
            );
            const selectedCategoryHead = categoryHeads.find(
              (ch) => ch.id === parseInt(formData.categoryHeadId as string)
            );
            const classIdNum =
              typeof formData.classId === "number"
                ? formData.classId
                : parseInt(formData.classId as string);
            const selectedClass = classOptions.find(
              (cls) => cls.id === classIdNum
            );

            const basePlanName = selectedCategory
              ? `${selectedCategory.name}${
                  selectedCategoryHead ? ` - ${selectedCategoryHead.name}` : ""
                }`
              : "Fee Plan";

            const planName = `${basePlanName}${
              selectedClass ? ` (${selectedClass.name})` : ""
            }`;

            const payload: Record<string, unknown> = {
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

            if (selectedClass?.id) {
              payload.classId = selectedClass.id;
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
      } catch (err: unknown) {
        const errorMessage =
          (err &&
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
            : null) || "Failed to save fee plan";
        setError(errorMessage);
        setTimeout(() => setError(""), 5000);
      }
    },
    [
      formData,
      createMode,
      selectedFeeCategoryIds,
      selectedCategoryHeadIds,
      selectedClasses,
      editingStructure,
      feeCategories,
      categoryHeads,
      classOptions,
      refetchFeeStructures,
      resetForm,
      setError,
      setSuccess,
    ]
  );

  return {
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
  };
}

