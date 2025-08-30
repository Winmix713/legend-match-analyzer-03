import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LazyPerformanceMetrics } from "@/lib/lazy-components";
import { Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthPage } from "./pages/AuthPage";
import { ProfilePage } from "./pages/ProfilePage";
import { Analytics } from "./pages/Analytics";
import AdminDashboard from "./pages/AdminDashboard";
import { UnauthorizedPage } from "./pages/Unauthorized";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              } />
              
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />

              <Route path="/analytics" element={
                <ProtectedRoute requiredPermission="view_analytics">
                  <Analytics />
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Catch all route */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        <Suspense fallback={null}>
          <LazyPerformanceMetrics />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
