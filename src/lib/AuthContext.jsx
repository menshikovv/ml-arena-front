import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { FOUNDER_TELEGRAM_URL } from "@/lib/founder-season";

const USER_KEY = "ml-arena-founder-user";
const AUTH_KEY = "ml-arena-founder-auth";
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

function hasSession() {
  return localStorage.getItem(AUTH_KEY) === "1" || sessionStorage.getItem(AUTH_KEY) === "1";
}

function persistUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

const pause = (milliseconds = 450) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const AuthProvider = ({ children }) => {
  const storedUser = readStoredUser();
  const [user, setUser] = useState(storedUser);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(storedUser && hasSession()));
  const [isLoadingAuth] = useState(false);
  const [isLoadingPublicSettings] = useState(false);
  const [authError] = useState(null);
  const [authChecked] = useState(true);

  const register = useCallback(async ({ email, nickname, marketingConsent = false, attribution = {} }) => {
    await pause();
    const existing = readStoredUser();
    if (existing?.email === email) throw new Error("email_exists");
    if (existing?.nickname?.toLowerCase() === nickname.toLowerCase()) throw new Error("nickname_exists");

    const nextUser = {
      id: `founder-${Date.now()}`,
      email,
      nickname,
      full_name: "",
      city: "",
      education_status: "",
      organization: "",
      ml_level: "beginner",
      ml_interests: [],
      github_url: "",
      telegram_username: "",
      bio: "",
      avatar_url: "",
      account_status: "pending_verification",
      preregistration_status: "pending_email",
      registered_at: new Date().toISOString(),
      marketing_consent: marketingConsent,
      attribution,
    };
    persistUser(nextUser);
    sessionStorage.setItem(AUTH_KEY, "1");
    setUser(nextUser);
    setIsAuthenticated(true);
    return nextUser;
  }, []);

  const login = useCallback(async ({ email, remember }) => {
    await pause();
    const existing = readStoredUser();
    if (!existing || existing.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error("invalid_credentials");
    }
    if (remember) localStorage.setItem(AUTH_KEY, "1");
    else sessionStorage.setItem(AUTH_KEY, "1");
    setUser(existing);
    setIsAuthenticated(true);
    return existing;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const verifyEmail = useCallback(async () => {
    await pause(300);
    const current = readStoredUser();
    if (!current) return null;
    const updated = { ...current, account_status: "active", preregistration_status: "confirmed" };
    persistUser(updated);
    setUser(updated);
    setIsAuthenticated(true);
    sessionStorage.setItem(AUTH_KEY, "1");
    return updated;
  }, []);

  const resendVerification = useCallback(async () => {
    await pause(250);
    return true;
  }, []);

  const updateProfile = useCallback(async (changes) => {
    await pause();
    const current = readStoredUser();
    if (!current) throw new Error("auth_required");
    const updated = { ...current, ...changes };
    persistUser(updated);
    setUser(updated);
    return updated;
  }, []);

  const checkUserAuth = useCallback(async () => Boolean(readStoredUser() && hasSession()), []);
  const checkAppState = useCallback(async () => true, []);
  const navigateToLogin = useCallback(() => { window.location.href = "/login"; }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    authChecked,
    appPublicSettings: { telegram_url: FOUNDER_TELEGRAM_URL },
    register,
    login,
    logout,
    verifyEmail,
    resendVerification,
    updateProfile,
    navigateToLogin,
    checkUserAuth,
    checkAppState,
  }), [checkAppState, checkUserAuth, isAuthenticated, login, logout, navigateToLogin, register, resendVerification, updateProfile, user, verifyEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
