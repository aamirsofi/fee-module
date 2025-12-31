import { FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeeCategory, CategoryHead } from "../../../types";
import { School } from "../../../services/schoolService";

interface FormData {
  feeCategoryId: string | number;
  categoryHeadId: string | number | null;
  amount: string;
  classId: string | number;
  status: "active" | "inactive";
  schoolId: string | number;
}

interface FeePlanFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  createMode: "single" | "multiple";
  setCreateMode: React.Dispatch<React.SetStateAction<"single" | "multiple">>;
  selectedFeeCategoryIds: number[];
  setSelectedFeeCategoryIds: React.Dispatch<React.SetStateAction<number[]>>;
  selectedCategoryHeadIds: number[];
  setSelectedCategoryHeadIds: React.Dispatch<React.SetStateAction<number[]>>;
  selectedClasses: number[];
  setSelectedClasses: React.Dispatch<React.SetStateAction<number[]>>;
  editingStructure: { id: number } | null;
  formResetKey: number;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleCancel: () => void;
  schools: School[];
  loadingSchools: boolean;
  feeCategories: FeeCategory[];
  loadingCategories: boolean;
  categoryHeads: CategoryHead[];
  loadingCategoryHeads: boolean;
  classOptions: Array<{ id: number; name: string }>;
  availableClasses: string[];
  loadingClasses: boolean;
}

export function FeePlanForm({
  formData,
  setFormData,
  createMode,
  setCreateMode,
  selectedFeeCategoryIds,
  setSelectedFeeCategoryIds,
  selectedCategoryHeadIds,
  setSelectedCategoryHeadIds,
  selectedClasses,
  setSelectedClasses,
  editingStructure,
  formResetKey,
  handleSubmit,
  handleCancel,
  schools,
  loadingSchools,
  feeCategories,
  loadingCategories,
  categoryHeads,
  loadingCategoryHeads,
  classOptions,
  availableClasses,
  loadingClasses,
}: FeePlanFormProps) {
  return (
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
          <Select
            value={
              formData.schoolId && formData.schoolId !== ""
                ? formData.schoolId.toString()
                : undefined
            }
            onValueChange={(value) => {
              const schoolIdNum = parseInt(value, 10);
              setFormData({
                ...formData,
                schoolId: schoolIdNum,
                feeCategoryId: "",
                categoryHeadId: null,
              });
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
        <div className="flex items-center justify-between mb-0.5">
          <label className="block text-xs font-medium text-gray-700">
            Fee Heading <span className="text-red-500">*</span>
          </label>
          {formData.schoolId && feeCategories.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setCreateMode(createMode === "single" ? "multiple" : "single")
              }
              className="h-auto p-0 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {createMode === "single" ? "Bulk" : "Single"}
            </Button>
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
          <Select
            key={`fee-category-${formResetKey}`}
            value={
              formData.feeCategoryId && formData.feeCategoryId !== ""
                ? formData.feeCategoryId.toString()
                : undefined
            }
            onValueChange={(value) => {
              const feeCategoryIdNum = parseInt(value, 10);
              setFormData({
                ...formData,
                feeCategoryId: feeCategoryIdNum,
              });
            }}
            disabled={!formData.schoolId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select fee heading..." />
            </SelectTrigger>
            <SelectContent>
              {feeCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name} ({cat.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                          selectedFeeCategoryIds.filter((id) => id !== cat.id)
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
            {createMode === "multiple" && selectedFeeCategoryIds.length > 0 && (
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
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
          disabled={!formData.schoolId}
          className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth ${
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
          <Select
            key={`category-head-${formResetKey}`}
            value={
              formData.categoryHeadId
                ? formData.categoryHeadId.toString()
                : "__EMPTY__"
            }
            onValueChange={(value) =>
              setFormData({
                ...formData,
                categoryHeadId: value === "__EMPTY__" ? null : parseInt(value),
              })
            }
            disabled={!formData.schoolId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category head..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__EMPTY__">None (General)</SelectItem>
              {categoryHeads.map((ch) => (
                <SelectItem key={ch.id} value={ch.id.toString()}>
                  {ch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                      selectedCategoryHeadIds.length === categoryHeads.length
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
                          selectedCategoryHeadIds.filter((id) => id !== ch.id)
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
          Class <span className="text-red-500">*</span>
        </label>
        {createMode === "single" ? (
          !formData.schoolId ? (
            <div className="px-2 py-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
              Select school first
            </div>
          ) : loadingClasses ? (
            <div className="flex items-center justify-center py-2">
              <FiLoader className="w-3 h-3 animate-spin text-indigo-600" />
              <span className="ml-1.5 text-xs text-gray-600">Loading...</span>
            </div>
          ) : (
            <Select
              key={`class-${formResetKey}`}
              value={
                formData.classId && formData.classId !== ""
                  ? formData.classId.toString()
                  : undefined
              }
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  classId: parseInt(value),
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a class..." />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        ) : (
          <div className="space-y-1">
            {loadingClasses ? (
              <div className="flex items-center justify-center py-2">
                <FiLoader className="w-3 h-3 animate-spin text-indigo-600" />
                <span className="ml-1.5 text-xs text-gray-600">Loading...</span>
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
                      classOptions.length > 0 &&
                      selectedClasses.length === classOptions.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClasses(classOptions.map((cls) => cls.id));
                      } else {
                        setSelectedClasses([]);
                      }
                    }}
                    className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-1.5 text-xs font-semibold text-indigo-700">
                    All ({classOptions.length})
                  </span>
                </label>
                {classOptions.map((cls) => (
                  <label
                    key={cls.id}
                    className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(cls.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClasses([...selectedClasses, cls.id]);
                        } else {
                          setSelectedClasses(
                            selectedClasses.filter((c) => c !== cls.id)
                          );
                        }
                      }}
                      className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-1.5 text-xs text-gray-700">
                      {cls.name}
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
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              status: value as "active" | "inactive",
            })
          }
          disabled={!formData.schoolId}
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
        <Button
          type="submit"
          disabled={!formData.schoolId}
          className={`flex-1 ${
            !formData.schoolId
              ? ""
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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
        </Button>
        {editingStructure && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
      {!formData.schoolId && (
        <p className="text-xs text-gray-500 text-center mt-1">
          ⚠️ Select school first
        </p>
      )}
    </form>
  );
}
