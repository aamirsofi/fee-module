import { FiLoader, FiUpload, FiDownload } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { School } from "../../../services/schoolService";
import { FeeCategory } from "../../../hooks/pages/super-admin/useFeeHeadingData";

interface FeeHeadingFormProps {
  mode: "add" | "import";
  setMode: (mode: "add" | "import") => void;
  formData: {
    name: string;
    description: string;
    type: "school" | "transport";
    status: string;
    schoolId: string | number;
    applicableMonths: number[];
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      type: "school" | "transport";
      status: string;
      schoolId: string | number;
      applicableMonths: number[];
    }>
  >;
  editingCategory: FeeCategory | null;
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
    type: "school" | "transport";
    status: "active" | "inactive";
    applicableMonths?: number[];
  }>;
  isImporting: boolean;
  importResult: {
    success: number;
    failed: number;
    skipped: number;
    errors: Array<{ row: number; error: string }>;
    duplicates: Array<{ row: number; name: string; reason: string }>;
  } | null;
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
  isDragActive: boolean;
  downloadSampleCSV: () => void;
  handleBulkImport: () => Promise<void>;
}

export default function FeeHeadingForm({
  mode,
  setMode,
  formData,
  setFormData,
  editingCategory,
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
}: FeeHeadingFormProps) {
  const monthNames = [
    { num: 1, name: "Jan" },
    { num: 2, name: "Feb" },
    { num: 3, name: "Mar" },
    { num: 4, name: "Apr" },
    { num: 5, name: "May" },
    { num: 6, name: "Jun" },
    { num: 7, name: "Jul" },
    { num: 8, name: "Aug" },
    { num: 9, name: "Sep" },
    { num: 10, name: "Oct" },
    { num: 11, name: "Nov" },
    { num: 12, name: "Dec" },
  ];

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-800 mb-4">
          {editingCategory ? "Edit Fee Heading" : "Fee Heading Management"}
        </CardTitle>
        <Tabs
          value={mode}
          onValueChange={(value) => {
            if (value === "add") {
              setMode("add");
              setImportFile(null);
            } else if (value === "import") {
              setMode("import");
              handleCancel();
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 p-1 rounded-lg border border-gray-200">
            <TabsTrigger
              value="add"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all font-semibold"
            >
              Add Fee Heading
            </TabsTrigger>
            <TabsTrigger
              value="import"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all font-semibold"
            >
              Import Fee Headings
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as "add" | "import")}
        >
          <TabsContent value="add" className="mt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School <span className="text-red-500">*</span>
                </label>
                {loadingSchools ? (
                  <div className="flex items-center justify-center py-4">
                    <FiLoader className="w-5 h-5 animate-spin text-indigo-600" />
                    <span className="ml-2 text-gray-600">
                      Loading schools...
                    </span>
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
                        <SelectItem
                          key={school.id}
                          value={school.id.toString()}
                        >
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Tuition Fee, Library Fee"
                  required
                  disabled={!formData.schoolId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fee Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      type: value as "school" | "transport",
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">School Fee</SelectItem>
                    <SelectItem value="transport">Transport Fee</SelectItem>
                  </SelectContent>
                </Select>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Applicable Months
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Select months when this fee is applicable. Leave empty for all
                  months.
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                  {monthNames.map((month) => {
                    const isSelected = formData.applicableMonths.includes(
                      month.num
                    );
                    return (
                      <button
                        key={month.num}
                        type="button"
                        onClick={() => {
                          const newMonths = isSelected
                            ? formData.applicableMonths.filter(
                                (m) => m !== month.num
                              )
                            : [...formData.applicableMonths, month.num].sort(
                                (a, b) => a - b
                              );
                          setFormData({
                            ...formData,
                            applicableMonths: newMonths,
                          });
                        }}
                        className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                        }`}
                      >
                        {month.name}
                      </button>
                    );
                  })}
                </div>
                {formData.applicableMonths.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-600">Selected:</span>
                    <span className="text-xs font-medium text-indigo-600">
                      {formData.applicableMonths
                        .map((m) => monthNames[m - 1].name)
                        .join(", ")}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, applicableMonths: [] })
                      }
                      className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {editingCategory ? "Update" : "Create"}
                </Button>
                {editingCategory && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </TabsContent>
          <TabsContent value="import" className="mt-0">
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
                        <SelectItem
                          key={school.id}
                          value={school.id.toString()}
                        >
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
                </div>
              )}

              {/* File Upload */}
              {importSchoolId && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImportFile(null);
                          }}
                          className="mt-1 text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-600">
                          {isDragActive
                            ? "Drop your CSV file here"
                            : "Drag & drop your CSV file here"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          or click to browse
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview */}
              {importPreview.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Preview ({importPreview.length} rows)
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">Name</th>
                          <th className="px-2 py-1 text-left">Type</th>
                          <th className="px-2 py-1 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-2 py-1">{row.name}</td>
                            <td className="px-2 py-1">{row.type}</td>
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
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {isImporting ? (
                    <span className="flex items-center justify-center gap-2">
                      <FiLoader className="w-4 h-4 animate-spin" />
                      Importing...
                    </span>
                  ) : (
                    "Import Fee Categories"
                  )}
                </Button>
              )}

              {/* Import Results */}
              {importResult && (
                <div className="space-y-2">
                  {importResult.success > 0 && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs font-semibold text-green-800">
                        Successfully imported: {importResult.success} fee
                        category(es)
                      </p>
                    </div>
                  )}
                  {importResult.skipped > 0 && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs font-semibold text-yellow-800 mb-1">
                        Skipped (duplicates): {importResult.skipped} fee
                        category(es)
                      </p>
                      <div className="max-h-24 overflow-y-auto text-xs text-yellow-700">
                        {importResult.duplicates.map((dup, idx) => (
                          <div key={idx} className="mb-0.5">
                            Row {dup.row} - "{dup.name}": {dup.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {importResult.failed > 0 && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-semibold text-red-800 mb-1">
                        Failed: {importResult.failed} fee category(es)
                      </p>
                      <div className="max-h-24 overflow-y-auto text-xs text-red-700">
                        {importResult.errors.map((err, idx) => (
                          <div key={idx} className="mb-0.5">
                            Row {err.row}: {err.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
