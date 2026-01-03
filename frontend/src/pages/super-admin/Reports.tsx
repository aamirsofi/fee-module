import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FiFileText, FiDownload, FiCalendar, FiDollarSign, FiMapPin, FiUser } from "react-icons/fi";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";

interface FinancialReport {
  id: number;
  reportType: string;
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  generatedAt: string;
  generatedBy: string;
}

interface SchoolReport {
  id: number;
  schoolName: string;
  totalStudents: number;
  totalRevenue: number;
  totalPayments: number;
  pendingPayments: number;
  reportPeriod: string;
  generatedAt: string;
}

interface UserReport {
  id: number;
  reportType: string;
  userRole: string;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  reportPeriod: string;
  generatedAt: string;
}

export default function Reports() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("financial");

  // Set active tab based on URL
  useEffect(() => {
    if (location.pathname.includes("/reports/financial")) {
      setActiveTab("financial");
    } else if (location.pathname.includes("/reports/schools")) {
      setActiveTab("schools");
    } else if (location.pathname.includes("/reports/users")) {
      setActiveTab("users");
    }
  }, [location.pathname]);

  // Financial Reports Columns
  const financialColumns: ColumnDef<FinancialReport>[] = [
    {
      accessorKey: "reportType",
      header: "Report Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FiFileText className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{row.getValue("reportType")}</span>
        </div>
      ),
    },
    {
      accessorKey: "period",
      header: "Period",
    },
    {
      accessorKey: "totalRevenue",
      header: "Total Revenue",
      cell: ({ row }) => (
        <span className="text-green-600 font-medium">
          ₹{row.getValue("totalRevenue")?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "totalExpenses",
      header: "Total Expenses",
      cell: ({ row }) => (
        <span className="text-red-600 font-medium">
          ₹{row.getValue("totalExpenses")?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "netIncome",
      header: "Net Income",
      cell: ({ row }) => {
        const netIncome = row.getValue("netIncome") as number;
        return (
          <span className={`font-medium ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
            ₹{netIncome.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "generatedAt",
      header: "Generated At",
      cell: ({ row }) => {
        const date = new Date(row.getValue("generatedAt"));
        return date.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDownload(row.original)}
          title="Download Report"
        >
          <FiDownload className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // School Reports Columns
  const schoolColumns: ColumnDef<SchoolReport>[] = [
    {
      accessorKey: "schoolName",
      header: "School Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FiMapPin className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{row.getValue("schoolName")}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalStudents",
      header: "Total Students",
    },
    {
      accessorKey: "totalRevenue",
      header: "Total Revenue",
      cell: ({ row }) => (
        <span className="text-green-600 font-medium">
          ₹{row.getValue("totalRevenue")?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "totalPayments",
      header: "Total Payments",
      cell: ({ row }) => (
        <span className="text-blue-600 font-medium">
          ₹{row.getValue("totalPayments")?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "pendingPayments",
      header: "Pending Payments",
      cell: ({ row }) => (
        <span className="text-orange-600 font-medium">
          ₹{row.getValue("pendingPayments")?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "reportPeriod",
      header: "Period",
    },
    {
      accessorKey: "generatedAt",
      header: "Generated At",
      cell: ({ row }) => {
        const date = new Date(row.getValue("generatedAt"));
        return date.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDownload(row.original)}
          title="Download Report"
        >
          <FiDownload className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // User Reports Columns
  const userColumns: ColumnDef<UserReport>[] = [
    {
      accessorKey: "reportType",
      header: "Report Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FiFileText className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{row.getValue("reportType")}</span>
        </div>
      ),
    },
    {
      accessorKey: "userRole",
      header: "User Role",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FiUser className="h-4 w-4 text-gray-500" />
          <span>{row.getValue("userRole")}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalUsers",
      header: "Total Users",
    },
    {
      accessorKey: "activeUsers",
      header: "Active Users",
      cell: ({ row }) => (
        <span className="text-green-600 font-medium">{row.getValue("activeUsers")}</span>
      ),
    },
    {
      accessorKey: "inactiveUsers",
      header: "Inactive Users",
      cell: ({ row }) => (
        <span className="text-red-600 font-medium">{row.getValue("inactiveUsers")}</span>
      ),
    },
    {
      accessorKey: "reportPeriod",
      header: "Period",
    },
    {
      accessorKey: "generatedAt",
      header: "Generated At",
      cell: ({ row }) => {
        const date = new Date(row.getValue("generatedAt"));
        return date.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDownload(row.original)}
          title="Download Report"
        >
          <FiDownload className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const handleDownload = (report: any) => {
    // TODO: Implement download functionality
    console.log("Download report:", report);
    // This would typically generate and download a PDF/Excel file
  };

  const handleGenerateReport = (type: string) => {
    // TODO: Implement report generation
    console.log("Generate report:", type);
    // This would call an API to generate a new report
  };

  // Mock data - replace with actual API calls
  const financialReports: FinancialReport[] = [];
  const schoolReports: SchoolReport[] = [];
  const userReports: UserReport[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and view financial, school, and user reports
          </p>
        </div>
        <Button onClick={() => handleGenerateReport(activeTab)}>
          <FiFileText className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="financial">
            <FiDollarSign className="mr-2 h-4 w-4" />
            Financial Reports
          </TabsTrigger>
          <TabsTrigger value="schools">
            <FiMapPin className="mr-2 h-4 w-4" />
            School Reports
          </TabsTrigger>
          <TabsTrigger value="users">
            <FiUser className="mr-2 h-4 w-4" />
            User Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                View and download financial reports including revenue, expenses, and income
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financialReports.length === 0 ? (
                <div className="text-center py-12">
                  <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports generated</h3>
                  <p className="text-gray-600 mb-4">
                    Generate your first financial report to get started
                  </p>
                  <Button onClick={() => handleGenerateReport("financial")}>
                    <FiFileText className="mr-2 h-4 w-4" />
                    Generate Financial Report
                  </Button>
                </div>
              ) : (
                <DataTable columns={financialColumns} data={financialReports} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>School Reports</CardTitle>
              <CardDescription>
                View and download reports for individual schools including student and payment data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schoolReports.length === 0 ? (
                <div className="text-center py-12">
                  <FiMapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports generated</h3>
                  <p className="text-gray-600 mb-4">
                    Generate your first school report to get started
                  </p>
                  <Button onClick={() => handleGenerateReport("schools")}>
                    <FiFileText className="mr-2 h-4 w-4" />
                    Generate School Report
                  </Button>
                </div>
              ) : (
                <DataTable columns={schoolColumns} data={schoolReports} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Reports</CardTitle>
              <CardDescription>
                View and download user reports including user counts by role and activity status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userReports.length === 0 ? (
                <div className="text-center py-12">
                  <FiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports generated</h3>
                  <p className="text-gray-600 mb-4">
                    Generate your first user report to get started
                  </p>
                  <Button onClick={() => handleGenerateReport("users")}>
                    <FiFileText className="mr-2 h-4 w-4" />
                    Generate User Report
                  </Button>
                </div>
              ) : (
                <DataTable columns={userColumns} data={userReports} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

