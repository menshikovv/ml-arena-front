import { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const [form, setForm] = useState({ password: "", confirmation: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const passwordValid = form.password.length >= 8 && form.password.length <= 128 && /[\p{L}]/u.test(form.password) && /\d/.test(form.password);

  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!passwordValid || form.password !== form.confirmation) return;
    setLoading(true);
    setError("");
    try {
      await resetPassword(resetToken, form.password);
      setLoading(false);
      setComplete(true);
    } catch (submitError) {
      setLoading(false);
      setError(submitError.code === "INVALID_ACTION_TOKEN" ? "Ссылка недействительна, уже использована или устарела." : submitError.message || "Не удалось обновить пароль.");
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout icon={AlertTriangle} title="Ссылка недействительна" subtitle="Запросите новое письмо для восстановления доступа." footer={<Link to="/forgot-password" className="font-medium text-primary hover:underline">Запросить новую ссылку</Link>}>
        <p className="text-center text-sm leading-6 text-muted-foreground">В ссылке нет токена восстановления или срок её действия закончился.</p>
      </AuthLayout>
    );
  }

  if (complete) {
    return (
      <AuthLayout icon={CheckCircle2} title="Пароль обновлён" subtitle="Теперь можно войти в аккаунт с новым паролем.">
        <Button asChild className="h-12 w-full"><Link to="/login">Войти</Link></Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Lock} title="Новый пароль" subtitle="Используйте от 8 до 128 символов, минимум одну букву и цифру.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">Новый пароль</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="h-11 px-10" minLength={8} maxLength={128} required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.password && !passwordValid && <p className="text-xs text-destructive">Нужны 8–128 символов, буква и цифра.</p>}
        </div>
        {error && <p className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        <div className="space-y-2">
          <Label htmlFor="confirmation">Повторите пароль</Label>
          <Input id="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirmation} onChange={(event) => setForm((current) => ({ ...current, confirmation: event.target.value }))} className="h-11" required />
          {form.confirmation && form.confirmation !== form.password && <p className="text-xs text-destructive">Пароли не совпадают.</p>}
        </div>
        <Button type="submit" className="h-12 w-full" disabled={loading || !passwordValid || form.confirmation !== form.password}>
          {loading ? <><Loader2 className="animate-spin" size={16} /> Сохраняем…</> : "Сохранить пароль"}
        </Button>
      </form>
    </AuthLayout>
  );
}
