import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MailCheck, RefreshCw } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { maskEmail } from "@/lib/founder-season";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nicknamePattern = /^[\p{L}\d_.-]{3,30}$/u;

function ConsentRow({ id, checked, onCheckedChange, children, muted = false }) {
  return (
    <label htmlFor={id} className={`group flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm leading-5 transition-colors ${checked ? "border-primary/25 bg-primary/[0.045]" : "border-transparent bg-secondary/45 hover:border-border hover:bg-secondary/70"} ${muted ? "text-muted-foreground" : "text-foreground"}`}>
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} className="mt-0.5" />
      <span>{children}</span>
    </label>
  );
}

export default function Register() {
  const { isAuthenticated, register, resendVerification, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", nickname: "", password: "", confirmation: "", acceptTerms: false, acceptPrivacy: false, marketing: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [devCode, setDevCode] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const passwordValid = form.password.length >= 8 && form.password.length <= 128 && /[\p{L}]/u.test(form.password) && /\d/.test(form.password);
  const isValid = useMemo(() => (
    emailPattern.test(form.email.trim())
    && form.email.trim().length <= 254
    && nicknamePattern.test(form.nickname.trim())
    && passwordValid
    && form.confirmation === form.password
    && form.acceptTerms
    && form.acceptPrivacy
  ), [form, passwordValid]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError("");
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const result = await register({
        email: normalizedEmail,
        nickname: form.nickname.trim(),
        password: form.password,
        acceptedTerms: form.acceptTerms,
        acceptedPrivacy: form.acceptPrivacy,
      });
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

  const handleVerification = async (event) => {
    event.preventDefault();
    if (code.length !== 6 || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await verifyEmail({ email: registeredEmail, code });
      navigate(result.authenticated ? "/profile" : `/login?email=${encodeURIComponent(registeredEmail)}`, { replace: true });
    } catch (verificationError) {
      if (verificationError.code === "VERIFICATION_CODE_EXPIRED") setError("Срок действия кода закончился. Запросите новый.");
      else if (verificationError.code === "VERIFICATION_ATTEMPTS_EXCEEDED") setError("Попытки закончились. Запросите новый код.");
      else if (verificationError.code === "INVALID_VERIFICATION_CODE") setError(`Неверный код.${verificationError.details?.attempts_left != null ? ` Осталось попыток: ${verificationError.details.attempts_left}.` : ""}`);
      else setError(verificationError.message || "Не удалось подтвердить email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown || loading) return;
    setError("");
    try {
      const result = await resendVerification(registeredEmail);
      setCooldown(result.retry_after_seconds || 60);
      setDevCode(result.dev_code || "");
    } catch (requestError) {
      setError(requestError.message || "Не удалось отправить новый код.");
    }
  };

  if (isAuthenticated && !registeredEmail) return <Navigate to="/profile" replace />;

  if (registeredEmail) {
    return (
      <AuthLayout icon={MailCheck} title="Подтвердите email" subtitle={<>Код отправлен на <span className="font-medium text-foreground">{maskEmail(registeredEmail)}</span>. После подтверждения сразу откроется ваш профиль.</>}>
        <form onSubmit={handleVerification} className="space-y-6">
          <div className="space-y-3 text-center">
            <Label className="block text-sm">Шестизначный код</Label>
            <InputOTP maxLength={6} value={code} onChange={setCode} inputMode="numeric" pattern="[0-9]*" autoFocus containerClassName="justify-center">
              <InputOTPGroup>{Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} className="h-12 w-11 text-lg font-semibold" />)}</InputOTPGroup>
            </InputOTP>
          </div>

          {devCode && <button type="button" onClick={() => setCode(devCode)} className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-primary">Код разработки: <span className="font-mono font-semibold">{devCode}</span></button>}
          {error && <p className="border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

          <Button type="submit" className="h-12 w-full" disabled={loading || code.length !== 6}>
            {loading ? <><Loader2 className="animate-spin" size={16} /> Подтверждаем…</> : "Подтвердить и войти"}
          </Button>

          <div className="flex flex-col items-center gap-2 border-t border-border pt-5 text-sm">
            <Button type="button" variant="ghost" size="sm" onClick={handleResend} disabled={cooldown > 0 || loading}>
              <RefreshCw size={14} /> {cooldown ? `Новый код через ${cooldown} сек.` : "Отправить код ещё раз"}
            </Button>
            <button type="button" onClick={() => { setRegisteredEmail(""); setCode(""); setError(""); }} className="text-xs text-muted-foreground transition-colors hover:text-foreground">Указать другой email</button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      wide
      compact
      title="Регистрация"
      footer={<>Уже есть аккаунт? <Link to="/login" className="font-medium text-primary hover:underline">Войти</Link></>}
    >
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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

        <div className="space-y-2 border-t border-border pt-4 sm:col-span-2">
          <ConsentRow id="accept-terms" checked={form.acceptTerms} onCheckedChange={(value) => update("acceptTerms", value)}>
            Я принимаю <Link to="/terms" className="font-medium text-primary hover:underline">пользовательское соглашение</Link>.
          </ConsentRow>
          <ConsentRow id="accept-privacy" checked={form.acceptPrivacy} onCheckedChange={(value) => update("acceptPrivacy", value)}>
            Я даю согласие на <Link to="/privacy" className="font-medium text-primary hover:underline">обработку персональных данных</Link>.
          </ConsentRow>
          <ConsentRow id="marketing" checked={form.marketing} onCheckedChange={(value) => update("marketing", value)} muted>
            Я хочу получать новости ML Арены, анонсы соревнований и материалы Founder Season.
          </ConsentRow>
        </div>

        {error && <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive sm:col-span-2">{error}</div>}
        <Button type="submit" className="h-12 w-full sm:col-span-2" disabled={!isValid || loading}>
          {loading ? <><Loader2 className="animate-spin" size={16} /> Создаём аккаунт…</> : "Зарегистрироваться"}
        </Button>
      </form>
    </AuthLayout>
  );
}
