import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import {
  useRoutesData,
  Route,
} from "../../hooks/pages/super-admin/useRoutesData";
import { useSchool } from "../../contexts/SchoolContext";
import RoutesForm from "./components/RoutesForm";
import RoutesFilters from "./components/RoutesFilters";
import RoutesTable from "./components/RoutesTable";
import RoutesDialogs from "./components/RoutesDialogs";
import {
  Card,
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

export default function RouteHeading() {
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as string,
    schoolId: "" as string | number,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const { selectedSchoolId } = useSchool();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: number;
    schoolId: number;
  } | null>(null);

  // Use custom hook for data fetching
  const {
    routes,
    paginationMeta,
    loadingRoutes,
    refetchRoutes,
  } = useRoutesData({
    page,
    limit,
    search,
    selectedSchoolId: selectedSchoolId || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      if (!formData.schoolId) {
        setError("Please select a school");
        return;
      }

      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
      };

      if (editingRoute) {
        await api.instance.patch(
          `/super-admin/routes/${editingRoute.id}?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Route updated successfully!");
      } else {
        await api.instance.post(
          `/super-admin/routes?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Route created successfully!");
      }

      const currentSchoolId = formData.schoolId;

      if (editingRoute) {
        setEditingRoute(null);
        resetForm();
      } else {
        resetForm(true, currentSchoolId);
      }

      refetchRoutes();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save route";
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
      status: "active",
      schoolId: retainSchool && schoolId ? schoolId : (selectedSchoolId || ""),
    });
  };

  // Auto-set schoolId from context when creating new route
  useEffect(() => {
    if (!editingRoute && selectedSchoolId && formData.schoolId === "") {
      setFormData({ ...formData, schoolId: selectedSchoolId });
    }
  }, [selectedSchoolId, editingRoute]);

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      description: route.description || "",
      status: route.status,
      schoolId: route.schoolId,
    });
    setError("");
    setSuccess("");
  };

  const handleDeleteClick = (id: number, schoolId: number) => {
    setDeleteItem({ id, schoolId });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setError("");
      await api.instance.delete(
        `/super-admin/routes/${deleteItem.id}?schoolId=${deleteItem.schoolId}`
      );
      setSuccess("Route deleted successfully!");
      setDeleteDialogOpen(false);
      setDeleteItem(null);
      refetchRoutes();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete route";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancel = () => {
    setEditingRoute(null);
    resetForm();
    setError("");
    setSuccess("");
  };

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
              <Link to="/super-admin/settings/fee-settings/route-plan">Route Plans</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Define Routes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side - Add/Edit Form */}
        <RoutesForm
          formData={formData}
          setFormData={setFormData}
          editingRoute={editingRoute}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
        />

        {/* Right Side - List */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            {/* Search and Filter */}
            <RoutesFilters
              search={search}
              setSearch={setSearch}
              setPage={setPage}
            />

            {/* Table */}
            <RoutesTable
              routes={routes}
              loading={loadingRoutes}
              paginationMeta={paginationMeta}
              page={page}
              limit={limit}
              setPage={setPage}
              setLimit={setLimit}
              search={search}
              selectedSchoolId={selectedSchoolId}
              handleEdit={handleEdit}
              handleDeleteClick={handleDeleteClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <RoutesDialogs
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        handleDelete={handleDelete}
      />
    </div>
  );
}
