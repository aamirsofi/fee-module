import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import api from "../../../services/api";
import { RoutePlan } from "../../../types";
import {
  readAndParseCSV,
  generateSampleCSV,
  downloadCSV,
  createLookupMaps,
  type ParsedRoutePlan,
} from "../../../utils/routePlan";
import {
  findRoutePlanDuplicate,
} from "../../../utils/routePlan/duplicateUtils";
import { RoutePlanCombination } from "../../../utils/routePlan/combinationUtils";

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
  duplicates: Array<{ row: number; name: string; reason: string }>;
}

interface UseRoutePlanImportParams {
  refetchRoutePlans: () => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
}

interface UseRoutePlanImportReturn {
  importSchoolId: string | number;
  setImportSchoolId: React.Dispatch<React.SetStateAction<string | number>>;
  importFile: File | null;
  setImportFile: React.Dispatch<React.SetStateAction<File | null>>;
  importPreview: ParsedRoutePlan[];
  setImportPreview: React.Dispatch<React.SetStateAction<ParsedRoutePlan[]>>;
  isImporting: boolean;
  importResult: ImportResult | null;
  getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
  isDragActive: boolean;
  downloadSampleCSV: () => void;
  handleBulkImport: () => Promise<void>;
}

export function useRoutePlanImport({
  refetchRoutePlans,
  setError,
  setSuccess,
}: UseRoutePlanImportParams): UseRoutePlanImportReturn {
  const [importSchoolId, setImportSchoolId] = useState<string | number>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ParsedRoutePlan[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Parse CSV file - accepts names and resolves them to IDs
  const parseCSV = useCallback(
    async (file: File): Promise<ParsedRoutePlan[]> => {
      if (!importSchoolId) {
        throw new Error("School ID is required");
      }

      // Fetch all required data for name resolution
      const [routesResponse, feeCategoriesResponse, categoryHeadsResponse, classesResponse] =
        await Promise.all([
          api.instance.get("/super-admin/routes", {
            params: { schoolId: importSchoolId, limit: 1000 },
          }),
          api.instance.get("/super-admin/fee-categories", {
            params: { schoolId: importSchoolId, limit: 1000, type: "transport" },
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

      const routesData =
        routesResponse.data.data || routesResponse.data || [];
      const feeCategoriesData =
        feeCategoriesResponse.data.data || feeCategoriesResponse.data || [];
      const categoryHeadsData =
        categoryHeadsResponse.data.data || categoryHeadsResponse.data || [];
      const classesData =
        classesResponse.data.data || classesResponse.data || [];

      // Create lookup maps using utility function
      const { routeMap, feeCategoryMap, categoryHeadMap, classMap } = createLookupMaps(
        routesData,
        feeCategoriesData,
        categoryHeadsData,
        classesData
      );

      // Use utility function to parse CSV
      return readAndParseCSV(file, {
        routeMap,
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
    downloadCSV(csvContent, `route_plans_sample_${importSchoolId}.csv`);
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

      const routePlansData = await parseCSV(importFile);

      if (routePlansData.length === 0) {
        setError("No valid route plans found in CSV file");
        return;
      }

      // Fetch existing route plans for duplicate checking
      const existingRoutePlansResponse = await api.instance.get(
        "/super-admin/route-plans",
        {
          params: { schoolId: importSchoolId, limit: 10000 },
        }
      );
      const existingRoutePlans =
        existingRoutePlansResponse.data.data ||
        existingRoutePlansResponse.data ||
        [];

      const results: ImportResult = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        duplicates: [],
      };

      // Import route plans one by one
      for (let i = 0; i < routePlansData.length; i++) {
        const planData = routePlansData[i];
        const rowNumber = i + 2; // +2 because row 1 is header

        // Validate that all required IDs are resolved
        if (!planData.routeId) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Route not found: ${planData.routeName || "unknown"}`,
          });
          continue;
        }

        if (!planData.feeCategoryId) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Transport fee category not found: ${
              planData.feeCategoryName || "unknown"
            }`,
          });
          continue;
        }

        // Check for duplicates - classId can be null for route plans
        // We'll check manually since RoutePlanCombination requires classId to be a number
        const existing = existingRoutePlans.find((plan) => {
          const routeMatch = plan.routeId === planData.routeId;
          const feeCategoryMatch = plan.feeCategoryId === planData.feeCategoryId;
          const categoryHeadMatch =
            (plan.categoryHeadId === null && planData.categoryHeadId === null) ||
            (plan.categoryHeadId === planData.categoryHeadId);
          const classMatch =
            (plan.classId === null && planData.classId === null) ||
            (plan.classId === planData.classId);
          return routeMatch && feeCategoryMatch && categoryHeadMatch && classMatch;
        });

        if (existing) {
          results.skipped++;
          results.duplicates.push({
            row: rowNumber,
            name:
              planData.name ||
              `${planData.routeName || ""} - ${
                planData.feeCategoryName || ""
              } - ${planData.categoryHeadName || "General"}${planData.className ? ` (${planData.className})` : ""}`,
            reason: "Route plan already exists",
          });
          continue;
        }

        try {
          const payload: Record<string, unknown> = {
            routeId: planData.routeId,
            feeCategoryId: planData.feeCategoryId,
            amount: planData.amount,
            status: planData.status,
          };

          if (planData.categoryHeadId) {
            payload.categoryHeadId = planData.categoryHeadId;
          }

          if (planData.classId) {
            payload.classId = planData.classId;
          }

          if (planData.name) {
            payload.name = planData.name;
          }

          await api.instance.post(
            `/super-admin/route-plans?schoolId=${importSchoolId}`,
            payload
          );
          results.success++;
          // Add to existing route plans to prevent duplicates within the same import batch
          existingRoutePlans.push({
            routeId: planData.routeId,
            feeCategoryId: planData.feeCategoryId,
            categoryHeadId: planData.categoryHeadId,
            classId: planData.classId,
          } as RoutePlan);
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
              : "Failed to create route plan";

          if (errorMessage.toLowerCase().includes("already exists")) {
            results.skipped++;
            results.duplicates.push({
              row: rowNumber,
              name:
                planData.name ||
                `${planData.routeName || ""} - ${
                  planData.feeCategoryName || ""
                } - ${planData.categoryHeadName || "General"}${planData.className ? ` (${planData.className})` : ""}`,
              reason: "Route plan already exists",
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
        setSuccess(`Successfully imported ${results.success} route plan(s)`);
        if (results.skipped > 0) {
          setSuccess(
            `Successfully imported ${results.success} route plan(s). ${results.skipped} duplicate(s) skipped.`
          );
        }
        setImportFile(null);
        setImportPreview([]);
        refetchRoutePlans();
      }
      if (results.failed > 0) {
        setError(
          `${results.failed} route plan(s) failed to import. Check errors below.`
        );
      }
      if (results.skipped > 0 && results.success === 0) {
        setError(
          `All ${results.skipped} route plan(s) were duplicates and skipped.`
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
          : "Failed to import route plans";
      setError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  }, [
    importFile,
    importSchoolId,
    parseCSV,
    refetchRoutePlans,
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

