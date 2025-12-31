import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import api from "../../../services/api";
import { downloadCSV } from "../../../utils/feePlan";
import { FeeCategory } from "./useFeeHeadingData";

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
  duplicates: Array<{ row: number; name: string; reason: string }>;
}

interface ParsedFeeCategory {
  schoolId: string | number;
  name: string;
  description?: string;
  type: "school" | "transport";
  status: "active" | "inactive";
  applicableMonths?: number[];
}

interface UseFeeHeadingImportParams {
  refetchFeeCategories: () => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
}

interface UseFeeHeadingImportReturn {
  importSchoolId: string | number;
  setImportSchoolId: React.Dispatch<React.SetStateAction<string | number>>;
  importFile: File | null;
  setImportFile: React.Dispatch<React.SetStateAction<File | null>>;
  importPreview: ParsedFeeCategory[];
  setImportPreview: React.Dispatch<React.SetStateAction<ParsedFeeCategory[]>>;
  isImporting: boolean;
  importResult: ImportResult | null;
  getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
  isDragActive: boolean;
  downloadSampleCSV: () => void;
  handleBulkImport: () => Promise<void>;
}

export function useFeeHeadingImport({
  refetchFeeCategories,
  setError,
  setSuccess,
}: UseFeeHeadingImportParams): UseFeeHeadingImportReturn {
  const [importSchoolId, setImportSchoolId] = useState<string | number>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ParsedFeeCategory[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Parse CSV file
  const parseCSV = useCallback(
    (file: File): Promise<ParsedFeeCategory[]> => {
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
            const data: ParsedFeeCategory[] = [];

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i]
                .split(",")
                .map((v) => v.trim().replace(/"/g, ""));
              const row: Record<string, string> = {};

              headers.forEach((header, index) => {
                row[header] = values[index] || "";
              });

              if (row.name) {
                // Parse applicable months if provided
                let applicableMonths: number[] = [];
                if (row.applicablemonths) {
                  const monthsStr = row.applicablemonths;
                  if (monthsStr) {
                    applicableMonths = monthsStr
                      .split(",")
                      .map((m: string) => parseInt(m.trim()))
                      .filter((m: number) => !isNaN(m) && m >= 1 && m <= 12);
                  }
                }

                data.push({
                  schoolId: row.schoolid || importSchoolId,
                  name: row.name,
                  description: row.description || "",
                  type: (row.type || "school").toLowerCase() as "school" | "transport",
                  status: (row.status || "active").toLowerCase() as "active" | "inactive",
                  applicableMonths:
                    applicableMonths.length > 0 ? applicableMonths : undefined,
                });
              }
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

  // Download sample CSV
  const downloadSampleCSV = useCallback(() => {
    if (!importSchoolId) {
      setError("Please select a school first");
      return;
    }

    const headers = [
      "schoolId",
      "name",
      "description",
      "type",
      "status",
      "applicableMonths",
    ];
    const sampleRow = [
      importSchoolId.toString(),
      "Tuition Fee",
      "Monthly tuition fee",
      "school",
      "active",
      "1,2,3,4,5,6,7,8,9,10,11,12",
    ];

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      sampleRow.map((cell) => `"${cell}"`).join(","),
    ].join("\n");

    downloadCSV(csvContent, `fee_categories_sample_${importSchoolId}.csv`);
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
        const data = await parseCSV(file);
        setImportPreview(data.slice(0, 10)); // Preview first 10 rows
        setError("");
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

      const categoriesData = await parseCSV(importFile);

      if (categoriesData.length === 0) {
        setError("No valid fee categories found in CSV file");
        return;
      }

      // Fetch existing categories for duplicate checking
      const existingCategoriesResponse = await api.instance.get(
        "/super-admin/fee-categories",
        {
          params: { schoolId: importSchoolId, limit: 1000 },
        }
      );
      const existingCategories =
        existingCategoriesResponse.data.data ||
        existingCategoriesResponse.data ||
        [];
      // Create a Set using composite key: name + type (since same name can exist with different types)
      const existingCategoryKeys = new Set(
        existingCategories.map(
          (cat: FeeCategory) =>
            `${cat.name.toLowerCase().trim()}_${cat.type.toLowerCase()}`
        )
      );

      // Check for duplicates within CSV using composite key: name + type
      const csvCategoryKeys = new Map<string, number[]>(); // "name_type" -> array of row numbers
      categoriesData.forEach((categoryData, index) => {
        const name = categoryData.name.toLowerCase().trim();
        const type = (categoryData.type || "school").toLowerCase();
        const key = `${name}_${type}`;
        if (!csvCategoryKeys.has(key)) {
          csvCategoryKeys.set(key, []);
        }
        csvCategoryKeys.get(key)!.push(index + 2); // +2 because row 1 is header
      });

      const results: ImportResult = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        duplicates: [],
      };

      // Import categories one by one
      for (let i = 0; i < categoriesData.length; i++) {
        const categoryData = categoriesData[i];
        const categoryName = categoryData.name.trim();
        const categoryNameLower = categoryName.toLowerCase();
        const categoryType = (categoryData.type || "school").toLowerCase();
        const categoryKey = `${categoryNameLower}_${categoryType}`;
        const rowNumber = i + 2; // +2 because row 1 is header

        // Check for duplicates within CSV (skip if not first occurrence)
        const occurrences = csvCategoryKeys.get(categoryKey) || [];
        if (occurrences.length > 1 && occurrences[0] !== rowNumber) {
          results.skipped++;
          results.duplicates.push({
            row: rowNumber,
            name: categoryName,
            reason: `Duplicate name and type in CSV (first occurrence at row ${occurrences[0]})`,
          });
          continue;
        }

        // Check for duplicates against existing categories (name + type combination)
        if (existingCategoryKeys.has(categoryKey)) {
          results.skipped++;
          results.duplicates.push({
            row: rowNumber,
            name: categoryName,
            reason: `Fee category with name "${categoryName}" and type "${categoryType}" already exists in database`,
          });
          continue;
        }

        try {
          const payload: Record<string, unknown> = {
            name: categoryData.name,
            description: categoryData.description || undefined,
            type: categoryData.type || "school",
            status: categoryData.status || "active",
          };

          if (
            categoryData.applicableMonths &&
            categoryData.applicableMonths.length > 0
          ) {
            payload.applicableMonths = categoryData.applicableMonths;
          }

          await api.instance.post(
            `/super-admin/fee-categories?schoolId=${importSchoolId}`,
            payload
          );
          results.success++;
          // Add to existing set to prevent duplicates within the same import batch
          existingCategoryKeys.add(categoryKey);
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
              : "Failed to create fee category";

          // Check if it's a duplicate error
          if (errorMessage.toLowerCase().includes("already exists")) {
            results.skipped++;
            results.duplicates.push({
              row: rowNumber,
              name: categoryName,
              reason: "Fee category already exists in database",
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
        setSuccess(`Successfully imported ${results.success} fee category(es)`);
        if (results.skipped > 0) {
          setSuccess(
            `Successfully imported ${results.success} fee category(es). ${results.skipped} duplicate(s) skipped.`
          );
        }
        setImportFile(null);
        setImportPreview([]);
        refetchFeeCategories();
      }
      if (results.failed > 0) {
        setError(
          `${results.failed} fee category(es) failed to import. Check errors below.`
        );
      }
      if (results.skipped > 0 && results.success === 0) {
        setError(
          `All ${results.skipped} fee category(es) were duplicates and skipped.`
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
          : "Failed to import fee categories";
      setError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  }, [
    importFile,
    importSchoolId,
    parseCSV,
    refetchFeeCategories,
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

