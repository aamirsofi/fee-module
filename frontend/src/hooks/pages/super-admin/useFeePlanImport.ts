import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import api from "../../../services/api";
import { FeeStructure } from "../../../types";
import {
  readAndParseCSV,
  generateSampleCSV,
  downloadCSV,
  createLookupMaps,
  type ParsedFeePlan,
} from "../../../utils/feePlan";
import {
  filterDuplicates,
  findDuplicate,
  type FeePlanIdentifier,
} from "../../../utils/feePlan/duplicateUtils";

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
  duplicates: Array<{ row: number; name: string; reason: string }>;
}

interface ParsedFeePlan {
  schoolId: string | number;
  feeCategoryId: number;
  categoryHeadId: number | null;
  classId: number;
  amount: number;
  status: "active" | "inactive";
  name: string;
  feeCategoryName?: string;
  categoryHeadName?: string;
  className?: string;
}

interface UseFeePlanImportParams {
  refetchFeeStructures: () => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
}

interface UseFeePlanImportReturn {
  importSchoolId: string | number;
  setImportSchoolId: React.Dispatch<React.SetStateAction<string | number>>;
  importFile: File | null;
  setImportFile: React.Dispatch<React.SetStateAction<File | null>>;
  importPreview: ParsedFeePlan[];
  setImportPreview: React.Dispatch<React.SetStateAction<ParsedFeePlan[]>>;
  isImporting: boolean;
  importResult: ImportResult | null;
  getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
  isDragActive: boolean;
  downloadSampleCSV: () => void;
  handleBulkImport: () => Promise<void>;
}

export function useFeePlanImport({
  refetchFeeStructures,
  setError,
  setSuccess,
}: UseFeePlanImportParams): UseFeePlanImportReturn {
  const [importSchoolId, setImportSchoolId] = useState<string | number>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ParsedFeePlan[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Parse CSV file - accepts names and resolves them to IDs
  const parseCSV = useCallback(
    async (file: File): Promise<ParsedFeePlan[]> => {
      if (!importSchoolId) {
        throw new Error("School ID is required");
      }

      // Fetch all required data for name resolution
      const [feeCategoriesResponse, categoryHeadsResponse, classesResponse] =
        await Promise.all([
          api.instance.get("/super-admin/fee-categories", {
            params: { schoolId: importSchoolId, limit: 1000 },
          }),
          api.instance.get("/super-admin/category-heads", {
            params: {
              schoolId: importSchoolId,
              limit: 1000,
              status: "active",
            },
          }),
          api.instance.get("/classes", {
            params: { schoolId: importSchoolId, limit: 1000, page: 1 },
          }),
        ]);

      const feeCategoriesData =
        feeCategoriesResponse.data.data || feeCategoriesResponse.data || [];
      const categoryHeadsData =
        categoryHeadsResponse.data.data || categoryHeadsResponse.data || [];
      const classesData =
        classesResponse.data.data || classesResponse.data || [];

      // Create lookup maps using utility function
      const { feeCategoryMap, categoryHeadMap, classMap } = createLookupMaps(
        feeCategoriesData,
        categoryHeadsData,
        classesData
      );

      // Use utility function to parse CSV
      return readAndParseCSV(file, {
        feeCategoryMap,
        categoryHeadMap,
        classMap,
        schoolId: importSchoolId,
      });
    },
    [importSchoolId]
  );

  // Download sample CSV for import
  const downloadSampleCSV = useCallback(() => {
    if (!importSchoolId) {
      setError("Please select a school first");
      return;
    }

    const csvContent = generateSampleCSV();
    downloadCSV(csvContent, `fee_plans_sample_${importSchoolId}.csv`);
  }, [importSchoolId, setError]);

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
        setError("");
        const data = await parseCSV(file);
        setImportPreview(data.slice(0, 10)); // Preview first 10 rows
      } catch (err: unknown) {
        const errorMessage =
          err && typeof err === "object" && "message" in err
            ? (err.message as string)
            : "Failed to parse CSV file";
        setError(errorMessage);
        setImportFile(null);
        setImportPreview([]);
      }
    },
    [importSchoolId, parseCSV, setError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  // Handle bulk import
  const handleBulkImport = useCallback(async () => {
    if (!importFile || !importSchoolId) {
      setError("Please select a school and upload a CSV file");
      return;
    }

    try {
      setIsImporting(true);
      setError("");
      setSuccess("");
      setImportResult(null);

      const feePlansData = await parseCSV(importFile);

      if (feePlansData.length === 0) {
        setError("No valid fee plans found in CSV file");
        return;
      }

      // Fetch existing fee structures for duplicate checking
      const existingStructuresResponse = await api.instance.get(
        "/super-admin/fee-structures",
        {
          params: { schoolId: importSchoolId, limit: 10000 },
        }
      );
      const existingStructures =
        existingStructuresResponse.data.data ||
        existingStructuresResponse.data ||
        [];

      const results: ImportResult = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        duplicates: [],
      };

      // Import fee plans one by one
      for (let i = 0; i < feePlansData.length; i++) {
        const planData = feePlansData[i];
        const rowNumber = i + 2; // +2 because row 1 is header

        // Validate that all IDs are resolved
        if (!planData.feeCategoryId) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Fee category not found: ${
              planData.feeCategoryName || "unknown"
            }`,
          });
          continue;
        }

        if (!planData.classId) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Class not found: ${planData.className || "unknown"}`,
          });
          continue;
        }

        // Check for duplicates using utility function
        const existing = findDuplicate(
          {
            feeCategoryId: planData.feeCategoryId,
            categoryHeadId: planData.categoryHeadId,
            classId: planData.classId,
          },
          existingStructures
        );

        if (existing) {
          results.skipped++;
          results.duplicates.push({
            row: rowNumber,
            name:
              planData.name ||
              `${planData.feeCategoryName || ""} - ${
                planData.categoryHeadName || "General"
              } (${planData.className || ""})`,
            reason: "Fee plan already exists",
          });
          continue;
        }

        try {
          const payload: Record<string, unknown> = {
            feeCategoryId: planData.feeCategoryId,
            amount: planData.amount,
            status: planData.status,
            classId: planData.classId,
          };

          if (planData.categoryHeadId) {
            payload.categoryHeadId = planData.categoryHeadId;
          }

          if (planData.name) {
            payload.name = planData.name;
          }

          await api.instance.post(
            `/super-admin/fee-structures?schoolId=${importSchoolId}`,
            payload
          );
          results.success++;
          // Add to existing structures to prevent duplicates within the same import batch
          existingStructures.push({
            feeCategoryId: planData.feeCategoryId,
            categoryHeadId: planData.categoryHeadId,
            classId: planData.classId,
          } as FeeStructure);
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
              : "Failed to create fee plan";

          if (errorMessage.toLowerCase().includes("already exists")) {
            results.skipped++;
            results.duplicates.push({
              row: rowNumber,
              name:
                planData.name ||
                `${planData.feeCategoryName || ""} - ${
                  planData.categoryHeadName || "General"
                } (${planData.className || ""})`,
              reason: "Fee plan already exists",
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
        setSuccess(`Successfully imported ${results.success} fee plan(s)`);
        if (results.skipped > 0) {
          setSuccess(
            `Successfully imported ${results.success} fee plan(s). ${results.skipped} duplicate(s) skipped.`
          );
        }
        setImportFile(null);
        setImportPreview([]);
        refetchFeeStructures();
      }
      if (results.failed > 0) {
        setError(
          `${results.failed} fee plan(s) failed to import. Check errors below.`
        );
      }
      if (results.skipped > 0 && results.success === 0) {
        setError(
          `All ${results.skipped} fee plan(s) were duplicates and skipped.`
        );
      }
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
          : "Failed to import fee plans";
      setError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  }, [
    importFile,
    importSchoolId,
    parseCSV,
    refetchFeeStructures,
    setError,
    setSuccess,
  ]);

  return {
    importSchoolId,
    setImportSchoolId,
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
  };
}

