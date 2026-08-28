import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleUserRound,
  Lock,
  ShieldCheck,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { METRIC_LABELS, TASK_TYPE_COLORS, TASK_TYPE_LABELS } from "@/lib/ml-arena";
import { cn } from "@/lib/utils";

const STATUS_META = {
  active: { label: "Активно", className: "text-accent" },
  upcoming: { label: "Скоро", className: "text-primary" },
  finalizing: { label: "Финализация", className: "text-primary" },
  finished: { label: "Завершено", className: "text-muted-foreground" },
};

function pluralize(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function getTimeLabel(competition, status) {
  if (status === "finished") return "Результаты опубликованы";
  if (status === "finalizing") return "Идёт финальный пересчёт";
  if (!competition.deadline) return "Дата уточняется";

  const diff = new Date(competition.deadline).getTime() - Date.now();
  if (status === "upcoming") {
    return `Старт до ${new Date(competition.deadline).toLocaleDateString("ru-RU")}`;
  }
  const days = Math.max(0, Math.ceil(diff / 86400000));
  return days > 0 ? `Осталось ${days} ${pluralize(days, "день", "дня", "дней")}` : "Последний день";
}

export default function CompetitionCard({ competition, status, meta, userState, featured = false, sequence = 1 }) {
  const color = TASK_TYPE_COLORS[competition.task_type] || "hsl(var(--primary))";
  const statusMeta = STATUS_META[status] || STATUS_META.active;
  const isRestricted = competition.is_private || ["application", "invite_only", "partner", "premium"].includes(competition.access_type || competition.access);
  const isCommunity = competition.origin === "community";
  const isRated = !isCommunity && competition.rated !== false;
  const sequenceLabel = String(sequence).padStart(2, "0");

  const cta = status === "finished"
    ? "Смотреть результаты"
    : status === "finalizing"
      ? "Открыть соревнование"
      : status === "upcoming"
        ? "Открыть описание"
        : userState?.rank
          ? "Открыть рейтинг"
          : userState?.joined
            ? "Продолжить участие"
            : isRestricted
              ? "Подробнее"
              : "Участвовать";

  return (
    <Link to={`/competitions/${competition.id}`} className="block">
      <Card
        className={cn(
          "group relative overflow-hidden p-0 transition-all duration-500 hover:-translate-y-1",
          featured
            ? "min-h-[430px] border-foreground bg-foreground text-background shadow-lg hover:shadow-xl"
            : "min-h-[270px] border-border bg-card hover:border-primary/45 hover:shadow-md",
        )}
      >
        <span
          className={cn("absolute left-0 right-0 top-0", featured ? "h-1.5" : "h-1")}
          style={{ backgroundColor: color }}
        />
        <div
          className={cn(
            "grid",
            featured
              ? "min-h-[430px] lg:grid-cols-[minmax(0,1fr)_340px]"
              : "min-h-[270px] md:grid-cols-[minmax(0,1fr)_260px]",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 flex-col justify-between",
              featured ? "px-6 py-8 md:px-10 md:py-10 lg:px-12" : "px-5 py-6 md:px-8 md:py-8",
            )}
          >
            <div>
              <div
                className={cn(
                  "mb-7 flex flex-col items-start gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                  featured ? "border-background/15" : "border-border",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase", featured ? "text-background" : isCommunity ? "text-violet-600 dark:text-violet-400" : "text-primary")}>
                    {isCommunity ? <CircleUserRound size={11} /> : <ShieldCheck size={11} />}
                    {isCommunity ? "Сообщество" : competition.origin === "official_partner" ? "Партнёрское" : "Официальное"}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase",
                      featured ? "text-background" : statusMeta.className,
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full bg-current",
                        status === "active" && "animate-pulse",
                      )}
                    />
                    {statusMeta.label}
                  </span>
                  <span className={cn("text-[10px] font-semibold uppercase", featured ? "text-background/60" : "text-muted-foreground")}>
                    {TASK_TYPE_LABELS[competition.task_type] || competition.task_type}
                  </span>
                  <span className={cn("text-[10px] font-semibold uppercase", featured ? "text-background/60" : "text-muted-foreground")}>
                    {meta.difficulty}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-semibold uppercase",
                      featured ? "text-background/60" : "text-muted-foreground",
                    )}
                  >
                    {isRestricted && <Lock size={10} />}
                    {meta.access}
                  </span>
                </div>
                <span className={cn("font-mono text-xs", featured ? "text-background/40" : "text-muted-foreground")}>
                  Событие {sequenceLabel}
                </span>
              </div>

              <h2
                className={cn(
                  "max-w-4xl font-heading font-bold leading-tight transition-colors",
                  featured
                    ? "text-3xl text-background md:text-5xl"
                    : "text-2xl group-hover:text-primary md:text-3xl",
                )}
              >
                {competition.title}
              </h2>
              <p
                className={cn(
                  "mt-4 max-w-3xl leading-7",
                  featured ? "text-base text-background/65 md:text-lg" : "text-sm text-muted-foreground",
                )}
              >
                {competition.description}
              </p>
            </div>

            <div
              className={cn(
                "mt-8 grid gap-4 border-t pt-5 text-xs sm:grid-cols-2 xl:grid-cols-4",
                featured ? "border-background/15 text-background/65" : "border-border text-muted-foreground",
              )}
            >
              <span className="inline-flex items-center gap-2"><Target size={15} /> {METRIC_LABELS[competition.metric]}</span>
              <span className="inline-flex items-center gap-2"><Users size={15} /> {competition.participants_count || 0} участников</span>
              <span className="inline-flex items-center gap-2"><CalendarClock size={15} /> {getTimeLabel(competition, status)}</span>
              <span className="inline-flex items-center gap-2"><Building2 size={15} /> {competition.company_name || "ML-Арена"}</span>
            </div>
          </div>

          <div
            className={cn(
              "flex flex-col justify-between border-t px-6 py-7 md:border-l md:border-t-0",
              featured
                ? "border-background/15 bg-background/5 lg:px-8 lg:py-10"
                : "border-border bg-secondary/20 md:px-7 md:py-8",
            )}
          >
            <div>
              <div className={cn("mb-8", !featured && "mb-5")}>
                <Trophy size={featured ? 34 : 24} className={featured ? "text-background" : "text-primary"} />
              </div>
              <p className={cn("text-[10px] font-medium uppercase", featured ? "text-background/45" : "text-muted-foreground")}>
                {isCommunity ? "Статус результата" : competition.prize_fund > 0 ? "Призовой фонд" : "Формат"}
              </p>
              <p className={cn("mt-2 font-heading font-bold", featured ? "text-3xl text-background md:text-4xl" : "text-2xl")}>
                {isCommunity ? "Практика" : competition.prize_fund > 0 ? `${competition.prize_fund.toLocaleString("ru-RU")} ₽` : isRated ? "Рейтинговое" : "Тренировочное"}
              </p>
              <div className={cn("mt-6 border-t pt-5 text-xs leading-5", featured ? "border-background/15 text-background/60" : "border-border text-muted-foreground")}>
                {isCommunity
                  ? "Без денежных призов и сезонных очков. Результат сохранится отдельно в истории сообщества."
                  : competition.prize_fund > 0
                  ? "Денежные призы получают лучшие участники. Сильный результат также заметят компании-партнёры."
                  : isRated ? "Результат влияет на рейтинг, лигу и подтверждённую часть ML-паспорта." : "Практика не влияет на сезонный рейтинг и положение в лиге."}
              </div>
            </div>

            {userState?.rank ? (
              <div className={cn("mt-7 border-t pt-5", featured ? "border-background/15" : "border-border")}>
                <div className="flex items-center justify-between text-xs">
                  <span className={featured ? "text-background/55" : "text-muted-foreground"}>Ваш результат</span>
                  <span className={cn("font-semibold", featured ? "text-background" : "text-accent")}>#{userState.rank}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className={featured ? "text-background/55" : "text-muted-foreground"}>Текущий результат</span>
                  <span className={cn("font-semibold", featured && "text-background")}>{userState.score}</span>
                </div>
              </div>
            ) : userState?.joined ? (
              <div className={cn("mt-7 flex items-center gap-2 border-t pt-5 text-xs", featured ? "border-background/15 text-background" : "border-border text-accent")}>
                <CheckCircle2 size={14} />
                Вы участвуете
              </div>
            ) : null}

            <span
              className={cn(
                "mt-7 inline-flex h-11 shrink-0 items-center justify-between gap-3 border px-4 text-sm font-semibold transition-colors",
                featured
                  ? "border-background/30 bg-background text-foreground group-hover:bg-background/90"
                  : "border-border text-primary group-hover:border-primary/40 group-hover:bg-primary/5",
              )}
            >
              <span>{cta}</span>
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
