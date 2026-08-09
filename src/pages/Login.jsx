import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";

function safeReturnTo(value) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/profile";
}

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) return <Navigate to="/profile" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ email: email.trim().toLowerCase(), password, remember });
      navigate(safeReturnTo(searchParams.get("return_to") || location.state?.from), { replace: true });
    } catch {
      setError("Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon={LogIn} title="Войти в ML Арену" subtitle="Продолжите подготовку к первому соревнованию Founder Season." footer={<>Нет аккаунта? <Link to="/register" className="font-medium text-primary hover:underline">Пройти предрегистрацию</Link></>}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 pl-10" placeholder="you@example.com" required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Пароль</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Забыли пароль?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 px-10" required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} title={showPassword ? "Скрыть пароль" : "Показать пароль"}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-primary" />
          Запомнить меня
        </label>
        {error && <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
        <Button type="submit" className="h-12 w-full" disabled={!email || !password || loading}>
          {loading ? <><Loader2 className="animate-spin" size={16} /> Входим…</> : "Войти"}
        </Button>
      </form>
    </AuthLayout>
  );
}
