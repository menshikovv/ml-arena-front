import { lazy, Suspense, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "@/components/ml/AppLayout";
import CookieConsent from "@/components/CookieConsent";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { getBlogPost } from "@/lib/blog-data";
import PageNotFound from "@/lib/PageNotFound";
import { queryClientInstance } from "@/lib/query-client";
import ForgotPassword from "@/pages/ForgotPassword";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import CompanyDashboard from "@/pages/CompanyDashboard";
import CompetitionDetail from "@/pages/CompetitionDetail";
import Competitions from "@/pages/Competitions";
import Cooperation from "@/pages/Cooperation";
import DuelLobby from "@/pages/DuelLobby";
import Duels from "@/pages/Duels";
import FounderPlaceholder from "@/pages/FounderPlaceholder";
import FounderProfile from "@/pages/FounderProfile";
import Help from "@/pages/Help";
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

const Admin = lazy(() => import("@/pages/Admin"));

const defaultMeta = {
  title: "ML-Арена — соревнования по ИИ и машинному обучению",
  description: "Решайте реальные задачи, участвуйте в дуэлях и подтверждайте навыки результатами.",
};

const pageMeta = [
  ["/blog", "Блог — ML-Арена", "Новости ML-Арены, разборы задач, подготовка к соревнованиям и практические материалы по машинному обучению."],
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
  ["/support", "Поддержка — ML-Арена", "Ответы на частые вопросы и форма обращения в поддержку ML-Арены."],
  ["/companies", "Компаниям — ML-Арена", "Практические ML-соревнования, проверка специалистов и совместные проекты для компаний."],
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
    const blogPost = pathname.startsWith("/blog/") ? getBlogPost(pathname.slice("/blog/".length)) : null;
    const matched = pageMeta.find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
    const meta = blogPost
      ? { title: `${blogPost.title} — ML-Арена`, description: blogPost.excerpt }
      : matched ? { title: matched[1], description: matched[2] } : defaultMeta;
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", meta.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", meta.description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", meta.title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", meta.description);
  }, [pathname]);

  return null;
}

function AdminEntry() {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" /></div>}><Admin /></Suspense>;
}

function AppRoutes() {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, user } = useAuth();
  const founderMode = import.meta.env.VITE_FOUNDER_MODE !== "false";
  const closedSectionsEnabled = import.meta.env.VITE_ENABLE_CLOSED_SECTIONS === "true";
  const isAdmin = user?.role === "admin";
  const showFounderPlaceholders = founderMode && !isAdmin;

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <div className="fixed inset-0 flex items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" /></div>;
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
      <Route path="/support" element={isAuthenticated ? <AppLayout><Help embedded /></AppLayout> : <Help />} />
      <Route path="/companies" element={isAuthenticated ? <AppLayout><Cooperation embedded /></AppLayout> : <Cooperation />} />
      <Route path="/help" element={<Navigate to="/support" replace />} />
      <Route path="/contacts/cooperation" element={<Navigate to="/companies" replace />} />
      <Route path="/cooperation" element={<Navigate to="/companies" replace />} />

      <Route element={<AppLayout />}>
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        {showFounderPlaceholders ? (
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
          <Route path="/profile" element={showFounderPlaceholders ? <FounderProfile /> : <Profile />} />
          <Route path="/profile/me" element={<Navigate to="/profile" replace />} />
          {!showFounderPlaceholders && <Route path="/profile/:id" element={<Profile />} />}
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/company/dashboard" element={closedSectionsEnabled ? <CompanyDashboard /> : <Navigate to="/" replace />} />
          <Route path="/pricing" element={closedSectionsEnabled ? <Pricing /> : <Navigate to="/" replace />} />
          <Route path="/admin" element={<AdminEntry />} />
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
        <Router><PageMetadata /><ScrollToTop /><AppRoutes /><CookieConsent /></Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
