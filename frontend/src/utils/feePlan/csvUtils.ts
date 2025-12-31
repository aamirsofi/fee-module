/**
 * CSV Utility Functions for Fee Plan Import/Export
 */

export interface ParsedFeePlanRow {
  feeCategoryName?: string;
  categoryHeadName?: string;
  className?: string;
  amount: string;
  status: string;
  name?: string;
}

export interface CSVParseOptions {
  feeCategoryMap: Map<string, number>;
  categoryHeadMap: Map<string, number>;
  classMap: Map<string, number>;
  schoolId: string | number;
}

export interface ParsedFeePlan {
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

/**
 * Parse CSV file content into structured data
 */
export function parseCSVContent(
  csvText: string,
  options: CSVParseOptions
): { data: ParsedFeePlan[]; errors: string[] } {
  const { feeCategoryMap, categoryHeadMap, classMap, schoolId } = options;
  const lines = csvText.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error(
      "CSV file must have at least a header row and one data row"
    );
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
      row.feecategoryname || row.feecategoryid || "";
    let feeCategoryId: number | null = null;

    if (feeCategoryName) {
      const idMatch = parseInt(feeCategoryName);
      if (!isNaN(idMatch)) {
        feeCategoryId = idMatch;
      } else {
        feeCategoryId =
          feeCategoryMap.get(feeCategoryName.toLowerCase().trim()) || null;
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
      row.categoryheadname || row.categoryheadid || "";
    let categoryHeadId: number | null = null;

    if (categoryHeadName) {
      const idMatch = parseInt(categoryHeadName);
      if (!isNaN(idMatch)) {
        categoryHeadId = idMatch;
      } else {
        categoryHeadId =
          categoryHeadMap.get(categoryHeadName.toLowerCase().trim()) || null;
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
    const className = row.classname || row.classid || "";
    let classId: number | null = null;

    if (className) {
      const idMatch = parseInt(className);
      if (!isNaN(idMatch)) {
        classId = idMatch;
      } else {
        classId = classMap.get(className.toLowerCase().trim()) || null;
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
      schoolId,
      feeCategoryId,
      categoryHeadId,
      classId,
      amount,
      status:
        status === "active" || status === "inactive" ? status : "active",
      name,
      feeCategoryName,
      categoryHeadName: categoryHeadName || "General",
      className,
    });
  }

  return { data, errors };
}

/**
 * Read CSV file and parse it
 */
export function readAndParseCSV(
  file: File,
  options: CSVParseOptions
): Promise<ParsedFeePlan[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { data, errors } = parseCSVContent(text, options);

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
}

/**
 * Generate sample CSV content
 */
export function generateSampleCSV(): string {
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

  return [
    headers.map((h) => `"${h}"`).join(","),
    sampleRow.map((cell) => `"${cell}"`).join(","),
  ].join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(
  csvContent: string,
  filename: string
): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(
  headers: string[],
  rows: string[][]
): string {
  return [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");
}

