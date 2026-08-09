import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import CompetitionDetail from "@/pages/CompetitionDetail";
import Competitions from "@/pages/Competitions";
import DuelLobby from "@/pages/DuelLobby";
import Duels from "@/pages/Duels";
import FounderPlaceholder from "@/pages/FounderPlaceholder";
import FounderProfile from "@/pages/FounderProfile";
import Landing from "@/pages/Landing";
import Leaderboard from "@/pages/Leaderboard";
import LegalNotice from "@/pages/LegalNotice";
import Login from "@/pages/Login";
import ProfileEdit from "@/pages/ProfileEdit";
import Pricing from "@/pages/Pricing";
import Profile from "@/pages/Profile";
import Register from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";

const defaultMeta = {
  title: "ML-Арена — соревнования по ИИ и машинному обучению",
  description: "Решайте реальные задачи, участвуйте в дуэлях и подтверждайте навыки результатами.",
};

const pageMeta = [
  ["/competitions", "Соревнования — ML-Арена", "Соревнования по машинному обучению с реальными задачами, рейтингом и призами."],
  ["/duels", "Дуэли 1×1 — ML-Арена", "Быстрые ML-дуэли один на один для проверки навыков и пополнения ML-паспорта."],
  ["/rating", "Рейтинг участников — ML-Арена", "Общий рейтинг участников ML-Арены и путь от Бронзы до Платины."],
  ["/leaderboard", "Рейтинг участников — ML-Арена", "Общий рейтинг участников ML-Арены и путь от Бронзы до Платины."],
  ["/ml-passport", "ML-паспорт — ML-Арена", "Подтвержденные результаты, навыки и достижения участника ML-Арены."],
  ["/profile/edit", "Редактирование профиля — ML-Арена", "Настройка профиля и данных ML-паспорта."],
  ["/profile", "ML-паспорт — ML-Арена", "Подтвержденные результаты, навыки и достижения участника ML-Арены."],
  ["/company/dashboard", "Кабинет компании — ML-Арена", "Управление соревнованиями и поиск ML-специалистов с подтвержденными навыками."],
  ["/pricing", "Тарифы — ML-Арена", "Тарифы ML-Арены для тренировок, соревнований и развития ML-навыков."],
  ["/admin", "Панель администратора — ML-Арена", "Управление платформой ML-Арена."],
  ["/login", "Вход — ML-Арена", "Войдите в аккаунт ML-Арены."],
  ["/register", "Регистрация — ML-Арена", "Создайте аккаунт участника ML-Арены."],
  ["/verify-email", "Подтверждение почты — ML-Арена", "Подтвердите адрес электронной почты для входа в ML-Арену."],
  ["/forgot-password", "Восстановление пароля — ML-Арена", "Восстановите доступ к аккаунту ML-Арены."],
  ["/reset-password", "Новый пароль — ML-Арена", "Задайте новый пароль для аккаунта ML-Арены."],
  ["/terms", "Условия использования — ML-Арена", "Условия использования платформы ML-Арена."],
  ["/privacy", "Политика конфиденциальности — ML-Арена", "Политика обработки персональных данных ML-Арены."],
];

function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const matched = pageMeta.find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
    const meta = matched ? { title: matched[1], description: matched[2] } : defaultMeta;
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", meta.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", meta.description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", meta.title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", meta.description);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const founderMode = import.meta.env.VITE_FOUNDER_MODE !== "false";

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
        {founderMode ? (
          <>
            <Route path="/competitions/*" element={<FounderPlaceholder section="competitions" />} />
            <Route path="/duels/*" element={<FounderPlaceholder section="duels" />} />
            <Route path="/rating" element={<FounderPlaceholder section="rating" />} />
            <Route path="/ml-passport" element={<FounderPlaceholder section="passport" />} />
          </>
        ) : (
          <Route element={<ProtectedRoute />}>
            <Route path="/competitions" element={<Competitions />} />
            <Route path="/competitions/:id/:section?" element={<CompetitionDetail />} />
            <Route path="/duels" element={<Duels />} />
            <Route path="/duels/:id/:stage?" element={<DuelLobby />} />
            <Route path="/rating" element={<Leaderboard />} />
            <Route path="/ml-passport" element={<Navigate to="/profile" replace />} />
          </Route>
        )}
        <Route path="/leaderboard" element={<Navigate to="/rating" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={founderMode ? <FounderProfile /> : <Profile />} />
          <Route path="/profile/me" element={<Navigate to="/profile" replace />} />
          {!founderMode && <Route path="/profile/:id" element={<Profile />} />}
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
        <Router><PageMetadata /><ScrollToTop /><AppRoutes /></Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
