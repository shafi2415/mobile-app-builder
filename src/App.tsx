import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RealtimeNotifications } from "@/components/RealtimeNotifications";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Maintenance from "./pages/Maintenance";
import Dashboard from "./pages/student/Dashboard";
import Complaints from "./pages/student/Complaints";
import NewComplaint from "./pages/student/NewComplaint";
import ComplaintTracking from "./pages/student/ComplaintTracking";
import ComplaintDetails from "./pages/student/ComplaintDetails";
import SupportHistory from "./pages/student/SupportHistory";
import Community from "./pages/student/Community";
import Profile from "./pages/student/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminComplaints from "./pages/admin/Complaints";
import AdminUsers from "./pages/admin/Users";
import AdminCommunity from "./pages/admin/Community";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import AdminSecurity from "./pages/admin/Security";

const queryClient = new QueryClient();

const AppContent = () => {
  useOfflineSync();
  
  return (
    <>
      <RealtimeNotifications />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/maintenance" element={<Maintenance />} />

              {/* Student Protected Routes */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/complaints"
                element={
                  <ProtectedRoute>
                    <Complaints />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/complaints/new"
                element={
                  <ProtectedRoute>
                    <NewComplaint />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/complaints/track"
                element={
                  <ProtectedRoute>
                    <ComplaintTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/complaints/:id"
                element={
                  <ProtectedRoute>
                    <ComplaintDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/support/history"
                element={
                  <ProtectedRoute>
                    <SupportHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/community"
                element={
                  <ProtectedRoute>
                    <Community />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/complaints"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminComplaints />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/community"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminCommunity />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/security"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSecurity />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
