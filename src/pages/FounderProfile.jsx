import { ArrowRight, CheckCircle2, CircleUserRound, Clock3, Github, Mail, MapPin, Pencil, School, Send, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Avatar from "@/components/ml/Avatar";
import FounderSeasonTelegramCard from "@/components/ml/FounderSeasonTelegramCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const FUTURE_MODULES = [
  { to: "/competitions", title: "Соревнования", text: "Первое событие ML Арены" },
  { to: "/duels", title: "Дуэли 1×1", text: "Матчи после запуска" },
  { to: "/rating", title: "Рейтинг", text: "Позиция по подтверждённым результатам" },
  { to: "/ml-passport", title: "ML-паспорт", text: "Навыки и история участия" },
];

export default function FounderProfile() {
  const { user } = useAuth();
  const confirmed = user?.preregistration_status === "confirmed";
  const hasDetails = Boolean(user?.full_name || user?.city || user?.organization || user?.bio || user?.ml_interests?.length);
  const registeredAt = user?.registered_at ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(user.registered_at)) : "";

  return (
    <div className="min-h-full bg-secondary/25 px-4 py-8 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-7">
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-primary via-cyan-400 to-violet-500" />
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <Avatar name={user?.full_name || user?.nickname} src={user?.avatar_url} size={88} className="ring-4 ring-primary/10" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-heading text-3xl font-bold">{user?.nickname}</h1>
              {user?.full_name && <p className="mt-1 text-base font-medium text-foreground">{user.full_name}</p>}
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Mail size={15} /> {user?.email}</p>
            </div>
            <Button asChild variant="outline"><Link to="/profile/edit"><Pencil size={15} /> Редактировать</Link></Button>
          </div>
        </section>

        <section className={`rounded-lg border p-6 ${confirmed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              {confirmed ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={22} /> : <Clock3 className="mt-0.5 shrink-0 text-amber-600" size={22} />}
              <div>
                <h2 className="font-heading text-lg font-bold">{confirmed ? "Предрегистрация подтверждена" : "Подтвердите email"}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{confirmed ? `Вы в списке участников Founder Season${registeredAt ? ` с ${registeredAt}` : ""}` : "Откройте письмо от ML Арены и перейдите по ссылке, чтобы завершить предрегистрацию."}</p>
              </div>
            </div>
            {!confirmed && <Button asChild size="sm"><Link to="/verify-email?token=demo">Подтвердить в демо</Link></Button>}
          </div>
        </section>

        <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading text-xl font-bold">О себе</h2>
              <CircleUserRound className="text-primary" size={22} />
            </div>
            {hasDetails ? (
              <div className="mt-6 space-y-5">
                {user?.bio && <p className="text-sm leading-7 text-muted-foreground">{user.bio}</p>}
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  {user?.city && <p className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {user.city}</p>}
                  {user?.education_status && <p className="flex items-center gap-2"><School size={16} className="text-primary" /> {user.education_status}</p>}
                  {user?.organization && <p className="flex items-center gap-2"><Sparkles size={16} className="text-primary" /> {user.organization}</p>}
                  {user?.telegram_username && <p className="flex items-center gap-2"><Send size={16} className="text-primary" /> @{user.telegram_username.replace(/^@/, "")}</p>}
                  {user?.github_url && <a href={user.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline"><Github size={16} /> GitHub</a>}
                </div>
                {user?.ml_interests?.length > 0 && <div className="flex flex-wrap gap-2">{user.ml_interests.map((item) => <span key={item} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium">{item}</span>)}</div>}
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-border p-6 text-sm leading-6 text-muted-foreground">
                Расскажите о своём опыте и интересах. Так профиль будет готов к запуску ML-паспорта.
                <Link to="/profile/edit" className="mt-3 flex items-center gap-1 font-medium text-primary">Заполнить профиль <ArrowRight size={14} /></Link>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <h2 className="font-heading text-xl font-bold">Будущие разделы</h2>
            <div className="mt-5 divide-y divide-border border-y border-border">
              {FUTURE_MODULES.map((item) => (
                <Link key={item.to} to={item.to} className="group flex items-center justify-between gap-4 py-4">
                  <div><p className="font-semibold group-hover:text-primary">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.text}</p></div>
                  <ArrowRight className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" size={17} />
                </Link>
              ))}
            </div>
          </section>
        </div>
        <FounderSeasonTelegramCard />
      </div>
    </div>
  );
}
