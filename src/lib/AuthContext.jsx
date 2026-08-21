import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, uploadFile } from "@/api/mlArenaApi";
import { FOUNDER_TELEGRAM_URL } from "@/lib/founder-season";

const PENDING_EMAIL_KEY = "ml-arena-pending-email";
const AuthContext = createContext(null);

function mapUser(account = {}, profile = {}) {
  return {
    ...account,
    ...profile,
    id: account.id || profile.user_id,
    nickname: profile.user_name || profile.username || profile.nickname || account.nickname || account.username || account.email?.split("@")[0],
    full_name: profile.full_name ?? profile.name ?? account.full_name ?? account.name ?? "",
    education_status: profile.university || "",
    organization: profile.company || account.organization_name || "",
    birth_date: profile.birth_date || "",
    ml_experience_years: profile.ml_experience_years ?? "",
    ml_experience: profile.ml_experience || "",
    account_status: account.status === "pending_email" ? "pending_verification" : account.status,
    preregistration_status: account.email_verified ? "confirmed" : "pending_email",
    registered_at: profile.created_at,
    ml_interests: Array.isArray(profile.ml_interests)
      ? profile.ml_interests
      : Object.entries(profile.skills || {}).filter(([, value]) => value > 0).map(([key]) => key),
  };
}

async function loadUser(account) {
  const freshAccount = await api.auth.me();
  const authUser = { ...(account || {}), ...freshAccount };
  let profile = {};
  try {
    profile = await api.profiles.me();
  } catch (error) {
    if (error.status !== 404 && error.code !== "RESOURCE_NOT_FOUND") throw error;
  }
  return mapUser(authUser, profile);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const restored = await api.auth.restore();
      const current = await loadUser(restored.user);
      setUser(current);
      setIsAuthenticated(true);
      setAuthError(null);
      return true;
    } catch (error) {
      clearSession();
      if (error.code !== "AUTHENTICATION_REQUIRED" && error.code !== "TOKEN_REVOKED") setAuthError(error);
      return false;
    } finally {
      setAuthChecked(true);
      setIsLoadingAuth(false);
    }
  }, [clearSession]);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  useEffect(() => {
    const handleExpired = () => clearSession();
    window.addEventListener("ml-arena:session-expired", handleExpired);
    return () => window.removeEventListener("ml-arena:session-expired", handleExpired);
  }, [clearSession]);

  const register = useCallback(async ({ email, nickname, password, acceptedTerms, acceptedPrivacy }) => {
    const result = await api.auth.register({
      email,
      password,
      username: nickname,
      accepted_terms: acceptedTerms,
      accepted_privacy: acceptedPrivacy,
    });
    sessionStorage.setItem(PENDING_EMAIL_KEY, email);
    setPendingCredentials({ email, password });
    return result;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const result = await api.auth.login(email, password);
    const current = await loadUser(result.user);
    setUser(current);
    setIsAuthenticated(true);
    setAuthError(null);
    setPendingCredentials(null);
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
    return current;
  }, []);

  const logout = useCallback(async () => {
    clearSession();
    try {
      await api.auth.logout();
    } catch {
      return false;
    }
    return true;
  }, [clearSession]);

  const verifyEmail = useCallback(async ({ email, code }) => {
    const verified = await api.auth.confirmVerification(email, code);
    const credentials = pendingCredentials?.email === email ? pendingCredentials : null;
    if (!credentials) {
      sessionStorage.setItem(PENDING_EMAIL_KEY, email);
      return { verified, authenticated: false };
    }
    try {
      const current = await login(credentials);
      return { verified, authenticated: true, user: current };
    } catch (loginError) {
      return { verified, authenticated: false, loginError };
    }
  }, [login, pendingCredentials]);

  const resendVerification = useCallback(async (email) => {
    const target = email || sessionStorage.getItem(PENDING_EMAIL_KEY) || user?.email;
    if (!target) throw new Error("Укажите email");
    return api.auth.requestVerification(target);
  }, [user?.email]);

  const updateProfile = useCallback(async (changes) => {
    const body = {
      user_name: changes.nickname,
      full_name: changes.full_name || null,
      bio: changes.bio || null,
      city: changes.city || null,
      birth_date: changes.birth_date || null,
      university: changes.education_status || null,
      company: changes.organization || null,
      ml_experience_years: changes.ml_experience_years === "" ? null : Number(changes.ml_experience_years),
      ml_experience: changes.ml_experience || null,
      ml_interests: changes.ml_interests,
      github_url: changes.github_url || null,
      kaggle_url: changes.kaggle_url || null,
      visible_to_employers: changes.visible_to_employers,
      public_profile: changes.public_profile,
    };
    Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);
    const profile = await api.profiles.updateMe(body);
    const current = mapUser(user, profile);
    setUser((previous) => {
      return mapUser(previous || user, profile);
    });
    return current;
  }, [user]);

  const updateAvatar = useCallback(async (file) => {
    const upload = await uploadFile(file, "profile_avatar");
    const profile = await api.profiles.setAvatar(upload.id);
    const current = mapUser(user, profile);
    setUser((previous) => {
      return mapUser(previous || user, profile);
    });
    return current;
  }, [user]);

  const deleteAvatar = useCallback(async () => {
    const profile = await api.profiles.deleteAvatar();
    const current = mapUser(user, profile);
    setUser((previous) => {
      return mapUser(previous || user, profile);
    });
    return current;
  }, [user]);

  const forgotPassword = useCallback((email) => api.auth.forgotPassword(email), []);
  const resetPassword = useCallback((token, password) => api.auth.resetPassword(token, password), []);
  const navigateToLogin = useCallback(() => { window.location.href = "/login"; }, []);
  const checkAppState = useCallback(async () => true, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authError,
    authChecked,
    pendingEmail: sessionStorage.getItem(PENDING_EMAIL_KEY),
    appPublicSettings: { telegram_url: FOUNDER_TELEGRAM_URL },
    register,
    login,
    logout,
    verifyEmail,
    resendVerification,
    updateProfile,
    updateAvatar,
    deleteAvatar,
    forgotPassword,
    resetPassword,
    navigateToLogin,
    checkUserAuth,
    checkAppState,
  }), [authChecked, authError, checkAppState, checkUserAuth, deleteAvatar, forgotPassword, isAuthenticated, isLoadingAuth, login, logout, navigateToLogin, register, resendVerification, resetPassword, updateAvatar, updateProfile, user, verifyEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
