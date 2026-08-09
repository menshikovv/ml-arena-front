import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, MailCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const STATE_COPY = {
  expired: { icon: Clock3, title: "Ссылка устарела", text: "Срок действия ссылки закончился. Отправьте письмо ещё раз из профиля." },
  already_used: { icon: CheckCircle2, title: "Email уже подтверждён", text: "Аккаунт активен, можно продолжать подготовку к Founder Season." },
  invalid: { icon: AlertTriangle, title: "Ссылка недействительна", text: "Проверьте адрес или запросите новое письмо из профиля." },
};

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const token = searchParams.get("token");
  const forcedState = searchParams.get("state");
  const [status, setStatus] = useState(forcedState && STATE_COPY[forcedState] ? forcedState : token ? "loading" : "invalid");

  useEffect(() => {
    if (!token || status !== "loading") return;
    verifyEmail().then((result) => setStatus(result ? "success" : "invalid"));
  }, [status, token, verifyEmail]);

  if (status === "loading") {
    return <AuthLayout icon={MailCheck} title="Подтверждаем email" subtitle="Это займёт несколько секунд."><div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" size={28} /></div></AuthLayout>;
  }

  const state = status === "success"
    ? { icon: CheckCircle2, title: "Email подтверждён", text: "Предрегистрация завершена. Мы сообщим о старте первого соревнования." }
    : STATE_COPY[status];

  return (
    <AuthLayout icon={state.icon} title={state.title} subtitle={state.text}>
      <Button asChild className="h-12 w-full"><Link to={status === "invalid" || status === "expired" ? "/profile" : "/profile"}>Перейти в профиль</Link></Button>
      <Button asChild variant="ghost" className="mt-2 w-full"><Link to="/">На главную</Link></Button>
    </AuthLayout>
  );
}
