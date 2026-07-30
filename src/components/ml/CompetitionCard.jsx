import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Lock,
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
  if (status === "finalizing") return "Идёт private-пересчёт";
  if (!competition.deadline) return "Дата уточняется";

  const diff = new Date(competition.deadline).getTime() - Date.now();
  if (status === "upcoming") {
    return `Старт до ${new Date(competition.deadline).toLocaleDateString("ru-RU")}`;
  }
  const days = Math.max(0, Math.ceil(diff / 86400000));
  return days > 0 ? `Осталось ${days} ${pluralize(days, "день", "дня", "дней")}` : "Последний день";
}

export default function CompetitionCard({ competition, status, meta, userState }) {
  const color = TASK_TYPE_COLORS[competition.task_type] || "hsl(var(--primary))";
  const statusMeta = STATUS_META[status] || STATUS_META.active;
  const isRestricted = competition.is_private || meta.access !== "Открыто";

  const cta = status === "finished"
    ? "Смотреть результаты"
    : status === "finalizing"
      ? "Открыть соревнование"
      : status === "upcoming"
        ? "Открыть описание"
        : userState?.rank
          ? "Открыть leaderboard"
          : userState?.joined
            ? "Продолжить участие"
            : isRestricted
              ? "Подробнее"
              : "Участвовать";

  return (
    <Link to={`/competitions/${competition.id}`} className="block">
      <Card className="group relative min-h-[218px] overflow-hidden border-border bg-card p-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md">
        <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} />
        <div className="grid min-h-[218px] md:grid-cols-[minmax(0,1fr)_210px]">
          <div className="flex min-w-0 flex-col justify-between px-5 py-5 md:px-7 md:py-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase", statusMeta.className)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full bg-current", status === "active" && "animate-pulse")} />
                  {statusMeta.label}
                </span>
                <span className="border border-border px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  {TASK_TYPE_LABELS[competition.task_type] || competition.task_type}
                </span>
                <span className="border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {meta.difficulty}
                </span>
                <span className="inline-flex items-center gap-1 border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {isRestricted && <Lock size={10} />}
                  {meta.access}
                </span>
              </div>

              <h2 className="max-w-3xl font-heading text-xl font-bold leading-snug transition-colors group-hover:text-primary md:text-2xl">
                {competition.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground line-clamp-2">
                {competition.description}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Target size={14} /> {METRIC_LABELS[competition.metric]}</span>
              <span className="inline-flex items-center gap-1.5"><Users size={14} /> {competition.participants_count || 0} участников</span>
              <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} /> {getTimeLabel(competition, status)}</span>
              <span className="inline-flex items-center gap-1.5"><Building2 size={14} /> {competition.company_name || "ML-Арена"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border bg-secondary/20 px-5 py-4 md:flex-col md:items-stretch md:justify-center md:border-l md:border-t-0 md:px-6">
            <div>
              <p className="text-[10px] font-medium uppercase text-muted-foreground">
                {competition.prize_fund > 0 ? "Призовой фонд" : "Формат"}
              </p>
              <p className="mt-1 font-heading text-xl font-bold">
                {competition.prize_fund > 0 ? `${competition.prize_fund.toLocaleString("ru-RU")} ₽` : "Рейтинговое"}
              </p>
              <p className="mt-2 hidden text-xs text-muted-foreground md:block">
                {meta.publicSplit}% public · {100 - meta.publicSplit}% private
              </p>
            </div>

            {userState?.rank ? (
              <div className="hidden border-t border-border pt-3 md:block">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Ваш результат</span>
                  <span className="font-semibold text-accent">#{userState.rank}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Public score</span>
                  <span className="font-semibold">{userState.score}</span>
                </div>
              </div>
            ) : userState?.joined ? (
              <div className="hidden items-center gap-2 border-t border-border pt-3 text-xs text-accent md:flex">
                <CheckCircle2 size={14} />
                Вы участвуете
              </div>
            ) : null}

            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
              <Trophy size={15} className="hidden md:block" />
              <span className="hidden sm:inline">{cta}</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
