import { ReactNode } from "react";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "./Layout";

interface ProtectedLayoutRouteProps {
  children: ReactNode;
}

/**
 * Wrapper component that combines ProtectedRoute and Layout
 * Reduces repetition in route definitions
 */
export default function ProtectedLayoutRoute({
  children,
}: ProtectedLayoutRouteProps) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

