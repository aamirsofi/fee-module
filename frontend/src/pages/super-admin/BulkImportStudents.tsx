import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiLoader } from "react-icons/fi";
import { useInfiniteQuery } from "@tanstack/react-query";
import { schoolService, School } from "../../services/schoolService";
import StudentBulkImport from "../../components/StudentBulkImport";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BulkImportStudents() {
  const navigate = useNavigate();
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Use TanStack Query for schools (using infinite query for pagination)
  const {
    data: schoolsData,
    isLoading: loadingSchools,
  } = useInfiniteQuery({
    queryKey: ["schools", "active"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await schoolService.getSchools({
        page: pageParam,
        limit: 100,
        status: "active",
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta && lastPage.meta.hasNextPage) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const schools: School[] = useMemo(() => {
    if (!schoolsData?.pages) return [];
    return schoolsData.pages.flatMap((page) => page.data || []);
  }, [schoolsData]);

  const handleImportSuccess = () => {
    setSuccess("Students imported successfully!");
    setError("");
    // Clear success message after 5 seconds
    setTimeout(() => setSuccess(""), 5000);
  };

  const handleImportError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess("");
    // Clear error message after 5 seconds
    setTimeout(() => setError(""), 5000);
  };

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/super-admin/schools")}
              className="h-auto p-1.5"
            >
              <FiArrowLeft className="w-4 h-4 text-gray-600" />
            </Button>
            <div>
              <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Bulk Import Students
              </CardTitle>
              <CardDescription>
                Import multiple students from a CSV file
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm text-green-700">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* School Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Select School
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSchools ? (
            <div className="flex items-center justify-center py-8">
              <FiLoader className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Loading schools...</span>
            </div>
          ) : (
            <div className="max-w-md space-y-4">
              <Select
                value={selectedSchoolId?.toString() || "__EMPTY__"}
                onValueChange={(value) => {
                  setSelectedSchoolId(
                    value === "__EMPTY__" ? null : parseInt(value)
                  );
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a school..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="__EMPTY__">Select a school...</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSchool && (
                <Card className="bg-indigo-50 border-indigo-200">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600 mb-1">Selected School:</p>
                    <p className="text-lg font-semibold text-indigo-900">
                      {selectedSchool.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Subdomain: {selectedSchool.subdomain}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Component */}
      {selectedSchoolId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StudentBulkImport
              schoolId={selectedSchoolId}
              onImportSuccess={handleImportSuccess}
              onImportError={handleImportError}
            />
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            CSV Format Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Required Columns:
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>
                <code className="bg-gray-100 px-2 py-0.5 rounded">studentId</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">student_id</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">Student ID</code>
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-0.5 rounded">firstName</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">first_name</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">First Name</code>
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-0.5 rounded">lastName</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">last_name</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">Last Name</code>
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-0.5 rounded">email</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">Email</code>
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-0.5 rounded">class</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">Class</code>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Optional Columns:
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>
                <code className="bg-gray-100 px-2 py-0.5 rounded">phone</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">Phone</code>
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-0.5 rounded">address</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">Address</code>
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-0.5 rounded">section</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">Section</code>
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-0.5 rounded">status</code>{" "}
                or <code className="bg-gray-100 px-2 py-0.5 rounded">Status</code>{" "}
                (defaults to "active")
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Example CSV:
            </h3>
            <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-700">
{`studentId,firstName,lastName,email,phone,address,class,section,status
STU001,John,Doe,john.doe@example.com,+1234567890,123 Main St,10th Grade,A,active
STU002,Jane,Smith,jane.smith@example.com,+1234567891,456 Oak Ave,10th Grade,B,active`}
              </pre>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}

