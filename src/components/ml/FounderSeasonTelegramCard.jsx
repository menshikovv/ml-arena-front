import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, Mail, Send, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { FOUNDER_TELEGRAM_URL, trackFounderEvent } from "@/lib/founder-season";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function FounderSeasonTelegramCard({ compact = false, embedded = false, pending = false }) {
  const { isAuthenticated, user, resendVerification } = useAuth();
  const location = useLocation();
  const pendingEmail = pending || (isAuthenticated && user?.account_status === "pending_verification");
  const telegramAvailable = Boolean(FOUNDER_TELEGRAM_URL);
  const [resending, setResending] = useState(false);

  const openTelegram = () => {
    trackFounderEvent("telegram_cta_click", {
      origin_route: location.pathname,
      user_status: !isAuthenticated ? "guest" : pendingEmail ? "pending_email" : "confirmed",
    });
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      toast({ title: "Письмо отправлено повторно" });
    } finally {
      setResending(false);
    }
  };

  return (
    <section className={embedded ? "border-t border-border pt-5" : "overflow-hidden rounded-lg border border-primary/20 bg-card shadow-[0_18px_45px_rgba(37,99,235,0.08)]"}>
      <div className={compact ? "p-5" : "p-6 md:p-8"}>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="flex max-w-2xl items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/15">
              <Send size={20} />
            </span>
            <div>
              <h2 className={`${compact ? "text-xl" : "text-2xl md:text-3xl"} font-heading font-bold`}>
                Все активности Founder Season сейчас проходят в Telegram
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Пока мы готовим соревнования, дуэли и ML-паспорт, в Telegram выходят мини-задачи, разборы, анонсы и материалы к первому запуску.
              </p>
              <div className="mt-5 flex items-start gap-2 text-sm font-medium">
                {pendingEmail ? <Mail className="mt-0.5 shrink-0 text-primary" size={17} /> : <CheckCircle2 className="mt-0.5 shrink-0 text-accent" size={17} />}
                <span>
                {pendingEmail
                    ? "Предрегистрация создана. Осталось подтвердить email."
                  : !isAuthenticated
                    ? "Создайте аккаунт, чтобы попасть в первое соревнование."
                    : "Вы зарегистрировались на первое соревнование."}
                </span>
              </div>
            </div>
          </div>

          <div className="flex min-w-52 flex-col gap-3">
            {pendingEmail ? (
              <Button type="button" onClick={handleResend} disabled={resending}>{resending ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />} Отправить письмо ещё раз</Button>
            ) : !isAuthenticated ? (
              <Button asChild>
                <Link to="/register"><UserPlus size={16} /> Зарегистрироваться</Link>
              </Button>
            ) : telegramAvailable ? (
              <Button asChild>
                <a href={FOUNDER_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={openTelegram}>
                  <Send size={16} /> Перейти в Telegram
                </a>
              </Button>
            ) : (
              <Button disabled>Ссылка временно недоступна</Button>
            )}

            {(!isAuthenticated || pendingEmail) && telegramAvailable && (
              <Button asChild variant="outline">
                <a href={FOUNDER_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={openTelegram}>
                  Telegram <ArrowRight size={15} />
                </a>
              </Button>
            )}
            {isAuthenticated && !pendingEmail && (
              <Button asChild variant="outline"><Link to="/profile/edit">Редактировать профиль</Link></Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
