import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
  Upload,
  UserRoundSearch,
  X,
  Zap,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { api, uploadFile } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import { PageFrame, PageHeader } from "@/components/ml/PageFrame";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

const TASKS = {
  classification: {
    label: "Классификация",
    title: "Детекция подозрительных транзакций",
    description: "Построй бинарный классификатор транзакций и максимизируй ROC-AUC на скрытой выборке.",
    metric: "roc_auc",
  },
  regression: {
    label: "Регрессия",
    title: "Прогноз стоимости недвижимости",
    description: "Предскажи стоимость объекта по табличным признакам. Метрика качества — RMSE.",
    metric: "rmse",
  },
  nlp: {
    label: "NLP",
    title: "Классификация тональности отзывов",
    description: "Определи тональность коротких отзывов. Метрика качества — Accuracy.",
    metric: "accuracy",
  },
  cv: {
    label: "Компьютерное зрение",
    title: "Классификация изображений товаров",
    description: "Определи категорию товара по изображению. Метрика качества — F1.",
    metric: "f1",
  },
  time_series: {
    label: "Временные ряды",
    title: "Прогноз спроса по часам",
    description: "Предскажи следующий шаг временного ряда. Метрика качества — MAE.",
    metric: "mae",
  },
  ranking: {
    label: "Ранжирование",
    title: "Ранжирование результатов поиска",
    description: "Упорядочь документы по релевантности запросу. Метрика качества — NDCG.",
    metric: "ndcg",
  },
  clustering: {
    label: "Кластеризация",
    title: "Сегментация пользовательских профилей",
    description: "Раздели пользователей на устойчивые группы по поведению. Метрика качества — Silhouette score.",
    metric: "silhouette",
  },
  recsys: {
    label: "RecSys",
    title: "Персональные рекомендации товаров",
    description: "Подбери товары, которые с высокой вероятностью заинтересуют пользователя. Метрика качества — NDCG.",
    metric: "ndcg",
  },
};

const RULES = [
  { icon: Clock3, title: "60 минут", text: "Одинаковое основное время для обоих участников." },
  { icon: Upload, title: "Одна отправка", text: "Каждый участник отправляет один финальный CSV." },
  { icon: Trophy, title: "Лучший результат", text: "Побеждает лучший результат на одной скрытой выборке." },
  { icon: ShieldCheck, title: "Равные правила", text: "Результат соперника скрыт до завершения матча." },
];

const CHALLENGE_LEVELS = {
  easy: {
    label: "Лёгкий",
    description: "Для разминки и первого подтверждения навыка.",
  },
  medium: {
    label: "Средний",
    description: "Потребуется уверенная ML-работа, одного базового решения обычно недостаточно.",
  },
  advanced: {
    label: "Продвинутый",
    description: "Сильный короткий результат против сложного эталонного решения.",
  },
};

function TimerDisplay({ seconds, compact = false }) {
  const safeSeconds = Math.max(0, seconds || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return (
    <span className={cn("font-mono font-bold tabular-nums", compact ? "text-xl" : "text-3xl")}>
      {String(minutes).padStart(2, "0")}:{String(rest).padStart(2, "0")}
    </span>
  );
}

function getWinRate(opponent) {
  const matches = Number(opponent.wins || 0) + Number(opponent.losses || 0);
  return matches ? Math.round((Number(opponent.wins || 0) / matches) * 100) : null;
}

function getDuelDate(duel) {
  const value = duel.created_date || duel.started_at;
  return value ? new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }) : "—";
}

function adaptDuel(duel, currentUserId) {
  const player1 = duel.player1 || {};
  const player2 = duel.player2 || {};
  const meIsPlayer1 = player1.user_id === currentUserId;
  const opponent = meIsPlayer1 ? player2 : player1;
  const won = Boolean(currentUserId && duel.winner_id === currentUserId);
  const rawRatingDelta = duel.rating_change?.[currentUserId];
  const ratingDelta = rawRatingDelta == null ? null : Number(rawRatingDelta);
  return {
    ...duel,
    player1_name: meIsPlayer1 ? "Ты" : player1.user_name,
    player2_name: meIsPlayer1 ? player2.user_name : "Ты",
    player1_rating: player1.rating,
    player2_rating: player2.rating,
    winner_name: duel.winner_id ? (won ? "Ты" : opponent.user_name) : null,
    rating_change: ratingDelta == null ? null : Math.abs(ratingDelta),
    rating_delta: ratingDelta,
    opponent_avatar_url: opponent.avatar_url,
    created_date: duel.created_at,
  };
}

function DuelNav({ view, className }) {
  const items = [
    { id: "overview", label: "Обзор", icon: Swords, to: "/duels" },
    { id: "history", label: "История", icon: History, to: "/duels/history" },
    { id: "rating", label: "Рейтинг", icon: BarChart3, to: "/rating?tab=duels" },
  ];

  return (
    <div className={cn("mb-7 flex items-center gap-1 overflow-x-auto border-b border-border", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            to={item.to}
            className={cn(
              "relative flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
              view === item.id && "text-primary",
            )}
          >
            <Icon size={16} />
            {item.label}
            {view === item.id && (
              <motion.span layoutId="duel-nav" className="absolute inset-x-2 bottom-0 h-0.5 bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

function RatingSummary({ rating, isLoading }) {
  const duelRating = rating?.duel_rating ?? null;
  const duelRank = rating?.duel_rank ?? rating?.rank ?? null;
  return (
    <div className="grid min-w-0 grid-cols-2 md:grid-cols-4">
      <div className="flex min-h-28 flex-col justify-between border-b border-r border-border/80 p-5 md:border-b-0">
        <span className="text-xs font-medium text-muted-foreground">Рейтинг сезона</span>
        <span className="font-heading text-3xl font-bold tabular-nums">{isLoading ? "…" : duelRating ?? "—"}</span>
      </div>
      <div className="flex min-h-28 flex-col justify-between border-b border-border/80 p-5 md:border-b-0 md:border-r">
        <span className="text-xs font-medium text-muted-foreground">Место</span>
        <span className="font-heading text-3xl font-bold tabular-nums">{isLoading ? "…" : duelRank ? `#${duelRank}` : "—"}</span>
      </div>
      <div className="flex min-h-28 flex-col justify-between border-r border-border/80 p-5">
        <span className="text-xs font-medium text-muted-foreground">Лига</span>
        {duelRating === null ? <span className="text-sm text-muted-foreground">Не определена</span> : <LeagueBadge rating={duelRating} size="sm" />}
      </div>
      <div className="flex min-h-28 flex-col justify-between p-5">
        <span className="text-xs font-medium text-muted-foreground">Матчи сезона</span>
        <p className="text-sm font-semibold text-accent">{rating?.calibration_status === "calibrated" ? "Рейтинг открыт" : "Калибровка"}</p>
        <p className="mt-1 text-xs text-muted-foreground">{rating ? `${rating.wins} побед · ${rating.losses} поражений` : "Пока нет результатов"}</p>
      </div>
    </div>
  );
}

function ChallengeChooser({ open, onClose, taskType, onTaskTypeChange, onStart }) {
  const [level, setLevel] = useState("medium");

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="arena-challenge-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between gap-5 border-b border-border p-5 md:p-7">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground"><BrainCircuit size={21} /></span>
                  <div>
                    <h2 id="arena-challenge-title" className="font-heading text-2xl font-bold">Вызов ML-Арены</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Задача из банка на 60 минут с выбранным уровнем бейзлайна.</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть"><X size={18} /></Button>
            </div>

            <div className="p-5 md:p-7">
              <h3 className="text-sm font-semibold">Направление</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Направление вызова">
                {Object.entries(TASKS).map(([key, task]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={taskType === key}
                    onClick={() => onTaskTypeChange(key)}
                    className={cn(
                      "min-h-11 rounded-md border px-3 text-left text-xs font-semibold transition-colors",
                      taskType === key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50",
                    )}
                  >
                    {task.label}
                  </button>
                ))}
              </div>

              <h3 className="mt-7 text-sm font-semibold">Уровень бейзлайна</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Уровень вызова">
                {Object.entries(CHALLENGE_LEVELS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={level === key}
                    onClick={() => setLevel(key)}
                    className={cn(
                      "min-h-44 rounded-lg border p-5 text-left transition-all hover:-translate-y-0.5",
                      level === key ? "border-primary bg-primary/7 shadow-sm" : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    <span className="font-heading text-lg font-bold">{item.label}</span>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-md border border-border bg-secondary/40 p-4 text-xs leading-5 text-muted-foreground">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-primary" />
                Это не матч с ботом. Вызов не входит в число человеческих дуэлей и процент побед. За первую победу над новой задачей можно получить небольшой неотрицательный бонус; повторное решение остаётся тренировкой.
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border p-5 sm:flex-row sm:justify-end md:px-7">
              <Button variant="outline" onClick={onClose}>Назад</Button>
              <Button onClick={() => onStart(level)}><Clock3 size={16} /> Начать 60 минут</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OpponentCard({ opponent, onChallenge, pending, currentRating }) {
  const hasRatings = Number.isFinite(currentRating) && Number.isFinite(opponent.rating);
  const ratingGap = hasRatings ? Math.abs(currentRating - opponent.rating) : null;
  const withinRatingRange = ratingGap === null || ratingGap <= 200;
  const winRate = getWinRate(opponent);

  return (
    <Card className="group h-full border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar name={opponent.name} src={opponent.avatar} size={42} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{opponent.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {opponent.rating === null ? <span className="text-xs text-muted-foreground">Нет калибровки</span> : <><LeagueBadge rating={opponent.rating} size="sm" /><span className="text-xs text-muted-foreground">{opponent.rating} Elo</span></>}
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{winRate === null ? "—" : `${winRate}%`}</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className={cn("text-xs", withinRatingRange ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400")}>
          {ratingGap === null ? "Рейтинг определит сервер" : `Разница ${ratingGap} Elo`}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => onChallenge(opponent)}
          aria-label={`Вызвать ${opponent.name}`}
        >
          <Swords size={14} />
          Вызвать
        </Button>
      </div>
    </Card>
  );
}

function RecentDuels({ duels, isLoading }) {
  if (isLoading) {
    return <div className="flex min-h-36 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }
  if (!duels.length) {
    return <div className="border-y border-dashed border-border py-12 text-center"><Swords className="mx-auto text-muted-foreground" size={24} /><p className="mt-3 text-sm font-medium">Завершённых дуэлей пока нет</p><p className="mt-1 text-xs text-muted-foreground">После первого матча здесь появится его результат.</p></div>;
  }

  return (
    <div className="divide-y divide-border border-y border-border">
      {duels.slice(0, 5).map((duel) => {
        const won = duel.winner_name === "Ты";
        const draw = duel.is_draw;
        const opponent = duel.player1_name === "Ты" ? duel.player2_name : duel.player1_name;
        const opponentRating = duel.player1_name === "Ты" ? duel.player2_rating : duel.player1_rating;
        return (
          <Link
            key={duel.id}
            to={`/duels/${duel.id}/${duel.status === "completed" ? "result" : "live"}`}
            className="group grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-3 py-3 transition-colors hover:text-primary sm:grid-cols-[72px_1fr_120px_100px_auto]"
          >
            <span className="hidden text-xs text-muted-foreground sm:block">{getDuelDate(duel)}</span>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={opponent} size={34} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{opponent}</p>
                <p className="truncate text-xs text-muted-foreground">{duel.task_title}</p>
              </div>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:block">{opponentRating} Elo</span>
            <span
              className={cn(
                "justify-self-end text-xs font-semibold",
                duel.status !== "completed" ? "text-primary" : draw ? "text-muted-foreground" : won ? "text-accent" : "text-destructive",
              )}
            >
              {duel.status !== "completed" ? "Идёт сейчас" : draw ? "Ничья" : duel.rating_change == null ? (won ? "Победа" : "Поражение") : won ? `Победа +${duel.rating_change}` : `Поражение −${duel.rating_change}`}
            </span>
            <ChevronRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </div>
  );
}

function DuelGuideDialog({ open, onClose }) {
  const steps = [
    { number: "01", icon: Target, title: "Выбери направление", text: "Определи тип задачи и начни быструю дуэль или вызови конкретного соперника." },
    { number: "02", icon: Swords, title: "Получи общий старт", text: "Оба участника получают одну задачу, одинаковые условия и одинаковый лимит времени." },
    { number: "03", icon: Upload, title: "Загрузи решение", text: "На решение даётся 60 минут. Загрузи CSV, после чего платформа проверит формат и результат." },
    { number: "04", icon: Trophy, title: "Получи результат", text: "Итог меняет рейтинг, а завершённая дуэль пополняет ML-паспорт подтверждённым результатом." },
  ];

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="duel-guide-title"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between gap-6 border-b border-border p-5 md:p-6">
              <div>
                <h2 id="duel-guide-title" className="font-heading text-2xl font-bold">Как проходит дуэль</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Короткий рейтинговый матч, в котором условия одинаковы для обоих участников.</p>
              </div>
              <button type="button" onClick={onClose} title="Закрыть" aria-label="Закрыть инструкцию" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-px bg-border sm:grid-cols-2">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <div key={step.number} className="relative min-h-44 bg-card p-5 md:p-6">
                    <span className="absolute right-5 top-5 font-mono text-[11px] text-muted-foreground">{step.number}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={19} /></span>
                    <h3 className="mt-5 font-heading text-base font-bold">{step.title}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{step.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-start gap-3 border-t border-border bg-secondary/45 p-5 text-sm leading-6 text-muted-foreground md:px-6">
              <ShieldCheck size={19} className="mt-0.5 shrink-0 text-accent" />
              Premium не даёт преимущества в подборе соперника, числе попыток или результате матча.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OverviewView({ duels, challenges, opponents, isLoading, createDuel, isCreating, taskType, setTaskType, onChallengeAction, challengePending, currentUserId, currentRating, currentRatingRow, ratingLoading }) {
  const [searchNick, setSearchNick] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const matchedOpponent = useMemo(() => {
    if (!searchNick.trim()) return null;
    return opponents.find((opponent) => opponent.name.toLowerCase().includes(searchNick.trim().toLowerCase()));
  }, [opponents, searchNick]);

  return (
    <>
      <Reveal>
        <section>
          <PageHeader className="border-b-0 pb-0" title="Дуэли по машинному обучению" description="Выберите направление, получите одинаковую задачу с соперником и за 60 минут покажите лучший результат.">
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 px-6">
                  <Link to="/duels/matchmaking">
                    <Zap size={17} />
                    Найти соперника
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 px-6"
                  onClick={() => document.getElementById("nickname-search")?.focus()}
                >
                  <UserRoundSearch size={17} />
                  Вызвать по нику
                </Button>
                <Button variant="outline" size="lg" className="h-11 px-5" onClick={() => setGuideOpen(true)}>
                  <CircleHelp size={17} />
                  Как это работает
                </Button>
              </div>
          </PageHeader>
          <DuelNav view="overview" className="mt-6" />
          <div className="mt-6 overflow-hidden border border-border bg-card"><RatingSummary rating={currentRatingRow} isLoading={ratingLoading} /></div>
        </section>
      </Reveal>

      {challenges.length > 0 && <Reveal delay={0.04} className="border-b border-border py-7"><div className="mb-4 flex items-center justify-between"><h2 className="font-heading text-xl font-bold">Ожидающие вызовы</h2><span className="text-xs text-muted-foreground">{challenges.length}</span></div><div className="space-y-2">{challenges.map((challenge) => { const outgoing = challenge.direction === "outgoing" || challenge.challenger_id === currentUserId || challenge.challenger?.id === currentUserId; const opponent = outgoing ? challenge.opponent : challenge.challenger; const name = opponent?.nickname || (outgoing ? challenge.opponent_name : challenge.challenger_name) || "Соперник"; return <div key={challenge.id} className="flex flex-col gap-4 border border-border bg-card p-4 sm:flex-row sm:items-center"><Avatar name={name} size={40} /><div className="min-w-0 flex-1"><p className="font-semibold">{name}</p><p className="mt-1 text-xs text-muted-foreground">{outgoing ? "Исходящий вызов" : "Входящий вызов"} · {TASKS[challenge.task_type]?.label || challenge.task_type} · {challenge.rated === false ? "без рейтинга" : "рейтинговая"}</p></div><div className="flex gap-2">{outgoing ? <Button size="sm" variant="outline" onClick={() => onChallengeAction(challenge.id, "withdraw")} disabled={challengePending}>Отозвать</Button> : <><Button size="sm" onClick={() => onChallengeAction(challenge.id, "accept")} disabled={challengePending}>Принять</Button><Button size="sm" variant="outline" onClick={() => onChallengeAction(challenge.id, "decline")} disabled={challengePending}>Отклонить</Button></>}</div></div>; })}</div></Reveal>}

      <Reveal delay={0.06} className="py-9">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold md:text-2xl">Выбери направление</h2>
          </div>
          <span className="hidden text-xs text-muted-foreground md:block">Рейтинг соперника: ±200 очков</span>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4" role="radiogroup" aria-label="Направление дуэли">
          {Object.entries(TASKS).map(([key, task]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={taskType === key}
              onClick={() => setTaskType(key)}
              className={cn(
                "min-h-12 border px-3 text-left text-sm font-medium transition-colors",
                taskType === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50 hover:text-primary",
              )}
            >
              {task.label}
            </button>
          ))}
        </div>
      </Reveal>

      <section className="grid gap-8 border-t border-border py-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
        <Reveal delay={0.08}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold">Найти соперника</h2>
            </div>
            <Search size={20} className="text-muted-foreground" />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <Input
              id="nickname-search"
              value={searchNick}
              onChange={(event) => setSearchNick(event.target.value)}
              placeholder="Например, ai_glider"
              className="h-11 pl-10"
            />
          </div>
          <AnimatePresence mode="wait">
            {matchedOpponent ? (
              <motion.div
                key={matchedOpponent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-3"
              >
                <OpponentCard opponent={matchedOpponent} onChallenge={(opponent) => createDuel(opponent, taskType)} pending={isCreating} currentRating={currentRating} />
              </motion.div>
            ) : searchNick.trim().length > 1 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 border border-dashed border-border px-4 py-7 text-center"
              >
                <p className="text-sm font-medium">Соперник не найден</p>
                <p className="mt-1 text-xs text-muted-foreground">Проверь ник или выбери игрока из списка справа.</p>
              </motion.div>
            ) : (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-muted-foreground">
                Для рейтинговой дуэли разница рейтинга должна быть не больше 200 очков.
              </motion.p>
            )}
          </AnimatePresence>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold">Ближайшие по рейтингу</h2>
            </div>
            <span className="text-xs text-muted-foreground">Победы</span>
          </div>
          <div className="space-y-2">
            {opponents.slice(0, 3).map((opponent) => (
              <OpponentCard
                key={opponent.id}
                opponent={opponent}
                onChallenge={(item) => createDuel(item, taskType)}
                pending={isCreating}
                currentRating={currentRating}
              />
            ))}
          </div>
        </Reveal>
      </section>

      <section className="border-t border-border py-9">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold md:text-2xl">Последние дуэли</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/duels/history">Вся история <ArrowRight size={14} /></Link>
          </Button>
        </div>
        <RecentDuels duels={duels} isLoading={isLoading} />
      </section>

      <Stagger className="grid border-t border-border py-9 sm:grid-cols-2 lg:grid-cols-4" delay={0.08}>
        {RULES.map((rule, index) => {
          const Icon = rule.icon;
          return (
            <StaggerItem key={rule.title} className={cn("p-5", index > 0 && "border-t border-border sm:border-l sm:border-t-0")}>
              <Icon size={20} className="text-primary" />
              <h3 className="mt-4 font-heading text-base font-bold">{rule.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{rule.text}</p>
            </StaggerItem>
          );
        })}
      </Stagger>

      <DuelGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}

function MatchmakingView({ onCreate, opponents, pending, taskType, setTaskType, openChallenge, canPlay, currentRating }) {
  const [status, setStatus] = useState("idle");
  const [opponent, setOpponent] = useState(null);
  const [ticket, setTicket] = useState(null);
  const navigate = useNavigate();
  const ticketQuery = useQuery({
    queryKey: ["duel-matchmaking", ticket?.id],
    queryFn: () => api.matchmaking.get(ticket.id),
    enabled: canPlay && Boolean(ticket?.id) && status === "searching",
    refetchInterval: 1500,
  });

  const startMutation = useMutation({
    mutationFn: () => api.matchmaking.search({ task_type: taskType, mode: "rated" }),
    onSuccess: (nextTicket) => { setTicket(nextTicket); setStatus(nextTicket.status || "searching"); setOpponent(null); },
    onError: (error) => toast.error(error.message || "Не удалось начать поиск"),
  });

  const start = () => {
    if (!canPlay) {
      toast("Поиск соперника требует аккаунт участника.");
      return;
    }
    setStatus("searching");
    setOpponent(null);
    startMutation.mutate();
  };

  useEffect(() => {
    const current = ticketQuery.data;
    if (!current) return;
    if (current.duel_id || current.status === "matched") {
      if (current.duel_id) navigate(`/duels/${current.duel_id}`);
      else setStatus("found");
    }
    if (current.status === "fallback_available") setStatus("empty");
    if (current.status === "cancelled") setStatus("cancelled");
    if (current.status === "challenge_started") {
      const challengeId = current.challenge_instance_id || current.arena_challenge_id;
      if (challengeId) navigate(`/duels/challenges/${challengeId}`);
    }
  }, [navigate, opponents, ticketQuery.data]);
  const secondsUntilFallback = ticketQuery.data?.seconds_until_fallback;

  const cancel = async () => {
    if (!canPlay) return;
    if (ticket?.id) await api.matchmaking.cancel(ticket.id).catch((error) => toast.error(error.message));
    setStatus("cancelled");
  };
  const continueSearch = async () => {
    if (!canPlay) return;
    if (!ticket?.id) return start();
    try {
      const nextTicket = await api.matchmaking.continue(ticket.id);
      setTicket(nextTicket);
      setStatus(nextTicket.status || "searching");
    } catch (error) {
      toast.error(error.message || "Не удалось продолжить поиск");
    }
  };

  return (
    <Reveal>
      <div className="mx-auto max-w-3xl py-4 md:py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/duels"><ArrowLeft size={15} /> К дуэлям</Link>
        </Button>
        <div className="border-y border-border bg-card px-5 py-8 text-center md:px-10 md:py-12">
          <motion.div
            animate={status === "searching" ? { rotate: 360 } : { rotate: 0 }}
            transition={status === "searching" ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"
          >
            {status === "found" ? <Check size={28} /> : status === "cancelled" ? <X size={28} /> : <Target size={28} />}
          </motion.div>
          <h1 className="mt-6 font-heading text-2xl font-bold md:text-3xl">
            {status === "searching"
              ? "Ищем равного соперника"
              : status === "found"
                ? "Соперник найден"
                : status === "cancelled"
                  ? "Поиск остановлен"
                  : "Быстрая дуэль"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {status === "searching"
              ? `${currentRating === null ? "Сервер подбирает доступного участника" : "Сервер учитывает текущий рейтинг"}${secondsUntilFallback == null ? "" : ` · вариант вызова через ${secondsUntilFallback} сек.`}`
              : status === "empty"
                ? "Можно оставить поиск активным или сразу получить новую задачу против эталонного результата ML-Арены."
              : "Выбери направление. Условия, таймер и лимиты одинаковы для обоих участников."}
          </p>

          {status !== "searching" && status !== "found" && (
            <div className="mx-auto mt-7 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(TASKS).map(([key, task]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTaskType(key)}
                  className={cn(
                    "min-h-11 border px-3 text-xs font-medium transition-colors",
                    taskType === key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50",
                  )}
                >
                  {task.label}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {status === "found" && opponent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mx-auto mt-7 max-w-md border-y border-border py-5"
              >
                <div className="flex items-center gap-4 text-left">
                  <Avatar name={opponent.name} size={50} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{opponent.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {opponent.rating === null ? <span className="text-xs text-muted-foreground">Рейтинг ещё не откалиброван</span> : <><LeagueBadge rating={opponent.rating} size="sm" /><span className="text-xs text-muted-foreground">{opponent.rating} очков{getWinRate(opponent) === null ? "" : ` · ${getWinRate(opponent)}% побед`}</span></>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {status === "searching" ? (
              <Button variant="outline" onClick={cancel}><X size={16} /> Отменить поиск</Button>
            ) : status === "found" ? (
              <>
                <Button onClick={() => onCreate(opponent, taskType)} disabled={pending}>
                  {pending ? <Loader2 className="animate-spin" /> : <Swords size={16} />}
                  Подтвердить дуэль
                </Button>
                <Button variant="outline" onClick={start}>Искать другого</Button>
              </>
            ) : status === "empty" ? (
              <>
                <Button onClick={() => openChallenge(ticket)}><BrainCircuit size={16} /> Выбрать вызов</Button>
                <Button variant="outline" onClick={continueSearch}>Продолжить поиск</Button>
              </>
            ) : (
              <Button onClick={start} disabled={startMutation.isPending}>{startMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} Найти соперника</Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 border-b border-border">
          {[
            ["Сервер", "подбор соперника"],
            ["ZIP", "данные задачи"],
            ["Одна", "финальная отправка"],
          ].map(([value, label], index) => (
            <div key={value} className={cn("p-4 text-center", index > 0 && "border-l border-border")}>
              <p className="font-heading text-lg font-bold">{value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function ArenaChallengeView() {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const { user } = useAuth();
  const canPlay = ["user", "admin"].includes(user?.role);
  const challengeQuery = useQuery({ queryKey: ["arena-challenge", attemptId], queryFn: () => api.arenaChallenges.get(attemptId), enabled: canPlay && Boolean(attemptId && attemptId !== "new"), refetchInterval: (query) => ["active", "scoring"].includes(query.state.data?.status) ? 2000 : false });
  const challenge = challengeQuery.data;
  const directionKey = challenge?.task_type;
  const task = { label: TASKS[directionKey]?.label || directionKey, title: challenge?.task_title, description: challenge?.task_description, metric: challenge?.metric };
  const levelKey = challenge?.difficulty || challenge?.challenge_difficulty;
  const level = { label: CHALLENGE_LEVELS[levelKey]?.label || challenge?.difficulty_label || levelKey, benchmark: Number(challenge?.benchmark_score), reward: challenge?.benchmark_rating };
  const [seconds, setSeconds] = useState(0);
  const [uploadState, setUploadState] = useState("idle");
  const bestScore = challenge?.best_score == null ? null : Number(challenge.best_score);
  const finished = ["won", "lost", "expired", "cancelled"].includes(challenge?.status);
  const won = Boolean(challenge?.benchmark_beaten ?? challenge?.result?.benchmark_beaten);

  useEffect(() => {
    if (!challenge) return;
    if (challenge.seconds_remaining !== undefined) setSeconds(challenge.seconds_remaining);
    else if (challenge.ends_at) setSeconds(Math.max(0, Math.ceil((new Date(challenge.ends_at).getTime() - Date.now()) / 1000)));
  }, [challenge]);

  useEffect(() => {
    if (finished) return undefined;
    const interval = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [finished]);

  const submitResult = async (file) => {
    if (!canPlay) {
      toast("Отправка решения требует аккаунт участника.");
      return;
    }
    if (!file || !challenge?.id || challenge.attempts_remaining === 0 || uploadState === "validating") return;
    setUploadState("validating");
    try {
      const upload = await uploadFile(file, "arena_challenge_submission", { challenge_instance_id: challenge.id });
      const result = await api.arenaChallenges.submit(challenge.id, upload.id);
      setUploadState("scored");
      toast.success(result.benchmark_beaten ? "Эталон превзойдён" : "Результат проверен");
      challengeQuery.refetch();
    } catch (error) {
      setUploadState("idle");
      toast.error(error.message || "Не удалось проверить CSV");
    }
  };

  const finishChallenge = async () => {
    if (!canPlay) {
      toast("Завершение вызова требует аккаунт участника.");
      return;
    }
    try { await api.arenaChallenges.finish(challenge.id); await challengeQuery.refetch(); }
    catch (error) { toast.error(error.message || "Не удалось завершить вызов"); }
  };

  if (!canPlay || attemptId === "new") return <div className="py-16 text-center"><Target className="mx-auto text-primary" /><h2 className="mt-4 font-heading text-2xl font-bold">Сначала запустите поиск</h2><p className="mt-2 text-sm text-muted-foreground">Вызов ML-Арены создаётся сервером после ожидания соперника.</p><Button asChild className="mt-5"><Link to="/duels">Перейти к дуэлям</Link></Button></div>;
  if (challengeQuery.isLoading) return <div className="flex min-h-72 items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  if (challengeQuery.error || !challenge) return <div className="py-16 text-center"><Target className="mx-auto text-primary" /><h2 className="mt-4 font-heading text-2xl font-bold">Вызов не найден</h2><p className="mt-2 text-sm text-muted-foreground">{challengeQuery.error?.message || "Сервер не вернул данные вызова."}</p><Button asChild variant="outline" className="mt-5"><Link to="/duels">Вернуться к дуэлям</Link></Button></div>;

  if (finished) {
    const rawBonus = challenge.rating_bonus ?? challenge.bonus_awarded;
    const bonus = won && rawBonus != null ? Number(rawBonus) : won ? null : 0;
    return (
      <Reveal>
        <div className="mx-auto max-w-5xl py-4 md:py-8">
          <Link to="/duels" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> К дуэлям</Link>
          <section className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
            <div className={cn("px-6 py-10 text-center md:px-10 md:py-14", won ? "bg-accent/7" : "bg-secondary/35")}>
              <span className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-full", won ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground")}>
                {won ? <Trophy size={25} /> : <Target size={25} />}
              </span>
              <h1 className="mt-5 font-heading text-3xl font-bold md:text-5xl">{won ? "Эталон превзойдён" : "Вызов завершён"}</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                {won ? `Подтверждение по направлению «${task.label}» обновлено в ML-паспорте.` : "Результат сохранён в личной истории. Рейтинг не уменьшается."}
              </p>
            </div>
            <div className="grid border-t border-border sm:grid-cols-4">
              {[
                [bestScore?.toFixed(4) || "—", "ваш результат"],
                [Number.isFinite(level.benchmark) ? level.benchmark.toFixed(4) : "—", "эталон"],
                [level.label, "уровень"],
                [bonus == null ? "—" : bonus > 0 ? `+${bonus}` : "0", "бонус к рейтингу"],
              ].map(([value, label], index) => (
                <div key={label} className={cn("p-5 text-center", index > 0 && "border-t border-border sm:border-l sm:border-t-0")}>
                  <p className="font-heading text-2xl font-bold tabular-nums">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:justify-center md:p-7">
              <Button onClick={() => navigate("/duels")}><RefreshCw size={16} /> Новый поиск</Button>
              <Button asChild variant="outline"><Link to="/profile">Посмотреть ML-паспорт</Link></Button>
              <Button asChild variant="ghost"><Link to="/duels">Вернуться к дуэлям</Link></Button>
            </div>
          </section>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal>
      <div className="mx-auto max-w-7xl py-2 md:py-5">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/duels" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> К дуэлям</Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:block">Вызов ML-Арены · {level.label}</span>
            <div className={cn("rounded-md border px-4 py-2", seconds < 600 ? "border-destructive/50 text-destructive" : "border-border")}><TimerDisplay seconds={seconds} compact /></div>
          </div>
        </div>

        <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="min-w-0 space-y-5">
            <section className="rounded-lg border border-border bg-card p-5 md:p-7">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">{task.label}</span>
                <span className="rounded-full bg-secondary px-3 py-1 font-semibold">{level.label}</span>
              </div>
              <h1 className="mt-5 font-heading text-2xl font-bold md:text-4xl">{task.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{task.description}</p>
              <div className="mt-6 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
                <div className="bg-background p-4"><p className="text-xs text-muted-foreground">Метрика</p><p className="mt-2 text-sm font-semibold">{task.metric.toUpperCase()}</p></div>
                <div className="bg-background p-4"><p className="text-xs text-muted-foreground">Нужно превзойти</p><p className="mt-2 text-sm font-semibold tabular-nums">{Number.isFinite(level.benchmark) ? level.benchmark.toFixed(4) : "—"}</p></div>
                <div className="bg-background p-4"><p className="text-xs text-muted-foreground">Направление</p><p className="mt-2 text-sm font-semibold">{task.label}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {challenge.dataset_bundle_url && <Button asChild variant="outline" size="sm"><a href={challenge.dataset_bundle_url}><Upload size={14} /> Скачать данные</a></Button>}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div><h2 className="font-heading text-xl font-bold">Отправка результата</h2><p className="mt-2 text-sm text-muted-foreground">Загрузите CSV с колонками `id` и `prediction`.</p></div>
                <span className="text-xs font-semibold text-muted-foreground">Осталось: {challenge.attempts_remaining ?? "—"}</span>
              </div>
              <label className={cn("mt-5 flex min-h-36 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/25 px-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/5", (challenge.attempts_remaining === 0 || uploadState === "validating") && "cursor-not-allowed opacity-60")}>
                <input type="file" accept=".csv,text/csv" className="sr-only" disabled={challenge.attempts_remaining === 0 || uploadState === "validating"} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; submitResult(file); }} />
                {uploadState === "validating" ? <Loader2 className="animate-spin text-primary" size={24} /> : <Upload className="text-primary" size={24} />}
                <span className="mt-3 text-sm font-semibold">{uploadState === "validating" ? "Проверяем формат и результат…" : "Выбрать CSV-файл"}</span>
                <span className="mt-1 text-xs text-muted-foreground">Невалидный файл не расходует попытку</span>
              </label>
            </section>
          </main>

          <aside className="min-w-0 space-y-4">
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3"><BrainCircuit className="text-primary" size={21} /><h2 className="font-heading text-lg font-bold">Эталон ML-Арены</h2></div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Зафиксированная версия решения. Она не меняется во время попытки и не имитирует живого соперника.</p>
              <div className="mt-5 border-t border-border pt-5">
                <p className="text-xs text-muted-foreground">Лучший результат</p>
                <p className="mt-2 font-heading text-3xl font-bold tabular-nums">{bestScore?.toFixed(4) || "—"}</p>
                {bestScore !== null && <p className={cn("mt-2 text-xs font-semibold", won ? "text-accent" : "text-muted-foreground")}>{won ? "Эталон превзойдён" : "Эталон пока не превзойдён"}</p>}
              </div>
            </section>
            <section className="rounded-lg border border-border bg-secondary/35 p-5">
              <ShieldCheck className="text-primary" size={20} />
              <h3 className="mt-3 text-sm font-semibold">Как считается результат</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Победа может дать небольшой бонус только один раз для этой задачи. Поражение не снижает рейтинг и не входит в процент побед над людьми.</p>
            </section>
            <Button variant="outline" className="w-full" onClick={finishChallenge} disabled={!challenge?.id}>Завершить вызов</Button>
          </aside>
        </div>
      </div>
    </Reveal>
  );
}

function HistoryView({ duels, isLoading, rating }) {
  const [resultFilter, setResultFilter] = useState("all");
  const [taskFilter, setTaskFilter] = useState("all");
  const filtered = useMemo(() => duels.filter((duel) => {
    const resultMatches =
      resultFilter === "all"
      || (resultFilter === "wins" && duel.winner_name === "Ты")
      || (resultFilter === "losses" && duel.status === "completed" && !duel.is_draw && duel.winner_name !== "Ты")
      || (resultFilter === "active" && duel.status !== "completed");
    return resultMatches && (taskFilter === "all" || duel.task_type === taskFilter);
  }), [duels, resultFilter, taskFilter]);

  return (
    <Reveal>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-3xl font-bold">История дуэлей</h1>
          <p className="mt-2 text-sm text-muted-foreground">{rating ? `${rating.human_duels_count} матчей · ${rating.wins} побед` : "Пока нет рейтинговых матчей"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={resultFilter}
            onChange={(event) => setResultFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            aria-label="Фильтр результата"
          >
            <option value="all">Все результаты</option>
            <option value="wins">Победы</option>
            <option value="losses">Поражения</option>
            <option value="active">Активные</option>
          </select>
          <select
            value={taskFilter}
            onChange={(event) => setTaskFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            aria-label="Фильтр направления"
          >
            <option value="all">Все направления</option>
            {Object.entries(TASKS).map(([key, task]) => <option key={key} value={key}>{task.label}</option>)}
          </select>
        </div>
      </div>
      <DuelNav view="history" className="mt-6" />

      <div>
        {isLoading ? (
          <div className="flex min-h-52 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : filtered.length ? (
          <RecentDuels duels={filtered} isLoading={false} />
        ) : (
          <div className="border-y border-dashed border-border py-16 text-center">
            <History className="mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">В этой выборке пока нет матчей</p>
          </div>
        )}
      </div>
    </Reveal>
  );
}

export default function Duels() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [taskType, setTaskType] = useState("classification");
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeTicket, setChallengeTicket] = useState(null);
  const canReadPersonalDuels = ["user", "admin"].includes(user?.role);
  const view = location.pathname.endsWith("/history")
    ? "history"
    : location.pathname.includes("/challenges/")
        ? "challenge"
      : location.pathname.endsWith("/matchmaking")
        ? "matchmaking"
        : "overview";

  const duelsQuery = useQuery({
    queryKey: ["duels"],
    queryFn: () => api.duels.list({ limit: 50, offset: 0 }),
    enabled: canReadPersonalDuels,
  });
  const rawDuels = Array.isArray(duelsQuery.data) ? duelsQuery.data : duelsQuery.data?.data || duelsQuery.data?.items || [];
  const duels = useMemo(() => rawDuels.map((duel) => adaptDuel(duel, user?.id)), [rawDuels, user?.id]);
  const seasonsQuery = useQuery({ queryKey: ["rating-seasons"], queryFn: api.rating.seasons, enabled: canReadPersonalDuels, staleTime: 60000 });
  const seasons = Array.isArray(seasonsQuery.data) ? seasonsQuery.data : seasonsQuery.data?.items || [];
  const activeSeason = seasons.find((season) => season.status === "active")?.slug || "";
  const duelRatingQuery = useQuery({
    queryKey: ["duel-rating-summary", activeSeason],
    queryFn: () => api.rating.get({ tab: "duels", season: activeSeason, limit: 100, offset: 0 }),
    enabled: canReadPersonalDuels && Boolean(activeSeason),
    retry: false,
  });
  const currentRatingRow = duelRatingQuery.data?.current_user || null;
  const currentRating = currentRatingRow?.duel_rating ?? null;
  const duelRatingsByUser = useMemo(() => new Map((duelRatingQuery.data?.items || []).map((row) => [row.user_id, row])), [duelRatingQuery.data?.items]);
  const profilesQuery = useQuery({
    queryKey: ["duel-opponents"],
    queryFn: () => api.profiles.search({ limit: 50, offset: 0 }),
    enabled: Boolean(user),
  });
  const ownProfileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => api.profiles.me(),
    enabled: Boolean(user),
  });
  const profiles = profilesQuery.data?.data || profilesQuery.data?.items || [];
  const challengesQuery = useQuery({ queryKey: ["duel-challenges"], queryFn: () => api.duels.challenges({ status: "pending", limit: 50, offset: 0 }), enabled: canReadPersonalDuels });
  const challenges = challengesQuery.data?.data || challengesQuery.data?.items || [];
  const opponents = useMemo(() => {
    const ownProfile = ownProfileQuery.data;
    const ownIds = new Set([user?.id, user?.user_id, user?.profile_id, ownProfile?.id, ownProfile?.user_id].filter(Boolean));
    const ownNames = new Set([user?.nickname, user?.user_name, ownProfile?.user_name].filter(Boolean).map((value) => String(value).toLowerCase()));
    return profiles
    .filter((profile) => profile.user_id && !ownIds.has(profile.user_id) && !ownIds.has(profile.id) && !ownNames.has(String(profile.user_name || "").toLowerCase()))
    .map((profile) => {
      const rating = duelRatingsByUser.get(profile.user_id);
      return {
        id: profile.user_id,
        profileId: profile.id,
        name: profile.user_name || profile.nickname,
        avatar: profile.avatar_url,
        rating: rating?.duel_rating ?? null,
        wins: rating?.wins ?? 0,
        losses: rating?.losses ?? 0,
        focus: Object.entries(profile.skills || {}).filter(([, value]) => value > 0).map(([key]) => key),
      };
    });
  }, [duelRatingsByUser, ownProfileQuery.data, profiles, user?.id, user?.nickname, user?.profile_id, user?.user_id, user?.user_name]);

  const createDuelMutation = useMutation({
    mutationFn: ({ opponent, selectedTask }) => api.duels.createChallenge({
        opponent_user_id: opponent.id,
        task_type: selectedTask,
        mode: "rated",
      }),
    onSuccess: (duel) => {
      queryClient.invalidateQueries({ queryKey: ["duels"] });
      toast.success("Вызов отправлен сопернику");
      navigate("/duels");
    },
    onError: (error) => {
      if (error.code === "NO_DUEL_TASK_AVAILABLE") return toast.error("Для этого направления ещё нет опубликованной задачи для дуэлей");
      if (error.code === "RESOURCE_CONFLICT" && error.message === "You cannot challenge yourself") return toast.error("Нельзя отправить вызов самому себе");
      return toast.error(error.code === "RESOURCE_NOT_FOUND" ? "Соперник сейчас недоступен для дуэли" : error.message || "Не удалось создать дуэль");
    },
  });

  const createDuel = (opponent, selectedTask = taskType) => {
    createDuelMutation.mutate({ opponent, selectedTask });
  };
  const challengeAction = useMutation({
    mutationFn: ({ id, action }) => action === "accept" ? api.duels.acceptChallenge(id) : action === "withdraw" ? api.duels.withdrawChallenge(id) : api.duels.declineChallenge(id),
    onSuccess: (result, variables) => { queryClient.invalidateQueries({ queryKey: ["duel-challenges"] }); queryClient.invalidateQueries({ queryKey: ["duels"] }); if (variables.action === "accept" && result?.duel_id) navigate(`/duels/${result.duel_id}`); },
    onError: (error) => toast.error(error.message || "Не удалось обработать вызов"),
  });

  const startChallenge = async (level) => {
    if (!canReadPersonalDuels) {
      toast("Вызов ML-Арены доступен только аккаунту участника.");
      return;
    }
    if (!challengeTicket?.id) return;
    try {
      const challenge = await api.matchmaking.startArenaChallenge(challengeTicket.id, level);
      setChallengeOpen(false);
      navigate(`/duels/challenges/${challenge.id}?direction=${taskType}&level=${level}`);
    } catch (error) {
      toast.error(error.message || "Не удалось запустить вызов ML-Арены");
    }
  };

  return (
    <PageFrame>
      {view === "overview" && (
        <OverviewView
          duels={duels}
          challenges={challenges}
          opponents={opponents}
          isLoading={duelsQuery.isLoading}
          createDuel={createDuel}
          isCreating={createDuelMutation.isPending}
          taskType={taskType}
          setTaskType={setTaskType}
          onChallengeAction={(id, action) => {
            if (!canReadPersonalDuels) {
              toast("Управление вызовами доступно только аккаунту участника.");
              return;
            }
            challengeAction.mutate({ id, action });
          }}
          challengePending={challengeAction.isPending}
          currentUserId={user?.id}
          currentRating={currentRating}
          currentRatingRow={currentRatingRow}
          ratingLoading={seasonsQuery.isLoading || duelRatingQuery.isLoading}
        />
      )}
      {view === "matchmaking" && (
        <MatchmakingView
          onCreate={createDuel}
          opponents={opponents}
          pending={createDuelMutation.isPending}
          taskType={taskType}
          setTaskType={setTaskType}
          openChallenge={(ticket) => { setChallengeTicket(ticket); setChallengeOpen(true); }}
          canPlay={canReadPersonalDuels}
          currentRating={currentRating}
        />
      )}
      {view === "history" && <HistoryView duels={duels} isLoading={duelsQuery.isLoading} rating={currentRatingRow} />}
      {view === "challenge" && <ArenaChallengeView />}
      <ChallengeChooser
        open={challengeOpen}
        onClose={() => setChallengeOpen(false)}
        taskType={taskType}
        onTaskTypeChange={setTaskType}
        onStart={startChallenge}
      />
    </PageFrame>
  );
}
