import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailCheck, RefreshCw } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { maskEmail } from "@/lib/founder-season";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pendingEmail, verifyEmail, resendVerification } = useAuth();
  const [email, setEmail] = useState(searchParams.get("email") || pendingEmail || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState("");

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const submit = async (event) => {
    event.preventDefault();
    if (!email || code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const result = await verifyEmail({ email: email.trim().toLowerCase(), code });
      if (result.authenticated) {
        navigate("/profile", { replace: true });
        return;
      }
      setComplete(true);
    } catch (submitError) {
      if (submitError.code === "VERIFICATION_CODE_EXPIRED") setError("Срок действия кода закончился. Запросите новый.");
      else if (submitError.code === "VERIFICATION_ATTEMPTS_EXCEEDED") setError("Попытки закончились. Запросите новый код.");
      else if (submitError.code === "INVALID_VERIFICATION_CODE") setError(`Неверный код.${submitError.details?.attempts_left != null ? ` Осталось попыток: ${submitError.details.attempts_left}.` : ""}`);
      else setError(submitError.message || "Не удалось подтвердить email.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email || cooldown) return;
    setError("");
    try {
      const result = await resendVerification(email.trim().toLowerCase());
      setCooldown(result.retry_after_seconds || 60);
      setDevCode(result.dev_code || "");
    } catch (requestError) {
      setError(requestError.message || "Не удалось отправить код.");
    }
  };

  if (complete) {
    return (
      <AuthLayout icon={CheckCircle2} title="Email подтверждён" subtitle="Аккаунт активирован. Войдите с указанным email и паролем.">
        <Button asChild className="h-12 w-full"><Link to={`/login?email=${encodeURIComponent(email)}`}>Перейти ко входу</Link></Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={MailCheck} title="Подтвердите email" subtitle={email ? `Введите шестизначный код, отправленный на ${maskEmail(email)}.` : "Укажите email и введите шестизначный код из письма."}>
      <form onSubmit={submit} className="space-y-5">
        {!searchParams.get("email") && !pendingEmail && <div className="space-y-2"><Label htmlFor="verify-email">Email</Label><Input id="verify-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>}
        <div className="space-y-3">
          <Label>Код подтверждения</Label>
          <InputOTP maxLength={6} value={code} onChange={setCode} inputMode="numeric" pattern="[0-9]*" containerClassName="justify-center">
            <InputOTPGroup>{Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} className="h-12 w-11 text-base" />)}</InputOTPGroup>
          </InputOTP>
        </div>
        {devCode && <button type="button" onClick={() => setCode(devCode)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">Подставить код разработки: <span className="font-mono font-semibold">{devCode}</span></button>}
        {error && <p className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="h-12 w-full" disabled={loading || !email || code.length !== 6}>{loading ? <><Loader2 className="animate-spin" size={16} /> Проверяем…</> : "Подтвердить email"}</Button>
        <Button type="button" variant="outline" className="w-full" onClick={resend} disabled={!email || cooldown > 0}><RefreshCw size={15} /> {cooldown ? `Повторить через ${cooldown} сек.` : "Отправить новый код"}</Button>
      </form>
    </AuthLayout>
  );
}
