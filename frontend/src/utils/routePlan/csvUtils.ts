/**
 * CSV Utility Functions for Route Plan Import/Export
 */

export interface ParsedRoutePlanRow {
  routeName?: string;
  feeCategoryName?: string;
  categoryHeadName?: string;
  className?: string;
  amount: string;
  status: string;
  name?: string;
}

export interface CSVParseOptions {
  routeMap: Map<string, number>;
  feeCategoryMap: Map<string, number>;
  categoryHeadMap: Map<string, number>;
  classMap: Map<string, number>;
  schoolId: string | number;
}

export interface ParsedRoutePlan {
  schoolId: string | number;
  routeId: number;
  feeCategoryId: number;
  categoryHeadId: number | null;
  classId: number | null; // Optional for route plans
  amount: number;
  status: "active" | "inactive";
  name: string;
  routeName?: string;
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
): { data: ParsedRoutePlan[]; errors: string[] } {
  const { routeMap, feeCategoryMap, categoryHeadMap, classMap, schoolId } = options;
  const lines = csvText.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error(
      "CSV file must have at least a header row and one data row"
    );
  }

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/"/g, "").toLowerCase());
  const data: ParsedRoutePlan[] = [];
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

    // Resolve route name to ID
    const routeName = row.routename || row.routeid || "";
    let routeId: number | null = null;

    if (routeName) {
      const idMatch = parseInt(routeName);
      if (!isNaN(idMatch)) {
        routeId = idMatch;
      } else {
        routeId = routeMap.get(routeName.toLowerCase().trim()) || null;
        if (!routeId) {
          errors.push(
            `Row ${rowNumber}: Route "${routeName}" not found for this school`
          );
          continue;
        }
      }
    } else {
      errors.push(`Row ${rowNumber}: Route is required`);
      continue;
    }

    // Resolve fee category name to ID (transport fee category)
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
            `Row ${rowNumber}: Transport fee category "${feeCategoryName}" not found for this school`
          );
          continue;
        }
      }
    } else {
      errors.push(`Row ${rowNumber}: Transport fee category is required`);
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

    // Resolve class name to ID (optional)
    const className = row.classname || row.classid || "";
    let classId: number | null = null;

    if (className && className.trim() !== "" && className.toLowerCase() !== "none" && className.toLowerCase() !== "all") {
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
    }

    const amount = parseFloat(row.amount || "0");
    if (isNaN(amount) || amount < 0) {
      errors.push(`Row ${rowNumber}: Valid amount is required (0 is allowed)`);
      continue;
    }

    const status = (row.status || "active").toLowerCase();
    const name = row.name || "";

    data.push({
      schoolId,
      routeId,
      feeCategoryId,
      categoryHeadId,
      classId,
      amount,
      status:
        status === "active" || status === "inactive" ? status : "active",
      name,
      routeName,
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
): Promise<ParsedRoutePlan[]> {
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
    "routeName",
    "feeCategoryName",
    "categoryHeadName",
    "className",
    "amount",
    "status",
    "name",
  ];
  const sampleRow = [
    "Route A",
    "Transport Fee",
    "",
    "1st",
    "2000.00",
    "active",
    "Route A - Transport Fee - General (1st)",
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
 * Create lookup maps for name resolution
 */
export function createLookupMaps(
  routes: Array<{ id: number; name: string }>,
  feeCategories: Array<{ id: number; name: string; type?: string }>,
  categoryHeads: Array<{ id: number; name: string }>,
  classes: Array<{ id: number; name: string }>
): {
  routeMap: Map<string, number>;
  feeCategoryMap: Map<string, number>;
  categoryHeadMap: Map<string, number>;
  classMap: Map<string, number>;
} {
  const routeMap = new Map<string, number>();
  routes.forEach((route) => {
    routeMap.set(route.name.toLowerCase().trim(), route.id);
  });

  // Only include transport fee categories
  const feeCategoryMap = new Map<string, number>();
  feeCategories
    .filter((fc) => fc.type === "transport")
    .forEach((fc) => {
      feeCategoryMap.set(fc.name.toLowerCase().trim(), fc.id);
    });

  const categoryHeadMap = new Map<string, number>();
  categoryHeads.forEach((ch) => {
    categoryHeadMap.set(ch.name.toLowerCase().trim(), ch.id);
  });

  const classMap = new Map<string, number>();
  classes.forEach((cls) => {
    classMap.set(cls.name.toLowerCase().trim(), cls.id);
  });

  return { routeMap, feeCategoryMap, categoryHeadMap, classMap };
}

