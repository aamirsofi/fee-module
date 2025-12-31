import { FiLoader, FiUpload, FiDownload } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School } from "../../../services/schoolService";
import { CategoryHead } from "../../../hooks/pages/super-admin/useCategoryHeadsData";

interface CategoryHeadsFormProps {
  mode: "add" | "import";
  setMode: (mode: "add" | "import") => void;
  formData: {
    name: string;
    description: string;
    status: string;
    schoolId: string | number;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      status: string;
      schoolId: string | number;
    }>
  >;
  editingCategoryHead: CategoryHead | null;
  schools: School[];
  loadingSchools: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  handleCancel: () => void;
  // Import props
  importSchoolId: string | number;
  setImportSchoolId: (schoolId: string | number) => void;
  importFile: File | null;
  setImportFile: (file: File | null) => void;
  importPreview: Array<{
    schoolId: string | number;
    name: string;
    description?: string;
    status: "active" | "inactive";
  }>;
  isImporting: boolean;
  importResult: {
    success: number;
    failed: number;
    skipped: number;
    errors: Array<{ row: number; error: string }>;
    duplicates: Array<{ row: number; name: string; reason: string }>;
  } | null;
  getRootProps: () => any;
  getInputProps: () => any;
  isDragActive: boolean;
  downloadSampleCSV: () => void;
  handleBulkImport: () => Promise<void>;
}

export default function CategoryHeadsForm({
  mode,
  setMode,
  formData,
  setFormData,
  editingCategoryHead,
  schools,
  loadingSchools,
  handleSubmit,
  handleCancel,
  importSchoolId,
  setImportSchoolId,
  importFile,
  setImportFile,
  importPreview,
  isImporting,
  importResult,
  getRootProps,
  getInputProps,
  isDragActive,
  downloadSampleCSV,
  handleBulkImport,
}: CategoryHeadsFormProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setMode("add");
              setImportFile(null);
            }}
            className={`px-4 py-2 text-sm font-semibold transition-smooth ${
              mode === "add"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Add Category Head
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("import");
              handleCancel();
            }}
            className={`px-4 py-2 text-sm font-semibold transition-smooth ${
              mode === "import"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Import Category Heads
          </button>
        </div>
        <CardTitle className="text-lg font-bold text-gray-800">
          {mode === "import"
            ? "Import Category Heads from CSV"
            : editingCategoryHead
            ? "Edit Category Head"
            : "Add Category Head"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mode === "add" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School <span className="text-red-500">*</span>
              </label>
              {loadingSchools ? (
                <div className="flex items-center justify-center py-4">
                  <FiLoader className="w-5 h-5 animate-spin text-indigo-600" />
                  <span className="ml-2 text-gray-600">Loading schools...</span>
                </div>
              ) : (
                <Select
                  value={
                    formData.schoolId && formData.schoolId !== ""
                      ? formData.schoolId.toString()
                      : undefined
                  }
                  onValueChange={(value) => {
                    const numValue = parseInt(value, 10);
                    setFormData({ ...formData, schoolId: numValue || "" });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a school..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Head Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., General, Sponsored"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white resize-none"
              />
            </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {editingCategoryHead ? "Update" : "Create"}
              </button>
              {editingCategoryHead && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-smooth"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* School Selection for Import */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                School <span className="text-red-500">*</span>
              </label>
              {loadingSchools ? (
                <div className="flex items-center justify-center py-2">
                  <FiLoader className="w-3 h-3 animate-spin text-indigo-600" />
                  <span className="ml-1.5 text-xs text-gray-600">
                    Loading...
                  </span>
                </div>
              ) : (
                <Select
                  value={
                    importSchoolId && importSchoolId !== ""
                      ? importSchoolId.toString()
                      : undefined
                  }
                  onValueChange={(value) => {
                    const schoolId = value ? parseInt(value) : "";
                    setImportSchoolId(schoolId);
                    setImportFile(null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a school..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Download Sample CSV */}
            {importSchoolId && (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadSampleCSV}
                  className="w-full"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Download Sample CSV
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Download a sample CSV template with the correct format.
                </p>
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-blue-900 mb-1">
                    CSV Format:
                  </p>
                  <ul className="text-xs text-blue-800 space-y-0.5 list-disc list-inside">
                    <li>
                      <strong>name</strong> - Category head name (e.g.,
                      "General", "Sponsored")
                    </li>
                    <li>
                      <strong>description</strong> - Optional description
                    </li>
                    <li>
                      <strong>status</strong> - "active" or "inactive"
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* File Upload */}
            {importSchoolId && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Upload CSV File <span className="text-red-500">*</span>
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-smooth ${
                    isDragActive
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <FiUpload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  {importFile ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        {importFile.name}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImportFile(null);
                        }}
                        className="mt-1 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-600">
                        {isDragActive
                          ? "Drop your CSV file here"
                          : "Drag & drop your CSV file here"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        or click to browse
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview Table */}
            {importPreview.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Preview (first 10 rows)
                </label>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left">Description</th>
                        <th className="px-2 py-1 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importPreview.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-2 py-1">{row.name}</td>
                          <td className="px-2 py-1">
                            {row.description || "-"}
                          </td>
                          <td className="px-2 py-1">{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Button */}
            {importFile && importSchoolId && (
              <Button
                type="button"
                onClick={handleBulkImport}
                disabled={isImporting}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FiUpload className="w-4 h-4 mr-2" />
                    Import Category Heads
                  </>
                )}
              </Button>
            )}

            {/* Import Results */}
            {importResult && (
              <div className="space-y-2">
                {importResult.success > 0 && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-green-900">
                      ✓ Successfully imported: {importResult.success}
                    </p>
                  </div>
                )}
                {importResult.skipped > 0 && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-semibold text-yellow-900">
                      ⚠ Skipped: {importResult.skipped} duplicate(s)
                    </p>
                    {importResult.duplicates.length > 0 && (
                      <ul className="text-xs text-yellow-800 mt-1 space-y-0.5">
                        {importResult.duplicates.slice(0, 5).map((dup, idx) => (
                          <li key={idx}>
                            Row {dup.row}: {dup.name} - {dup.reason}
                          </li>
                        ))}
                        {importResult.duplicates.length > 5 && (
                          <li>
                            ... and {importResult.duplicates.length - 5} more
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
                {importResult.failed > 0 && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-semibold text-red-900">
                      ✗ Failed: {importResult.failed}
                    </p>
                    {importResult.errors.length > 0 && (
                      <ul className="text-xs text-red-800 mt-1 space-y-0.5">
                        {importResult.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx}>
                            Row {err.row}: {err.error}
                          </li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>... and {importResult.errors.length - 5} more</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
