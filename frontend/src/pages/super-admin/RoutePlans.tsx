import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiLoader,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiX,
  FiDownload,
  FiUpload,
} from "react-icons/fi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Pagination from "../../components/Pagination";
import { useRoutePlanData } from "../../hooks/pages/super-admin/useRoutePlanData";
import { useRoutePlanImport } from "../../hooks/pages/super-admin/useRoutePlanImport";
import { routePlanService } from "../../services/routePlanService";
import api from "../../services/api";
import {
  validateSingleModeRoutePlanForm,
  validateEditRoutePlanForm,
  validateMultipleModeRoutePlanForm,
  generateRoutePlanNameFromIds,
  generateRoutePlanCombinations,
  filterRoutePlanDuplicates,
} from "../../utils/routePlan";
import { RoutePlan } from "../../types";
import { useSchool } from "../../contexts/SchoolContext";
import RouteHeading from "./RouteHeading";

export default function RoutePlans() {
  const [activeTab, setActiveTab] = useState<"plan-routes" | "define-routes">(
    "plan-routes"
  );

  // Route Plan state (Plan Routes tab)
  const { selectedSchoolId: routePlanSelectedSchoolId, selectedSchool } =
    useSchool();
  const [routePlanPage, setRoutePlanPage] = useState(1);
  const [routePlanLimit, setRoutePlanLimit] = useState(10);
  const [routePlanSearch, setRoutePlanSearch] = useState("");
  const [routePlanMode, setRoutePlanMode] = useState<"add" | "import">("add");
  const [routePlanFormData, setRoutePlanFormData] = useState({
    routeId: "" as string | number,
    feeCategoryId: "" as string | number,
    categoryHeadId: "" as string | number | null,
    amount: "",
    classId: "" as string | number,
    status: "active" as "active" | "inactive",
    schoolId: "" as string | number,
  });
  const [createMode, setCreateMode] = useState<"single" | "multiple">("single");
  const [selectedRouteIds, setSelectedRouteIds] = useState<number[]>([]);
  const [selectedFeeCategoryIds, setSelectedFeeCategoryIds] = useState<
    number[]
  >([]);
  const [selectedCategoryHeadIds, setSelectedCategoryHeadIds] = useState<
    number[]
  >([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [editingRoutePlan, setEditingRoutePlan] = useState<RoutePlan | null>(
    null
  );
  const [formResetKey, setFormResetKey] = useState(0);
  const [routePlanDeleteDialogOpen, setRoutePlanDeleteDialogOpen] =
    useState(false);
  const [routePlanDeleteItem, setRoutePlanDeleteItem] = useState<{
    id: number;
    schoolId: number;
  } | null>(null);

  // Use custom hook for Route Plan data fetching
  const {
    routePlans,
    paginationMeta: routePlanPaginationMeta,
    loadingRoutePlans,
    refetchRoutePlans,
    routes: routePlanRoutes,
    loadingRoutes: loadingRoutePlanRoutes,
    transportFeeCategories,
    loadingTransportCategories,
    categoryHeads: routePlanCategoryHeads,
    loadingCategoryHeads: loadingRoutePlanCategoryHeads,
    classOptions: routePlanClassOptions,
    loadingClasses: loadingRoutePlanClasses,
  } = useRoutePlanData({
    page: routePlanPage,
    limit: routePlanLimit,
    search: routePlanSearch,
    selectedSchoolId: routePlanSelectedSchoolId || "",
    formSchoolId: routePlanFormData.schoolId,
  });

  // Route Plan state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Use custom hook for import functionality
  const {
    importSchoolId: hookImportSchoolId,
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
  } = useRoutePlanImport({
    refetchRoutePlans,
    setError,
    setSuccess,
  });

  // Sync importSchoolId with context school
  const importSchoolId = routePlanSelectedSchoolId || hookImportSchoolId;

  // Route Plan handlers
  const resetRoutePlanForm = (
    retainSchool: boolean = false,
    schoolId?: string | number
  ) => {
    setRoutePlanFormData({
      routeId: "",
      feeCategoryId: "",
      categoryHeadId: null,
      amount: "",
      classId: "",
      status: "active",
      schoolId: retainSchool && schoolId ? schoolId : "",
    });
    setCreateMode("single");
    setSelectedRouteIds([]);
    setSelectedFeeCategoryIds([]);
    setSelectedCategoryHeadIds([]);
    setSelectedClasses([]);
    setFormResetKey((prev) => prev + 1);
  };

  const handleRoutePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      // Validate form
      const validation = editingRoutePlan
        ? validateEditRoutePlanForm(routePlanFormData)
        : createMode === "multiple"
        ? validateMultipleModeRoutePlanForm(
            routePlanFormData,
            selectedRouteIds,
            selectedFeeCategoryIds,
            selectedClasses
          )
        : validateSingleModeRoutePlanForm(routePlanFormData);

      if (!validation.isValid) {
        setError(validation.error || "Validation failed");
        return;
      }

      const schoolIdNum =
        typeof routePlanFormData.schoolId === "string"
          ? parseInt(routePlanFormData.schoolId, 10)
          : routePlanFormData.schoolId;

      const currentSchoolId = schoolIdNum;

      if (editingRoutePlan) {
        // Edit mode
        const planName = generateRoutePlanNameFromIds(
          parseInt(routePlanFormData.routeId as string),
          parseInt(routePlanFormData.feeCategoryId as string),
          routePlanFormData.categoryHeadId
            ? parseInt(routePlanFormData.categoryHeadId as string)
            : null,
          routePlanFormData.classId
            ? parseInt(routePlanFormData.classId as string)
            : null,
          routePlanRoutes,
          transportFeeCategories,
          routePlanCategoryHeads,
          routePlanClassOptions
        );

        await routePlanService.updateRoutePlan(
          editingRoutePlan.id,
          currentSchoolId,
          {
            routeId: parseInt(routePlanFormData.routeId as string),
            feeCategoryId: parseInt(routePlanFormData.feeCategoryId as string),
            categoryHeadId: routePlanFormData.categoryHeadId
              ? parseInt(routePlanFormData.categoryHeadId as string)
              : undefined,
            classId: routePlanFormData.classId
              ? parseInt(routePlanFormData.classId as string)
              : undefined,
            name: planName,
            amount: parseFloat(routePlanFormData.amount),
            status: routePlanFormData.status,
          }
        );
        setEditingRoutePlan(null);
        resetRoutePlanForm(true, currentSchoolId);
        setSuccess("Route plan updated successfully!");
      } else {
        // Create mode
        if (createMode === "multiple") {
          // Generate all combinations using utility function
          const combinations = generateRoutePlanCombinations(
            selectedRouteIds,
            selectedFeeCategoryIds,
            selectedCategoryHeadIds,
            selectedClasses
          );

          // Check for existing route plans to avoid duplicates
          const existingRoutePlansResponse = await api.instance.get(
            "/super-admin/route-plans",
            {
              params: {
                schoolId: currentSchoolId,
                limit: 10000, // Get all to check duplicates
                page: 1,
              },
            }
          );
          const existingRoutePlans =
            existingRoutePlansResponse.data.data ||
            existingRoutePlansResponse.data ||
            [];

          // Filter out duplicates
          const filteredCombinations = filterRoutePlanDuplicates(
            combinations,
            existingRoutePlans
          );

          if (filteredCombinations.length === 0) {
            setError("All selected combinations already exist");
            return;
          }

          // Create all route plans
          let successCount = 0;
          let errorCount = 0;

          for (const combo of filteredCombinations) {
            try {
              const planName = generateRoutePlanNameFromIds(
                combo.routeId,
                combo.feeCategoryId,
                combo.categoryHeadId,
                combo.classId,
                routePlanRoutes,
                transportFeeCategories,
                routePlanCategoryHeads,
                routePlanClassOptions
              );

              await routePlanService.createRoutePlan(currentSchoolId, {
                routeId: combo.routeId,
                feeCategoryId: combo.feeCategoryId,
                categoryHeadId: combo.categoryHeadId || undefined,
                classId: combo.classId || undefined,
                name: planName,
                amount: parseFloat(routePlanFormData.amount),
                status: routePlanFormData.status,
              });
              successCount++;
            } catch (err: any) {
              errorCount++;
            }
          }

          resetRoutePlanForm(true, currentSchoolId);
          if (errorCount > 0) {
            setSuccess(
              `Successfully created ${successCount} route plan(s). ${errorCount} failed.`
            );
          } else {
            setSuccess(`Successfully created ${successCount} route plan(s)`);
          }
        } else {
          // Single create mode
          const planName = generateRoutePlanNameFromIds(
            parseInt(routePlanFormData.routeId as string),
            parseInt(routePlanFormData.feeCategoryId as string),
            routePlanFormData.categoryHeadId
              ? parseInt(routePlanFormData.categoryHeadId as string)
              : null,
            routePlanFormData.classId
              ? parseInt(routePlanFormData.classId as string)
              : null,
            routePlanRoutes,
            transportFeeCategories,
            routePlanCategoryHeads,
            routePlanClassOptions
          );

          await routePlanService.createRoutePlan(currentSchoolId, {
            routeId: parseInt(routePlanFormData.routeId as string),
            feeCategoryId: parseInt(routePlanFormData.feeCategoryId as string),
            categoryHeadId: routePlanFormData.categoryHeadId
              ? parseInt(routePlanFormData.categoryHeadId as string)
              : undefined,
            classId: routePlanFormData.classId
              ? parseInt(routePlanFormData.classId as string)
              : undefined,
            name: planName,
            amount: parseFloat(routePlanFormData.amount),
            status: routePlanFormData.status,
          });
          resetRoutePlanForm(true, currentSchoolId);
          setSuccess("Route plan created successfully!");
        }
      }

      refetchRoutePlans();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save route plan";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleRoutePlanEdit = (routePlan: RoutePlan) => {
    setEditingRoutePlan(routePlan);
    setRoutePlanFormData({
      routeId: routePlan.routeId,
      feeCategoryId: routePlan.feeCategoryId,
      categoryHeadId: routePlan.categoryHeadId || null,
      amount: routePlan.amount.toString(),
      classId: routePlan.classId || "",
      status: routePlan.status,
      schoolId: routePlan.schoolId,
    });
    setError("");
    setSuccess("");
  };

  const handleRoutePlanDeleteClick = (id: number, schoolId: number) => {
    setRoutePlanDeleteItem({ id, schoolId });
    setRoutePlanDeleteDialogOpen(true);
  };

  const handleRoutePlanDelete = async () => {
    if (!routePlanDeleteItem) return;

    try {
      setError("");
      await routePlanService.deleteRoutePlan(
        routePlanDeleteItem.id,
        routePlanDeleteItem.schoolId
      );
      setSuccess("Route plan deleted successfully!");
      setRoutePlanDeleteDialogOpen(false);
      setRoutePlanDeleteItem(null);
      refetchRoutePlans();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete route plan";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleRoutePlanCancel = () => {
    setEditingRoutePlan(null);
    resetRoutePlanForm();
    setError("");
    setSuccess("");
  };

  // Auto-set schoolId from context when creating new route plan
  useEffect(() => {
    if (!editingRoutePlan && routePlanSelectedSchoolId) {
      setRoutePlanFormData((prev) => {
        // Only update if schoolId is empty or different
        if (
          !prev.schoolId ||
          prev.schoolId === "" ||
          prev.schoolId !== routePlanSelectedSchoolId
        ) {
          return { ...prev, schoolId: routePlanSelectedSchoolId };
        }
        return prev;
      });
    }
  }, [routePlanSelectedSchoolId, editingRoutePlan]);

  // Reset form when school changes
  useEffect(() => {
    if (routePlanFormData.schoolId) {
      setRoutePlanFormData((prev) => ({
        ...prev,
        routeId: "",
        feeCategoryId: "",
        categoryHeadId: null,
        classId: "",
      }));
    }
  }, [routePlanFormData.schoolId]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/super-admin/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/super-admin/settings/fee-settings/route-plan">
                Settings
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Route Plans</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Route Plans Management
          </CardTitle>
          <CardDescription>
            Define routes and create route plans by combining routes with
            category heads and transport fee headings
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-700">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as "plan-routes" | "define-routes");
              setError("");
              setSuccess("");
            }}
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 p-1 rounded-lg border border-gray-200">
              <TabsTrigger
                value="plan-routes"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all font-semibold"
              >
                Plan Routes
              </TabsTrigger>
              <TabsTrigger
                value="define-routes"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all font-semibold"
              >
                Define Routes
              </TabsTrigger>
            </TabsList>

            {/* Plan Routes Tab */}
            <TabsContent value="plan-routes" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Side - Add/Edit Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingRoutePlan ? "Edit Route Plan" : "Add Route Plan"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs
                      value={routePlanMode}
                      onValueChange={(v) => {
                        if (v === "add") {
                          setRoutePlanMode("add");
                          setError("");
                          setSuccess("");
                          setImportFile(null);
                          setImportPreview([]);
                          // Auto-set schoolId when switching to add mode
                          if (routePlanSelectedSchoolId) {
                            setRoutePlanFormData((prev) => ({
                              ...prev,
                              schoolId: routePlanSelectedSchoolId,
                            }));
                          }
                        } else if (v === "import") {
                          setRoutePlanMode("import");
                          setError("");
                          setSuccess("");
                          resetRoutePlanForm();
                        }
                      }}
                    >
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="add">Add Route Plan</TabsTrigger>
                        <TabsTrigger value="import">Import</TabsTrigger>
                      </TabsList>
                      <TabsContent value="add">
                        <form
                          onSubmit={handleRoutePlanSubmit}
                          className="space-y-3"
                        >
                          {/* School */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              School <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="text"
                              value={
                                selectedSchool?.name || "No school selected"
                              }
                              disabled
                              className="bg-gray-50 cursor-not-allowed text-xs"
                            />
                            {!selectedSchool && (
                              <p className="text-xs text-red-500 mt-1">
                                Please select a school from the top navigation
                                bar
                              </p>
                            )}
                          </div>

                          {/* Route */}
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-xs font-medium text-gray-700">
                                Route <span className="text-red-500">*</span>
                              </label>
                              {routePlanFormData.schoolId &&
                                routePlanRoutes.length > 0 &&
                                !editingRoutePlan && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setCreateMode(
                                        createMode === "single"
                                          ? "multiple"
                                          : "single"
                                      )
                                    }
                                    className="h-auto p-0 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                  >
                                    {createMode === "single"
                                      ? "Bulk"
                                      : "Single"}
                                  </Button>
                                )}
                            </div>
                            {!routePlanFormData.schoolId ? (
                              <div className="px-2 py-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                                Select school first
                              </div>
                            ) : loadingRoutePlanRoutes ? (
                              <div className="flex items-center justify-center py-1">
                                <FiLoader className="w-3 h-3 animate-spin text-indigo-600" />
                              </div>
                            ) : createMode === "single" ? (
                              <Select
                                key={`route-${formResetKey}`}
                                value={
                                  routePlanFormData.routeId &&
                                  routePlanFormData.routeId !== ""
                                    ? routePlanFormData.routeId.toString()
                                    : undefined
                                }
                                onValueChange={(value) => {
                                  setRoutePlanFormData({
                                    ...routePlanFormData,
                                    routeId: parseInt(value),
                                  });
                                }}
                                disabled={!routePlanFormData.schoolId}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select route..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {routePlanRoutes.map((route) => (
                                    <SelectItem
                                      key={route.id}
                                      value={route.id.toString()}
                                    >
                                      {route.name}
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
                                        routePlanRoutes.length > 0 &&
                                        selectedRouteIds.length ===
                                          routePlanRoutes.length
                                      }
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedRouteIds(
                                            routePlanRoutes.map(
                                              (route) => route.id
                                            )
                                          );
                                        } else {
                                          setSelectedRouteIds([]);
                                        }
                                      }}
                                      className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="ml-1.5 text-xs font-semibold text-indigo-700">
                                      All ({routePlanRoutes.length})
                                    </span>
                                  </label>
                                  {routePlanRoutes.map((route) => (
                                    <label
                                      key={route.id}
                                      className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedRouteIds.includes(
                                          route.id
                                        )}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedRouteIds([
                                              ...selectedRouteIds,
                                              route.id,
                                            ]);
                                          } else {
                                            setSelectedRouteIds(
                                              selectedRouteIds.filter(
                                                (id) => id !== route.id
                                              )
                                            );
                                          }
                                        }}
                                        className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="ml-1.5 text-xs text-gray-700">
                                        {route.name}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                                {createMode === "multiple" &&
                                  selectedRouteIds.length > 0 && (
                                    <div className="text-xs text-gray-600">
                                      {selectedRouteIds.length} selected
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>

                          {/* Transport Fee Category */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              Transport Fee Heading{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            {!routePlanFormData.schoolId ? (
                              <div className="px-2 py-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                                Select school first
                              </div>
                            ) : loadingTransportCategories ? (
                              <div className="flex items-center justify-center py-1">
                                <FiLoader className="w-3 h-3 animate-spin text-indigo-600" />
                              </div>
                            ) : createMode === "single" ? (
                              <Select
                                key={`fee-category-${formResetKey}`}
                                value={
                                  routePlanFormData.feeCategoryId &&
                                  routePlanFormData.feeCategoryId !== ""
                                    ? routePlanFormData.feeCategoryId.toString()
                                    : undefined
                                }
                                onValueChange={(value) => {
                                  setRoutePlanFormData({
                                    ...routePlanFormData,
                                    feeCategoryId: parseInt(value),
                                  });
                                }}
                                disabled={!routePlanFormData.schoolId}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select transport fee heading..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {transportFeeCategories.map((cat) => (
                                    <SelectItem
                                      key={cat.id}
                                      value={cat.id.toString()}
                                    >
                                      {cat.name}
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
                                        transportFeeCategories.length > 0 &&
                                        selectedFeeCategoryIds.length ===
                                          transportFeeCategories.length
                                      }
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedFeeCategoryIds(
                                            transportFeeCategories.map(
                                              (cat) => cat.id
                                            )
                                          );
                                        } else {
                                          setSelectedFeeCategoryIds([]);
                                        }
                                      }}
                                      className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="ml-1.5 text-xs font-semibold text-indigo-700">
                                      All ({transportFeeCategories.length})
                                    </span>
                                  </label>
                                  {transportFeeCategories.map((cat) => (
                                    <label
                                      key={cat.id}
                                      className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedFeeCategoryIds.includes(
                                          cat.id
                                        )}
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
                                        {cat.name}
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

                          {/* Category Head */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              Category Head{" "}
                              <span className="text-gray-400 text-xs">
                                (Optional)
                              </span>
                            </label>
                            {!routePlanFormData.schoolId ? (
                              <div className="px-2 py-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                                Select school first
                              </div>
                            ) : loadingRoutePlanCategoryHeads ? (
                              <div className="flex items-center justify-center py-1">
                                <FiLoader className="w-3 h-3 animate-spin text-indigo-600" />
                              </div>
                            ) : createMode === "single" ? (
                              <Select
                                key={`category-head-${formResetKey}`}
                                value={
                                  routePlanFormData.categoryHeadId
                                    ? routePlanFormData.categoryHeadId.toString()
                                    : "__EMPTY__"
                                }
                                onValueChange={(value) =>
                                  setRoutePlanFormData({
                                    ...routePlanFormData,
                                    categoryHeadId:
                                      value === "__EMPTY__"
                                        ? null
                                        : parseInt(value),
                                  })
                                }
                                disabled={!routePlanFormData.schoolId}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select category head..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__EMPTY__">
                                    None (General)
                                  </SelectItem>
                                  {routePlanCategoryHeads.map((ch) => (
                                    <SelectItem
                                      key={ch.id}
                                      value={ch.id.toString()}
                                    >
                                      {ch.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="space-y-1">
                                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-1.5 bg-white">
                                  {/* Select All */}
                                  {routePlanCategoryHeads.length > 0 && (
                                    <label className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer border-b border-gray-200 mb-0.5 pb-0.5">
                                      <input
                                        type="checkbox"
                                        checked={
                                          routePlanCategoryHeads.length > 0 &&
                                          selectedCategoryHeadIds.length ===
                                            routePlanCategoryHeads.length
                                        }
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedCategoryHeadIds(
                                              routePlanCategoryHeads.map(
                                                (ch) => ch.id
                                              )
                                            );
                                          } else {
                                            setSelectedCategoryHeadIds([]);
                                          }
                                        }}
                                        className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                      />
                                      <span className="ml-1.5 text-xs font-semibold text-indigo-700">
                                        All ({routePlanCategoryHeads.length})
                                      </span>
                                    </label>
                                  )}
                                  {routePlanCategoryHeads.map((ch) => (
                                    <label
                                      key={ch.id}
                                      className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedCategoryHeadIds.includes(
                                          ch.id
                                        )}
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
                                {createMode === "multiple" &&
                                  selectedCategoryHeadIds.length > 0 && (
                                    <div className="text-xs text-gray-600">
                                      {selectedCategoryHeadIds.length} selected
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>

                          {/* Class */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              Class <span className="text-red-500">*</span>
                            </label>
                            {!routePlanFormData.schoolId ? (
                              <div className="px-2 py-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                                Select school first
                              </div>
                            ) : loadingRoutePlanClasses ? (
                              <div className="flex items-center justify-center py-1">
                                <FiLoader className="w-3 h-3 animate-spin text-indigo-600" />
                              </div>
                            ) : createMode === "single" ? (
                              <Select
                                key={`class-${formResetKey}`}
                                value={
                                  routePlanFormData.classId &&
                                  routePlanFormData.classId !== ""
                                    ? routePlanFormData.classId.toString()
                                    : undefined
                                }
                                onValueChange={(value) => {
                                  setRoutePlanFormData({
                                    ...routePlanFormData,
                                    classId: parseInt(value),
                                  });
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a class..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {routePlanClassOptions.map((cls) => (
                                    <SelectItem
                                      key={cls.id}
                                      value={cls.id.toString()}
                                    >
                                      {cls.name}
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
                                        routePlanClassOptions.length > 0 &&
                                        selectedClasses.length ===
                                          routePlanClassOptions.length
                                      }
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedClasses(
                                            routePlanClassOptions.map(
                                              (cls) => cls.id
                                            )
                                          );
                                        } else {
                                          setSelectedClasses([]);
                                        }
                                      }}
                                      className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="ml-1.5 text-xs font-semibold text-indigo-700">
                                      All ({routePlanClassOptions.length})
                                    </span>
                                  </label>
                                  {routePlanClassOptions.map((cls) => (
                                    <label
                                      key={cls.id}
                                      className="flex items-center px-1.5 py-1 hover:bg-gray-50 rounded cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedClasses.includes(
                                          cls.id
                                        )}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedClasses([
                                              ...selectedClasses,
                                              cls.id,
                                            ]);
                                          } else {
                                            setSelectedClasses(
                                              selectedClasses.filter(
                                                (id) => id !== cls.id
                                              )
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
                                {createMode === "multiple" &&
                                  selectedClasses.length > 0 && (
                                    <div className="text-xs text-gray-600">
                                      {selectedClasses.length} selected
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>

                          {/* Amount */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              Amount <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={routePlanFormData.amount}
                              onChange={(e) =>
                                setRoutePlanFormData({
                                  ...routePlanFormData,
                                  amount: e.target.value,
                                })
                              }
                              placeholder="0.00"
                              required
                              disabled={!routePlanFormData.schoolId}
                            />
                          </div>

                          {/* Status */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              Status <span className="text-red-500">*</span>
                            </label>
                            <Select
                              value={routePlanFormData.status}
                              onValueChange={(value) =>
                                setRoutePlanFormData({
                                  ...routePlanFormData,
                                  status: value as "active" | "inactive",
                                })
                              }
                              disabled={!routePlanFormData.schoolId}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                  Inactive
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button
                              type="submit"
                              disabled={!routePlanFormData.schoolId}
                              className={`flex-1 ${
                                !routePlanFormData.schoolId
                                  ? ""
                                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                              }`}
                            >
                              {editingRoutePlan ? "Update" : "Create"}
                            </Button>
                            {editingRoutePlan && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleRoutePlanCancel}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </form>
                      </TabsContent>
                      <TabsContent value="import">
                        <div className="space-y-4">
                          {/* School Selection for Import */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              School <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="text"
                              value={
                                selectedSchool?.name || "No school selected"
                              }
                              disabled
                              className="bg-gray-50 cursor-not-allowed text-xs"
                            />
                            {!selectedSchool && (
                              <p className="text-xs text-red-500 mt-1">
                                Please select a school from the top navigation
                                bar
                              </p>
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
                                Download a sample CSV template. Use names (not
                                IDs) for routes, transport fee categories,
                                category heads, and classes.
                              </p>
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs font-semibold text-blue-900 mb-1">
                                  CSV Format:
                                </p>
                                <ul className="text-xs text-blue-800 space-y-0.5 list-disc list-inside">
                                  <li>
                                    <strong>routeName</strong> - Name of route
                                    (e.g., "Route A")
                                  </li>
                                  <li>
                                    <strong>feeCategoryName</strong> - Name of
                                    transport fee category (e.g., "Transport
                                    Fee")
                                  </li>
                                  <li>
                                    <strong>categoryHeadName</strong> - Name of
                                    category head (optional, leave empty for
                                    "General")
                                  </li>
                                  <li>
                                    <strong>className</strong> - Name of class
                                    (optional, e.g., "1st", "2nd")
                                  </li>
                                  <li>
                                    <strong>amount</strong> - Fee amount (e.g.,
                                    "2000.00")
                                  </li>
                                  <li>
                                    <strong>status</strong> - "active" or
                                    "inactive"
                                  </li>
                                  <li>
                                    <strong>name</strong> - Plan name (optional,
                                    auto-generated if empty)
                                  </li>
                                </ul>
                                <p className="text-xs text-blue-700 mt-1 font-medium">
                                  Note: All names must belong to the selected
                                  school. The system will validate and show
                                  errors if names don't match.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* File Upload */}
                          {importSchoolId && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                                Upload CSV File{" "}
                                <span className="text-red-500">*</span>
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
                                        setImportPreview([]);
                                        setError("");
                                        setSuccess("");
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

                          {/* Preview */}
                          {importPreview.length > 0 && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                                Preview ({importPreview.length} rows)
                              </label>
                              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                      <th className="px-2 py-1 text-left">
                                        Route
                                      </th>
                                      <th className="px-2 py-1 text-left">
                                        Fee Category
                                      </th>
                                      <th className="px-2 py-1 text-left">
                                        Category Head
                                      </th>
                                      <th className="px-2 py-1 text-left">
                                        Class
                                      </th>
                                      <th className="px-2 py-1 text-left">
                                        Amount
                                      </th>
                                      <th className="px-2 py-1 text-left">
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {importPreview.map((row, idx) => (
                                      <tr key={idx} className="border-t">
                                        <td className="px-2 py-1">
                                          {row.routeName ||
                                            `ID: ${row.routeId}`}
                                        </td>
                                        <td className="px-2 py-1">
                                          {row.feeCategoryName ||
                                            `ID: ${row.feeCategoryId}`}
                                        </td>
                                        <td className="px-2 py-1">
                                          {row.categoryHeadName || "General"}
                                        </td>
                                        <td className="px-2 py-1">
                                          {row.className || row.classId
                                            ? `ID: ${row.classId}`
                                            : "-"}
                                        </td>
                                        <td className="px-2 py-1">
                                          {row.amount}
                                        </td>
                                        <td className="px-2 py-1">
                                          {row.status}
                                        </td>
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
                                <span className="flex items-center justify-center gap-2">
                                  <FiLoader className="w-4 h-4 animate-spin" />
                                  Importing...
                                </span>
                              ) : (
                                "Import Route Plans"
                              )}
                            </Button>
                          )}

                          {/* Import Results */}
                          {importResult && (
                            <div className="space-y-2">
                              {importResult.success > 0 && (
                                <Card className="border-l-4 border-l-green-400 bg-green-50">
                                  <CardContent className="py-2 px-3">
                                    <p className="text-xs font-semibold text-green-800">
                                      Successfully imported:{" "}
                                      {importResult.success} route plan(s)
                                    </p>
                                  </CardContent>
                                </Card>
                              )}
                              {importResult.skipped > 0 && (
                                <Card className="border-l-4 border-l-yellow-400 bg-yellow-50">
                                  <CardContent className="py-2 px-3">
                                    <p className="text-xs font-semibold text-yellow-800 mb-1">
                                      Skipped (duplicates):{" "}
                                      {importResult.skipped} route plan(s)
                                    </p>
                                    <div className="max-h-24 overflow-y-auto text-xs text-yellow-700">
                                      {importResult.duplicates.map(
                                        (dup, idx) => (
                                          <div key={idx} className="mb-0.5">
                                            Row {dup.row} - "{dup.name}":{" "}
                                            {dup.reason}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                              {importResult.failed > 0 && (
                                <Card className="border-l-4 border-l-red-400 bg-red-50">
                                  <CardContent className="py-2 px-3">
                                    <p className="text-xs font-semibold text-red-800 mb-1">
                                      Failed: {importResult.failed} route
                                      plan(s)
                                    </p>
                                    <div className="max-h-24 overflow-y-auto text-xs text-red-700">
                                      {importResult.errors.map((err, idx) => (
                                        <div key={idx} className="mb-0.5">
                                          Row {err.row}: {err.error}
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Right Side - List */}
                <Card className="lg:col-span-2">
                  <CardContent className="pt-6">
                    {/* Search */}
                    <div className="mb-4">
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          value={routePlanSearch}
                          onChange={(e) => {
                            setRoutePlanSearch(e.target.value);
                            setRoutePlanPage(1);
                          }}
                          placeholder="Search by name or description..."
                          className="w-full pl-10 pr-10"
                        />
                        {routePlanSearch && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRoutePlanSearch("");
                              setRoutePlanPage(1);
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto p-1 text-gray-400 hover:text-gray-600"
                          >
                            <FiX className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Table */}
                    {loadingRoutePlans ? (
                      <div className="flex items-center justify-center py-12">
                        <FiLoader className="w-6 h-6 animate-spin text-indigo-600" />
                        <span className="ml-2 text-gray-600">
                          Loading route plans...
                        </span>
                      </div>
                    ) : routePlans.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        No route plans found. Create your first route plan!
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  Name
                                </th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  School
                                </th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  Route
                                </th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  Fee Heading
                                </th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  Category Head
                                </th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  Class
                                </th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  Amount
                                </th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                  Status
                                </th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {routePlans.map((plan) => (
                                <tr
                                  key={plan.id}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                  <td className="py-2 px-3 font-semibold">
                                    {plan.name}
                                  </td>
                                  <td className="py-2 px-3">
                                    {plan.school?.name ||
                                      `School ID: ${plan.schoolId}`}
                                  </td>
                                  <td className="py-2 px-3">
                                    {plan.route?.name ||
                                      `Route ID: ${plan.routeId}`}
                                  </td>
                                  <td className="py-2 px-3">
                                    {plan.feeCategory?.name ||
                                      `Fee ID: ${plan.feeCategoryId}`}
                                  </td>
                                  <td className="py-2 px-3">
                                    {plan.categoryHead?.name || "General"}
                                  </td>
                                  <td className="py-2 px-3">
                                    {plan.class?.name ||
                                      `Class ID: ${plan.classId}`}
                                  </td>
                                  <td className="py-2 px-3">
                                    ₹
                                    {parseFloat(plan.amount.toString()).toFixed(
                                      2
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        plan.status === "active"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {plan.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRoutePlanEdit(plan)
                                        }
                                        className="h-8 w-8 p-0"
                                      >
                                        <FiEdit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRoutePlanDeleteClick(
                                            plan.id,
                                            plan.schoolId
                                          )
                                        }
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                      >
                                        <FiTrash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {routePlanPaginationMeta && (
                          <div className="mt-4">
                            <Pagination
                              paginationMeta={routePlanPaginationMeta}
                              page={routePlanPage}
                              limit={routePlanLimit}
                              onPageChange={setRoutePlanPage}
                              onLimitChange={setRoutePlanLimit}
                              itemName="route plans"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Define Routes Tab */}
            <TabsContent value="define-routes" className="mt-6">
              <RouteHeading />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Route Plan Delete Dialog */}
      <Dialog
        open={routePlanDeleteDialogOpen}
        onOpenChange={setRoutePlanDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Route Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this route plan? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRoutePlanDeleteDialogOpen(false);
                setRoutePlanDeleteItem(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRoutePlanDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
