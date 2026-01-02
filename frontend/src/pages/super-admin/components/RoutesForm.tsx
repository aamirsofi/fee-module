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
import { useSchool } from "../../../contexts/SchoolContext";
import { Route } from "../../../hooks/pages/super-admin/useRoutesData";
import { useEffect } from "react";

interface RoutesFormProps {
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
  editingRoute: Route | null;
  handleSubmit: (e: React.FormEvent) => void;
  handleCancel: () => void;
}

export default function RoutesForm({
  formData,
  setFormData,
  editingRoute,
  handleSubmit,
  handleCancel,
}: RoutesFormProps) {
  const { selectedSchool, selectedSchoolId } = useSchool();

  // Auto-set schoolId from context when creating new route
  useEffect(() => {
    if (!editingRoute && selectedSchoolId && formData.schoolId === "") {
      setFormData({ ...formData, schoolId: selectedSchoolId });
    }
  }, [selectedSchoolId, editingRoute]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-800">
          {editingRoute ? "Edit Route" : "Add Route"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* School Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              School <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={selectedSchool?.name || "No school selected"}
              disabled
              className="bg-gray-50 cursor-not-allowed text-xs"
            />
            {!selectedSchool && (
              <p className="text-xs text-red-500 mt-1">
                Please select a school from the top navigation bar
              </p>
            )}
          </div>

          {/* Route Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Route Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Route A, Route B"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Optional description..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-smooth resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Status <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
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

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {editingRoute ? "Update Route" : "Add Route"}
            </Button>
            {editingRoute && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

