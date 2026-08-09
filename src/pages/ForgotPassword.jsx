import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 450);
  };

  return (
    <AuthLayout
      icon={sent ? CheckCircle2 : Mail}
      title={sent ? "Проверьте почту" : "Восстановить пароль"}
      subtitle={sent ? "Если аккаунт существует, письмо со ссылкой уже отправлено." : "Укажите email, с которым проходили предрегистрацию."}
      footer={<Link to="/login" className="font-medium text-primary hover:underline"><ArrowLeft className="mr-1 inline h-3.5 w-3.5" /> Вернуться ко входу</Link>}
    >
      {sent ? (
        <div className="space-y-5 text-center">
          <p className="rounded-md border border-primary/15 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
            Мы показываем одинаковый результат для любого адреса, чтобы посторонний не мог проверить наличие аккаунта.
          </p>
          <Button type="button" variant="outline" className="w-full" onClick={() => setSent(false)}>Указать другой email</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" autoComplete="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 pl-10" placeholder="you@example.com" maxLength={254} required />
            </div>
          </div>
          <Button type="submit" className="h-12 w-full" disabled={loading || !email}>
            {loading ? <><Loader2 className="animate-spin" size={16} /> Отправляем…</> : "Получить ссылку"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
