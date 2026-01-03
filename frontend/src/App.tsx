import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { SchoolProvider } from "./contexts/SchoolContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Students from "./pages/Students";
import AddEditStudent from "./pages/AddEditStudent";
import FeeStructures from "./pages/FeeStructures";
import Payments from "./pages/Payments";
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import SuperAdminSchools from "./pages/super-admin/Schools";
import SuperAdminUsers from "./pages/super-admin/Users";
import SuperAdminSchoolDetails from "./pages/super-admin/SchoolDetails";
import BulkImportStudents from "./pages/super-admin/BulkImportStudents";
import FeeHeading from "./pages/super-admin/FeeHeading";
import CategoryHeads from "./pages/super-admin/CategoryHeads";
import FeePlan from "./pages/super-admin/FeePlan";
import Classes from "./pages/super-admin/Classes";
import RoutePlans from "./pages/super-admin/RoutePlans";
import AcademicYears from "./pages/super-admin/AcademicYears";
import Announcements from "./pages/super-admin/Announcements";
import Analytics from "./pages/super-admin/Analytics";
import Reports from "./pages/super-admin/Reports";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayoutRoute from "./components/ProtectedLayoutRoute";
import Layout from "./components/Layout";
import { ShadcnDemo } from "./components/ShadcnDemo";

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SchoolProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route
                path="/testing"
                element={
                  <Layout>
                    <ShadcnDemo />
                  </Layout>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Super Admin Routes */}

              {/* Dashboard */}
              <Route
                path="/super-admin/dashboard"
                element={
                  <ProtectedLayoutRoute>
                    <SuperAdminDashboard />
                  </ProtectedLayoutRoute>
                }
              />

              {/* Schools */}
              <Route
                path="/super-admin/schools"
                element={
                  <ProtectedLayoutRoute>
                    <SuperAdminSchools />
                  </ProtectedLayoutRoute>
                }
              />
              <Route
                path="/super-admin/students/bulk-import"
                element={
                  <ProtectedLayoutRoute>
                    <BulkImportStudents />
                  </ProtectedLayoutRoute>
                }
              />
              <Route
                path="/super-admin/schools/:id/details"
                element={
                  <ProtectedLayoutRoute>
                    <SuperAdminSchoolDetails />
                  </ProtectedLayoutRoute>
                }
              />

              {/* User Management */}
              <Route
                path="/super-admin/settings/users"
                element={
                  <ProtectedLayoutRoute>
                    <SuperAdminUsers />
                  </ProtectedLayoutRoute>
                }
              />

              {/* Settings - Fee Settings */}
              <Route
                path="/super-admin/settings/fee-settings/category-heads"
                element={
                  <ProtectedLayoutRoute>
                    <CategoryHeads />
                  </ProtectedLayoutRoute>
                }
              />
              <Route
                path="/super-admin/settings/fee-settings/fee-heading"
                element={
                  <ProtectedLayoutRoute>
                    <FeeHeading />
                  </ProtectedLayoutRoute>
                }
              />
              <Route
                path="/super-admin/settings/fee-settings/fee-plan"
                element={
                  <ProtectedLayoutRoute>
                    <FeePlan />
                  </ProtectedLayoutRoute>
                }
              />
              {/* Route Plans - Contains both "Define Routes" and "Plan Routes" tabs */}
              <Route
                path="/super-admin/settings/fee-settings/route-plan"
                element={
                  <ProtectedLayoutRoute>
                    <RoutePlans />
                  </ProtectedLayoutRoute>
                }
              />

              {/* Settings - Academics */}
              <Route
                path="/super-admin/settings/academics/class"
                element={
                  <ProtectedLayoutRoute>
                    <Classes />
                  </ProtectedLayoutRoute>
                }
              />
              <Route
                path="/super-admin/settings/academics/academic-years"
                element={
                  <ProtectedLayoutRoute>
                    <AcademicYears />
                  </ProtectedLayoutRoute>
                }
              />

              {/* Settings - Other */}
              {/* TODO: Add System Settings component when ready */}
              {/* <Route
              path="/super-admin/settings/system"
              element={
                <ProtectedLayoutRoute>
                  <SystemSettings />
                </ProtectedLayoutRoute>
              }
            /> */}
              {/* TODO: Add Notifications component when ready */}
              {/* <Route
              path="/super-admin/settings/notifications"
              element={
                <ProtectedLayoutRoute>
                  <Notifications />
                </ProtectedLayoutRoute>
              }
            /> */}

              {/* Profile */}
              <Route
                path="/super-admin/profile"
                element={
                  <ProtectedLayoutRoute>
                    <Profile />
                  </ProtectedLayoutRoute>
                }
              />

              {/* Communication */}
              <Route
                path="/super-admin/settings/announcements"
                element={
                  <ProtectedLayoutRoute>
                    <Announcements />
                  </ProtectedLayoutRoute>
                }
              />

              {/* Analytics */}
              <Route
                path="/super-admin/analytics"
                element={
                  <ProtectedLayoutRoute>
                    <Analytics />
                  </ProtectedLayoutRoute>
                }
              />
              <Route
                path="/super-admin/analytics/revenue"
                element={
                  <ProtectedLayoutRoute>
                    <Analytics />
                  </ProtectedLayoutRoute>
                }
              />
              <Route
                path="/super-admin/analytics/schools"
                element={
                  <ProtectedLayoutRoute>
                    <Analytics />
                  </ProtectedLayoutRoute>
                }
              />

              {/* Reports */}
              <Route
                path="/super-admin/reports/financial"
                element={
                  <ProtectedLayoutRoute>
                    <Reports />
                  </ProtectedLayoutRoute>
                }
              />
              <Route
                path="/super-admin/reports/schools"
                element={
                  <ProtectedLayoutRoute>
                    <Reports />
                  </ProtectedLayoutRoute>
                }
              />
              <Route
                path="/super-admin/reports/users"
                element={
                  <ProtectedLayoutRoute>
                    <Reports />
                  </ProtectedLayoutRoute>
                }
              />

              {/* School Admin Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/super-admin/students"
                element={
                  <ProtectedRoute>
                    <Students />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/students/new"
                element={
                  <ProtectedRoute>
                    <AddEditStudent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin/students/:id/edit"
                element={
                  <ProtectedRoute>
                    <AddEditStudent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fee-structures"
                element={
                  <ProtectedRoute>
                    <FeeStructures />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              {/* Default redirect */}
              <Route
                path="/"
                element={<Navigate to="/super-admin/dashboard" />}
              />

              {/* 404 - Catch all unmatched routes */}
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            404
                          </h1>
                          <p className="text-gray-600 mb-4">Page not found</p>
                          <a
                            href="/super-admin/dashboard"
                            className="text-indigo-600 hover:text-indigo-800 underline"
                          >
                            Go to Dashboard
                          </a>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </SchoolProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
