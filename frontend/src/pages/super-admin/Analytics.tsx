import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FiBarChart2, FiTrendingUp, FiTrendingDown, FiDollarSign, FiMapPin, FiUsers, FiCalendar } from "react-icons/fi";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";

interface RevenueData {
  id: number;
  period: string;
  totalRevenue: number;
  totalPayments: number;
  averagePayment: number;
  growthRate: number;
  paymentCount: number;
}

interface SchoolPerformance {
  id: number;
  schoolName: string;
  totalStudents: number;
  totalRevenue: number;
  averageFee: number;
  collectionRate: number;
  growthRate: number;
  status: "excellent" | "good" | "average" | "needs_attention";
}

export default function Analytics() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Set active tab based on URL
  useEffect(() => {
    if (location.pathname.includes("/analytics/revenue")) {
      setActiveTab("revenue");
    } else if (location.pathname.includes("/analytics/schools")) {
      setActiveTab("schools");
    } else {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  // Revenue Columns
  const revenueColumns: ColumnDef<RevenueData>[] = [
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FiCalendar className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{row.getValue("period")}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalRevenue",
      header: "Total Revenue",
      cell: ({ row }) => (
        <span className="text-green-600 font-semibold">
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
      accessorKey: "averagePayment",
      header: "Average Payment",
      cell: ({ row }) => (
        <span className="text-gray-700 font-medium">
          ₹{row.getValue("averagePayment")?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "paymentCount",
      header: "Payment Count",
    },
    {
      accessorKey: "growthRate",
      header: "Growth Rate",
      cell: ({ row }) => {
        const growthRate = row.getValue("growthRate") as number;
        const isPositive = growthRate >= 0;
        return (
          <div className="flex items-center gap-1">
            {isPositive ? (
              <FiTrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <FiTrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? "+" : ""}{growthRate.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
  ];

  // School Performance Columns
  const schoolPerformanceColumns: ColumnDef<SchoolPerformance>[] = [
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
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FiUsers className="h-4 w-4 text-gray-500" />
          <span>{row.getValue("totalStudents")}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalRevenue",
      header: "Total Revenue",
      cell: ({ row }) => (
        <span className="text-green-600 font-semibold">
          ₹{row.getValue("totalRevenue")?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "averageFee",
      header: "Average Fee",
      cell: ({ row }) => (
        <span className="text-gray-700 font-medium">
          ₹{row.getValue("averageFee")?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "collectionRate",
      header: "Collection Rate",
      cell: ({ row }) => {
        const rate = row.getValue("collectionRate") as number;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  rate >= 80 ? "bg-green-600" : rate >= 60 ? "bg-yellow-600" : "bg-red-600"
                }`}
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className="text-sm font-medium">{rate}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: "growthRate",
      header: "Growth Rate",
      cell: ({ row }) => {
        const growthRate = row.getValue("growthRate") as number;
        const isPositive = growthRate >= 0;
        return (
          <div className="flex items-center gap-1">
            {isPositive ? (
              <FiTrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <FiTrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? "+" : ""}{growthRate.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColors = {
          excellent: "bg-green-100 text-green-800",
          good: "bg-blue-100 text-blue-800",
          average: "bg-yellow-100 text-yellow-800",
          needs_attention: "bg-red-100 text-red-800",
        };
        const statusLabels = {
          excellent: "Excellent",
          good: "Good",
          average: "Average",
          needs_attention: "Needs Attention",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
            {statusLabels[status as keyof typeof statusLabels]}
          </span>
        );
      },
    },
  ];

  // Mock data - replace with actual API calls
  const revenueData: RevenueData[] = [];
  const schoolPerformanceData: SchoolPerformance[] = [];

  // Overview Stats (mock data)
  const overviewStats = {
    totalRevenue: 0,
    totalPayments: 0,
    averagePayment: 0,
    growthRate: 0,
    totalSchools: 0,
    totalStudents: 0,
    collectionRate: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            View insights and performance metrics across your platform
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <FiBarChart2 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <FiDollarSign className="mr-2 h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="schools">
            <FiMapPin className="mr-2 h-4 w-4" />
            School Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <FiDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{overviewStats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {overviewStats.growthRate >= 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <FiTrendingUp className="h-3 w-3" />
                      +{overviewStats.growthRate.toFixed(1)}% from last period
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <FiTrendingDown className="h-3 w-3" />
                      {overviewStats.growthRate.toFixed(1)}% from last period
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                <FiDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.totalPayments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Average: ₹{overviewStats.averagePayment.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                <FiMapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.totalSchools}</div>
                <p className="text-xs text-muted-foreground">Active schools</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                <FiBarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.collectionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {overviewStats.collectionRate >= 80 ? "Excellent" : overviewStats.collectionRate >= 60 ? "Good" : "Needs Improvement"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Insights</CardTitle>
              <CardDescription>
                Key metrics and trends at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FiBarChart2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
                <p className="text-gray-600">
                  Analytics data will appear here once you have payment and school data
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Track revenue trends, payment patterns, and growth metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.length === 0 ? (
                <div className="text-center py-12">
                  <FiDollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No revenue data</h3>
                  <p className="text-gray-600 mb-4">
                    Revenue analytics will appear here once you have payment data
                  </p>
                </div>
              ) : (
                <DataTable columns={revenueColumns} data={revenueData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>School Performance</CardTitle>
              <CardDescription>
                Compare performance metrics across all schools
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schoolPerformanceData.length === 0 ? (
                <div className="text-center py-12">
                  <FiMapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No performance data</h3>
                  <p className="text-gray-600 mb-4">
                    School performance metrics will appear here once you have school and payment data
                  </p>
                </div>
              ) : (
                <DataTable columns={schoolPerformanceColumns} data={schoolPerformanceData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

