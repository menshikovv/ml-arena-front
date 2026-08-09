import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "@/components/ml/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import PageNotFound from "@/lib/PageNotFound";
import { queryClientInstance } from "@/lib/query-client";
import ForgotPassword from "@/pages/ForgotPassword";
import Admin from "@/pages/Admin";
import CompanyDashboard from "@/pages/CompanyDashboard";
import FounderPlaceholder from "@/pages/FounderPlaceholder";
import FounderProfile from "@/pages/FounderProfile";
import Landing from "@/pages/Landing";
import LegalNotice from "@/pages/LegalNotice";
import Login from "@/pages/Login";
import ProfileEdit from "@/pages/ProfileEdit";
import Pricing from "@/pages/Pricing";
import Register from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";

function AppRoutes() {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <div className="fixed inset-0 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>;
  }
  if (authError?.type === "user_not_registered") return <UserNotRegisteredError />;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<LegalNotice type="terms" />} />
      <Route path="/privacy" element={<LegalNotice type="privacy" />} />

      <Route element={<AppLayout />}>
        <Route path="/competitions/*" element={<FounderPlaceholder section="competitions" />} />
        <Route path="/duels/*" element={<FounderPlaceholder section="duels" />} />
        <Route path="/rating" element={<FounderPlaceholder section="rating" />} />
        <Route path="/leaderboard" element={<Navigate to="/rating" replace />} />
        <Route path="/ml-passport" element={<FounderPlaceholder section="passport" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<FounderProfile />} />
          <Route path="/profile/me" element={<Navigate to="/profile" replace />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router><ScrollToTop /><AppRoutes /></Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
