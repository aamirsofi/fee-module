import { useState, useEffect } from "react";
import {
  FiEdit,
  FiTrash2,
  FiLoader,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiSearch,
} from "react-icons/fi";
import api from "../../services/api";
import CustomDropdown from "../../components/ui/CustomDropdown";

interface FeeCategory {
  id: number;
  name: string;
  description?: string;
  type: "school" | "transport";
  status: string;
  applicableMonths?: number[]; // Array of month numbers (1-12)
  schoolId: number;
  school?: {
    id: number;
    name: string;
    subdomain: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface School {
  id: number;
  name: string;
  subdomain: string;
  email?: string;
  status: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function FeeHeading() {
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [createMode, setCreateMode] = useState<"single" | "multiple">("single");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "school" as "school" | "transport",
    status: "active" as string,
    schoolId: "" as string | number,
    applicableMonths: [] as number[],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | number>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );

  useEffect(() => {
    loadFeeCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, selectedSchoolId, selectedType]);

  useEffect(() => {
    loadSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.schoolId) {
      loadAvailableClasses();
    } else {
      setAvailableClasses([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.schoolId]);

  const loadAvailableClasses = async () => {
    if (!formData.schoolId) return;

    try {
      setLoadingClasses(true);
      // Fetch students for the school to get unique classes
      // Use school details endpoint which includes students
      const response = await api.instance.get(
        `/super-admin/schools/${formData.schoolId}/details`
      );

      const students = response.data?.students || [];

      // Extract unique classes
      const uniqueClasses = Array.from(
        new Set(
          students
            .map((student: any) => student.class)
            .filter((cls: string) => cls && cls.trim())
        )
      ).sort() as string[];

      setAvailableClasses(uniqueClasses);
    } catch (err: any) {
      console.error("Error loading classes:", err);
      setAvailableClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadSchools = async () => {
    try {
      setLoadingSchools(true);
      setError("");

      let allSchools: School[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const pageLimit = 100;

      while (hasMorePages) {
        const response = await api.instance.get("/super-admin/schools", {
          params: { page: currentPage, limit: pageLimit, status: "active" },
        });

        if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          allSchools = [...allSchools, ...response.data.data];

          const meta = response.data.meta;
          if (meta && meta.hasNextPage) {
            currentPage++;
          } else {
            hasMorePages = false;
          }
        } else if (Array.isArray(response.data)) {
          allSchools = [...allSchools, ...response.data];
          hasMorePages = false;
        } else {
          hasMorePages = false;
        }
      }

      setSchools(allSchools);
    } catch (err: any) {
      console.error("Error loading schools:", err);
      setSchools([]);
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadFeeCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const params: any = { page, limit };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedSchoolId) {
        params.schoolId = selectedSchoolId;
      }
      if (selectedType) {
        params.type = selectedType;
      }

      const response = await api.instance.get("/super-admin/fee-categories", {
        params,
      });

      if (response.data.data && response.data.meta) {
        setFeeCategories(response.data.data);
        setPaginationMeta(response.data.meta);
      } else if (Array.isArray(response.data)) {
        setFeeCategories(response.data);
        setPaginationMeta({
          total: response.data.length,
          page: 1,
          limit: response.data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load fee categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      if (!formData.schoolId) {
        setError("Please select a school");
        return;
      }

      if (
        createMode === "multiple" &&
        selectedClasses.length === 0 &&
        !editingCategory
      ) {
        setError("Please select at least one class");
        return;
      }

      const basePayload: any = {
        description: formData.description.trim() || undefined,
        type: formData.type,
        status: formData.status,
      };

      // Include applicableMonths if selected, otherwise send empty array (means all months)
      if (formData.applicableMonths.length > 0) {
        basePayload.applicableMonths = formData.applicableMonths;
      } else {
        basePayload.applicableMonths = [];
      }

      const currentSchoolId = formData.schoolId;

      if (editingCategory) {
        const payload = {
          ...basePayload,
          name: formData.name.trim(),
        };
        await api.instance.patch(
          `/super-admin/fee-categories/${editingCategory.id}?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Fee category updated successfully!");
        setEditingCategory(null);
        resetForm();
      } else {
        // Handle multiple classes creation
        if (createMode === "multiple" && selectedClasses.length > 0) {
          const promises = selectedClasses.map((className) => {
            const payload = {
              ...basePayload,
              name: `${formData.name.trim()} - ${className}`,
            };
            return api.instance.post(
              `/super-admin/fee-categories?schoolId=${currentSchoolId}`,
              payload
            );
          });

          await Promise.all(promises);
          setSuccess(
            `Successfully created ${selectedClasses.length} fee heading(s) for selected classes!`
          );
          setSelectedClasses([]);
        } else {
          const payload = {
            ...basePayload,
            name: formData.name.trim(),
          };
          await api.instance.post(
            `/super-admin/fee-categories?schoolId=${formData.schoolId}`,
            payload
          );
          setSuccess("Fee category created successfully!");
        }
        // Retain school selection when creating new category
        resetForm(true, currentSchoolId);
      }

      loadFeeCategories();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save fee category";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const resetForm = (
    retainSchool: boolean = false,
    schoolId?: string | number
  ) => {
    setFormData({
      name: "",
      description: "",
      type: "school",
      status: "active",
      schoolId: retainSchool && schoolId ? schoolId : "",
      applicableMonths: [],
    });
    setCreateMode("single");
    setSelectedClasses([]);
  };

  const handleEdit = (category: FeeCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      type: category.type || "school",
      status: category.status,
      schoolId: category.schoolId,
      applicableMonths: category.applicableMonths || [],
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: number, schoolId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this fee category? This action cannot be undone."
      )
    )
      return;

    try {
      setError("");
      await api.instance.delete(
        `/super-admin/fee-categories/${id}?schoolId=${schoolId}`
      );
      setSuccess("Fee category deleted successfully!");
      loadFeeCategories();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete fee category";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    resetForm();
    setError("");
    setSuccess("");
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="card-modern rounded-xl p-4 bg-green-50 border-l-4 border-green-400">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="card-modern rounded-xl p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="card-modern rounded-xl p-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          Fee Heading Management
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Manage fee categories (headings) for schools
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Add/Edit Form */}
        <div className="card-modern rounded-xl p-6 lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingCategory ? "Edit Fee Category" : "Add Fee Category"}
          </h2>

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
                <CustomDropdown
                  options={schools.map((school) => ({
                    value: school.id.toString(),
                    label: school.name,
                  }))}
                  value={formData.schoolId?.toString() || ""}
                  onChange={(value) => {
                    const numValue =
                      typeof value === "string" ? parseInt(value, 10) : value;
                    setFormData({ ...formData, schoolId: numValue || "" });
                  }}
                  placeholder="Select a school..."
                  className="w-full"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category Name <span className="text-red-500">*</span>
                </label>
                {formData.schoolId && availableClasses.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCreateMode(
                        createMode === "single" ? "multiple" : "single"
                      )
                    }
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {createMode === "single"
                      ? "Create for Multiple Classes"
                      : "Single Mode"}
                  </button>
                )}
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={
                  createMode === "multiple"
                    ? "e.g., Tuition Fee (will append class names)"
                    : "e.g., Tuition Fee, Library Fee"
                }
                required
                disabled={!formData.schoolId}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth ${
                  !formData.schoolId
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "bg-white"
                }`}
              />
              {createMode === "multiple" && (
                <p className="mt-1 text-xs text-gray-500">
                  Class names will be appended automatically (e.g., "Tuition Fee
                  - Grade 1")
                </p>
              )}
              {createMode === "multiple" && (
                <div className="mt-3 space-y-2">
                  {loadingClasses ? (
                    <div className="flex items-center justify-center py-4">
                      <FiLoader className="w-4 h-4 animate-spin text-indigo-600" />
                      <span className="ml-2 text-sm text-gray-600">
                        Loading classes...
                      </span>
                    </div>
                  ) : availableClasses.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                      No classes found. Add students to this school first.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                      {availableClasses.map((className) => (
                        <label
                          key={className}
                          className="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedClasses.includes(className)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClasses([
                                  ...selectedClasses,
                                  className,
                                ]);
                              } else {
                                setSelectedClasses(
                                  selectedClasses.filter((c) => c !== className)
                                );
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {className}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedClasses.length > 0 && (
                    <div className="text-xs text-gray-600">
                      {selectedClasses.length} class(es) selected - Will create:{" "}
                      {selectedClasses
                        .map((c) => `"${formData.name || "Fee"} - ${c}"`)
                        .join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fee Type <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                options={[
                  { value: "school", label: "School Fee" },
                  { value: "transport", label: "Transport Fee" },
                ]}
                value={formData.type}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    type: value as "school" | "transport",
                  })
                }
                className="w-full"
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
              <CustomDropdown
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                value={formData.status}
                onChange={(value) =>
                  setFormData({ ...formData, status: String(value) })
                }
                className="w-full"
              />
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
                {[
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
                ].map((month) => {
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
                      .map((m) => {
                        const monthNames = [
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ];
                        return monthNames[m - 1];
                      })
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
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {editingCategory ? "Update" : "Create"}
              </button>
              {editingCategory && (
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
        </div>

        {/* Right Side - List */}
        <div className="card-modern rounded-xl p-6 lg:col-span-2">
          {/* Search and Filter */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or description..."
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by School
                </label>
                <CustomDropdown
                  options={[
                    { value: "", label: "All Schools" },
                    ...schools.map((school) => ({
                      value: school.id.toString(),
                      label: school.name,
                    })),
                  ]}
                  value={selectedSchoolId?.toString() || ""}
                  onChange={(value) => {
                    const numValue =
                      typeof value === "string" ? parseInt(value, 10) : value;
                    setSelectedSchoolId(numValue || "");
                    setPage(1);
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Type
                </label>
                <CustomDropdown
                  options={[
                    { value: "", label: "All Types" },
                    { value: "school", label: "School Fee" },
                    { value: "transport", label: "Transport Fee" },
                  ]}
                  value={selectedType}
                  onChange={(value) => {
                    setSelectedType(String(value));
                    setPage(1);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : feeCategories.length === 0 ? (
            <div className="text-center py-12">
              <FiDollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {search || selectedSchoolId || selectedType
                  ? "No fee categories found matching your criteria"
                  : "No fee categories found. Create one to get started."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Applicable Months
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {feeCategories.map((category) => (
                      <tr
                        key={category.id}
                        className="hover:bg-indigo-50/50 transition-all duration-150 group"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">
                            {category.name}
                          </div>
                          {category.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {category.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              category.type === "transport"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {category.type === "transport"
                              ? "Transport"
                              : "School"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {category.applicableMonths &&
                          category.applicableMonths.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {category.applicableMonths.map((month) => {
                                const monthNames = [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec",
                                ];
                                return (
                                  <span
                                    key={month}
                                    className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded"
                                  >
                                    {monthNames[month - 1]}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">
                              All months
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {category.school?.name ||
                            `School ID: ${category.schoolId}`}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              category.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {category.status.charAt(0).toUpperCase() +
                              category.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-smooth"
                              title="Edit"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(category.id, category.schoolId)
                              }
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-smooth"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {paginationMeta && paginationMeta.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, paginationMeta.total)} of{" "}
                    {paginationMeta.total} results
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                      Per page:
                    </label>
                    <div className="relative z-10">
                      <CustomDropdown
                        options={[
                          { value: "10", label: "10" },
                          { value: "20", label: "20" },
                          { value: "50", label: "50" },
                          { value: "100", label: "100" },
                        ]}
                        value={limit.toString()}
                        onChange={(value) => {
                          const numValue =
                            typeof value === "string"
                              ? parseInt(value, 10)
                              : value;
                          setLimit(numValue || 10);
                          setPage(1);
                        }}
                        className="w-20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!paginationMeta.hasPrevPage}
                      className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold ${
                        paginationMeta.hasPrevPage
                          ? "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 border border-gray-200"
                          : "bg-gray-100/50 text-gray-400 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(7, paginationMeta.totalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (paginationMeta.totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (page <= 4) {
                            pageNum = i + 1;
                          } else if (page >= paginationMeta.totalPages - 3) {
                            pageNum = paginationMeta.totalPages - 6 + i;
                          } else {
                            pageNum = page - 3 + i;
                          }

                          const isActive = pageNum === page;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`min-w-[40px] h-10 rounded-xl transition-all duration-200 text-sm font-semibold ${
                                isActive
                                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-110 ring-2 ring-indigo-300/50"
                                  : "bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white hover:scale-105 hover:shadow-md border border-gray-200"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setPage((p) =>
                          Math.min(paginationMeta.totalPages, p + 1)
                        )
                      }
                      disabled={!paginationMeta.hasNextPage}
                      className={`px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold ${
                        paginationMeta.hasNextPage
                          ? "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 border border-gray-200"
                          : "bg-gray-100/50 text-gray-400 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
