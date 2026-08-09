import React, { useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, UserPlus } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import FounderSeasonTelegramCard from "@/components/ml/FounderSeasonTelegramCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { maskEmail } from "@/lib/founder-season";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nicknamePattern = /^[\p{L}\d_.-]{3,30}$/u;

export default function Register() {
  const { isAuthenticated, register } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", nickname: "", password: "", confirmation: "", acceptLegal: false, marketing: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [devCode, setDevCode] = useState("");

  const passwordValid = form.password.length >= 8 && form.password.length <= 128 && /[\p{L}]/u.test(form.password) && /\d/.test(form.password);
  const isValid = useMemo(() => (
    emailPattern.test(form.email.trim())
    && form.email.trim().length <= 254
    && nicknamePattern.test(form.nickname.trim())
    && passwordValid
    && form.confirmation === form.password
    && form.acceptLegal
  ), [form, passwordValid]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError("");
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const attribution = Object.fromEntries(
        ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
          .map((key) => [key, searchParams.get(key)])
          .filter(([, value]) => value)
      );
      const result = await register({ email: normalizedEmail, nickname: form.nickname.trim(), password: form.password, marketingConsent: form.marketing, attribution });
      setRegisteredEmail(normalizedEmail);
      setDevCode(result.dev_code || "");
      setForm((current) => ({ ...current, password: "", confirmation: "" }));
    } catch (submitError) {
      setError(submitError.code === "RESOURCE_CONFLICT"
        ? "Email или никнейм уже используются. Войдите, восстановите пароль или выберите другой никнейм."
        : submitError.code === "NETWORK_ERROR"
          ? "Бэкенд ML Арены недоступен. Проверьте, что он запущен."
          : submitError.message || "Не удалось создать аккаунт. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && !registeredEmail) return <Navigate to="/profile" replace />;

  if (registeredEmail) {
    return (
      <AuthLayout wide icon={CheckCircle2} title="Предрегистрация создана" subtitle={`Мы подготовили письмо для ${maskEmail(registeredEmail)}. Подтвердите email, чтобы завершить регистрацию.`}>
        <div className="space-y-5">
          <div className="rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm leading-6">
            Аккаунт ML Арены создан, а вы добавлены в предрегистрацию первого соревнования.
          </div>
          {devCode && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-900">Код для локальной разработки: <strong className="font-mono text-base">{devCode}</strong></div>}
          <Button asChild className="w-full"><Link to={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}>Ввести код подтверждения</Link></Button>
          <FounderSeasonTelegramCard compact embedded pending />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      wide
      icon={UserPlus}
      title="Создай аккаунт и попади в Founder Season"
      subtitle="Зарегистрируйся на ML Арене, чтобы попасть в предрегистрацию первого соревнования. Пока задания, разборы и анонсы проходят в Telegram."
      footer={<>Уже есть аккаунт? <Link to="/login" className="font-medium text-primary hover:underline">Войти</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="h-11 pl-10" placeholder="you@example.com" maxLength={254} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname">Никнейм</Label>
            <Input id="nickname" autoComplete="username" value={form.nickname} onChange={(event) => update("nickname", event.target.value)} className="h-11" placeholder="ml_builder" minLength={3} maxLength={30} required />
            {form.nickname && !nicknamePattern.test(form.nickname.trim()) && <p className="text-xs text-destructive">3–30 символов: буквы, цифры, _, - или точка.</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} className="h-11 px-10" maxLength={128} required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} title={showPassword ? "Скрыть пароль" : "Показать пароль"}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && !passwordValid && <p className="text-xs text-destructive">8–128 символов, минимум одна буква и одна цифра.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmation">Повторите пароль</Label>
            <Input id="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirmation} onChange={(event) => update("confirmation", event.target.value)} className="h-11" required />
            {form.confirmation && form.confirmation !== form.password && <p className="text-xs text-destructive">Пароли не совпадают.</p>}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-5">
          <input type="checkbox" checked={form.acceptLegal} onChange={(event) => update("acceptLegal", event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
          <span>Принимаю <Link to="/terms" className="text-primary hover:underline">пользовательское соглашение</Link> и <Link to="/privacy" className="text-primary hover:underline">политику обработки данных</Link>.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-muted-foreground">
          <input type="checkbox" checked={form.marketing} onChange={(event) => update("marketing", event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
          <span>Хочу получать новости Founder Season и анонсы первого соревнования.</span>
        </label>

        {error && <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
        <Button type="submit" className="h-12 w-full" disabled={!isValid || loading}>
          {loading ? <><Loader2 className="animate-spin" size={16} /> Создаём аккаунт…</> : "Зарегистрироваться"}
        </Button>
      </form>
    </AuthLayout>
  );
}
