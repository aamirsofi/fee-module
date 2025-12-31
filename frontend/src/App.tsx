import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
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
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
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
            <Route
              path="/super-admin/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SuperAdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/schools"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SuperAdminSchools />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/schools/bulk-import"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BulkImportStudents />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/settings/fee-settings/fee-heading"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FeeHeading />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/settings/fee-settings/category-heads"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CategoryHeads />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/settings/fee-settings/fee-plan"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FeePlan />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/settings/academics/class"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Classes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/schools/:id/details"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SuperAdminSchoolDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SuperAdminUsers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
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
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <Students />
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
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
