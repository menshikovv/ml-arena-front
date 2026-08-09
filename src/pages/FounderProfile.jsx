import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Github,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Send,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import Avatar from "@/components/ml/Avatar";
import FounderSeasonTelegramCard from "@/components/ml/FounderSeasonTelegramCard";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const FUTURE_MODULES = [
  { to: "/competitions", title: "Соревнования", text: "Реальные задачи, призы и места в рейтинге", icon: Trophy, tone: "bg-cyan-500/10 text-cyan-600" },
  { to: "/duels", title: "Дуэли 1×1", text: "Быстрые матчи с участниками платформы", icon: Swords, tone: "bg-emerald-500/10 text-emerald-600" },
  { to: "/rating", title: "Рейтинг", text: "Позиция по подтверждённым результатам", icon: BarChart3, tone: "bg-violet-500/10 text-violet-600" },
  { to: "/ml-passport", title: "ML-паспорт", text: "Навыки, достижения и история участия", icon: UserRoundCheck, tone: "bg-primary/10 text-primary" },
];

const INTEREST_LABELS = {
  classification: "Классификация",
  regression: "Регрессия",
  nlp: "NLP",
  cv: "Компьютерное зрение",
  tabular: "Табличные данные",
  time_series: "Временные ряды",
  ranking: "Ранжирование",
  recsys: "Рекомендательные системы",
};

export default function FounderProfile() {
  const { user } = useAuth();
  const confirmed = user?.preregistration_status === "confirmed";
  const registeredAt = user?.registered_at
    ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(user.registered_at))
    : "";
  const profileFields = [user?.full_name, user?.city, user?.education_status, user?.organization, user?.bio, user?.github_url];
  const completedFields = profileFields.filter(Boolean).length;
  const completion = Math.round((completedFields / profileFields.length) * 100);
  const hasDetails = completedFields > 0 || user?.telegram_username || user?.ml_interests?.length;

  return (
    <div className="min-h-full bg-secondary/25 px-4 py-6 sm:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <Reveal>
          <section className="overflow-hidden border-y border-border bg-card shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-lg sm:border">
            <div className="h-1 bg-gradient-to-r from-primary via-cyan-400 to-violet-500" />
            <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8 lg:p-10">
                <div className="relative w-fit shrink-0">
                  <div className="rounded-full bg-card p-1.5 shadow-xl ring-1 ring-border">
                    <Avatar name={user?.full_name || user?.nickname} src={user?.avatar_url} size={112} />
                  </div>
                  <span
                    className={`absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-card text-white ${confirmed ? "bg-emerald-500" : "bg-amber-500"}`}
                    title={confirmed ? "Email подтверждён" : "Email ожидает подтверждения"}
                  >
                    {confirmed ? <Check size={15} strokeWidth={3} /> : <Clock3 size={14} />}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="break-words font-heading text-4xl font-bold leading-tight sm:text-5xl">{user?.nickname || "Участник"}</h1>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${confirmed ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : "border-amber-500/20 bg-amber-500/10 text-amber-700"}`}>
                      {confirmed ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                      {confirmed ? "Почта подтверждена" : "Ожидает подтверждения"}
                    </span>
                  </div>
                  {user?.full_name && <p className="mt-2 text-lg font-semibold text-foreground/80">{user.full_name}</p>}
                  <p className="mt-3 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={16} className="shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild size="lg"><Link to="/profile/edit"><Pencil size={16} /> Редактировать профиль</Link></Button>
                    {user?.github_url && (
                      <Button asChild size="lg" variant="outline">
                        <a href={user.github_url} target="_blank" rel="noopener noreferrer"><Github size={17} /> GitHub <ExternalLink size={14} /></a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-border bg-secondary/45 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-9">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Заполненность профиля</p>
                    <p className="mt-2 font-heading text-4xl font-bold tabular-nums">{completion}%</p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-card text-primary shadow-sm ring-1 ring-border">
                    <ShieldCheck size={22} />
                  </span>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-border/70">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${completion}%` }} />
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {completion === 100 ? "Профиль полностью готов к запуску ML-паспорта." : "Добавьте информацию о себе, чтобы профиль лучше представлял ваш опыт."}
                </p>
                {completion < 100 && <Link to="/profile/edit" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">Дополнить профиль <ArrowRight size={15} /></Link>}
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.06}>
          <section className={`border-y px-5 py-5 sm:rounded-lg sm:border sm:px-7 ${confirmed ? "border-emerald-500/20 bg-emerald-500/[0.06]" : "border-amber-500/20 bg-amber-500/[0.06]"}`}>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${confirmed ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                  {confirmed ? <Sparkles size={21} /> : <Clock3 size={21} />}
                </span>
                <div>
                  <h2 className="font-heading text-xl font-bold sm:text-2xl">{confirmed ? "Вы в списке участников ML-Арена Founder Season" : "Подтвердите адрес электронной почты"}</h2>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {confirmed
                      ? `Аккаунт готов к первым активностям${registeredAt ? `. Вы присоединились ${registeredAt}` : ""}.`
                      : "Введите код из письма, чтобы завершить регистрацию и получить доступ к активностям."}
                  </p>
                </div>
              </div>
              {!confirmed && <Button asChild className="shrink-0"><Link to={`/verify-email?email=${encodeURIComponent(user?.email || "")}`}>Подтвердить почту</Link></Button>}
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.1}>
          <section className="border-y border-border bg-card sm:rounded-lg sm:border">
            <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
              <div className="p-6 sm:p-8 lg:p-9">
                <h2 className="font-heading text-2xl font-bold sm:text-3xl">О себе</h2>
                {hasDetails ? (
                  <div className="mt-6">
                    {user?.bio
                      ? <p className="max-w-3xl text-base leading-8 text-muted-foreground">{user.bio}</p>
                      : <p className="text-base leading-7 text-muted-foreground">Добавьте короткое описание опыта и задач, которые вам интересны.</p>}
                    {user?.ml_interests?.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {user.ml_interests.map((item) => (
                          <span key={item} className="rounded-md border border-border bg-secondary/70 px-3 py-2 text-sm font-semibold transition-colors hover:border-primary/30 hover:bg-primary/5">
                            {INTEREST_LABELS[item] || item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 border-l-2 border-primary bg-secondary/50 px-5 py-4">
                    <p className="text-sm leading-6 text-muted-foreground">Расскажите о своём опыте и интересах. Эта информация станет основой будущего ML-паспорта.</p>
                    <Link to="/profile/edit" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">Заполнить профиль <ArrowRight size={15} /></Link>
                  </div>
                )}
              </div>

              <div className="border-t border-border p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-9">
                <h3 className="font-heading text-lg font-bold">Основная информация</h3>
                <div className="mt-5 space-y-1">
                  <ProfileFact icon={MapPin} label="Город" value={user?.city} />
                  <ProfileFact icon={GraduationCap} label="Университет" value={user?.education_status} />
                  <ProfileFact icon={BriefcaseBusiness} label="Компания" value={user?.organization} />
                  <ProfileFact icon={Send} label="Telegram" value={user?.telegram_username ? `@${user.telegram_username.replace(/^@/, "")}` : ""} />
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        <section>
          <Reveal delay={0.14} className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">Возможности ML-Арены</h2>
              <p className="mt-2 text-sm text-muted-foreground">Все результаты будут собираться в одном профиле после запуска.</p>
            </div>
          </Reveal>
          <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" delay={0.17}>
            {FUTURE_MODULES.map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.to}>
                  <Link
                    to={item.to}
                    className="group flex min-h-44 h-full flex-col border border-border bg-card p-5 shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${item.tone}`}><Icon size={21} /></span>
                      <ArrowRight size={18} className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                    <h3 className="mt-6 font-heading text-lg font-bold transition-colors group-hover:text-primary">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        <Reveal delay={0.2}><FounderSeasonTelegramCard /></Reveal>
      </div>
    </div>
  );
}

function ProfileFact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3.5 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground"><Icon size={17} /></span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`mt-0.5 truncate text-sm font-semibold ${value ? "text-foreground" : "text-muted-foreground"}`}>{value || "Не указано"}</p>
      </div>
    </div>
  );
}
