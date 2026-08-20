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
  Medal,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Upload,
  UserRoundSearch,
  X,
  Zap,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { base44 } from "@/api/base44Client";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

const CURRENT_USER = {
  name: "Ты",
  rating: 1246,
  rank: 184,
  wins: 18,
  losses: 11,
  streak: 3,
};

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

const DUEL_RATING = [
  { name: "AI_Ninja", rating: 1580, duels: 48, wins: 38 },
  { name: "DataWizard", rating: 1520, duels: 48, wins: 38 },
  { name: "TensorLord", rating: 1480, duels: 49, wins: 35 },
  { name: "NeuralFox", rating: 1420, duels: 40, wins: 30 },
  { name: "ML_Glider", rating: 1380, duels: 40, wins: 25 },
];

const RULES = [
  { icon: Clock3, title: "60 минут", text: "Одинаковое основное время для обоих участников." },
  { icon: Upload, title: "10 отправок", text: "Невалидный файл не расходует попытку, но проверяется с ограничением частоты." },
  { icon: Trophy, title: "Лучший результат", text: "Побеждает лучший результат на одной скрытой выборке." },
  { icon: ShieldCheck, title: "Равные правила", text: "Результат соперника скрыт до завершения матча." },
];

const CHALLENGE_LEVELS = {
  easy: {
    label: "Лёгкий",
    range: "60–75%",
    reward: "до +4",
    description: "Для разминки и первого подтверждения навыка.",
    benchmark: 0.7814,
  },
  medium: {
    label: "Средний",
    range: "35–55%",
    reward: "до +7",
    description: "Потребуется уверенная ML-работа, одного базового решения обычно недостаточно.",
    benchmark: 0.8564,
  },
  advanced: {
    label: "Продвинутый",
    range: "15–35%",
    reward: "до +10",
    description: "Сильный короткий результат против сложного эталонного решения.",
    benchmark: 0.9028,
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
  return Math.round((opponent.wins / (opponent.wins + opponent.losses)) * 100);
}

function getDuelDate(duel) {
  const value = duel.created_date || duel.started_at;
  return value ? new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }) : "Сегодня";
}

function DuelNav({ view }) {
  const items = [
    { id: "overview", label: "Обзор", icon: Swords, to: "/duels" },
    { id: "history", label: "История", icon: History, to: "/duels/history" },
    { id: "rating", label: "Рейтинг", icon: BarChart3, to: "/rating?tab=duels" },
  ];

  return (
    <div className="mb-7 flex items-center gap-1 overflow-x-auto border-b border-border">
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

function RatingSummary() {
  return (
    <div className="grid min-w-0 grid-cols-2 border-t border-border/80 xl:min-w-[320px] xl:border-l xl:border-t-0">
      <div className="flex min-h-32 flex-col justify-between border-b border-r border-border/80 p-5">
        <span className="text-xs font-medium text-muted-foreground">Рейтинг сезона</span>
        <span className="font-heading text-4xl font-bold tabular-nums">{CURRENT_USER.rating}</span>
      </div>
      <div className="flex min-h-32 flex-col justify-between border-b border-border/80 p-5">
        <span className="text-xs font-medium uppercase text-muted-foreground">Место</span>
        <span className="font-heading text-4xl font-bold tabular-nums">#{CURRENT_USER.rank}</span>
      </div>
      <div className="border-r border-border/80 p-5">
        <LeagueBadge rating={CURRENT_USER.rating} size="sm" />
        <p className="mt-2 text-xs text-muted-foreground">54 очка до золота</p>
      </div>
      <div className="p-5">
        <p className="text-sm font-semibold text-accent">Серия {CURRENT_USER.streak}</p>
        <p className="mt-1 text-xs text-muted-foreground">{CURRENT_USER.wins} побед · {CURRENT_USER.losses} поражений</p>
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
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-heading text-lg font-bold">{item.label}</span>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold">{item.reward} очков</span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    <p className="mt-4 text-xs text-muted-foreground">Ориентир прохождения: {item.range}</p>
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

function OpponentCard({ opponent, onChallenge, pending }) {
  const ratingGap = Math.abs(CURRENT_USER.rating - opponent.rating);
  const canChallenge = ratingGap <= 200;

  return (
    <Card className="group h-full border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar name={opponent.name} size={42} />
          <span
            className={cn(
              "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
              opponent.online ? "bg-accent" : "bg-muted-foreground",
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{opponent.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <LeagueBadge rating={opponent.rating} size="sm" />
            <span className="text-xs text-muted-foreground">{opponent.rating} Elo</span>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{getWinRate(opponent)}%</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className={cn("text-xs", canChallenge ? "text-muted-foreground" : "text-destructive")}>
          Разница {ratingGap} Elo
        </span>
        <Button
          size="sm"
          variant={canChallenge ? "outline" : "ghost"}
          disabled={!canChallenge || pending}
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

  return (
    <div className="divide-y divide-border border-y border-border">
      {duels.slice(0, 5).map((duel) => {
        const won = duel.winner_name === "Ты";
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
                duel.status !== "completed" ? "text-primary" : won ? "text-accent" : "text-destructive",
              )}
            >
              {duel.status !== "completed" ? "Идёт сейчас" : won ? `Победа +${duel.rating_change}` : `Поражение −${duel.rating_change}`}
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

function OverviewView({ duels, opponents, isLoading, createDuel, isCreating, taskType, setTaskType }) {
  const [searchNick, setSearchNick] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const matchedOpponent = useMemo(() => {
    if (!searchNick.trim()) return null;
    return opponents.find((opponent) => opponent.name.toLowerCase().includes(searchNick.trim().toLowerCase()));
  }, [opponents, searchNick]);

  return (
    <>
      <Reveal>
        <section className="overflow-hidden border-y border-border bg-card">
          <div className="grid xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex min-h-[320px] flex-col justify-between p-6 md:p-10">
              <div>
                <h1 className="max-w-3xl font-heading text-3xl font-bold leading-tight md:text-5xl">
                  Дуэли по машинному обучению
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Выберите направление, получите одинаковую задачу с соперником и за 60 минут покажите лучший результат. Рейтинговые дуэли влияют на рейтинг текущего сезона и сохраняются в ML-паспорте.
                </p>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
            </div>
            <RatingSummary />
          </div>
        </section>
      </Reveal>

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
                <OpponentCard opponent={matchedOpponent} onChallenge={(opponent) => createDuel(opponent, taskType)} pending={isCreating} />
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
              />
            ))}
          </div>
        </Reveal>
      </section>

      <section className="border-t border-border py-9">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold md:text-2xl">Твоя форма</h2>
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

      <section className="border-y border-border py-9">
        <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <h2 className="font-heading text-2xl font-bold">Сильнейшие дуэлянты</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              Рейтинг меняется после каждого человеческого рейтингового матча. Premium не влияет на подбор, время или число попыток.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/rating?tab=duels">Открыть рейтинг <ArrowRight size={15} /></Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {DUEL_RATING.map((player, index) => (
              <div key={player.name} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-3">
                <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={player.name} size={30} />
                  <span className="truncate text-sm font-semibold">{player.name}</span>
                </div>
                <span className="font-heading text-sm font-bold tabular-nums">{player.rating}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <DuelGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}

function MatchmakingView({ onCreate, opponents, pending, taskType, setTaskType, openChallenge }) {
  const [status, setStatus] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const [opponent, setOpponent] = useState(null);
  const timerRef = useRef(null);
  const matchRef = useRef(null);

  useEffect(() => () => {
    window.clearInterval(timerRef.current);
    window.clearTimeout(matchRef.current);
  }, []);

  const start = () => {
    setStatus("searching");
    setSeconds(0);
    setOpponent(null);
    timerRef.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    matchRef.current = window.setTimeout(() => {
      const candidates = opponents.filter(
        (item) => item.online && Math.abs(CURRENT_USER.rating - item.rating) <= 200 && item.focus.includes(taskType),
      );
      if (candidates.length) {
        window.clearInterval(timerRef.current);
        setOpponent(candidates[0]);
        setStatus("found");
      }
    }, 4200);
  };

  useEffect(() => {
    if (status === "searching" && seconds >= 120) {
      setStatus("empty");
      window.clearInterval(timerRef.current);
    }
  }, [seconds, status]);

  const ratingWindow = seconds < 30 ? 100 : seconds < 60 ? 150 : 200;

  const cancel = () => {
    window.clearInterval(timerRef.current);
    window.clearTimeout(matchRef.current);
    setStatus("cancelled");
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
              ? `Диапазон ${CURRENT_USER.rating - ratingWindow}–${CURRENT_USER.rating + ratingWindow} очков · ${seconds} сек.`
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
                      <LeagueBadge rating={opponent.rating} size="sm" />
                      <span className="text-xs text-muted-foreground">{opponent.rating} очков · {getWinRate(opponent)}% побед</span>
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
                <Button onClick={openChallenge}><BrainCircuit size={16} /> Выбрать вызов</Button>
                <Button variant="outline" onClick={start}>Продолжить поиск</Button>
              </>
            ) : (
              <Button onClick={start}><Zap size={16} /> Найти соперника</Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 border-b border-border">
          {[
            ["±100 → ±200", "диапазон рейтинга"],
            ["60 мин", "основное время"],
            ["10", "валидных отправок"],
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
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const directionKey = params.get("direction") || "classification";
  const levelKey = params.get("level") || "medium";
  const task = TASKS[directionKey] || TASKS.classification;
  const level = CHALLENGE_LEVELS[levelKey] || CHALLENGE_LEVELS.medium;
  const [seconds, setSeconds] = useState(3600);
  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [status, setStatus] = useState("active");
  const [uploadState, setUploadState] = useState("idle");
  const won = bestScore !== null && bestScore > level.benchmark;

  useEffect(() => {
    if (status !== "active") return undefined;
    const interval = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (seconds === 0 && status === "active") setStatus("result");
  }, [seconds, status]);

  const submitResult = () => {
    if (attempts >= 5 || uploadState === "validating") return;
    setUploadState("validating");
    window.setTimeout(() => {
      const nextAttempt = attempts + 1;
      const score = Number((level.benchmark + (nextAttempt >= 2 ? 0.0167 : -0.0124)).toFixed(4));
      setAttempts(nextAttempt);
      setBestScore((current) => current === null ? score : Math.max(current, score));
      setUploadState("scored");
      toast.success(nextAttempt >= 2 ? "Эталон превзойдён" : "Результат проверен");
    }, 900);
  };

  if (status === "result") {
    const bonus = won ? Number(level.reward.replace(/\D/g, "")) || 0 : 0;
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
                [level.benchmark.toFixed(4), "эталон"],
                [level.label, "уровень"],
                [won ? `+${bonus}` : "+0", "бонус к рейтингу"],
              ].map(([value, label], index) => (
                <div key={label} className={cn("p-5 text-center", index > 0 && "border-t border-border sm:border-l sm:border-t-0")}>
                  <p className="font-heading text-2xl font-bold tabular-nums">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:justify-center md:p-7">
              <Button onClick={() => navigate(`/duels/challenges/new?direction=${directionKey}&level=${levelKey}`)}><RefreshCw size={16} /> Следующий вызов</Button>
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
                <div className="bg-background p-4"><p className="text-xs text-muted-foreground">Нужно превзойти</p><p className="mt-2 text-sm font-semibold tabular-nums">{level.benchmark.toFixed(4)}</p></div>
                <div className="bg-background p-4"><p className="text-xs text-muted-foreground">Направление</p><p className="mt-2 text-sm font-semibold">{task.label}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.success("Данные подготовлены к скачиванию")}><Upload size={14} /> Скачать данные</Button>
                <Button variant="outline" size="sm" onClick={() => toast.success("Пример решения скачан")}><ArrowRight size={14} /> Пример файла</Button>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div><h2 className="font-heading text-xl font-bold">Отправка результата</h2><p className="mt-2 text-sm text-muted-foreground">Загрузите CSV с колонками `id` и `prediction`.</p></div>
                <span className="text-xs font-semibold text-muted-foreground">{attempts} из 5</span>
              </div>
              <button
                type="button"
                onClick={submitResult}
                disabled={attempts >= 5 || uploadState === "validating"}
                className="mt-5 flex min-h-36 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/25 px-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadState === "validating" ? <Loader2 className="animate-spin text-primary" size={24} /> : <Upload className="text-primary" size={24} />}
                <span className="mt-3 text-sm font-semibold">{uploadState === "validating" ? "Проверяем формат и результат…" : "Выбрать CSV-файл"}</span>
                <span className="mt-1 text-xs text-muted-foreground">Невалидный файл не расходует попытку</span>
              </button>
            </section>
          </main>

          <aside className="min-w-0 space-y-4">
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3"><BrainCircuit className="text-primary" size={21} /><h2 className="font-heading text-lg font-bold">Эталон ML-Арены</h2></div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Зафиксированная версия решения. Она не меняется во время попытки и не имитирует живого соперника.</p>
              <div className="mt-5 border-t border-border pt-5">
                <p className="text-xs text-muted-foreground">Лучший результат</p>
                <p className="mt-2 font-heading text-3xl font-bold tabular-nums">{bestScore?.toFixed(4) || "—"}</p>
                {bestScore !== null && <p className={cn("mt-2 text-xs font-semibold", won ? "text-accent" : "text-muted-foreground")}>{won ? "Эталон превзойдён" : `${(level.benchmark - bestScore).toFixed(4)} до эталона`}</p>}
              </div>
            </section>
            <section className="rounded-lg border border-border bg-secondary/35 p-5">
              <ShieldCheck className="text-primary" size={20} />
              <h3 className="mt-3 text-sm font-semibold">Как считается результат</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Победа может дать небольшой бонус только один раз для этой задачи. Поражение не снижает рейтинг и не входит в процент побед над людьми.</p>
            </section>
            <Button variant="outline" className="w-full" onClick={() => setStatus("result")}>Завершить вызов</Button>
          </aside>
        </div>
      </div>
    </Reveal>
  );
}

function HistoryView({ duels, isLoading }) {
  const [resultFilter, setResultFilter] = useState("all");
  const [taskFilter, setTaskFilter] = useState("all");
  const filtered = useMemo(() => duels.filter((duel) => {
    const resultMatches =
      resultFilter === "all"
      || (resultFilter === "wins" && duel.winner_name === "Ты")
      || (resultFilter === "losses" && duel.status === "completed" && duel.winner_name !== "Ты")
      || (resultFilter === "active" && duel.status !== "completed");
    return resultMatches && (taskFilter === "all" || duel.task_type === taskFilter);
  }), [duels, resultFilter, taskFilter]);

  return (
    <Reveal>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-3xl font-bold">История дуэлей</h1>
          <p className="mt-2 text-sm text-muted-foreground">{CURRENT_USER.wins + CURRENT_USER.losses} матчей · {CURRENT_USER.wins} побед</p>
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

      <div className="mt-7">
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

function RatingView() {
  const rows = [
    ...DUEL_RATING,
    { name: "GradientHero", rating: 1280, duels: 32, wins: 18 },
    { name: CURRENT_USER.name, rating: CURRENT_USER.rating, duels: 29, wins: 18, current: true },
    { name: "LossMin", rating: 1210, duels: 25, wins: 15 },
  ].sort((a, b) => b.rating - a.rating);

  return (
    <Reveal>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <h1 className="font-heading text-3xl font-bold">Рейтинг дуэлянтов</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Позиция рассчитывается по Duel Elo. При подборе учитываются только игроки в диапазоне 200 очков.
          </p>
          <div className="mt-7 overflow-x-auto border-y border-border">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[56px_1fr_100px_100px_100px] border-b border-border py-3 text-xs text-muted-foreground">
                <span>Место</span><span>Участник</span><span>Лига</span><span>Матчи</span><span className="text-right">Elo</span>
              </div>
              {rows.map((player, index) => (
                <Link
                  key={player.name}
                  to={player.current ? "/profile/me" : "/profile/p1"}
                  className={cn(
                    "grid min-h-16 grid-cols-[56px_1fr_100px_100px_100px] items-center border-b border-border text-sm transition-colors hover:bg-secondary/50",
                    player.current && "bg-primary/5",
                  )}
                >
                  <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <div className="flex items-center gap-3">
                    <Avatar name={player.name} size={32} />
                    <span className="font-semibold">{player.name}</span>
                    {player.current && <span className="text-[10px] font-medium text-primary">Это ты</span>}
                  </div>
                  <LeagueBadge rating={player.rating} size="sm" />
                  <span className="text-muted-foreground">{player.duels}</span>
                  <span className="text-right font-heading font-bold tabular-nums">{player.rating}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <aside className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-6">
          <Medal className="text-primary" size={24} />
          <h2 className="mt-4 font-heading text-xl font-bold">Твоя позиция</h2>
          <p className="mt-4 font-heading text-5xl font-bold">#{CURRENT_USER.rank}</p>
          <div className="mt-4 flex items-center gap-2">
            <LeagueBadge rating={CURRENT_USER.rating} size="sm" />
            <span className="text-sm font-semibold">{CURRENT_USER.rating} Elo</span>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[73%] rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Ещё 54 Elo до золотой лиги</p>
          <Button asChild className="mt-6 w-full">
            <Link to="/duels/matchmaking"><Sparkles size={15} /> Улучшить позицию</Link>
          </Button>
        </aside>
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
  const view = location.pathname.endsWith("/history")
    ? "history"
    : location.pathname.endsWith("/rating")
      ? "rating"
      : location.pathname.includes("/challenges/")
        ? "challenge"
      : location.pathname.endsWith("/matchmaking")
        ? "matchmaking"
        : "overview";

  const { data: duels = [], isLoading } = useQuery({
    queryKey: ["duels"],
    queryFn: () => base44.entities.Duel.list("-created_date", 30),
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["duel-opponents"],
    queryFn: () => base44.entities.MLProfile.list("-rating", 50),
  });
  const opponents = useMemo(() => profiles
    .filter((profile) => profile.id && profile.id !== user?.id)
    .map((profile) => ({
      id: profile.id,
      name: profile.user_name || profile.nickname,
      rating: profile.rating || 1000,
      wins: profile.duels_won || 0,
      losses: profile.duels_lost || 0,
      online: true,
      focus: Object.entries(profile.skills || {}).filter(([, value]) => value > 0).map(([key]) => key),
    })), [profiles, user?.id]);

  const createDuelMutation = useMutation({
    mutationFn: ({ opponent, selectedTask }) => {
      const task = TASKS[selectedTask];
      return base44.entities.Duel.create({
        opponent_user_id: opponent.id,
        player1_name: CURRENT_USER.name,
        player1_rating: CURRENT_USER.rating,
        player2_name: opponent.name,
        player2_rating: opponent.rating,
        player2_avatar: null,
        status: "lobby",
        task_title: task.title,
        task_description: task.description,
        task_type: selectedTask,
        metric: task.metric,
        duration_minutes: 60,
        rating_window: 200,
        dataset_url: "#",
        created_date: new Date().toISOString(),
      });
    },
    onSuccess: (duel) => {
      queryClient.invalidateQueries({ queryKey: ["duels"] });
      toast.success("Вызов отправлен сопернику");
      navigate("/duels");
    },
    onError: (error) => toast.error(error.message || "Не удалось создать дуэль"),
  });

  const createDuel = (opponent, selectedTask = taskType) => {
    createDuelMutation.mutate({ opponent, selectedTask });
  };

  const startChallenge = (level) => {
    setChallengeOpen(false);
    navigate(`/duels/challenges/new?direction=${taskType}&level=${level}`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-7">
      {!['matchmaking', 'challenge'].includes(view) && <DuelNav view={view} />}
      {view === "overview" && (
        <OverviewView
          duels={duels}
          opponents={opponents}
          isLoading={isLoading}
          createDuel={createDuel}
          isCreating={createDuelMutation.isPending}
          taskType={taskType}
          setTaskType={setTaskType}
        />
      )}
      {view === "matchmaking" && (
        <MatchmakingView
          onCreate={createDuel}
          opponents={opponents}
          pending={createDuelMutation.isPending}
          taskType={taskType}
          setTaskType={setTaskType}
          openChallenge={() => setChallengeOpen(true)}
        />
      )}
      {view === "history" && <HistoryView duels={duels} isLoading={isLoading} />}
      {view === "rating" && <RatingView />}
      {view === "challenge" && <ArenaChallengeView />}
      <ChallengeChooser
        open={challengeOpen}
        onClose={() => setChallengeOpen(false)}
        taskType={taskType}
        onTaskTypeChange={setTaskType}
        onStart={startChallenge}
      />
    </div>
  );
}
