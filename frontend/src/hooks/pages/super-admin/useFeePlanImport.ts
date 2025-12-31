import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import api from "../../../services/api";
import { FeeStructure } from "../../../types";

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

      // Create lookup maps
      const feeCategoryMap = new Map<string, number>();
      feeCategoriesData.forEach((cat: { name: string; id: number }) => {
        feeCategoryMap.set(cat.name.toLowerCase().trim(), cat.id);
      });

      const categoryHeadMap = new Map<string, number>();
      categoryHeadsData.forEach((ch: { name: string; id: number }) => {
        categoryHeadMap.set(ch.name.toLowerCase().trim(), ch.id);
      });

      const classMap = new Map<string, number>();
      classesData.forEach((cls: { name: string; id: number }) => {
        classMap.set(cls.name.toLowerCase().trim(), cls.id);
      });

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
              .map((h) => h.trim().replace(/"/g, "").toLowerCase());
            const data: ParsedFeePlan[] = [];
            const errors: string[] = [];

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i]
                .split(",")
                .map((v) => v.trim().replace(/"/g, ""));
              const row: Record<string, string> = {};

              headers.forEach((header, index) => {
                row[header] = values[index] || "";
              });

              const rowNumber = i + 1;

              // Resolve fee category name to ID
              const feeCategoryName =
                row.feecategoryname ||
                row.feecategoryname ||
                row.feecategoryid ||
                row.feecategoryid ||
                "";
              let feeCategoryId: number | null = null;

              if (feeCategoryName) {
                // Try as ID first
                const idMatch = parseInt(feeCategoryName);
                if (!isNaN(idMatch)) {
                  feeCategoryId = idMatch;
                } else {
                  // Try as name
                  feeCategoryId =
                    feeCategoryMap.get(feeCategoryName.toLowerCase().trim()) ||
                    null;
                  if (!feeCategoryId) {
                    errors.push(
                      `Row ${rowNumber}: Fee category "${feeCategoryName}" not found for this school`
                    );
                    continue;
                  }
                }
              } else {
                errors.push(`Row ${rowNumber}: Fee category is required`);
                continue;
              }

              // Resolve category head name to ID (optional)
              const categoryHeadName =
                row.categoryheadname ||
                row.categoryheadname ||
                row.categoryheadid ||
                row.categoryheadid ||
                "";
              let categoryHeadId: number | null = null;

              if (categoryHeadName) {
                // Try as ID first
                const idMatch = parseInt(categoryHeadName);
                if (!isNaN(idMatch)) {
                  categoryHeadId = idMatch;
                } else {
                  // Try as name
                  categoryHeadId =
                    categoryHeadMap.get(
                      categoryHeadName.toLowerCase().trim()
                    ) || null;
                  if (
                    !categoryHeadId &&
                    categoryHeadName.toLowerCase() !== "none" &&
                    categoryHeadName.toLowerCase() !== "general"
                  ) {
                    errors.push(
                      `Row ${rowNumber}: Category head "${categoryHeadName}" not found for this school`
                    );
                    continue;
                  }
                }
              }

              // Resolve class name to ID
              const className =
                row.classname ||
                row.classname ||
                row.classid ||
                row.classid ||
                "";
              let classId: number | null = null;

              if (className) {
                // Try as ID first
                const idMatch = parseInt(className);
                if (!isNaN(idMatch)) {
                  classId = idMatch;
                } else {
                  // Try as name
                  classId =
                    classMap.get(className.toLowerCase().trim()) || null;
                  if (!classId) {
                    errors.push(
                      `Row ${rowNumber}: Class "${className}" not found for this school`
                    );
                    continue;
                  }
                }
              } else {
                errors.push(`Row ${rowNumber}: Class is required`);
                continue;
              }

              const amount = parseFloat(row.amount || "0");
              if (!amount || amount <= 0) {
                errors.push(`Row ${rowNumber}: Valid amount is required`);
                continue;
              }

              const status = (row.status || "active").toLowerCase();
              const name = row.name || "";

              data.push({
                schoolId: importSchoolId,
                feeCategoryId,
                categoryHeadId,
                classId,
                amount,
                status:
                  status === "active" || status === "inactive"
                    ? status
                    : "active",
                name,
                // Store original names for preview
                feeCategoryName: feeCategoryName,
                categoryHeadName: categoryHeadName || "General",
                className: className,
              });
            }

            if (errors.length > 0 && data.length === 0) {
              reject(
                new Error(
                  `CSV parsing errors:\n${errors.slice(0, 10).join("\n")}${
                    errors.length > 10
                      ? `\n... and ${errors.length - 10} more`
                      : ""
                  }`
                )
              );
              return;
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

  // Download sample CSV for import
  const downloadSampleCSV = useCallback(() => {
    if (!importSchoolId) {
      setError("Please select a school first");
      return;
    }

    const headers = [
      "feeCategoryName",
      "categoryHeadName",
      "className",
      "amount",
      "status",
      "name",
    ];
    const sampleRow = [
      "Tuition Fee",
      "",
      "1st",
      "5000.00",
      "active",
      "Tuition Fee - General (1st)",
    ];

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      sampleRow.map((cell) => `"${cell}"`).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fee_plans_sample_${importSchoolId}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        // Check for duplicates
        const existing = existingStructures.find((existing: FeeStructure) => {
          const matchesFeeCategory =
            existing.feeCategoryId === planData.feeCategoryId;
          const matchesCategoryHead =
            existing.categoryHeadId === planData.categoryHeadId ||
            (!existing.categoryHeadId && !planData.categoryHeadId);
          const matchesClass =
            existing.classId === planData.classId ||
            (!existing.classId && !planData.classId);

          return matchesFeeCategory && matchesCategoryHead && matchesClass;
        });

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

