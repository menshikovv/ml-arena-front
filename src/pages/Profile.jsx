import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  Award,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  Database,
  Eye,
  EyeOff,
  FileCheck2,
  Github,
  GitPullRequest,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Medal,
  Send,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getLeagueProgress } from "@/lib/ml-arena";

const SKILL_BLUEPRINTS = [
  { key: "skill_tabular", label: "Tabular ML", task: "Табличные данные" },
  { key: "skill_classification", label: "Classification", task: "Классификация" },
  { key: "skill_nlp", label: "NLP", task: "Тексты" },
  { key: "skill_regression", label: "Regression", task: "Регрессия" },
  { key: "skill_cv", label: "Computer Vision", task: "Изображения" },
  { key: "skill_time_series", label: "Time Series", task: "Временные ряды" },
];

const RESULT_BLUEPRINTS = [
  {
    id: "c3",
    title: "Детекция аномалий в транзакциях",
    task: "classification",
    taskLabel: "Классификация",
    difficulty: "Hard",
    domain: "Финтех",
    metric: "ROC-AUC",
    rank: 8,
    participants: 612,
    publicRank: 6,
    privateRank: 8,
    publicScore: "0.948",
    privateScore: "0.941",
    baselineScore: "0.781",
    bestScore: "0.941",
    improvement: "+20.5%",
    submits: 9,
    baselineAt: 3,
    verification: "Воспроизведён",
    scoreCurve: [
      { submit: 1, score: 0.781 },
      { submit: 2, score: 0.824 },
      { submit: 3, score: 0.856 },
      { submit: 4, score: 0.861 },
      { submit: 5, score: 0.901 },
      { submit: 6, score: 0.912 },
      { submit: 7, score: 0.931 },
      { submit: 8, score: 0.928 },
      { submit: 9, score: 0.941 },
    ],
    context: { registrations: 940, valid: 612, baselineBeaten: 391, universities: 28 },
  },
  {
    id: "c2",
    title: "Классификация тональности отзывов",
    task: "nlp",
    taskLabel: "NLP",
    difficulty: "Medium",
    domain: "E-commerce",
    metric: "F1",
    rank: 12,
    participants: 480,
    publicRank: 9,
    privateRank: 12,
    publicScore: "0.934",
    privateScore: "0.927",
    baselineScore: "0.744",
    bestScore: "0.927",
    improvement: "+24.6%",
    submits: 7,
    baselineAt: 2,
    verification: "Private final",
    scoreCurve: [
      { submit: 1, score: 0.744 },
      { submit: 2, score: 0.802 },
      { submit: 3, score: 0.846 },
      { submit: 4, score: 0.881 },
      { submit: 5, score: 0.903 },
      { submit: 6, score: 0.899 },
      { submit: 7, score: 0.927 },
    ],
    context: { registrations: 720, valid: 480, baselineBeaten: 306, universities: 34 },
  },
  {
    id: "c1",
    title: "Предсказание цен на недвижимость",
    task: "regression",
    taskLabel: "Регрессия",
    difficulty: "Medium",
    domain: "PropTech",
    metric: "RMSE",
    rank: 18,
    participants: 216,
    publicRank: 17,
    privateRank: 18,
    publicScore: "2.390",
    privateScore: "2.410",
    baselineScore: "2.930",
    bestScore: "2.410",
    improvement: "+17.7%",
    submits: 8,
    baselineAt: 2,
    verification: "Код проверен",
    scoreCurve: [
      { submit: 1, score: 2.93 },
      { submit: 2, score: 2.78 },
      { submit: 3, score: 2.66 },
      { submit: 4, score: 2.63 },
      { submit: 5, score: 2.55 },
      { submit: 6, score: 2.49 },
      { submit: 7, score: 2.51 },
      { submit: 8, score: 2.41 },
    ],
    context: { registrations: 351, valid: 216, baselineBeaten: 128, universities: 21 },
  },
  {
    id: "c4",
    title: "Сегментация изображений товаров",
    task: "cv",
    taskLabel: "Computer Vision",
    difficulty: "Hard",
    domain: "Retail",
    metric: "Dice",
    rank: 16,
    participants: 198,
    publicRank: 14,
    privateRank: 16,
    publicScore: "0.894",
    privateScore: "0.887",
    baselineScore: "0.692",
    bestScore: "0.887",
    improvement: "+28.2%",
    submits: 10,
    baselineAt: 2,
    verification: "Private final",
    scoreCurve: [
      { submit: 1, score: 0.692 },
      { submit: 2, score: 0.741 },
      { submit: 3, score: 0.756 },
      { submit: 4, score: 0.798 },
      { submit: 5, score: 0.812 },
      { submit: 6, score: 0.828 },
      { submit: 7, score: 0.852 },
      { submit: 8, score: 0.849 },
      { submit: 9, score: 0.874 },
      { submit: 10, score: 0.887 },
    ],
    context: { registrations: 312, valid: 198, baselineBeaten: 119, universities: 19 },
  },
  {
    id: "c8",
    title: "Прогноз оттока клиентов",
    task: "tabular",
    taskLabel: "Tabular ML",
    difficulty: "Medium",
    domain: "Telecom",
    metric: "ROC-AUC",
    rank: 9,
    participants: 342,
    publicRank: 11,
    privateRank: 9,
    publicScore: "0.901",
    privateScore: "0.912",
    baselineScore: "0.733",
    bestScore: "0.912",
    improvement: "+24.4%",
    submits: 6,
    baselineAt: 2,
    verification: "Воспроизведён",
    scoreCurve: [
      { submit: 1, score: 0.733 },
      { submit: 2, score: 0.801 },
      { submit: 3, score: 0.842 },
      { submit: 4, score: 0.867 },
      { submit: 5, score: 0.893 },
      { submit: 6, score: 0.912 },
    ],
    context: { registrations: 504, valid: 342, baselineBeaten: 225, universities: 26 },
  },
];

const VALIDATION_ERRORS = [
  { name: "Формат CSV", count: 3, percent: 75 },
  { name: "Несовпадение id", count: 1, percent: 25 },
  { name: "Пропуски", count: 0, percent: 0 },
];

const ACTIVITY_EVENTS = [
  { date: "24 июля", title: "Лучший private score", detail: "ROC-AUC 0.941 · top-1.3%", icon: Trophy },
  { date: "22 июля", title: "Код решения передан", detail: "Проверка воспроизводимости начата", icon: Code2 },
  { date: "20 июля", title: "Baseline побит", detail: "На третьем валидном submit-е", icon: Target },
  { date: "18 июля", title: "Первый валидный submit", detail: "Формат данных подтверждён", icon: Send },
  { date: "17 июля", title: "Датасет скачан", detail: "Соревнование по транзакциям", icon: Database },
];

const BADGE_ICONS = {
  "Первая победа": Trophy,
  "Гладиатор недели": Sparkles,
  "10 дуэлей": Swords,
  "Чемпион": Award,
};

const CHART_TOOLTIP_STYLE = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
};

function getSkillLevel(value) {
  if (value >= 88) return "Платина";
  if (value >= 76) return "Золото";
  if (value >= 62) return "Серебро";
  return "Бронза";
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-heading text-xl font-bold md:text-2xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function MetricTile({ icon: Icon, label, value, detail, tone = "primary" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent-foreground",
    neutral: "bg-secondary text-foreground",
    positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <div className="min-h-[118px] rounded-lg border border-border bg-card p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 break-words font-heading text-2xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function StatusLine({ icon: Icon, label, detail, active }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{label}</p>
          <span className={cn("text-xs font-medium", active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {active ? "Да" : "Нет"}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function EvidenceTag({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-border bg-secondary/70 text-secondary-foreground",
    primary: "border-primary/20 bg-primary/10 text-primary",
    positive: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

function RankGauge({ topPercent }) {
  const percentile = 100 - topPercent;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-secondary">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(hsl(var(--primary)) ${percentile * 3.6}deg, hsl(var(--secondary)) 0deg)` }}
      />
      <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full bg-card">
        <span className="font-heading text-2xl font-bold">{percentile.toFixed(1)}%</span>
        <span className="text-[10px] text-muted-foreground">выше участников</span>
      </div>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const [visibilityOverride, setVisibilityOverride] = useState(null);
  const [resultFilter, setResultFilter] = useState("all");
  const [selectedResultId, setSelectedResultId] = useState(RESULT_BLUEPRINTS[0].id);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id || "me"],
    queryFn: () => base44.entities.MLProfile.get(id || "me"),
  });

  const { data: badges } = useQuery({
    queryKey: ["badges", profile?.user_name],
    queryFn: () => base44.entities.Badge.filter({ user_name: profile?.user_name }, "-created_date", 20),
    enabled: !!profile?.user_name,
  });

  const skillData = useMemo(() => {
    if (!profile) return [];

    return SKILL_BLUEPRINTS.map((item, index) => {
      const value = profile[item.key] || 0;
      const bestTop = Math.max(2, Math.round((100 - value) * 0.42 + index * 0.6));
      const medianTop = Math.max(bestTop + 4, Math.round((100 - value) * 0.86 + index));

      return {
        ...item,
        value,
        level: getSkillLevel(value),
        competitions: Math.max(1, Math.round(value / 16)),
        bestTop,
        medianTop,
        baselineBeaten: Math.max(1, Math.round(value / 19)),
      };
    }).sort((a, b) => b.value - a.value);
  }, [profile]);

  const ratingHistory = useMemo(() => {
    if (!profile) return [];
    const history = profile.rating_history?.length
      ? profile.rating_history
      : [{ date: "2026-01", rating: 1000 }, { date: "2026-07", rating: profile.rating || 1000 }];

    return history.map((point) => ({
      ...point,
      label: new Date(`${point.date}-01`).toLocaleDateString("ru-RU", { month: "short" }).replace(".", ""),
    }));
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Профиль не найден</p>
      </div>
    );
  }

  const progress = getLeagueProgress(profile.rating || 1000);
  const totalDuels = (profile.duels_won || 0) + (profile.duels_lost || 0);
  const winRate = totalDuels ? Math.round(((profile.duels_won || 0) / totalDuels) * 100) : 0;
  const validSubmissions = Math.max(12, (profile.competitions_participated || 0) * 3 + Math.round(totalDuels / 2));
  const invalidSubmissions = Math.max(2, Math.round(validSubmissions * 0.07));
  const validRatio = Math.round((validSubmissions / (validSubmissions + invalidSubmissions)) * 100);
  const privateTopTen = Math.max(profile.competitions_won || 0, Math.round((profile.competitions_participated || 0) * 0.42));
  const activeDays = Math.min(30, Math.max(4, Math.round((profile.competitions_participated || 0) * 0.7 + totalDuels * 0.08)));
  const profileVisible = visibilityOverride ?? profile.visible_to_employers;
  const bestSkill = skillData[0];
  const ratingDelta = ratingHistory.length > 1 ? ratingHistory.at(-1).rating - ratingHistory[0].rating : 0;
  const currentElo = Math.round(900 + ((profile.rating || 1000) - 900) * 0.82);
  const maxElo = currentElo + 65;
  const eloHistory = ratingHistory.map((point, index) => ({
    ...point,
    elo: Math.round(900 + (point.rating - 900) * 0.82 + index * 4),
  }));
  const selectedResult = RESULT_BLUEPRINTS.find((result) => result.id === selectedResultId) || RESULT_BLUEPRINTS[0];
  const filteredResults = resultFilter === "all"
    ? RESULT_BLUEPRINTS
    : RESULT_BLUEPRINTS.filter((result) => result.task === resultFilter);
  const bestTopPercent = Math.min(...RESULT_BLUEPRINTS.map((result) => (result.rank / result.participants) * 100));
  const stabilityData = RESULT_BLUEPRINTS.map((result) => ({
    name: result.taskLabel,
    top: Number(((result.rank / result.participants) * 100).toFixed(1)),
  }));
  const duelPie = [
    { name: "Победы", value: profile.duels_won || 0, fill: "hsl(var(--chart-2))" },
    { name: "Поражения", value: profile.duels_lost || 0, fill: "hsl(var(--secondary))" },
  ];
  const submitPie = [
    { name: "Валидные", value: validSubmissions, fill: "hsl(var(--chart-1))" },
    { name: "С ошибкой", value: invalidSubmissions, fill: "hsl(var(--secondary))" },
  ];

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-6 md:py-8">
      <Reveal className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.7fr)]">
        <Card className="relative overflow-hidden border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          <div className="relative p-5 md:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar name={profile.user_name} src={profile.avatar_url} size={92} className="ring-2 ring-primary/20" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <LeagueBadge rating={profile.rating} size="lg" />
                      <EvidenceTag tone="positive">
                        <ShieldCheck size={12} className="mr-1" />
                        ML-паспорт подтверждён
                      </EvidenceTag>
                    </div>
                    <h1 className="font-heading text-2xl font-bold md:text-3xl">{profile.user_name}</h1>
                    {profile.full_name && <p className="mt-0.5 text-sm text-muted-foreground">{profile.full_name}</p>}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Текущий рейтинг</p>
                    <p className="mt-1 font-heading text-4xl font-bold">{profile.rating || 1000}</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{ratingDelta} за сезон</p>
                  </div>
                </div>

                {profile.bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{profile.bio}</p>}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  {profile.city && <span className="flex items-center gap-1.5"><MapPin size={14} /> {profile.city}</span>}
                  {profile.university && <span className="flex items-center gap-1.5"><Building2 size={14} /> {profile.university}</span>}
                  {profile.company && <span className="flex items-center gap-1.5"><BriefcaseBusiness size={14} /> {profile.company}</span>}
                  {profile.github_url && <a href={profile.github_url} className="flex items-center gap-1.5 font-medium hover:text-primary"><Github size={14} /> GitHub</a>}
                  {profile.kaggle_url && <a href={profile.kaggle_url} className="flex items-center gap-1.5 font-medium hover:text-primary"><LinkIcon size={14} /> Kaggle</a>}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between gap-4 text-xs text-muted-foreground">
                <span>Прогресс текущей лиги</span>
                <span className="font-medium text-foreground">
                  {progress.max === "∞" ? "Максимальная лига" : `${progress.current} из ${progress.max} очков`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                  style={{ width: `${Math.min(progress.percent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold">Готовность к контакту</h2>
            </div>
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", profileVisible ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-secondary text-muted-foreground")}>
              {profileVisible ? <Eye size={18} /> : <EyeOff size={18} />}
            </span>
          </div>

          <div className="mt-3 divide-y divide-border">
            <StatusLine icon={Eye} label="Открыт работодателям" detail="Компании видят достижения" active={profileVisible} />
            <StatusLine icon={BriefcaseBusiness} label="Контакт разрешён" detail="Можно отправить приглашение" active={profileVisible} />
            <StatusLine icon={Github} label="GitHub подключён" detail="Ссылка добавлена в паспорт" active={Boolean(profile.github_url)} />
          </div>

          <Button
            variant={profileVisible ? "outline" : "default"}
            className="mt-3 w-full"
            onClick={() => setVisibilityOverride(!profileVisible)}
          >
            {profileVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            {profileVisible ? "Скрыть паспорт" : "Открыть паспорт"}
          </Button>
        </Card>
      </Reveal>

      <Stagger className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(156px,1fr))] gap-3">
        <StaggerItem><MetricTile icon={Trophy} label="Соревнований" value={profile.competitions_participated || 0} detail="завершено с результатом" /></StaggerItem>
        <StaggerItem><MetricTile icon={Swords} label="Дуэлей" value={totalDuels} detail={`${winRate}% побед`} tone="accent" /></StaggerItem>
        <StaggerItem><MetricTile icon={Send} label="Корректные отправки" value={validSubmissions} detail={`${validRatio}% без ошибок`} tone="positive" /></StaggerItem>
        <StaggerItem><MetricTile icon={Medal} label="Итоговый топ-10" value={privateTopTen} detail="финальных результатов" /></StaggerItem>
        <StaggerItem><MetricTile icon={CalendarDays} label="Активных дней" value={activeDays} detail="за последние 30 дней" tone="neutral" /></StaggerItem>
        <StaggerItem><MetricTile icon={Sparkles} label="Сильный навык" value={bestSkill?.label || "—"} detail={`подтверждение: ${bestSkill?.level || "—"}`} tone="accent" /></StaggerItem>
      </Stagger>

      <Tabs.Root defaultValue="overview" className="mt-8 min-w-0">
        <Tabs.List
          aria-label="Разделы ML-паспорта"
          className="sticky top-3 z-20 grid grid-cols-2 gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-sm backdrop-blur md:grid-cols-4"
        >
          {[
            { value: "overview", label: "Обзор", icon: TrendingUp },
            { value: "results", label: "Результаты", icon: Trophy },
            { value: "submissions", label: "Процесс отправок", icon: GitPullRequest },
            { value: "trust", label: "Дуэли и доверие", icon: ShieldCheck },
          ].map((item) => (
            <Tabs.Trigger
              key={item.value}
              value={item.value}
              className="flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <item.icon size={16} />
              {item.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" className="mt-8 min-w-0 outline-none">
          <Reveal>
            <SectionHeading
              title="Не проценты знаний, а результаты"
              description="Уровень строится по private percentile, сложности задач, числу подтверждений и победам над baseline."
            />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
              <Card className="border-border bg-card p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Сила навыков</p>
                    <p className="text-xs text-muted-foreground">Сводный score, 0–100</p>
                  </div>
                  <EvidenceTag tone="primary">6 направлений</EvidenceTag>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={skillData} layout="vertical" margin={{ top: 0, right: 12, left: 2, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="label" width={112} tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => [`${value}/100`, "Skill score"]} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 5, 5, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2">
                {skillData.map((skill) => (
                  <div key={skill.key} className="rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{skill.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{skill.task}</p>
                      </div>
                      <EvidenceTag tone={skill.value >= 76 ? "primary" : "neutral"}>{skill.level}</EvidenceTag>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div><span className="text-muted-foreground">Задач</span><p className="mt-0.5 font-semibold">{skill.competitions}</p></div>
                      <div><span className="text-muted-foreground">Лучший</span><p className="mt-0.5 font-semibold">top-{skill.bestTop}%</p></div>
                      <div><span className="text-muted-foreground">Медиана</span><p className="mt-0.5 font-semibold">top-{skill.medianTop}%</p></div>
                      <div><span className="text-muted-foreground">Baseline</span><p className="mt-0.5 font-semibold">{skill.baselineBeaten}× побит</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-10" delay={0.08}>
            <SectionHeading
              title="Динамика рейтинга"
              description="Изменения после соревнований и дуэлей показывают движение по лигам, а не разовый пик."
            />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.5fr)]">
              <Card className="border-border bg-card p-4 md:p-5">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ratingHistory} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={["dataMin - 80", "dataMax + 80"]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => [value, "Рейтинг"]} />
                    <Line type="monotone" dataKey="rating" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--card))", stroke: "hsl(var(--primary))", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid gap-3">
                <MetricTile icon={ArrowUpRight} label="Рост за период" value={`+${ratingDelta}`} detail={`${ratingHistory[0]?.rating || 0} → ${profile.rating}`} tone="positive" />
                <MetricTile icon={Medal} label="Текущая лига" value={<LeagueBadge rating={profile.rating} size="md" />} detail={progress.max === "∞" ? "максимальный уровень" : `до следующей: ${progress.max - progress.current}`} />
                <MetricTile icon={Target} label="Стабильность" value="Высокая" detail="4 из 5 результатов — top-10%" tone="accent" />
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-10" delay={0.12}>
            <SectionHeading
              title="Бейджи и последние события"
              description="Короткий слой достижений и свежести паспорта."
            />
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <Card className="border-border bg-card p-5">
                <div className="grid grid-cols-2 gap-3">
                  {badges?.length ? badges.map((badge) => {
                    const Icon = BADGE_ICONS[badge.name] || Award;
                    return (
                      <div key={badge.id} className="rounded-lg border border-border bg-secondary/40 p-3 text-center">
                        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon size={18} />
                        </span>
                        <p className="mt-2 text-xs font-semibold">{badge.name}</p>
                        <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{badge.description}</p>
                      </div>
                    );
                  }) : (
                    <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">Первый бейдж появится после подтверждённого результата.</div>
                  )}
                </div>
              </Card>

              <div className="border-l border-border pl-5">
                {ACTIVITY_EVENTS.slice(0, 4).map((event, index) => (
                  <div key={event.title} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < 3 && <span className="absolute bottom-0 left-[15px] top-8 w-px bg-border" />}
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                      <event.icon size={14} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2">
                        <p className="text-sm font-semibold">{event.title}</p>
                        <span className="text-[11px] text-muted-foreground">{event.date}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </Tabs.Content>

        <Tabs.Content value="results" className="mt-8 min-w-0 outline-none">
          <Reveal>
            <SectionHeading
              title="Сила результата в контексте"
              description="Место всегда показано вместе с размером соревнования: 8 из 612 сильнее, чем просто «8 место»."
            />
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
              <Card className="flex min-h-[230px] items-center justify-center border-border bg-card p-5">
                <div className="flex flex-col items-center text-center">
                  <RankGauge topPercent={bestTopPercent} />
                  <p className="mt-4 font-semibold">Лучший результат: top-{bestTopPercent.toFixed(1)}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">8 место из 612 valid participants</p>
                </div>
              </Card>

              <Card className="border-border bg-card p-5">
                <h3 className="font-heading text-lg font-bold">Результат устойчив</h3>
                <p className="mt-1 text-xs text-muted-foreground">Разрыв после private-пересчёта небольшой</p>
                <div className="mt-6 space-y-5">
                  {[
                    { label: "Public rank", value: selectedResult.publicRank, score: selectedResult.publicScore, width: 94 },
                    { label: "Private rank", value: selectedResult.privateRank, score: selectedResult.privateScore, width: 91 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-semibold">#{item.value} · {item.score}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${item.width}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={14} />
                  Падение всего на {Math.max(0, selectedResult.privateRank - selectedResult.publicRank)} позиции
                </div>
              </Card>

              <Card className="border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Стабильность результатов</h3>
                  </div>
                  <EvidenceTag tone="positive">Высокая</EvidenceTag>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={stabilityData} margin={{ top: 22, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" hide />
                    <YAxis reversed domain={[0, 12]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => [`top-${value}%`, "Результат"]} />
                    <Line type="monotone" dataKey="top" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ fill: "hsl(var(--chart-2))", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 border-t border-border pt-3 text-center">
                  <div><p className="text-xs text-muted-foreground">Медиана</p><p className="mt-1 font-semibold">top-3.4%</p></div>
                  <div><p className="text-xs text-muted-foreground">Среднее</p><p className="mt-1 font-semibold">top-4.5%</p></div>
                  <div><p className="text-xs text-muted-foreground">Разброс</p><p className="mt-1 font-semibold">Низкий</p></div>
                </div>
              </Card>
            </div>
          </Reveal>

          <Reveal className="mt-10" delay={0.08}>
            <SectionHeading
              title="Проверяемые результаты"
              description="Финальный private rank, score, baseline и статус проверки собраны в одной таблице."
              action={(
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "all", label: "Все" },
                    { value: "classification", label: "Classification" },
                    { value: "nlp", label: "NLP" },
                    { value: "regression", label: "Regression" },
                    { value: "cv", label: "CV" },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setResultFilter(filter.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        resultFilter === filter.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            />

            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-xs">
                  <thead className="border-b border-border bg-secondary/60 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Соревнование</th>
                      <th className="px-3 py-3 font-semibold">Задача</th>
                      <th className="px-3 py-3 font-semibold">Private rank</th>
                      <th className="px-3 py-3 font-semibold">Score</th>
                      <th className="px-3 py-3 font-semibold">Baseline</th>
                      <th className="px-3 py-3 font-semibold">Submit</th>
                      <th className="px-3 py-3 font-semibold">Проверка</th>
                      <th className="w-10 px-3 py-3"><span className="sr-only">Открыть</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredResults.map((result) => {
                      const topPercent = (result.rank / result.participants) * 100;
                      return (
                        <tr
                          key={result.id}
                          className={cn("cursor-pointer transition-colors hover:bg-secondary/40", selectedResultId === result.id && "bg-primary/5")}
                          onClick={() => setSelectedResultId(result.id)}
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-foreground">{result.title}</p>
                            <div className="mt-1 flex gap-1.5">
                              <span className="text-muted-foreground">{result.domain}</span>
                              <span className="text-border">·</span>
                              <span className="text-muted-foreground">{result.difficulty}</span>
                            </div>
                          </td>
                          <td className="px-3 py-4"><EvidenceTag>{result.taskLabel}</EvidenceTag></td>
                          <td className="px-3 py-4">
                            <p className="font-semibold">#{result.rank} / {result.participants}</p>
                            <p className="mt-1 text-[11px] text-primary">top-{topPercent.toFixed(1)}%</p>
                          </td>
                          <td className="px-3 py-4 font-mono font-semibold">{result.privateScore}</td>
                          <td className="px-3 py-4">
                            <p className="font-mono">{result.baselineScore}</p>
                            <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{result.improvement}</p>
                          </td>
                          <td className="px-3 py-4">{result.submits}</td>
                          <td className="px-3 py-4"><EvidenceTag tone="positive">{result.verification}</EvidenceTag></td>
                          <td className="px-3 py-4"><ChevronRight size={16} className="text-muted-foreground" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-border bg-secondary/30 p-4 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedResult.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Участник оказался выше медианного score и подтвердил результат на private leaderboard.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Регистраций", value: selectedResult.context.registrations },
                      { label: "Valid участников", value: selectedResult.context.valid },
                      { label: "Побили baseline", value: selectedResult.context.baselineBeaten },
                      { label: "Вузов", value: selectedResult.context.universities },
                    ].map((item) => (
                      <div key={item.label} className="min-w-[118px]">
                        <p className="text-[11px] text-muted-foreground">{item.label}</p>
                        <p className="mt-1 font-heading text-lg font-bold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-10" delay={0.12}>
            <SectionHeading
              title="Типы задач, сложность и домены"
              description="Паспорт показывает ширину практики и не выдаёт единичный сильный результат за универсальную экспертизу."
            />
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="border-border bg-card p-5">
                <h3 className="font-semibold">Матрица опыта</h3>
                <div className="mt-5 space-y-4">
                  {[
                    { label: "Классификация", medium: 58, hard: 32 },
                    { label: "NLP", medium: 67, hard: 18 },
                    { label: "Regression", medium: 72, hard: 12 },
                    { label: "Computer Vision", medium: 41, hard: 44 },
                    { label: "Time Series", medium: 48, hard: 22 },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="font-medium">{row.label}</span>
                        <span className="text-muted-foreground">{Math.round((row.medium + row.hard) / 18)} задач</span>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
                        <div className="bg-primary" style={{ width: `${row.medium}%` }} />
                        <div className="bg-accent" style={{ width: `${row.hard}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary" /> Medium</span>
                  <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-accent" /> Hard</span>
                </div>
              </Card>

              <Card className="border-border bg-card p-5">
                <h3 className="font-semibold">Контекст задач</h3>
                <div className="mt-5">
                  <p className="text-xs font-medium text-muted-foreground">Домены</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Финтех · 6", "E-commerce · 4", "Retail · 3", "Telecom · 3", "PropTech · 2"].map((domain) => (
                      <EvidenceTag key={domain}>{domain}</EvidenceTag>
                    ))}
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-xs font-medium text-muted-foreground">Метрики</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["ROC-AUC", "F1", "RMSE", "Dice", "MAE"].map((metric) => (
                      <EvidenceTag key={metric} tone="primary">{metric}</EvidenceTag>
                    ))}
                  </div>
                </div>
                <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4">
                  <div className="flex items-start gap-3">
                    <Users size={18} className="mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Образовательный контекст</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Результаты получены в соревнованиях с участниками из 34 вузов. Персональные данные других участников не раскрываются.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Reveal>
        </Tabs.Content>

        <Tabs.Content value="submissions" className="mt-8 min-w-0 outline-none">
          <Reveal>
            <SectionHeading
              title="Умеет улучшать базовое решение"
              description="Даже без победы видно, насколько далеко участник продвинул baseline и сколько попыток ему потребовалось."
              action={(
                <div className="flex flex-wrap gap-1.5">
                  {RESULT_BLUEPRINTS.slice(0, 4).map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      title={result.title}
                      onClick={() => setSelectedResultId(result.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        selectedResultId === result.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {result.taskLabel}
                    </button>
                  ))}
                </div>
              )}
            />

            <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
              <MetricTile icon={Target} label="Baseline" value={selectedResult.baselineScore} detail={selectedResult.metric} tone="neutral" />
              <MetricTile icon={Trophy} label="Лучший score" value={selectedResult.bestScore} detail="private leaderboard" />
              <MetricTile icon={ArrowUpRight} label="Улучшение" value={selectedResult.improvement} detail="относительно baseline" tone="positive" />
              <MetricTile icon={GitPullRequest} label="До baseline" value={`${selectedResult.baselineAt} submit`} detail={`из ${selectedResult.submits} попыток`} tone="accent" />
            </div>

            <div className="mt-4 rounded-lg border border-border bg-card p-5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Путь от baseline к лучшему score</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedResult.improvement}</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-primary to-accent" />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground">
                <span>{selectedResult.baselineScore}</span>
                <span>{selectedResult.bestScore}</span>
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-10" delay={0.08}>
            <SectionHeading
              title="Как улучшалось решение"
              description="График показывает осмысленные итерации от первого валидного submit-а до лучшего результата."
            />
            <div className="grid gap-5 lg:grid-cols-[1.45fr_0.55fr]">
              <Card className="border-border bg-card p-4 md:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{selectedResult.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{selectedResult.metric} · submit number → score</p>
                  </div>
                  <EvidenceTag tone="positive">Лучший: #{selectedResult.submits}</EvidenceTag>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={selectedResult.scoreCurve} margin={{ top: 18, right: 16, left: -4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="submit" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Номер submit-а", position: "insideBottom", offset: -2, fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis domain={["dataMin - 0.02", "dataMax + 0.02"]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => [value, selectedResult.metric]} labelFormatter={(label) => `Submit ${label}`} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ fill: "hsl(var(--card))", stroke: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid gap-3">
                <MetricTile icon={Zap} label="Реальных улучшений" value={`${selectedResult.submits - 2}`} detail={`из ${selectedResult.submits} submit-ов`} tone="accent" />
                <MetricTile icon={TrendingUp} label="Средний прирост" value="+0.021" detail="на успешную итерацию" tone="positive" />
                <MetricTile icon={Clock3} label="Время до baseline" value="1 д 8 ч" detail="после скачивания данных" tone="neutral" />
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-10" delay={0.12}>
            <SectionHeading
              title="Аккуратность работы с данными"
              description="Валидность CSV, использование лимита и типовые ошибки дают понятную обратную связь."
            />
            <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
              <Card className="border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Valid / invalid</p>
                    <p className="mt-1 text-xs text-muted-foreground">{validSubmissions + invalidSubmissions} submit-ов всего</p>
                  </div>
                  <EvidenceTag tone="positive">{validRatio}% valid</EvidenceTag>
                </div>
                <div className="relative mx-auto h-[220px] max-w-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={submitPie} dataKey="value" innerRadius={62} outerRadius={86} paddingAngle={3} stroke="none">
                        {submitPie.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading text-3xl font-bold">{validRatio}%</span>
                    <span className="text-[11px] text-muted-foreground">валидных</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-t border-border pt-4 text-center">
                  <div><p className="text-xs text-muted-foreground">Валидные</p><p className="mt-1 font-semibold">{validSubmissions}</p></div>
                  <div><p className="text-xs text-muted-foreground">С ошибкой</p><p className="mt-1 font-semibold">{invalidSubmissions}</p></div>
                </div>
              </Card>

              <Card className="border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Ошибки валидации</p>
                    <p className="mt-1 text-xs text-muted-foreground">Human-readable причины вместо технических кодов</p>
                  </div>
                  <CircleAlert size={20} className="text-muted-foreground" />
                </div>
                <div className="mt-6 space-y-5">
                  {VALIDATION_ERRORS.map((error) => (
                    <div key={error.name}>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium">{error.name}</span>
                        <span className="text-muted-foreground">{error.count} случая</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${error.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-7">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="font-medium">Использование лимита</span>
                    <span className="text-muted-foreground">{selectedResult.submits} из 15</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(selectedResult.submits / 15) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">Поздних submit-ов: 8% · работа распределена равномерно</p>
                </div>
              </Card>
            </div>
          </Reveal>
        </Tabs.Content>

        <Tabs.Content value="trust" className="mt-8 min-w-0 outline-none">
          <Reveal>
            <SectionHeading
              title="Сила в формате 1×1"
              description="Elo, win rate, серии и сила соперников показывают результат под ограничением времени."
            />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
              <MetricTile icon={Swords} label="Текущий Elo" value={currentElo} detail={`максимум ${maxElo}`} />
              <MetricTile icon={Trophy} label="Win rate" value={`${winRate}%`} detail={`${profile.duels_won || 0} побед · ${profile.duels_lost || 0} поражений`} tone="positive" />
              <MetricTile icon={Zap} label="Лучшая серия" value="7 побед" detail="текущая серия: 3" tone="accent" />
              <MetricTile icon={Clock3} label="Первый submit" value="18 мин" detail="в среднем по дуэлям" tone="neutral" />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
              <Card className="border-border bg-card p-4 md:p-5">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Динамика Elo</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Средний рейтинг соперника: {Math.max(1000, currentElo - 34)}</p>
                  </div>
                  <EvidenceTag tone="positive">+{Math.max(0, currentElo - eloHistory[0]?.elo)}</EvidenceTag>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={eloHistory} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={["dataMin - 60", "dataMax + 60"]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => [value, "Elo"]} />
                    <Line type="monotone" dataKey="elo" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--card))", stroke: "hsl(var(--primary))", strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="border-border bg-card p-5">
                <p className="font-semibold">Победы / поражения</p>
                <div className="relative mx-auto h-[220px] max-w-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={duelPie} dataKey="value" innerRadius={62} outerRadius={86} paddingAngle={3} stroke="none">
                        {duelPie.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading text-3xl font-bold">{winRate}%</span>
                    <span className="text-[11px] text-muted-foreground">win rate</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-t border-border pt-4 text-center">
                  <div><p className="text-xs text-muted-foreground">Победы</p><p className="mt-1 font-semibold">{profile.duels_won || 0}</p></div>
                  <div><p className="text-xs text-muted-foreground">Timeout losses</p><p className="mt-1 font-semibold">2</p></div>
                </div>
              </Card>
            </div>
          </Reveal>

          <Reveal className="mt-10" delay={0.08}>
            <SectionHeading
              title="Насколько результату можно доверять"
              description="Показываем только подтверждения: private final, переданный код, ревью и воспроизводимость. Сырые risk-флаги не публикуются."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Medal, title: "Private final", detail: "5 результатов подтверждены", active: true },
                { icon: Code2, title: "Код передан", detail: "Для 3 соревнований", active: true },
                { icon: FileCheck2, title: "Код проверен", detail: "2 решения прошли review", active: true },
                { icon: CheckCircle2, title: "Воспроизведено", detail: "2 результата повторены", active: true },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <item.icon size={19} />
                  </span>
                  <div className="mt-4 flex items-center gap-1.5">
                    <p className="font-semibold">{item.title}</p>
                    <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <Card className="border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Результаты надёжны</h3>
                  </div>
                  <ShieldCheck className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-5 divide-y divide-border">
                  {[
                    ["Private score", "Подтверждён"],
                    ["Public/private gap", "Низкий"],
                    ["Нарушения", "Не обнаружены"],
                    ["Последняя проверка", "24 июля 2026"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Последний подтверждённый результат</h3>
                  </div>
                  <Activity size={20} className="text-muted-foreground" />
                </div>
                <div className="mt-5">
                  {ACTIVITY_EVENTS.map((event, index) => (
                    <div key={event.title} className="relative flex gap-3 pb-5 last:pb-0">
                      {index < ACTIVITY_EVENTS.length - 1 && <span className="absolute bottom-0 left-[15px] top-8 w-px bg-border" />}
                      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                        <event.icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-3">
                          <p className="text-sm font-semibold">{event.title}</p>
                          <span className="text-[11px] text-muted-foreground">{event.date}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Reveal>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
