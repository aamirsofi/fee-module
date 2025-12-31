import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import api from "../../../services/api";
import {
  readAndParseCSV,
  generateSampleCSV,
  downloadCSV,
  createLookupMaps,
} from "../../../utils/feePlan";
import { CategoryHead } from "./useCategoryHeadsData";

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
  duplicates: Array<{ row: number; name: string; reason: string }>;
}

interface ParsedCategoryHead {
  schoolId: string | number;
  name: string;
  description?: string;
  status: "active" | "inactive";
}

interface UseCategoryHeadsImportParams {
  refetchCategoryHeads: () => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
}

interface UseCategoryHeadsImportReturn {
  importSchoolId: string | number;
  setImportSchoolId: React.Dispatch<React.SetStateAction<string | number>>;
  importFile: File | null;
  setImportFile: React.Dispatch<React.SetStateAction<File | null>>;
  importPreview: ParsedCategoryHead[];
  setImportPreview: React.Dispatch<React.SetStateAction<ParsedCategoryHead[]>>;
  isImporting: boolean;
  importResult: ImportResult | null;
  getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
  isDragActive: boolean;
  downloadSampleCSV: () => void;
  handleBulkImport: () => Promise<void>;
}

export function useCategoryHeadsImport({
  refetchCategoryHeads,
  setError,
  setSuccess,
}: UseCategoryHeadsImportParams): UseCategoryHeadsImportReturn {
  const [importSchoolId, setImportSchoolId] = useState<string | number>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ParsedCategoryHead[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Parse CSV file for category heads
  const parseCSV = useCallback(
    async (file: File): Promise<ParsedCategoryHead[]> => {
      if (!importSchoolId) {
        throw new Error("School ID is required");
      }

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
            const data: ParsedCategoryHead[] = [];
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

              const name = row.name || "";
              if (!name) {
                errors.push(`Row ${rowNumber}: Name is required`);
                continue;
              }

              const description = row.description || "";
              const status = (row.status || "active").toLowerCase();

              if (status !== "active" && status !== "inactive") {
                errors.push(
                  `Row ${rowNumber}: Status must be "active" or "inactive"`
                );
                continue;
              }

              data.push({
                schoolId: importSchoolId,
                name: name.trim(),
                description: description.trim() || undefined,
                status: status as "active" | "inactive",
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

    const headers = ["name", "description", "status"];
    const sampleRow = ["General", "General category head", "active"];
    const sampleRow2 = ["Sponsored", "Sponsored category head", "active"];

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      sampleRow.map((cell) => `"${cell}"`).join(","),
      sampleRow2.map((cell) => `"${cell}"`).join(","),
    ].join("\n");

    downloadCSV(csvContent, `category_heads_sample_${importSchoolId}.csv`);
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

      const categoryHeadsData = await parseCSV(importFile);

      if (categoryHeadsData.length === 0) {
        setError("No valid category heads found in CSV file");
        return;
      }

      // Fetch existing category heads for duplicate checking
      const existingCategoryHeadsResponse = await api.instance.get(
        "/super-admin/category-heads",
        {
          params: { schoolId: importSchoolId, limit: 10000 },
        }
      );
      const existingCategoryHeads =
        existingCategoryHeadsResponse.data.data ||
        existingCategoryHeadsResponse.data ||
        [];

      const results: ImportResult = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        duplicates: [],
      };

      // Import category heads one by one
      for (let i = 0; i < categoryHeadsData.length; i++) {
        const categoryHeadData = categoryHeadsData[i];
        const rowNumber = i + 2; // +2 because row 1 is header

        // Check for duplicates (by name)
        const existing = existingCategoryHeads.find(
          (existing: CategoryHead) =>
            existing.name.toLowerCase().trim() ===
              categoryHeadData.name.toLowerCase().trim() &&
            existing.schoolId === categoryHeadData.schoolId
        );

        if (existing) {
          results.skipped++;
          results.duplicates.push({
            row: rowNumber,
            name: categoryHeadData.name,
            reason: "Category head already exists",
          });
          continue;
        }

        try {
          const payload: Record<string, unknown> = {
            name: categoryHeadData.name,
            status: categoryHeadData.status,
          };

          if (categoryHeadData.description) {
            payload.description = categoryHeadData.description;
          }

          await api.instance.post(
            `/super-admin/category-heads?schoolId=${importSchoolId}`,
            payload
          );
          results.success++;
          // Add to existing category heads to prevent duplicates within the same import batch
          existingCategoryHeads.push({
            name: categoryHeadData.name,
            schoolId: categoryHeadData.schoolId,
          } as CategoryHead);
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
              : "Failed to create category head";

          if (errorMessage.toLowerCase().includes("already exists")) {
            results.skipped++;
            results.duplicates.push({
              row: rowNumber,
              name: categoryHeadData.name,
              reason: "Category head already exists",
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
        setSuccess(`Successfully imported ${results.success} category head(s)`);
        if (results.skipped > 0) {
          setSuccess(
            `Successfully imported ${results.success} category head(s). ${results.skipped} duplicate(s) skipped.`
          );
        }
        setImportFile(null);
        setImportPreview([]);
        refetchCategoryHeads();
      }
      if (results.failed > 0) {
        setError(
          `${results.failed} category head(s) failed to import. Check errors below.`
        );
      }
      if (results.skipped > 0 && results.success === 0) {
        setError(
          `All ${results.skipped} category head(s) were duplicates and skipped.`
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
          : "Failed to import category heads";
      setError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  }, [
    importFile,
    importSchoolId,
    parseCSV,
    refetchCategoryHeads,
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

