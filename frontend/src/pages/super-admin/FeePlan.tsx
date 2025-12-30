import { useState, useEffect } from "react";
import {
  FiEdit,
  FiTrash2,
  FiLoader,
  FiDollarSign,
  FiX,
  FiSearch,
} from "react-icons/fi";
import api from "../../services/api";
import CustomDropdown from "../../components/ui/CustomDropdown";
import Pagination from "../../components/Pagination";
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
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCategoryHeads, setLoadingCategoryHeads] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [createMode, setCreateMode] = useState<"single" | "multiple">("single");
  const [selectedFeeCategoryIds, setSelectedFeeCategoryIds] = useState<
    number[]
  >([]);
  const [selectedCategoryHeadIds, setSelectedCategoryHeadIds] = useState<
    number[]
  >([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(
    null
  );
  const [formData, setFormData] = useState({
    feeCategoryId: "" as string | number,
    categoryHeadId: "" as string | number | null,
    amount: "",
    class: "",
    status: "active" as "active" | "inactive",
    schoolId: "" as string | number,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | number>("");
  const [selectedFeeCategoryId, setSelectedFeeCategoryId] = useState<
    string | number
  >("");
  const [selectedCategoryHeadId, setSelectedCategoryHeadId] = useState<
    string | number | null
  >(null);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );

  useEffect(() => {
    loadFeeStructures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    limit,
    search,
    selectedSchoolId,
    selectedFeeCategoryId,
    selectedCategoryHeadId,
  ]);

  useEffect(() => {
    loadSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.schoolId) {
      loadFeeCategories();
      loadCategoryHeads();
      loadAvailableClasses();
    } else {
      setFeeCategories([]);
      setCategoryHeads([]);
      setAvailableClasses([]);
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
        params: {
          schoolId: formData.schoolId,
          limit: 1000,
          page: 1,
        },
      });

      console.log("Fee categories response:", response.data);

      if (response.data.data && Array.isArray(response.data.data)) {
        setFeeCategories(response.data.data);
      } else if (Array.isArray(response.data)) {
        setFeeCategories(response.data);
      } else {
        setFeeCategories([]);
      }
    } catch (err: any) {
      console.error("Error loading fee categories:", err);
      console.error("Error details:", err.response?.data);
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

  const loadAvailableClasses = async () => {
    if (!formData.schoolId) return;

    try {
      setLoadingClasses(true);
      // Fetch unique classes directly from the dedicated endpoint
      const response = await api.instance.get(
        `/super-admin/schools/${formData.schoolId}/classes`
      );

      // The endpoint returns an array of unique class names
      const classes = Array.isArray(response.data) ? response.data : [];
      setAvailableClasses(classes);
    } catch (err: any) {
      console.error("Error loading classes:", err);
      console.error("Error details:", err.response?.data);
      setAvailableClasses([]);
    } finally {
      setLoadingClasses(false);
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

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      // Validate based on mode
      if (createMode === "multiple") {
        if (selectedFeeCategoryIds.length === 0) {
          setError("Please select at least one fee heading");
          return;
        }
        if (selectedClasses.length === 0) {
          setError("Please select at least one class");
          return;
        }
      } else {
        if (!formData.feeCategoryId) {
          setError("Please select a fee heading");
          return;
        }
      }

      const currentSchoolId = formData.schoolId;

      if (editingStructure) {
        // Single edit mode
        const selectedCategory = feeCategories.find(
          (cat) => cat.id === parseInt(formData.feeCategoryId as string)
        );
        const selectedCategoryHead = categoryHeads.find(
          (ch) => ch.id === parseInt(formData.categoryHeadId as string)
        );

        const basePlanName = selectedCategory
          ? `${selectedCategory.name}${
              selectedCategoryHead ? ` - ${selectedCategoryHead.name}` : ""
            }`
          : "Fee Plan";

        const planName = `${basePlanName}${
          formData.class ? ` (${formData.class})` : ""
        }`;

        const payload: any = {
          name: planName,
          feeCategoryId: parseInt(formData.feeCategoryId as string),
          amount: parseFloat(formData.amount),
          status: formData.status,
        };

        if (formData.categoryHeadId) {
          payload.categoryHeadId = parseInt(formData.categoryHeadId as string);
        }

        if (formData.class.trim()) {
          payload.class = formData.class.trim();
        }

        await api.instance.patch(
          `/super-admin/fee-structures/${editingStructure.id}?schoolId=${currentSchoolId}`,
          payload
        );
        setSuccess("Fee plan updated successfully!");
        setEditingStructure(null);
        resetForm(true, currentSchoolId);
      } else {
        // Create mode
        if (createMode === "multiple") {
          // Generate all combinations
          const combinations: Array<{
            feeCategoryId: number;
            categoryHeadId: number | null;
            className: string;
          }> = [];

          // If no category heads selected, include null (General)
          const categoryHeadIdsToUse =
            selectedCategoryHeadIds.length > 0
              ? selectedCategoryHeadIds
              : [null];

          selectedFeeCategoryIds.forEach((feeCategoryId) => {
            categoryHeadIdsToUse.forEach((categoryHeadId) => {
              selectedClasses.forEach((className) => {
                combinations.push({
                  feeCategoryId,
                  categoryHeadId,
                  className,
                });
              });
            });
          });

          // Check for existing fee structures to avoid duplicates
          const existingStructuresResponse = await api.instance.get(
            "/super-admin/fee-structures",
            {
              params: {
                schoolId: currentSchoolId,
                limit: 10000, // Get all to check duplicates
                page: 1,
              },
            }
          );

          const existingStructures = Array.isArray(
            existingStructuresResponse.data.data
          )
            ? existingStructuresResponse.data.data
            : Array.isArray(existingStructuresResponse.data)
            ? existingStructuresResponse.data
            : [];

          // Filter out duplicates
          const newCombinations = combinations.filter((combo) => {
            return !existingStructures.some((existing: any) => {
              const matchesFeeCategory =
                existing.feeCategoryId === combo.feeCategoryId;
              const matchesCategoryHead =
                existing.categoryHeadId === combo.categoryHeadId ||
                (!existing.categoryHeadId && !combo.categoryHeadId);
              const matchesClass =
                existing.class === combo.className ||
                (!existing.class && !combo.className);

              return matchesFeeCategory && matchesCategoryHead && matchesClass;
            });
          });

          const duplicateCount = combinations.length - newCombinations.length;

          if (newCombinations.length === 0) {
            setError(
              `All ${combinations.length} fee plan(s) already exist. No new plans created.`
            );
            setTimeout(() => setError(""), 5000);
            return;
          }

          // Create only new combinations
          const promises = newCombinations.map((combo) => {
            const feeCategory = feeCategories.find(
              (cat) => cat.id === combo.feeCategoryId
            );
            const categoryHead = combo.categoryHeadId
              ? categoryHeads.find((ch) => ch.id === combo.categoryHeadId)
              : null;

            const planName = `${feeCategory?.name || "Fee Plan"}${
              categoryHead ? ` - ${categoryHead.name}` : ""
            }${combo.className ? ` (${combo.className})` : ""}`;

            const payload: any = {
              name: planName,
              feeCategoryId: combo.feeCategoryId,
              amount: parseFloat(formData.amount),
              status: formData.status,
            };

            if (combo.categoryHeadId) {
              payload.categoryHeadId = combo.categoryHeadId;
            }

            if (combo.className) {
              payload.class = combo.className;
            }

            return api.instance.post(
              `/super-admin/fee-structures?schoolId=${currentSchoolId}`,
              payload
            );
          });

          await Promise.all(promises);

          let successMessage = `Successfully created ${newCombinations.length} fee plan(s)!`;
          if (duplicateCount > 0) {
            successMessage += ` (${duplicateCount} already existed and were skipped)`;
          }
          setSuccess(successMessage);
          setSelectedFeeCategoryIds([]);
          setSelectedCategoryHeadIds([]);
          setSelectedClasses([]);
        } else {
          // Single create mode
          const selectedCategory = feeCategories.find(
            (cat) => cat.id === parseInt(formData.feeCategoryId as string)
          );
          const selectedCategoryHead = categoryHeads.find(
            (ch) => ch.id === parseInt(formData.categoryHeadId as string)
          );

          const basePlanName = selectedCategory
            ? `${selectedCategory.name}${
                selectedCategoryHead ? ` - ${selectedCategoryHead.name}` : ""
              }`
            : "Fee Plan";

          const planName = `${basePlanName}${
            formData.class ? ` (${formData.class})` : ""
          }`;

          const payload: any = {
            name: planName,
            feeCategoryId: parseInt(formData.feeCategoryId as string),
            amount: parseFloat(formData.amount),
            status: formData.status,
          };

          if (formData.categoryHeadId) {
            payload.categoryHeadId = parseInt(
              formData.categoryHeadId as string
            );
          }

          if (formData.class.trim()) {
            payload.class = formData.class.trim();
          }

          await api.instance.post(
            `/super-admin/fee-structures?schoolId=${currentSchoolId}`,
            payload
          );
          setSuccess("Fee plan created successfully!");
        }
        resetForm(true, currentSchoolId);
      }

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
      feeCategoryId: "",
      categoryHeadId: null,
      amount: "",
      class: "",
      status: "active",
      schoolId: retainSchool && schoolId ? schoolId : "",
    });
    setCreateMode("single");
    setSelectedFeeCategoryIds([]);
    setSelectedCategoryHeadIds([]);
    setSelectedClasses([]);
  };

  const handleEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormData({
      feeCategoryId: structure.feeCategoryId,
      categoryHeadId: structure.categoryHeadId || null,
      amount: structure.amount.toString(),
      class: structure.class || "",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-modern rounded-xl p-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          Fee Plan Management
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Create and manage fee plans by combining fee categories with category
          heads
        </p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Add/Edit Form */}
        <div className="card-modern rounded-xl p-4 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            {editingStructure ? "Edit Fee Plan" : "Add Fee Plan"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                School <span className="text-red-500">*</span>
              </label>
              {loadingSchools ? (
                <div className="flex items-center justify-center py-2">
                  <FiLoader className="w-4 h-4 animate-spin text-indigo-600" />
                  <span className="ml-2 text-xs text-gray-600">Loading...</span>
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
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-xs font-medium text-gray-700">
                  Fee Heading <span className="text-red-500">*</span>
                </label>
                {formData.schoolId && feeCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCreateMode(
                        createMode === "single" ? "multiple" : "single"
                      )
                    }
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {createMode === "single" ? "Bulk" : "Single"}
                  </button>
                )}
              </div>
              {!formData.schoolId ? (
                <div className="px-2 py-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                  Select school first
                </div>
              ) : loadingCategories ? (
                <div className="flex items-center justify-center py-1">
                  <FiLoader className="w-3 h-3 animate-spin text-indigo-600" />
                </div>
              ) : createMode === "single" ? (
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
                  placeholder="Select fee heading..."
                  className="w-full"
                  disabled={!formData.schoolId}
                />
              ) : (
                <div className="space-y-1">
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-1.5 bg-white">
                    {/* Select All */}
                    <label className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-200 mb-0.5 pb-0.5">
                      <input
                        type="checkbox"
                        checked={
                          feeCategories.length > 0 &&
                          selectedFeeCategoryIds.length === feeCategories.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFeeCategoryIds(
                              feeCategories.map((cat) => cat.id)
                            );
                          } else {
                            setSelectedFeeCategoryIds([]);
                          }
                        }}
                        className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-1.5 text-xs font-semibold text-indigo-700">
                        All ({feeCategories.length})
                      </span>
                    </label>
                    {feeCategories.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFeeCategoryIds.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFeeCategoryIds([
                                ...selectedFeeCategoryIds,
                                cat.id,
                              ]);
                            } else {
                              setSelectedFeeCategoryIds(
                                selectedFeeCategoryIds.filter(
                                  (id) => id !== cat.id
                                )
                              );
                            }
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-1.5 text-xs text-gray-700">
                          {cat.name} ({cat.type})
                        </span>
                      </label>
                    ))}
                  </div>
                  {createMode === "multiple" &&
                    selectedFeeCategoryIds.length > 0 && (
                      <div className="text-xs text-gray-600">
                        {selectedFeeCategoryIds.length} selected
                      </div>
                    )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Amount <span className="text-red-500">*</span>
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
                disabled={!formData.schoolId}
                className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth ${
                  !formData.schoolId
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "bg-white"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Category Head{" "}
                <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              {!formData.schoolId ? (
                <div className="px-2 py-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                  Select school first
                </div>
              ) : loadingCategoryHeads ? (
                <div className="flex items-center justify-center py-1">
                  <FiLoader className="w-3 h-3 animate-spin text-indigo-600" />
                </div>
              ) : createMode === "single" ? (
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
              ) : (
                <div className="space-y-1">
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-1.5 bg-white">
                    {/* Select All */}
                    {categoryHeads.length > 0 && (
                      <label className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-200 mb-0.5 pb-0.5">
                        <input
                          type="checkbox"
                          checked={
                            categoryHeads.length > 0 &&
                            selectedCategoryHeadIds.length ===
                              categoryHeads.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategoryHeadIds(
                                categoryHeads.map((ch) => ch.id)
                              );
                            } else {
                              setSelectedCategoryHeadIds([]);
                            }
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-1.5 text-xs font-semibold text-indigo-700">
                          All ({categoryHeads.length})
                        </span>
                      </label>
                    )}
                    {categoryHeads.map((ch) => (
                      <label
                        key={ch.id}
                        className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategoryHeadIds.includes(ch.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategoryHeadIds([
                                ...selectedCategoryHeadIds,
                                ch.id,
                              ]);
                            } else {
                              setSelectedCategoryHeadIds(
                                selectedCategoryHeadIds.filter(
                                  (id) => id !== ch.id
                                )
                              );
                            }
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-1.5 text-xs text-gray-700">
                          {ch.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedCategoryHeadIds.length > 0 && (
                    <div className="text-xs text-gray-600">
                      {selectedCategoryHeadIds.length} selected
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Class <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              {createMode === "single" ? (
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) =>
                    setFormData({ ...formData, class: e.target.value })
                  }
                  placeholder="e.g., Grade 1"
                  disabled={!formData.schoolId}
                  className={`w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth ${
                    !formData.schoolId
                      ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "bg-white"
                  }`}
                />
              ) : (
                <div className="space-y-1">
                  {loadingClasses ? (
                    <div className="flex items-center justify-center py-2">
                      <FiLoader className="w-3 h-3 animate-spin text-indigo-600" />
                      <span className="ml-1.5 text-xs text-gray-600">
                        Loading...
                      </span>
                    </div>
                  ) : availableClasses.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                      No classes found
                    </div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-1.5 bg-white">
                      {/* Select All */}
                      <label className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-200 mb-0.5 pb-0.5">
                        <input
                          type="checkbox"
                          checked={
                            availableClasses.length > 0 &&
                            selectedClasses.length === availableClasses.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClasses([...availableClasses]);
                            } else {
                              setSelectedClasses([]);
                            }
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-1.5 text-xs font-semibold text-indigo-700">
                          All ({availableClasses.length})
                        </span>
                      </label>
                      {availableClasses.map((className) => (
                        <label
                          key={className}
                          className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer"
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
                            className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-1.5 text-xs text-gray-700">
                            {className}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedClasses.length > 0 && (
                    <div className="text-xs text-gray-600">
                      {selectedClasses.length} selected
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
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
                disabled={!formData.schoolId}
              />
            </div>

            {/* Preview for multiple mode */}
            {createMode === "multiple" &&
              !editingStructure &&
              selectedFeeCategoryIds.length > 0 &&
              selectedClasses.length > 0 && (
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs font-semibold text-indigo-900">
                    Will create{" "}
                    {selectedFeeCategoryIds.length *
                      (selectedCategoryHeadIds.length > 0
                        ? selectedCategoryHeadIds.length
                        : 1) *
                      selectedClasses.length}{" "}
                    plan(s) (duplicates skipped)
                  </p>
                </div>
              )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={!formData.schoolId}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold shadow transition-all ${
                  !formData.schoolId
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-md"
                }`}
              >
                {editingStructure
                  ? "Update"
                  : createMode === "multiple"
                  ? `Create ${
                      selectedFeeCategoryIds.length *
                      (selectedCategoryHeadIds.length > 0
                        ? selectedCategoryHeadIds.length
                        : 1) *
                      selectedClasses.length
                    }`
                  : "Create"}
              </button>
              {editingStructure && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-smooth"
                >
                  Cancel
                </button>
              )}
            </div>
            {!formData.schoolId && (
              <p className="text-xs text-gray-500 text-center mt-1">
                ⚠️ Select school first
              </p>
            )}
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
                        Fee Heading
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Category Head
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Amount
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
                          {structure.school?.name ||
                            `School ID: ${structure.schoolId}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {structure.category?.name ||
                            `Category ID: ${structure.feeCategoryId}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {structure.categoryHead?.name || "General"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">
                            ₹
                            {parseFloat(
                              structure.amount.toString()
                            ).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
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
              <Pagination
                paginationMeta={paginationMeta}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
                itemName="fee plans"
                className="mt-6"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
