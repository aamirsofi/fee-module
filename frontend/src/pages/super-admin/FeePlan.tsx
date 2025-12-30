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
  FiCalendar,
} from "react-icons/fi";
import api from "../../services/api";
import CustomDropdown from "../../components/ui/CustomDropdown";
import { FeeStructure, FeeCategory, CategoryHead, School } from "../../types";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function FeePlan() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [categoryHeads, setCategoryHeads] = useState<CategoryHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCategoryHeads, setLoadingCategoryHeads] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    feeCategoryId: "" as string | number,
    categoryHeadId: "" as string | number | null,
    amount: "",
    class: "",
    academicYear: "",
    dueDate: "",
    status: "active" as "active" | "inactive",
    schoolId: "" as string | number,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | number>("");
  const [selectedFeeCategoryId, setSelectedFeeCategoryId] = useState<string | number>("");
  const [selectedCategoryHeadId, setSelectedCategoryHeadId] = useState<string | number | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);

  useEffect(() => {
    loadFeeStructures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, selectedSchoolId, selectedFeeCategoryId, selectedCategoryHeadId, selectedAcademicYear]);

  useEffect(() => {
    loadSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.schoolId) {
      loadFeeCategories();
      loadCategoryHeads();
    } else {
      setFeeCategories([]);
      setCategoryHeads([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.schoolId]);

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
    if (!formData.schoolId) return;

    try {
      setLoadingCategories(true);
      const response = await api.instance.get("/super-admin/fee-categories", {
        params: { schoolId: formData.schoolId, limit: 1000, status: "active" },
      });

      if (response.data.data && Array.isArray(response.data.data)) {
        setFeeCategories(response.data.data);
      } else if (Array.isArray(response.data)) {
        setFeeCategories(response.data);
      }
    } catch (err: any) {
      console.error("Error loading fee categories:", err);
      setFeeCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCategoryHeads = async () => {
    if (!formData.schoolId) return;

    try {
      setLoadingCategoryHeads(true);
      const response = await api.instance.get("/super-admin/category-heads", {
        params: { schoolId: formData.schoolId, limit: 1000, status: "active" },
      });

      if (response.data.data && Array.isArray(response.data.data)) {
        setCategoryHeads(response.data.data);
      } else if (Array.isArray(response.data)) {
        setCategoryHeads(response.data);
      }
    } catch (err: any) {
      console.error("Error loading category heads:", err);
      setCategoryHeads([]);
    } finally {
      setLoadingCategoryHeads(false);
    }
  };

  const loadFeeStructures = async () => {
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
      if (selectedFeeCategoryId) {
        params.feeCategoryId = selectedFeeCategoryId;
      }
      if (selectedCategoryHeadId !== null && selectedCategoryHeadId !== "") {
        params.categoryHeadId = selectedCategoryHeadId;
      }
      if (selectedAcademicYear) {
        params.academicYear = selectedAcademicYear;
      }

      const response = await api.instance.get("/super-admin/fee-structures", {
        params,
      });

      if (response.data.data && response.data.meta) {
        setFeeStructures(response.data.data);
        setPaginationMeta(response.data.meta);
      } else if (Array.isArray(response.data)) {
        setFeeStructures(response.data);
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
      setError(err.response?.data?.message || "Failed to load fee structures");
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

      if (!formData.feeCategoryId) {
        setError("Please select a fee category");
        return;
      }

      if (!formData.name.trim()) {
        setError("Please enter a name");
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      if (!formData.academicYear.trim()) {
        setError("Please enter an academic year");
        return;
      }

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        feeCategoryId: parseInt(formData.feeCategoryId as string),
        amount: parseFloat(formData.amount),
        academicYear: formData.academicYear.trim(),
        status: formData.status,
      };

      if (formData.categoryHeadId) {
        payload.categoryHeadId = parseInt(formData.categoryHeadId as string);
      }

      if (formData.class.trim()) {
        payload.class = formData.class.trim();
      }

      if (formData.dueDate) {
        payload.dueDate = formData.dueDate;
      }

      const currentSchoolId = formData.schoolId;

      if (editingStructure) {
        await api.instance.patch(
          `/super-admin/fee-structures/${editingStructure.id}?schoolId=${currentSchoolId}`,
          payload
        );
        setSuccess("Fee plan updated successfully!");
      } else {
        await api.instance.post(
          `/super-admin/fee-structures?schoolId=${currentSchoolId}`,
          payload
        );
        setSuccess("Fee plan created successfully!");
      }

      setEditingStructure(null);
      resetForm(true, currentSchoolId);
      loadFeeStructures();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save fee plan";
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
      feeCategoryId: "",
      categoryHeadId: null,
      amount: "",
      class: "",
      academicYear: "",
      dueDate: "",
      status: "active",
      schoolId: retainSchool && schoolId ? schoolId : "",
    });
  };

  const handleEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormData({
      name: structure.name,
      description: structure.description || "",
      feeCategoryId: structure.feeCategoryId,
      categoryHeadId: structure.categoryHeadId || null,
      amount: structure.amount.toString(),
      class: structure.class || "",
      academicYear: structure.academicYear,
      dueDate: structure.dueDate ? structure.dueDate.split('T')[0] : "",
      status: structure.status,
      schoolId: structure.schoolId,
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: number, schoolId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this fee plan? This action cannot be undone."
      )
    )
      return;

    try {
      setError("");
      await api.instance.delete(
        `/super-admin/fee-structures/${id}?schoolId=${schoolId}`
      );
      setSuccess("Fee plan deleted successfully!");
      loadFeeStructures();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete fee plan";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancel = () => {
    setEditingStructure(null);
    resetForm();
    setError("");
    setSuccess("");
  };

  // Generate academic years (current year to +5 years)
  const currentYear = new Date().getFullYear();
  const academicYears = [];
  for (let i = 0; i < 6; i++) {
    const year = currentYear + i;
    academicYears.push(`${year}-${year + 1}`);
  }

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
          Fee Plan Management
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Create and manage fee plans by combining fee categories with category heads
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Add/Edit Form */}
        <div className="card-modern rounded-xl p-6 lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingStructure ? "Edit Fee Plan" : "Add Fee Plan"}
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
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      schoolId: parseInt(value as string),
                      feeCategoryId: "",
                      categoryHeadId: null,
                    })
                  }
                  placeholder="Select a school..."
                  className="w-full"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fee Category <span className="text-red-500">*</span>
              </label>
              {loadingCategories ? (
                <div className="flex items-center justify-center py-2">
                  <FiLoader className="w-4 h-4 animate-spin text-indigo-600" />
                </div>
              ) : (
                <CustomDropdown
                  options={feeCategories.map((cat) => ({
                    value: cat.id.toString(),
                    label: `${cat.name} (${cat.type})`,
                  }))}
                  value={formData.feeCategoryId?.toString() || ""}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      feeCategoryId: parseInt(value as string),
                    })
                  }
                  placeholder="Select fee category..."
                  className="w-full"
                  disabled={!formData.schoolId}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Head (Optional)
              </label>
              {loadingCategoryHeads ? (
                <div className="flex items-center justify-center py-2">
                  <FiLoader className="w-4 h-4 animate-spin text-indigo-600" />
                </div>
              ) : (
                <CustomDropdown
                  options={[
                    { value: "", label: "None (General)" },
                    ...categoryHeads.map((ch) => ({
                      value: ch.id.toString(),
                      label: ch.name,
                    })),
                  ]}
                  value={formData.categoryHeadId?.toString() || ""}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      categoryHeadId: value ? parseInt(value as string) : null,
                    })
                  }
                  placeholder="Select category head..."
                  className="w-full"
                  disabled={!formData.schoolId}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Tuition Fee for General Students"
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
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class (Optional)
              </label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) =>
                  setFormData({ ...formData, class: e.target.value })
                }
                placeholder="e.g., Grade 1, Grade 2"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                options={academicYears.map((year) => ({
                  value: year,
                  label: year,
                }))}
                value={formData.academicYear}
                onChange={(value) =>
                  setFormData({ ...formData, academicYear: value as string })
                }
                placeholder="Select academic year..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (Optional)
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth bg-white"
                />
              </div>
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
                  setFormData({
                    ...formData,
                    status: value as "active" | "inactive",
                  })
                }
                className="w-full"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {editingStructure ? "Update" : "Create"}
              </button>
              {editingStructure && (
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                    setSelectedSchoolId(value ? parseInt(value as string) : "");
                    setPage(1);
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Academic Year
                </label>
                <CustomDropdown
                  options={[
                    { value: "", label: "All Years" },
                    ...academicYears.map((year) => ({
                      value: year,
                      label: year,
                    })),
                  ]}
                  value={selectedAcademicYear}
                  onChange={(value) => {
                    setSelectedAcademicYear(value as string);
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
          ) : feeStructures.length === 0 ? (
            <div className="text-center py-12">
              <FiDollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {search || selectedSchoolId
                  ? "No fee plans found matching your criteria"
                  : "No fee plans found. Create one to get started."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Plan Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Category Head
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Academic Year
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
                    {feeStructures.map((structure) => (
                      <tr
                        key={structure.id}
                        className="hover:bg-indigo-50/50 transition-all duration-150 group"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">
                            {structure.name}
                          </div>
                          {structure.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {structure.description}
                            </div>
                          )}
                          {structure.class && (
                            <div className="text-xs text-indigo-600 mt-0.5">
                              Class: {structure.class}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {structure.school?.name || `School ID: ${structure.schoolId}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {structure.category?.name || `Category ID: ${structure.feeCategoryId}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {structure.categoryHead?.name || "General"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">
                            ₹{parseFloat(structure.amount.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {structure.academicYear}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              structure.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {structure.status.charAt(0).toUpperCase() +
                              structure.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(structure)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-smooth"
                              title="Edit"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(structure.id, structure.schoolId)
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
                          setLimit(parseInt(value as string));
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
                          } else if (
                            page >= paginationMeta.totalPages - 3
                          ) {
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

