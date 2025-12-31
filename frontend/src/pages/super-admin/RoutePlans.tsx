import { useState, useEffect } from "react";
import { FiLoader, FiEdit, FiTrash2, FiSearch, FiX } from "react-icons/fi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
import { routePlanService } from "../../services/routePlanService";
import {
  validateSingleModeRoutePlanForm,
  validateEditRoutePlanForm,
  generateRoutePlanNameFromIds,
} from "../../utils/routePlan";
import { RoutePlan } from "../../types";
import RouteHeading from "./RouteHeading";

export default function RoutePlans() {
  const [activeTab, setActiveTab] = useState<"plan-routes" | "define-routes">(
    "plan-routes"
  );

  // Route Plan state (Plan Routes tab)
  const [routePlanPage, setRoutePlanPage] = useState(1);
  const [routePlanLimit, setRoutePlanLimit] = useState(10);
  const [routePlanSearch, setRoutePlanSearch] = useState("");
  const [routePlanSelectedSchoolId, setRoutePlanSelectedSchoolId] = useState<
    string | number
  >("");
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
  const [editingRoutePlan, setEditingRoutePlan] = useState<RoutePlan | null>(
    null
  );
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
    schools: routePlanSchools,
    loadingSchools: loadingRoutePlanSchools,
  } = useRoutePlanData({
    page: routePlanPage,
    limit: routePlanLimit,
    search: routePlanSearch,
    selectedSchoolId: routePlanSelectedSchoolId,
    formSchoolId: routePlanFormData.schoolId,
  });

  // Route Plan state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
  };

  const handleRoutePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      // Validate form
      const validation = editingRoutePlan
        ? validateEditRoutePlanForm(routePlanFormData)
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
        // Create mode - Single create
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
                      onValueChange={(v) =>
                        setRoutePlanMode(v as "add" | "import")
                      }
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
                            {loadingRoutePlanSchools ? (
                              <div className="flex items-center justify-center py-2">
                                <FiLoader className="w-4 h-4 animate-spin text-indigo-600" />
                              </div>
                            ) : (
                              <Select
                                value={
                                  routePlanFormData.schoolId &&
                                  routePlanFormData.schoolId !== ""
                                    ? routePlanFormData.schoolId.toString()
                                    : undefined
                                }
                                onValueChange={(value) => {
                                  const schoolIdNum = parseInt(value, 10);
                                  setRoutePlanFormData({
                                    ...routePlanFormData,
                                    schoolId: schoolIdNum,
                                    routeId: "",
                                    feeCategoryId: "",
                                    categoryHeadId: null,
                                    classId: "",
                                  });
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a school..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {routePlanSchools.map((school) => (
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

                          {/* Route */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              Route <span className="text-red-500">*</span>
                            </label>
                            {!routePlanFormData.schoolId ? (
                              <div className="px-2 py-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                                Select school first
                              </div>
                            ) : loadingRoutePlanRoutes ? (
                              <div className="flex items-center justify-center py-1">
                                <FiLoader className="w-3 h-3 animate-spin text-indigo-600" />
                              </div>
                            ) : (
                              <Select
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
                            ) : (
                              <Select
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
                            ) : (
                              <Select
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
                            ) : (
                              <Select
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
                        <div className="text-center py-8 text-gray-500 text-sm">
                          Import functionality coming soon...
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Right Side - List */}
                <Card className="lg:col-span-2">
                  <CardContent className="pt-6">
                    {/* Search and Filter */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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

                      <div>
                        <Select
                          value={
                            routePlanSelectedSchoolId
                              ? routePlanSelectedSchoolId.toString()
                              : "__EMPTY__"
                          }
                          onValueChange={(value) => {
                            setRoutePlanSelectedSchoolId(
                              value === "__EMPTY__" ? "" : parseInt(value)
                            );
                            setRoutePlanPage(1);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__EMPTY__">
                              All Schools
                            </SelectItem>
                            {routePlanSchools.map((school) => (
                              <SelectItem
                                key={school.id}
                                value={school.id.toString()}
                              >
                                {school.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
