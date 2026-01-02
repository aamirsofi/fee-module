import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiUpload, FiX, FiDownload } from "react-icons/fi";
import api from "../services/api";

interface StudentBulkImportProps {
  schoolId: number;
  onImportSuccess: () => void;
  onImportError: (error: string) => void;
}

interface ParsedStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  class: string;
  section?: string;
  status?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; studentId?: string; email?: string; error: string }>;
  created: Array<{ studentId: string; email: string; name: string }>;
}

const StudentBulkImport: React.FC<StudentBulkImportProps> = ({
  schoolId,
  onImportSuccess,
  onImportError,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedStudent[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Parse CSV file for preview
  const parseCsvPreview = useCallback(
    (file: File): Promise<{ data: ParsedStudent[]; columns: string[] }> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const lines = text.split("\n").filter((line) => line.trim());

            if (lines.length === 0) {
              reject(new Error("CSV file is empty"));
              return;
            }

            // Parse header
            const headerLine = lines[0];
            const headers = headerLine
              .split(",")
              .map((h) => h.trim().replace(/^"|"$/g, ""));

            // Parse data rows (limit to first 10 rows for preview)
            const previewRows = Math.min(10, lines.length - 1);
            const data: ParsedStudent[] = [];

            for (let i = 1; i <= previewRows; i++) {
              const line = lines[i];
              if (!line.trim()) continue;

              // Simple CSV parsing (handles quoted values)
              const values: string[] = [];
              let currentValue = "";
              let inQuotes = false;

              for (let j = 0; j < line.length; j++) {
                const char = line[j];

                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === "," && !inQuotes) {
                  values.push(currentValue.trim());
                  currentValue = "";
                } else {
                  currentValue += char;
                }
              }
              values.push(currentValue.trim()); // Add last value

              const row: Record<string, string> = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || "";
              });

              // Map CSV columns to student fields (case-insensitive)
              const student: ParsedStudent = {
                studentId: row["studentId"] || row["student_id"] || row["Student ID"] || "",
                firstName: row["firstName"] || row["first_name"] || row["First Name"] || "",
                lastName: row["lastName"] || row["last_name"] || row["Last Name"] || "",
                email: row["email"] || row["Email"] || "",
                phone: row["phone"] || row["Phone"] || "",
                address: row["address"] || row["Address"] || "",
                class: row["class"] || row["Class"] || "",
                section: row["section"] || row["Section"] || "",
                status: row["status"] || row["Status"] || "active",
              };

              data.push(student);
            }

            resolve({ data, columns: headers });
          } catch (error) {
            reject(new Error("Failed to parse CSV file"));
          }
        };

        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };

        reader.readAsText(file);
      });
    },
    []
  );

  // Parse full CSV file
  const parseFullCsv = useCallback(
    (file: File): Promise<ParsedStudent[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const lines = text.split("\n").filter((line) => line.trim());

            if (lines.length === 0) {
              reject(new Error("CSV file is empty"));
              return;
            }

            // Parse header
            const headerLine = lines[0];
            const headers = headerLine
              .split(",")
              .map((h) => h.trim().replace(/^"|"$/g, ""));

            const data: ParsedStudent[] = [];

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              if (!line.trim()) continue;

              // Simple CSV parsing (handles quoted values)
              const values: string[] = [];
              let currentValue = "";
              let inQuotes = false;

              for (let j = 0; j < line.length; j++) {
                const char = line[j];

                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === "," && !inQuotes) {
                  values.push(currentValue.trim());
                  currentValue = "";
                } else {
                  currentValue += char;
                }
              }
              values.push(currentValue.trim());

              const row: Record<string, string> = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || "";
              });

              // Map CSV columns to student fields
              const student: ParsedStudent = {
                studentId: row["studentId"] || row["student_id"] || row["Student ID"] || "",
                firstName: row["firstName"] || row["first_name"] || row["First Name"] || "",
                lastName: row["lastName"] || row["last_name"] || row["Last Name"] || "",
                email: row["email"] || row["Email"] || "",
                phone: row["phone"] || row["Phone"] || "",
                address: row["address"] || row["Address"] || "",
                class: row["class"] || row["Class"] || "",
                section: row["section"] || row["Section"] || "",
                status: row["status"] || row["Status"] || "active",
              };

              data.push(student);
            }

            resolve(data);
          } catch (error) {
            reject(new Error("Failed to parse CSV file"));
          }
        };

        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };

        reader.readAsText(file);
      });
    },
    []
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (isUploading) return;

      if (rejectedFiles && rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        let errorMessage = "Invalid file upload";
        if (error.code === "file-invalid-type") {
          errorMessage = "Invalid file type. Please upload a CSV file (.csv)";
        } else if (error.code === "file-too-large") {
          errorMessage = "File is too large. Maximum file size is 10MB";
        }
        onImportError(errorMessage);
        return;
      }

      const file = acceptedFiles[0];
      if (!file) {
        onImportError("No file selected");
        return;
      }

      if (!file.name.match(/\.(csv)$/i)) {
        onImportError(`Invalid file type: "${file.name}". Please upload a CSV file (.csv)`);
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        onImportError(`File "${file.name}" is too large (${fileSizeMB}MB). Maximum file size is 10MB`);
        return;
      }

      if (file.size === 0) {
        onImportError(`File "${file.name}" is empty. Please upload a valid CSV file with data`);
        return;
      }

      try {
        const { data, columns } = await parseCsvPreview(file);
        if (!data || data.length === 0) {
          onImportError(`CSV file "${file.name}" appears to be empty or has no data rows`);
          return;
        }
        if (!columns || columns.length === 0) {
          onImportError(`CSV file "${file.name}" has no column headers. Please ensure your CSV file has a header row`);
          return;
        }

        setPreviewData(data);
        setPreviewColumns(columns);
        setSelectedFile(file); // Store file reference
      } catch (error: any) {
        onImportError(error.message || "Failed to parse CSV file");
      }
    },
    [isUploading, parseCsvPreview, onImportError]
  );

  const handleConfirmImport = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const students = await parseFullCsv(selectedFile);

      // Validate required fields
      const invalidRows: number[] = [];
      students.forEach((student, index) => {
        if (!student.studentId || !student.firstName || !student.lastName || !student.email || !student.class) {
          invalidRows.push(index + 2); // +2 for header row
        }
      });

      if (invalidRows.length > 0) {
        onImportError(`Rows ${invalidRows.join(", ")} are missing required fields (studentId, firstName, lastName, email, class)`);
        setIsUploading(false);
        return;
      }

      // Call bulk import API
      const response = await api.instance.post<ImportResult>(
        `/super-admin/schools/${schoolId}/students/bulk-import`,
        { students }
      );

      setImportResult(response.data);
      setShowResults(true);
      setSelectedFile(null);
      setPreviewData([]);
      setPreviewColumns([]);
      onImportSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to import students";
      onImportError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, schoolId, parseFullCsv, onImportSuccess, onImportError]);

  const downloadSampleCSV = useCallback(() => {
    // Sample CSV data
    const sampleData = [
      {
        studentId: "STU001",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        address: "123 Main St",
        class: "10th Grade",
        section: "A",
        status: "active",
      },
      {
        studentId: "STU002",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "+1234567891",
        address: "456 Oak Ave",
        class: "10th Grade",
        section: "B",
        status: "active",
      },
      {
        studentId: "STU003",
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@example.com",
        phone: "+1234567892",
        address: "789 Pine Rd",
        class: "11th Grade",
        section: "A",
        status: "active",
      },
    ];

    // CSV headers
    const headers = [
      "studentId",
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "class",
      "section",
      "status",
    ];

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row] || "";
            // Escape commas and quotes in values
            if (value.includes(",") || value.includes('"') || value.includes("\n")) {
              return `"${String(value).replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_students.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);


  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
    disabled: isUploading,
    noClick: false, // Allow clicking on the dropzone area
    maxSize: 10 * 1024 * 1024, // 10MB
    minSize: 1,
  });

  return (
    <>
      {/* Upload Area */}
      <div className="card-modern rounded-xl p-6">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-smooth"
          >
            <FiDownload className="w-4 h-4" />
            Download Sample CSV
          </button>
        </div>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center
            transition-smooth cursor-pointer
            ${
              isUploading
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-indigo-500 hover:bg-indigo-50"
            }
            ${
              isDragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300"
            }
          `}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
              <p className="text-lg font-medium text-gray-600">Importing students...</p>
            </div>
          ) : (
            <>
              <FiUpload className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
              <h3 className="text-xl font-bold mb-2 text-gray-800">
                {isDragActive ? "Drop your CSV file here" : "Drag & drop your CSV file here"}
              </h3>
              <p className="text-lg mb-4 text-gray-500">or</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  open();
                }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Browse Files
              </button>
              <p className="text-sm mt-4 text-gray-400">
                Only CSV files are supported • Max file size: 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Preview Section - Inline */}
      {previewData.length > 0 && (
        <div className="card-modern rounded-xl p-6 space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Preview CSV Data</h3>
              <p className="text-sm text-gray-600 mt-1">
                Review the data before importing ({previewData.length} rows preview)
              </p>
            </div>
            <button
              onClick={() => {
                setPreviewData([]);
                setPreviewColumns([]);
                setSelectedFile(null);
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-smooth"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">First Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Last Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Section</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, index) => (
                  <tr key={index} className="hover:bg-indigo-50/50">
                    <td className="px-4 py-3 text-sm text-gray-900">{row.studentId || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.firstName || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.lastName || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.email || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.phone || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.address || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.class || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.section || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setPreviewData([]);
                setPreviewColumns([]);
                setSelectedFile(null);
              }}
              className="px-6 py-3 rounded-xl font-semibold bg-white text-gray-700 hover:bg-gray-50 shadow-md transition-smooth border border-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={isUploading}
              className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Importing..." : "Import All Rows"}
            </button>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResults && importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-modern rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Import Results</h2>
                <p className="text-sm text-gray-600">Bulk import completed</p>
              </div>
              <button
                onClick={() => {
                  setShowResults(false);
                  setImportResult(null);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-smooth"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Successfully Imported</p>
                  <p className="text-2xl font-bold text-green-800">{importResult.success}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm text-red-600 font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-800">{importResult.failed}</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Errors</h3>
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Row</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Student ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Error</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {importResult.errors.map((error, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{error.row}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{error.studentId || "-"}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{error.email || "-"}</td>
                            <td className="px-4 py-2 text-sm text-red-600">{error.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importResult.created.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Created Students</h3>
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Student ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Email</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {importResult.created.map((student, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{student.studentId}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{student.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{student.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowResults(false);
                  setImportResult(null);
                }}
                className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentBulkImport;

