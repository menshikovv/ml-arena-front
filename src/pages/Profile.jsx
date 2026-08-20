import React, { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Database,
  ExternalLink,
  Github,
  GraduationCap,
  Layers3,
  Link as LinkIcon,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageSquareText,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  UserRoundSearch,
  Users,
  X,
  Zap,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const DIRECTIONS = [
  { id: "classification", label: "Классификация", official: 5, duels: 8, community: 2, best: 2, typical: 7, recent: 5, status: "high", updated: "12 дней назад" },
  { id: "regression", label: "Регрессия", official: 4, duels: 6, community: 1, best: 4, typical: 11, recent: 8, status: "enough", updated: "21 день назад" },
  { id: "nlp", label: "NLP", official: 3, duels: 4, community: 2, best: 3, typical: 9, recent: 6, status: "enough", updated: "34 дня назад" },
  { id: "cv", label: "Компьютерное зрение", official: 2, duels: 2, community: 1, best: 8, typical: 16, recent: 12, status: "enough", updated: "48 дней назад" },
  { id: "time_series", label: "Временные ряды", official: 1, duels: 2, community: 2, best: 13, typical: 19, recent: 17, status: "low", updated: "2 месяца назад" },
  { id: "ranking", label: "Ранжирование", official: 1, duels: 0, community: 1, best: 18, typical: 18, recent: 18, status: "low", updated: "3 месяца назад" },
  { id: "clustering", label: "Кластеризация", official: 0, duels: 0, community: 2, best: null, typical: null, recent: null, status: "community", updated: "9 дней назад" },
  { id: "recsys", label: "RecSys", official: 0, duels: 0, community: 0, best: null, typical: null, recent: null, status: "low", updated: "нет подтверждений" },
];

const OFFICIAL_RESULTS = [
  { id: "result-anomaly", title: "Детекция аномалий в транзакциях", direction: "Классификация", domain: "Финтех", metric: "ROC-AUC", rank: 8, participants: 612, score: "0.941", baseline: "0.781", improvement: "+20,5%", verification: 4, date: "24 июля 2026", submits: 9 },
  { id: "result-nlp", title: "Классификация тональности отзывов", direction: "NLP", domain: "Электронная торговля", metric: "F1", rank: 12, participants: 480, score: "0.927", baseline: "0.744", improvement: "+24,6%", verification: 2, date: "11 июля 2026", submits: 7 },
  { id: "result-estate", title: "Предсказание цен на недвижимость", direction: "Регрессия", domain: "Недвижимость", metric: "RMSE", rank: 18, participants: 216, score: "2.410", baseline: "2.930", improvement: "+17,7%", verification: 3, date: "18 июня 2026", submits: 8 },
  { id: "result-segmentation", title: "Сегментация изображений товаров", direction: "Компьютерное зрение", domain: "Ритейл", metric: "Dice", rank: 16, participants: 198, score: "0.887", baseline: "0.692", improvement: "+28,2%", verification: 2, date: "2 июня 2026", submits: 10 },
];

const COMMUNITY_RESULTS = [
  { title: "Прогноз оттока в подписном сервисе", organizer: "data_north", direction: "Классификация", rank: 9, participants: 86, score: "0.8842", access: "Открыто", date: "12 августа 2026" },
  { title: "Спрос на велосипеды по часам", organizer: "ml_student", direction: "Временные ряды", rank: 14, participants: 61, score: "18.74", access: "По заявке", date: "30 июля 2026" },
];

const EXTERNAL_RESULTS = [
  { id: "external-1", source: "Kaggle", title: "Playground Series · Season 4", result: "Серебряная медаль · top-8%", direction: "Классификация", method: "Публичная таблица результатов", date: "2025", status: "verified" },
  { id: "external-2", source: "ODS.ai", title: "NLP Course Competition", result: "Финалист · 17 место", direction: "NLP", method: "Ожидает проверки", date: "2026", status: "pending" },
];

const VERIFIED_STACK = [
  { name: "CatBoost", count: 7, detail: "проверенных решений" },
  { name: "PyTorch", count: 4, detail: "проверенных решения" },
  { name: "Docker", count: 2, detail: "воспроизведённых решения" },
  { name: "Воспроизводимые пайплайны", count: 3, detail: "подтверждения" },
];

const VERIFICATION_LEVELS = ["Результат рассчитан", "Подтверждён на закрытых данных", "Код проверен", "Результат воспроизведён", "Решение защищено"];

const RATING_HISTORY = [
  { label: "март", overall: 1080, competitions: 1115, duels: 1002 },
  { label: "апр", overall: 1138, competitions: 1180, duels: 1040 },
  { label: "май", overall: 1194, competitions: 1241, duels: 1085 },
  { label: "июнь", overall: 1268, competitions: 1320, duels: 1146 },
  { label: "июль", overall: 1332, competitions: 1392, duels: 1192 },
  { label: "авг", overall: 1386, competitions: 1446, duels: 1246 },
];

const TOOLTIP_STYLE = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--popover-foreground))", fontSize: 12 };

const PREVIEW_PROFILE = {
  id: "preview-user",
  user_name: "menshikov",
  full_name: "Матвей Меньшиков",
  bio: "ML-специалист, который подтверждает навыки соревнованиями, дуэлями и воспроизводимыми решениями.",
  city: "Москва",
  university: "НИУ ВШЭ",
  company: "",
  rating: 1386,
  duels_won: 11,
  duels_lost: 7,
  competitions_participated: 18,
  visible_to_employers: true,
};

function SourceBadge({ type, children }) {
  const styles = {
    official: "border-primary/25 bg-primary/10 text-primary",
    community: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    external: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    neutral: "border-border bg-secondary text-muted-foreground",
  };
  return <span className={cn("inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold", styles[type])}>{children}</span>;
}

function DataStatus({ status }) {
  const variants = {
    high: { label: "Высокая подтверждённость", icon: ShieldCheck, className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    enough: { label: "Достаточно данных", icon: CheckCircle2, className: "border-primary/25 bg-primary/10 text-primary" },
    low: { label: "Мало данных", icon: CircleHelp, className: "border-border bg-secondary text-muted-foreground" },
    community: { label: "Только практика сообщества", icon: Users, className: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  };
  const variant = variants[status] || variants.low;
  const Icon = variant.icon;
  return <span className={cn("inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold", variant.className)}><Icon size={12} />{variant.label}</span>;
}

function SectionHeading({ title, description, action }) {
  return <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-heading text-2xl font-extrabold leading-tight md:text-3xl">{title}</h2>{description && <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</div>;
}

function SummaryMetric({ icon: Icon, label, value, detail }) {
  return <div className="min-h-28 border border-border bg-card p-4 transition-colors hover:border-primary/30"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-2xl font-extrabold">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div><span className="flex h-9 w-9 shrink-0 items-center justify-center border border-primary/15 bg-primary/10 text-primary"><Icon size={17} /></span></div></div>;
}

function SkillDirectionCard({ skill }) {
  return (
    <article className="group flex min-h-[255px] flex-col border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row"><h3 className="font-heading text-lg font-extrabold">{skill.label}</h3><DataStatus status={skill.status} /></div>
      {skill.best != null ? <div className="mt-6 grid grid-cols-3 gap-px bg-border">{[["Пик", `top-${skill.best}%`], ["Обычно", `top-${skill.typical}%`], ["Сейчас", `top-${skill.recent}%`]].map(([label, value]) => <div key={label} className="bg-card px-2 py-3 text-center"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>)}</div> : <p className="mt-6 min-h-[65px] border-y border-border py-3 text-xs leading-5 text-muted-foreground">По этому направлению пока недостаточно официальных подтверждений для устойчивого вывода.</p>}
      <div className="mt-auto grid grid-cols-3 gap-3 pt-5 text-xs"><div><p className="text-muted-foreground">Официально</p><p className="mt-1 font-bold">{skill.official}</p></div><div><p className="text-muted-foreground">Дуэли</p><p className="mt-1 font-bold">{skill.duels}</p></div><div><p className="text-muted-foreground">Сообщество</p><p className="mt-1 font-bold">{skill.community}</p></div></div>
      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Clock3 size={12} />{skill.updated}</p>
    </article>
  );
}

function VerificationLadder({ level }) {
  return <div className="grid gap-2 sm:grid-cols-5">{VERIFICATION_LEVELS.map((label, index) => { const complete = index < level; return <div key={label} className={cn("relative min-h-28 border p-3", complete ? "border-emerald-500/25 bg-emerald-500/5" : "border-border bg-secondary/25")}><span className={cn("flex h-7 w-7 items-center justify-center border text-xs font-bold", complete ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border text-muted-foreground")}>{complete ? <Check size={14} /> : index + 1}</span><p className="mt-3 text-xs font-semibold leading-5">{label}</p></div>; })}</div>;
}

function OfficialResultCard({ result, selected, onSelect }) {
  const percentile = ((result.rank / result.participants) * 100).toFixed(1);
  return (
    <button type="button" onClick={onSelect} className={cn("w-full border bg-card p-5 text-left transition-all hover:border-primary/40", selected ? "border-primary shadow-lg" : "border-border")}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><div className="flex flex-wrap gap-2"><SourceBadge type="official"><ShieldCheck size={12} />Официальный результат</SourceBadge><SourceBadge type="neutral">{result.direction}</SourceBadge></div><h3 className="mt-4 font-heading text-xl font-extrabold">{result.title}</h3><p className="mt-2 text-xs text-muted-foreground">{result.domain} · {result.metric} · {result.date}</p></div><div className="grid shrink-0 grid-cols-2 gap-px bg-border md:w-[310px]"><div className="bg-card p-3"><p className="text-[10px] text-muted-foreground">Итоговое место</p><p className="mt-1 font-heading text-xl font-extrabold">#{result.rank} из {result.participants}</p><p className="mt-1 text-[11px] text-primary">top-{percentile}%</p></div><div className="bg-card p-3"><p className="text-[10px] text-muted-foreground">Улучшение</p><p className="mt-1 font-heading text-xl font-extrabold">{result.improvement}</p><p className="mt-1 text-[11px] text-muted-foreground">от baseline</p></div></div></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="text-xs text-muted-foreground">Результат {result.score} · базовое решение {result.baseline} · {result.submits} отправок</p><span className="flex items-center gap-1 text-xs font-semibold text-primary">Проверка: уровень {result.verification}<ChevronRight size={14} /></span></div>
    </button>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-border bg-card shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4"><h2 className="font-heading text-xl font-extrabold">{title}</h2><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border hover:bg-secondary" aria-label="Закрыть"><X size={17} /></button></div><div className="p-5 sm:p-6">{children}</div></div></div>;
}

export default function Profile() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("evidence");
  const [selectedResultId, setSelectedResultId] = useState(OFFICIAL_RESULTS[0].id);
  const [externalOpen, setExternalOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [visibilityOverride, setVisibilityOverride] = useState(null);
  const isOwner = !id || id === "me";
  const employerMode = searchParams.get("mode") === "employer";
  const previewEnabled = String(import.meta.env.VITE_ENABLE_CLOSED_SECTIONS || "").toLowerCase() === "true";
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id || "me"],
    queryFn: async () => {
      try {
        return await base44.entities.MLProfile.get(id || "me");
      } catch (error) {
        if (previewEnabled) return PREVIEW_PROFILE;
        throw error;
      }
    },
  });
  const selectedResult = useMemo(() => OFFICIAL_RESULTS.find((item) => item.id === selectedResultId) || OFFICIAL_RESULTS[0], [selectedResultId]);

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  if (!profile) return <div className="py-20 text-center text-muted-foreground">ML-паспорт не найден</div>;

  const totalDuels = (profile.duels_won || 0) + (profile.duels_lost || 0);
  const winRate = totalDuels ? Math.round(((profile.duels_won || 0) / totalDuels) * 100) : 61;
  const visibleToEmployers = visibilityOverride ?? profile.visible_to_employers ?? false;
  const rating = profile.rating || 1386;
  const changeMode = (mode) => { const next = new URLSearchParams(searchParams); if (mode === "employer") next.set("mode", "employer"); else next.delete("mode"); setSearchParams(next); };

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-6 md:px-6 lg:px-8 lg:py-10">
      {isOwner && <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck size={16} className="text-primary" />Вы видите полную версию своего ML-паспорта</div><div className="flex w-full border border-border bg-card p-1 sm:w-auto"><button type="button" onClick={() => changeMode("owner")} className={cn("flex-1 px-4 py-2 text-xs font-semibold sm:flex-none", !employerMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Мой вид</button><button type="button" onClick={() => changeMode("employer")} className={cn("flex-1 px-4 py-2 text-xs font-semibold sm:flex-none", employerMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Как видит компания</button></div></div>}

      <Reveal className="grid gap-px border border-border bg-border lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.55fr)]">
        <section className="relative overflow-hidden bg-card p-5 sm:p-7 lg:p-8"><div className="absolute inset-x-0 top-0 h-1 bg-primary" /><div className="flex flex-col gap-6 sm:flex-row sm:items-start"><Avatar name={profile.user_name} src={profile.avatar_url} size={104} className="ring-2 ring-primary/20" /><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><LeagueBadge rating={rating} size="lg" /><SourceBadge type="official"><ShieldCheck size={12} />{OFFICIAL_RESULTS.length} официальных подтверждения</SourceBadge></div><h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight sm:text-4xl">{profile.user_name}</h1>{profile.full_name && <p className="mt-1 text-sm text-muted-foreground">{profile.full_name}</p>}<p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{profile.bio || "ML-специалист с подтверждённой практикой в классификации, регрессии и NLP. Паспорт разделяет официальные результаты, практику сообщества и внешние достижения."}</p><div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">{profile.city && <span className="flex items-center gap-1.5"><MapPin size={13} />{profile.city}</span>}{profile.university && <span className="flex items-center gap-1.5"><GraduationCap size={13} />{profile.university}</span>}{profile.company && <span className="flex items-center gap-1.5"><BriefcaseBusiness size={13} />{profile.company}</span>}{profile.github_url && <a href={profile.github_url} className="flex items-center gap-1.5 hover:text-primary"><Github size={13} />GitHub</a>}{profile.kaggle_url && <a href={profile.kaggle_url} className="flex items-center gap-1.5 hover:text-primary"><LinkIcon size={13} />Kaggle</a>}</div></div></div><div className="mt-7 grid gap-px bg-border sm:grid-cols-4">{[["Рейтинг сезона", rating, "место #184"], ["Подтверждений", 18, "официальный слой"], ["Воспроизведено", 2, "контролируемая среда"], ["Последний результат", "12 дней", "свежесть подтверждения"]].map(([label, value, detail]) => <div key={label} className="bg-card px-4 py-4"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-2 font-heading text-xl font-extrabold">{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></div>)}</div></section>
        <aside className="flex flex-col bg-card p-5 sm:p-7">{employerMode ? <EmployerSummary visible={visibleToEmployers} /> : <OwnerSummary visible={visibleToEmployers} onVisibility={() => setVisibilityOverride(!visibleToEmployers)} onConsultation={() => setConsultationOpen(true)} />}</aside>
      </Reveal>

      <Stagger className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StaggerItem><SummaryMetric icon={Trophy} label="Официальные соревнования" value="18" detail="5 итоговых top-10" /></StaggerItem><StaggerItem><SummaryMetric icon={Swords} label="Человеческие дуэли" value={totalDuels || 18} detail={`${winRate}% побед · Elo 1246`} /></StaggerItem><StaggerItem><SummaryMetric icon={Users} label="Практика сообщества" value="7" detail="не влияет на рейтинг" /></StaggerItem><StaggerItem><SummaryMetric icon={Award} label="Внешние достижения" value="1 + 1" detail="подтверждено · на проверке" /></StaggerItem></Stagger>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mt-9 min-w-0">
        <Tabs.List className="sticky top-3 z-20 flex overflow-x-auto border border-border bg-card/95 p-1 shadow-sm [scrollbar-width:none] backdrop-blur [&::-webkit-scrollbar]:hidden" aria-label="Разделы ML-паспорта">{[["evidence", "Подтверждения", ShieldCheck], ["results", "Результаты", Trophy], ["practice", "Практика", Swords], ["career", "Карьера и развитие", BriefcaseBusiness]].map(([value, label, Icon]) => <Tabs.Trigger key={value} value={value} className="flex min-h-11 min-w-[165px] flex-1 shrink-0 items-center justify-center gap-2 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:min-w-0"><Icon size={16} />{label}</Tabs.Trigger>)}</Tabs.List>

        <Tabs.Content value="evidence" className="mt-9 outline-none">
          <Reveal><SectionHeading title="Восемь направлений" description="Статус зависит от количества независимых официальных подтверждений и глубины проверки. Практика сообщества и внешние достижения показаны рядом, но не повышают статус автоматически." /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{DIRECTIONS.map((skill) => <SkillDirectionCard key={skill.id} skill={skill} />)}</div></Reveal>
          <Reveal className="mt-12" delay={0.06}><SectionHeading title="Текущий сезон" description="Сезонный рейтинг показывает текущую соревновательную форму. Долгосрочная история подтверждений после завершения сезона сохраняется." /><div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]"><Card className="border-border bg-card p-4 sm:p-5"><ResponsiveContainer width="100%" height={300}><LineChart data={RATING_HISTORY} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[900, 1500]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={TOOLTIP_STYLE} /><Line type="monotone" dataKey="overall" name="Общий" stroke="hsl(var(--foreground))" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="competitions" name="Соревнования" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="duels" name="Дуэли" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer><div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="h-0.5 w-5 bg-foreground" />Общий</span><span className="flex items-center gap-2"><i className="h-0.5 w-5 bg-primary" />Соревнования · 70%</span><span className="flex items-center gap-2"><i className="h-0.5 w-5 bg-chart-2" />Дуэли · 30%</span></div></Card><div className="grid gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-1">{[["Общий рейтинг", rating, "#184 на платформе"], ["Соревнования", 1446, "#126 · основной вклад"], ["Дуэли", 1246, "#218 · 18 матчей"]].map(([label, value, detail]) => <div key={label} className="bg-card p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-3 font-heading text-3xl font-extrabold">{value}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p></div>)}</div></div></Reveal>
          <Reveal className="mt-12" delay={0.1}><SectionHeading title="Надёжность и инженерная готовность" description="Технология считается подтверждённой только тогда, когда она обнаружена или проверена в артефактах решения." /><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.7fr)]"><div className="grid gap-3 sm:grid-cols-2">{VERIFIED_STACK.map((item) => <article key={item.name} className="border border-border bg-card p-5"><Code2 size={19} className="text-primary" /><h3 className="mt-4 font-heading text-lg font-extrabold">{item.name}</h3><p className="mt-2 text-sm text-muted-foreground"><strong className="text-foreground">{item.count}</strong> {item.detail}</p></article>)}</div><Card className="border-border bg-card p-5"><h3 className="font-heading text-xl font-extrabold">Глубина проверки</h3><div className="mt-5 space-y-4">{[["На закрытых данных", 5], ["Код проверен", 3], ["Воспроизведено", 2], ["Защищено экспертом", 0]].map(([label, count]) => <div key={label}><div className="flex justify-between text-xs"><span>{label}</span><strong>{count}</strong></div><div className="mt-2 h-1.5 bg-secondary"><div className="h-full bg-primary" style={{ width: `${Math.min(100, count * 20)}%` }} /></div></div>)}</div><p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">Внутренние риск-флаги и служебные проверки никогда не публикуются в ML-паспорте.</p></Card></div></Reveal>
        </Tabs.Content>

        <Tabs.Content value="results" className="mt-9 outline-none">
          <Reveal><SectionHeading title="Официальные результаты" description="Место показано вместе с числом валидных участников, метрикой, базовым решением и фактической глубиной проверки." /><div className="space-y-3">{OFFICIAL_RESULTS.map((result) => <OfficialResultCard key={result.id} result={result} selected={selectedResultId === result.id} onSelect={() => setSelectedResultId(result.id)} />)}</div></Reveal>
          <Reveal className="mt-10" delay={0.06}><SectionHeading title={`Проверка результата: ${selectedResult.title}`} description="Шкала показывает, что именно подтверждено. Не каждое официальное соревнование обязано доходить до максимального уровня." /><VerificationLadder level={selectedResult.verification} /><div className="mt-5 grid gap-3 sm:grid-cols-4">{[["Итоговое место", `#${selectedResult.rank} из ${selectedResult.participants}`], ["Результат", selectedResult.score], ["Базовое решение", selectedResult.baseline], ["Отправок", selectedResult.submits]].map(([label, value]) => <div key={label} className="border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-xl font-extrabold">{value}</p></div>)}</div></Reveal>
          <Reveal className="mt-10" delay={0.1}><SectionHeading title="Опыт по задачам" description="Ширина и глубина показаны отдельно, без скрытой оценки универсальности." /><div className="grid gap-px border border-border bg-border md:grid-cols-3">{[[Layers3, "Ширина", "4 направления с достаточными официальными подтверждениями"], [Target, "Основная глубина", "Классификация · 5 соревнований и 8 дуэлей"], [Database, "Домены", "Финтех, ритейл, телеком, E-commerce и PropTech"]].map(([Icon, title, text]) => <article key={title} className="bg-card p-6"><Icon size={20} className="text-primary" /><h3 className="mt-5 font-heading text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></Reveal>
        </Tabs.Content>

        <Tabs.Content value="practice" className="mt-9 outline-none">
          <Reveal><SectionHeading title="Дуэли и вызовы ML-Арены" description="Матчи с людьми и самостоятельные вызовы учитываются раздельно. Вызовы не входят в человеческий процент побед и не закрывают калибровочные матчи." /><div className="grid gap-5 lg:grid-cols-2"><PracticeCard icon={Swords} label="Человеческие дуэли" title="Elo 1246" values={[["Матчей", totalDuels || 18], ["Побед", profile.duels_won || 11], ["Победы", `${winRate}%`]]} text="Средний рейтинг соперника 1210 · максимальный Elo 1345 · текущая серия 3." /><PracticeCard icon={Zap} label="Вызовы ML-Арены" title="+27 из 40" values={[["Попыток", 8], ["Побед", 5], ["Продвинутый", "2 / 4"]]} text="Небольшой сезонный бонус за откалиброванные задачи платформы. Поражение не снижает рейтинг." /></div></Reveal>
          <Reveal className="mt-12" delay={0.06}><SectionHeading title="Практика сообщества" description="Это реальные результаты, но код не проверялся ML-Ареной. Они не меняют сезонный рейтинг и подтверждённые навыки." /><div className="grid gap-3 lg:grid-cols-2">{COMMUNITY_RESULTS.map((result) => <article key={result.title} className="border border-border bg-card p-5"><SourceBadge type="community"><Users size={12} />Сообщество · код не проверен</SourceBadge><h3 className="mt-4 font-heading text-xl font-extrabold">{result.title}</h3><p className="mt-2 text-xs text-muted-foreground">Организатор @{result.organizer} · {result.direction} · {result.access}</p><div className="mt-5 grid grid-cols-3 gap-px bg-border"><div className="bg-card p-3"><p className="text-[10px] text-muted-foreground">Место</p><p className="mt-1 font-bold">#{result.rank} из {result.participants}</p></div><div className="bg-card p-3"><p className="text-[10px] text-muted-foreground">Результат</p><p className="mt-1 font-bold">{result.score}</p></div><div className="bg-card p-3"><p className="text-[10px] text-muted-foreground">Завершено</p><p className="mt-1 text-xs font-bold">{result.date}</p></div></div></article>)}</div></Reveal>
          <Reveal className="mt-12" delay={0.1}><SectionHeading title="Внешние достижения" description="Источник, способ проверки и статус всегда видны. Внешние результаты не начисляют внутренний сезонный рейтинг." action={isOwner && <Button onClick={() => setExternalOpen(true)}><Plus size={16} />Добавить достижение</Button>} /><div className="grid gap-3 lg:grid-cols-2">{EXTERNAL_RESULTS.map((result) => <article key={result.id} className="border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><SourceBadge type="external"><ExternalLink size={12} />{result.source}</SourceBadge><SourceBadge type={result.status === "verified" ? "official" : "neutral"}>{result.status === "verified" ? <><Check size={12} />Источник проверен</> : <><Clock3 size={12} />На проверке</>}</SourceBadge></div><h3 className="mt-4 font-heading text-xl font-extrabold">{result.title}</h3><p className="mt-2 text-sm font-semibold">{result.result}</p><p className="mt-4 text-xs leading-5 text-muted-foreground">{result.direction} · {result.date}<br />{result.method}</p></article>)}</div></Reveal>
        </Tabs.Content>

        <Tabs.Content value="career" className="mt-9 outline-none">
          <Reveal><SectionHeading title="Почему кандидата стоит рассмотреть" description="Вывод опирается на видимые первичные факты и не использует скрытый HR-рейтинг или психологические предположения." /><div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"><div className="grid gap-3 sm:grid-cols-2">{[[ShieldCheck, "Независимые подтверждения", "18 официальных результатов в нескольких форматах задач."], [TrendingUp, "Стабильная текущая форма", "Свежий результат в верхних 5%; типичный уровень в сильных направлениях — верхние 7–11%."], [Code2, "Проверенные артефакты", "Код проверен в 3 решениях, 2 результата воспроизведены."], [Layers3, "Понятные границы", "Сильные данные по 4 направлениям; по RecSys и кластеризации пока мало официальных подтверждений."]].map(([Icon, title, text]) => <article key={title} className="border border-border bg-card p-5"><Icon size={20} className="text-primary" /><h3 className="mt-4 font-heading text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div><CareerCard employerMode={employerMode} visible={visibleToEmployers} /></div></Reveal>
          <Reveal className="mt-12" delay={0.06}><SectionHeading title="Следующие шаги" description="Рекомендации объясняют, каких подтверждений не хватает, и не меняют рейтинг сами по себе." /><div className="grid gap-px border border-border bg-border md:grid-cols-3">{[[1, "Закрепить временные ряды", "Завершить ещё две официальные задачи, чтобы перейти из статуса «Мало данных»."], [2, "Добавить подтверждения RecSys", "Пройти официальную задачу или дуэль по рекомендательным системам."], [3, "Усилить воспроизводимость", "Передать код и окружение для одного из свежих результатов в верхних 10%." ]].map(([number, title, text]) => <article key={title} className="bg-card p-6"><span className="flex h-8 w-8 items-center justify-center border border-primary/20 bg-primary/10 text-xs font-bold text-primary">{number}</span><h3 className="mt-5 font-heading text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div>{isOwner && <div className="mt-5 flex flex-col items-start justify-between gap-4 border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center"><div><h3 className="font-heading text-xl font-extrabold">Персональный разбор ML-паспорта</h3><p className="mt-2 text-sm text-muted-foreground">Эксперт разберёт доказательства и предложит 3–5 приоритетов развития. Консультация не повышает рейтинг.</p></div><Button onClick={() => setConsultationOpen(true)} className="shrink-0"><MessageSquareText size={16} />Открыть в Premium</Button></div>}</Reveal>
        </Tabs.Content>
      </Tabs.Root>

      <Modal open={externalOpen} onClose={() => setExternalOpen(false)} title="Добавить внешнее достижение"><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); setExternalOpen(false); }}><Field label="Источник"><Input required placeholder="Kaggle, ODS.ai, олимпиада или другая площадка" /></Field><Field label="Название"><Input required placeholder="Название соревнования или программы" /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Результат"><Input required placeholder="Место, медаль или процентиль" /></Field><Field label="Дата"><Input required type="date" /></Field></div><Field label="Публичная ссылка"><Input type="url" placeholder="https://..." /></Field><Field label="Комментарий"><Textarea rows={3} placeholder="Кратко опишите контекст результата" /></Field><div className="border border-border bg-secondary/40 p-4 text-xs leading-5 text-muted-foreground"><LockKeyhole size={16} className="mb-2 text-primary" />До проверки достижение видите только вы и модератор. Изменение ключевых полей после подтверждения отправит новую версию на повторную проверку.</div><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setExternalOpen(false)}>Отмена</Button><Button type="submit"><Send size={16} />Отправить на проверку</Button></div></form></Modal>
      <Modal open={consultationOpen} onClose={() => setConsultationOpen(false)} title="Разбор ML-паспорта"><div className="text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center bg-primary/10 text-primary"><Sparkles size={25} /></span><h3 className="mt-6 font-heading text-2xl font-extrabold">Одна экспертная консультация в Premium</h3><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Эксперт получает снимок текущего паспорта, отмечает сильные доказательства и формирует персональный план. Это не влияет на рейтинг и выдачу работодателей.</p><Button asChild className="mt-6"><Link to="/pricing">Посмотреть Premium<ArrowRight size={16} /></Link></Button></div></Modal>
    </div>
  );
}

function PracticeCard({ icon: Icon, label, title, values, text }) {
  return <Card className="border-border bg-card p-6"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center bg-primary/10 text-primary"><Icon size={21} /></span><SourceBadge type="official">{label}</SourceBadge></div><h3 className="mt-6 font-heading text-2xl font-extrabold">{title}</h3><div className="mt-5 grid grid-cols-3 gap-px bg-border">{values.map(([itemLabel, value]) => <div key={itemLabel} className="bg-card p-3"><p className="text-[10px] text-muted-foreground">{itemLabel}</p><p className="mt-1 font-bold">{value}</p></div>)}</div><p className="mt-5 text-sm leading-6 text-muted-foreground">{text}</p></Card>;
}

function CareerCard({ employerMode, visible }) {
  return <Card className="border-border bg-card p-6"><UserRoundSearch size={24} className="text-primary" /><h3 className="mt-5 font-heading text-2xl font-extrabold">Карьерная доступность</h3><div className="mt-5 divide-y divide-border">{[["Статус", "Открыт к предложениям"], ["Целевые роли", "Junior ML / Data Scientist"], ["Формат", "Удалённо или гибрид"], ["Контакт", "Только по запросу"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><span className="text-muted-foreground">{label}</span><strong className="text-right">{value}</strong></div>)}</div>{employerMode ? <Button className="mt-5 w-full" disabled={!visible}><Send size={16} />{visible ? "Запросить контакт" : "Контакт закрыт"}</Button> : <Button asChild variant="outline" className="mt-5 w-full"><Link to="/profile/edit">Настроить карьерную видимость</Link></Button>}<p className="mt-3 text-[11px] leading-5 text-muted-foreground">Контакты передаются только с отдельного согласия пользователя. Действие компании должно журналироваться на сервере.</p></Card>;
}

function OwnerSummary({ visible, onVisibility, onConsultation }) {
  return <><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">Управление паспортом</p><h2 className="mt-2 font-heading text-2xl font-extrabold">Данные под вашим контролем</h2></div><ShieldCheck className="text-primary" size={23} /></div><div className="mt-6 space-y-3">{[[CheckCircle2, "Официальные результаты", "Добавляются автоматически"], [Users, "Практика сообщества", "Хранится отдельно"], [LockKeyhole, "Контакты", "Только с отдельного согласия"]].map(([Icon, title, text]) => <div key={title} className="flex items-start gap-3 border-b border-border pb-3"><Icon size={17} className="mt-0.5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div></div>)}</div><div className="mt-auto space-y-3 pt-6"><Button className="w-full" onClick={onConsultation}><Sparkles size={16} />Разбор в Premium</Button><Button variant="outline" className="w-full" onClick={onVisibility}>{visible ? "Скрыть от работодателей" : "Открыть работодателям"}</Button><Button asChild variant="ghost" className="w-full"><Link to="/profile/edit">Редактировать профиль<ArrowRight size={15} /></Link></Button></div></>;
}

function EmployerSummary({ visible }) {
  return <><UserRoundSearch className="text-primary" size={25} /><p className="mt-6 text-xs text-muted-foreground">Представление для компании</p><h2 className="mt-2 font-heading text-2xl font-extrabold">Факты до технического интервью</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Сильные направления, свежесть, число независимых подтверждений и глубина проверки без скрытого HR-балла.</p><div className="mt-6 grid grid-cols-2 gap-px bg-border"><div className="bg-card p-4"><p className="text-[10px] text-muted-foreground">Сильных направлений</p><p className="mt-2 font-heading text-2xl font-extrabold">4</p></div><div className="bg-card p-4"><p className="text-[10px] text-muted-foreground">Свежесть</p><p className="mt-2 font-heading text-2xl font-extrabold">12 дней</p></div></div><Button className="mt-auto w-full" disabled={!visible}><Send size={16} />{visible ? "Запросить контакт" : "Контакт закрыт"}</Button></>;
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>;
}
