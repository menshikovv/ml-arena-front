import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Crown,
  History,
  Info,
  Loader2,
  Medal,
  Search,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { api } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DIRECTIONS = [
  ["all", "Все направления"],
  ["classification", "Классификация"],
  ["regression", "Регрессия"],
  ["nlp", "NLP"],
  ["computer_vision", "Компьютерное зрение"],
  ["time_series", "Временные ряды"],
  ["ranking", "Ранжирование"],
  ["clustering", "Кластеризация"],
  ["recsys", "Рекомендательные системы"],
];

const DIRECTION_LABELS = Object.fromEntries(DIRECTIONS);

const RATING_ROWS = [
  { id: "u1", name: "datawizard", overall: 982, competition: 6720, competitionRank: 1, competitions: 8, best: 1.2, duel: 1488, duelRank: 4, duels: 24, wins: 16, streak: 5, activity: "1 час назад", directions: ["classification", "regression"], directionScores: { classification: 991, regression: 964 }, verified: 4 },
  { id: "u2", name: "ml_ninja", overall: 963, competition: 6185, competitionRank: 2, competitions: 7, best: 1.8, duel: 1552, duelRank: 1, duels: 31, wins: 22, streak: 7, activity: "3 часа назад", directions: ["nlp", "classification"], directionScores: { nlp: 988, classification: 934 }, verified: 3 },
  { id: "u3", name: "TheModel", overall: 947, competition: 5904, competitionRank: 3, competitions: 7, best: 2.1, duel: 1510, duelRank: 3, duels: 28, wins: 18, streak: 2, activity: "сегодня", directions: ["computer_vision", "classification"], directionScores: { computer_vision: 978, classification: 916 }, verified: 2 },
  { id: "u4", name: "gradient_boost", overall: 931, competition: 5420, competitionRank: 4, competitions: 6, best: 2.7, duel: 1528, duelRank: 2, duels: 26, wins: 19, streak: 4, activity: "сегодня", directions: ["regression", "time_series"], directionScores: { regression: 949, time_series: 923 }, verified: 3 },
  { id: "u5", name: "rec_engineer", overall: 912, competition: 5088, competitionRank: 5, competitions: 6, best: 3.1, duel: 1436, duelRank: 6, duels: 20, wins: 13, streak: 1, activity: "вчера", directions: ["recsys", "ranking"], directionScores: { recsys: 971, ranking: 934 }, verified: 2 },
  { id: "u6", name: "vision_lab", overall: 895, competition: 4810, competitionRank: 6, competitions: 5, best: 3.9, duel: 1448, duelRank: 5, duels: 22, wins: 14, streak: 3, activity: "вчера", directions: ["computer_vision", "clustering"], directionScores: { computer_vision: 946, clustering: 901 }, verified: 2 },
  { id: "preview-user", name: "menshikov", overall: 876, competition: 4382, competitionRank: 12, competitions: 5, best: 3, duel: 1287, duelRank: 40, duels: 18, wins: 11, streak: 3, activity: "2 дня назад", directions: ["classification", "regression"], directionScores: { classification: 902, regression: 846 }, verified: 2, me: true },
  { id: "u8", name: "catboosted", overall: 851, competition: 4215, competitionRank: 14, competitions: 5, best: 5.2, duel: 1331, duelRank: 19, duels: 16, wins: 10, streak: 0, activity: "2 дня назад", directions: ["classification", "regression"], directionScores: { classification: 875, regression: 832 }, verified: 1 },
  { id: "u9", name: "time_forecaster", overall: 829, competition: 3990, competitionRank: 17, competitions: 4, best: 6.4, duel: 1306, duelRank: 27, duels: 15, wins: 9, streak: 2, activity: "3 дня назад", directions: ["time_series", "regression"], directionScores: { time_series: 887, regression: 791 }, verified: 1 },
  { id: "u10", name: "ranker_pro", overall: 807, competition: 3628, competitionRank: 21, competitions: 4, best: 7.1, duel: 1292, duelRank: 35, duels: 13, wins: 8, streak: 1, activity: "3 дня назад", directions: ["ranking", "recsys"], directionScores: { ranking: 861, recsys: 822 }, verified: 1 },
  { id: "u11", name: "cluster_point", overall: 774, competition: 3310, competitionRank: 25, competitions: 3, best: 9.8, duel: 1258, duelRank: 48, duels: 11, wins: 6, streak: 0, activity: "5 дней назад", directions: ["clustering", "classification"], directionScores: { clustering: 824, classification: 742 }, verified: 0 },
  { id: "u12", name: "nlp_student", overall: 741, competition: 2985, competitionRank: 31, competitions: 3, best: 11.4, duel: 1224, duelRank: 61, duels: 9, wins: 5, streak: 1, activity: "6 дней назад", directions: ["nlp", "classification"], directionScores: { nlp: 793, classification: 711 }, verified: 0 },
];

const TAB_META = {
  overall: { label: "Общий", icon: Crown, metric: "Общий результат", description: "70% соревнования + 30% дуэли после нормализации мест" },
  competitions: { label: "Соревнования", icon: Trophy, metric: "Очки сезона", description: "Сумма очков всех финализированных рейтинговых событий" },
  duels: { label: "Дуэли", icon: Swords, metric: "Рейтинг дуэлей", description: "Сезонный рейтинг после пяти калибровочных матчей" },
};

function adaptRatingRow(entry, index, currentUserId) {
  const profile = entry.profile || entry.user || entry;
  const duelCount = entry.human_duel_count ?? entry.duels_count ?? (entry.wins || 0) + (entry.losses || 0);
  const id = entry.user_id || profile.id;
  return {
    id,
    name: profile.nickname || profile.user_name || profile.username || entry.nickname || `Участник ${index + 1}`,
    avatar: profile.avatar_url || entry.avatar_url,
    overall: Number(entry.overall_score ?? entry.score ?? entry.rating ?? 0),
    competition: Number(entry.competition_score ?? entry.competition_points ?? 0),
    competitionRank: entry.competition_rank ?? entry.rank ?? index + 1,
    competitions: entry.competition_count ?? entry.competitions_count ?? 0,
    best: entry.best_percentile ?? null,
    duel: Number(entry.duel_rating ?? entry.duel_score ?? 1000),
    duelRank: entry.duel_rank ?? null,
    duels: duelCount,
    wins: entry.wins ?? 0,
    streak: entry.win_streak ?? entry.streak ?? 0,
    activity: entry.updated_at || entry.last_activity_at || "—",
    directions: entry.directions || profile.strong_directions || [],
    directionScores: entry.direction_scores || {},
    verified: entry.verified_results_count ?? entry.competition_count ?? 0,
    me: Boolean(entry.is_current_user || (currentUserId && id === currentUserId)),
  };
}

function rankValue(row, tab, direction) {
  if (direction !== "all") {
    const score = row.directionScores?.[direction] || 0;
    if (tab === "competitions") return Math.round(score * 5.1);
    if (tab === "duels") return score ? 1000 + Math.round((score - 700) * 1.25) : 0;
    return score;
  }
  if (tab === "competitions") return row.competition;
  if (tab === "duels") return row.duel;
  return row.overall;
}

function SeasonSelector({ value, onChange, seasons }) {
  return <label className="relative block"><span className="sr-only">Сезон</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 appearance-none border border-border bg-card pl-4 pr-10 text-sm font-semibold outline-none hover:border-primary/40 focus:border-primary">{seasons.map((item) => <option key={item.slug} value={item.slug}>{item.name || item.title || item.slug}{item.status === "active" ? " · активен" : item.status === "archived" ? " · архив" : ""}</option>)}</select><History className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} /></label>;
}

function MyPosition({ row, rank, tab, direction, archived }) {
  const value = rankValue(row, tab, direction);
  const details = tab === "overall" ? [`Соревнования №${row.competitionRank}`, `Дуэли №${row.duelRank || "—"}`] : tab === "competitions" ? [`${row.competitions} соревнований`, `лучший результат: верхние ${row.best}%`] : [`${row.duels} дуэлей`, `${Math.round((row.wins / Math.max(row.duels, 1)) * 100)}% побед`];
  return (
    <section className="grid gap-px border border-border bg-border lg:grid-cols-[minmax(0,1fr)_200px_200px_auto]">
      <div className="bg-card p-5"><div className="flex items-center gap-3"><Avatar name={row.name} src={row.avatar} size={44} /><div><p className="text-xs text-muted-foreground">Моя позиция</p><p className="mt-1 font-heading text-lg font-extrabold">{row.name}</p></div></div></div>
      <div className="bg-card p-5"><p className="text-xs text-muted-foreground">Место</p><p className="mt-2 font-heading text-3xl font-extrabold">{rank ? `#${rank}` : "—"}</p></div>
      <div className="bg-card p-5"><p className="text-xs text-muted-foreground">{TAB_META[tab].metric}</p><p className="mt-2 font-heading text-3xl font-extrabold">{value.toLocaleString("ru-RU")}</p></div>
      <div className="flex min-w-60 flex-col justify-center bg-card p-5"><p className="text-xs text-muted-foreground">{rank ? details.join(" · ") : "В этой выборке пока нет рейтингового результата"}</p><Button asChild variant="outline" className="mt-3"><Link to={archived ? "/profile" : tab === "duels" ? "/duels" : "/competitions"}>{archived ? "Открыть ML-паспорт" : "Улучшить позицию"}<ArrowRight size={15} /></Link></Button></div>
    </section>
  );
}

function RatingRow({ row, rank, tab, direction }) {
  const value = rankValue(row, tab, direction);
  const winRate = Math.round((row.wins / Math.max(row.duels, 1)) * 100);
  return (
    <Link to={`/profile/${row.id}`} className={cn("group hidden min-h-20 grid-cols-[64px_minmax(210px,1.2fr)_minmax(170px,0.8fr)_minmax(160px,0.7fr)_140px] items-center border-b border-border px-5 transition-colors hover:bg-secondary/35 md:grid", row.me && "bg-primary/5")}>
      <Rank rank={rank} />
      <div className="flex min-w-0 items-center gap-3"><Avatar name={row.name} src={row.avatar} size={40} /><div className="min-w-0"><p className="truncate text-sm font-bold group-hover:text-primary">{row.name}{row.me && <span className="ml-2 text-[10px] text-primary">Это вы</span>}</p><div className="mt-1 flex flex-wrap gap-1">{row.directions.slice(0, 2).map((item) => <span key={item} className="text-[10px] text-muted-foreground">{DIRECTION_LABELS[item]}</span>)}</div></div></div>
      {tab === "overall" ? <div><p className="text-xs text-muted-foreground">Соревнования #{row.competitionRank}</p><p className="mt-1 text-xs text-muted-foreground">Дуэли #{row.duelRank || "калибровка"}</p></div> : tab === "competitions" ? <div><p className="text-sm font-semibold">{row.competitions} событий</p><p className="mt-1 text-xs text-muted-foreground">верхние {row.best ?? "—"}%</p></div> : <div><p className="text-sm font-semibold">{row.duels} дуэлей</p><p className="mt-1 text-xs text-muted-foreground">{row.wins} побед · {winRate}%</p></div>}
      {tab === "competitions" ? <div><p className="text-xs text-muted-foreground">Проверки</p><p className="mt-1 text-sm font-semibold">{row.verified ? `${row.verified} подтверждено` : "Результат рассчитан"}</p></div> : tab === "duels" ? <div><p className="text-xs text-muted-foreground">Серия</p><p className="mt-1 text-sm font-semibold">{row.streak ? `${row.streak} побед` : "—"}</p><p className="mt-1 text-[10px] text-muted-foreground">{row.activity}</p></div> : <div><p className="text-xs text-muted-foreground">Сильные области</p><p className="mt-1 text-sm font-semibold">{row.directions.slice(0, 2).map((item) => DIRECTION_LABELS[item]).join(" · ") || "—"}</p></div>}
      <div className="text-right"><p className="font-heading text-xl font-extrabold tabular-nums">{value.toLocaleString("ru-RU")}</p><p className="mt-1 text-[10px] text-muted-foreground">{TAB_META[tab].metric}</p></div>
    </Link>
  );
}

function MobileRatingCard({ row, rank, tab, direction }) {
  const value = rankValue(row, tab, direction);
  const winRate = Math.round((row.wins / Math.max(row.duels, 1)) * 100);
  return <Link to={`/profile/${row.id}`} className={cn("block border-b border-border bg-card p-4 md:hidden", row.me && "bg-primary/5")}><div className="flex items-center gap-3"><Rank rank={rank} /><Avatar name={row.name} src={row.avatar} size={38} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{row.name}{row.me && <span className="ml-2 text-[10px] text-primary">Это вы</span>}</p><p className="mt-1 text-[10px] text-muted-foreground">{row.directions.slice(0, 2).map((item) => DIRECTION_LABELS[item]).join(" · ")}</p></div><div className="text-right"><p className="font-heading text-lg font-extrabold">{value.toLocaleString("ru-RU")}</p><p className="text-[9px] text-muted-foreground">{TAB_META[tab].metric}</p></div></div><div className="mt-4 grid grid-cols-2 gap-px bg-border text-xs">{tab === "overall" ? <><div className="bg-card p-3">Соревнования <strong className="float-right">#{row.competitionRank}</strong></div><div className="bg-card p-3">Дуэли <strong className="float-right">#{row.duelRank || "—"}</strong></div></> : tab === "competitions" ? <><div className="bg-card p-3">Событий <strong className="float-right">{row.competitions}</strong></div><div className="bg-card p-3">Лучший <strong className="float-right">верхние {row.best ?? "—"}%</strong></div></> : <><div className="bg-card p-3">Дуэлей <strong className="float-right">{row.duels}</strong></div><div className="bg-card p-3">Победы <strong className="float-right">{winRate}%</strong></div></>}</div></Link>;
}

function Rank({ rank }) {
  if (rank === 1) return <span className="flex w-10 shrink-0 items-center gap-1 font-heading text-lg font-extrabold text-amber-600 dark:text-amber-400"><Crown size={17} />1</span>;
  if (rank <= 3) return <span className="flex w-10 shrink-0 items-center gap-1 font-heading text-lg font-extrabold text-primary"><Medal size={16} />{rank}</span>;
  return <span className="w-10 shrink-0 font-mono text-sm text-muted-foreground">{String(rank).padStart(2, "0")}</span>;
}

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const tab = TAB_META[searchParams.get("tab")] ? searchParams.get("tab") : "overall";
  const direction = DIRECTION_LABELS[searchParams.get("direction")] ? searchParams.get("direction") : "all";
  const seasonParam = searchParams.get("season") || "";
  const previewEnabled = String(import.meta.env.VITE_ENABLE_CLOSED_SECTIONS || "").toLowerCase() === "true";

  const seasonsQuery = useQuery({ queryKey: ["rating-seasons"], queryFn: api.rating.seasons, staleTime: 60000 });
  const seasons = Array.isArray(seasonsQuery.data) ? seasonsQuery.data : seasonsQuery.data?.items || [];
  const activeSeason = seasons.find((item) => item.status === "active")?.slug || seasons[0]?.slug || "founder-2026";
  const season = seasonParam || activeSeason;
  const archived = seasons.find((item) => item.slug === season)?.status === "archived";
  const ratingQuery = useQuery({ queryKey: ["rating-v3", tab, season, direction], queryFn: () => api.rating.get({ tab, season, ...(direction !== "all" ? { direction } : {}) }) });
  const ratingPayload = ratingQuery.data || {};
  const ratingItems = Array.isArray(ratingPayload) ? ratingPayload : ratingPayload.items || ratingPayload.rows || ratingPayload.entries || [];
  const currentUserId = ratingPayload.current_user?.user_id || ratingPayload.current_user?.id;
  const serverRows = ratingItems.map((entry, index) => adaptRatingRow(entry, index, currentUserId));
  if (ratingPayload.current_user && !serverRows.some((row) => row.me)) serverRows.push(adaptRatingRow(ratingPayload.current_user, serverRows.length, currentUserId));
  const sourceRows = previewEnabled && !serverRows.length ? RATING_ROWS : serverRows;
  const rankedRows = useMemo(() => sourceRows
    .filter((row) => direction === "all" || row.directionScores?.[direction] > 0)
    .filter((row) => tab !== "duels" || row.duels >= 5)
    .sort((a, b) => rankValue(b, tab, direction) - rankValue(a, tab, direction)), [direction, sourceRows, tab]);
  const rows = useMemo(() => rankedRows.filter((row) => !search.trim() || row.name.toLowerCase().includes(search.trim().toLowerCase())), [rankedRows, search]);

  const myRow = sourceRows.find((row) => row.me);
  const myIndex = rankedRows.findIndex((row) => row.id === myRow?.id);
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  const updateParam = (key, value, defaultValue) => { const next = new URLSearchParams(searchParams); if (value === defaultValue) next.delete(key); else next.set(key, value); setSearchParams(next); };
  const eligibleCount = direction === "all" ? rows.length : sourceRows.filter((row) => row.directionScores?.[direction] > 0).length;

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-6 md:px-6 lg:px-8 lg:py-10">
      <Reveal><header className="grid gap-7 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div><h1 className="font-heading text-4xl font-extrabold leading-tight sm:text-5xl">Рейтинг ML-Арены</h1><p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground sm:text-base">Результаты участников в текущем сезоне. Соревнования и дуэли считаются отдельно, а общий рейтинг объединяет их с весами 70% и 30%. Выберите направление, чтобы сравнить участников в конкретной области ML.</p></div><div className="flex flex-col items-stretch gap-3 sm:flex-row"><SeasonSelector value={season} seasons={seasons.length ? seasons : [{ slug: season, name: "Founder Season", status: "active" }]} onChange={(value) => updateParam("season", value, activeSeason)} /><Button asChild variant="outline"><Link to={`/rating/methodology?season=${encodeURIComponent(season)}`}><BookOpenCheck size={16} />Как считается рейтинг?</Link></Button></div></header></Reveal>

      {archived && <div className="mt-5 flex items-start gap-3 border border-border bg-secondary/50 p-4 text-sm"><History size={18} className="mt-0.5 shrink-0 text-primary" /><div><p className="font-semibold">Сезон завершён</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Рейтинг зафиксирован и доступен только для просмотра. Долгосрочные результаты сохранены в ML-паспортах участников.</p></div></div>}

      <Reveal className="mt-6" delay={0.04}><div className="grid gap-px border border-border bg-border sm:grid-cols-4">{[[CalendarClock, "Сезон", archived ? "Beta Season" : "Founder Season", archived ? "архив" : "до 31 декабря"], [Users, "Участников", sourceRows.length || "—", "с рейтинговой активностью"], [Trophy, "Событий", 10, "финализировано"], [Clock3, "Обновление", "сегодня", "последний корректный снимок"]].map(([Icon, label, value, detail]) => <div key={label} className="bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon size={14} className="text-primary" />{label}</div><p className="mt-3 font-heading text-xl font-extrabold">{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></div>)}</div></Reveal>

      <section className="mt-7">
        <div className="flex overflow-x-auto border border-border bg-card p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{Object.entries(TAB_META).map(([value, item]) => <button key={value} type="button" onClick={() => updateParam("tab", value, "overall")} className={cn("flex min-h-12 min-w-[180px] flex-1 items-center justify-center gap-2 px-5 text-sm font-semibold text-muted-foreground transition-colors sm:min-w-0", tab === value ? "bg-primary text-primary-foreground" : "hover:bg-secondary hover:text-foreground")}><item.icon size={17} />{item.label}</button>)}</div>
        <p className="mt-3 text-xs text-muted-foreground">{TAB_META[tab].description}</p>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти участника по нику" className="h-11 pl-10" /></div>
          <label className="relative lg:w-[280px]"><span className="sr-only">Направление ML</span><select value={direction} onChange={(event) => updateParam("direction", event.target.value, "all")} className="h-11 w-full appearance-none border border-border bg-card pl-4 pr-10 text-sm font-semibold outline-none hover:border-primary/40 focus:border-primary">{DIRECTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Target className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} /></label>
        </div>
      </section>

      {direction !== "all" && eligibleCount < 10 && <div className="mt-5 flex items-start gap-3 border border-amber-500/25 bg-amber-500/5 p-4"><CircleHelp className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={18} /><div><p className="text-sm font-semibold">Недостаточно данных для устойчивого места</p><p className="mt-1 text-xs leading-5 text-muted-foreground">В направлении «{DIRECTION_LABELS[direction]}» сейчас {eligibleCount} участников. Результаты уже сохраняются в ML-паспорте, но громкий статус лидера направления пока не присваивается.</p></div></div>}

      {myRow && <Reveal className="mt-6" delay={0.06}><MyPosition row={myRow} rank={myRank} tab={tab} direction={direction} archived={archived} /></Reveal>}

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4"><div><h2 className="font-heading text-2xl font-extrabold md:text-3xl">{TAB_META[tab].label}{direction !== "all" ? ` · ${DIRECTION_LABELS[direction]}` : ""}</h2><p className="mt-2 text-xs text-muted-foreground">{rows.length} участников в текущей выборке</p></div>{search && <button type="button" onClick={() => setSearch("")} className="text-xs font-semibold text-primary hover:underline">Сбросить поиск</button>}</div>
        {ratingQuery.isLoading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div> : rows.length ? <div className="mt-5 overflow-hidden border border-border bg-card"><div className="hidden grid-cols-[64px_minmax(210px,1.2fr)_minmax(170px,0.8fr)_minmax(160px,0.7fr)_140px] border-b border-border bg-secondary/40 px-5 py-3 text-[10px] font-semibold text-muted-foreground md:grid"><span>Место</span><span>Участник</span><span>{tab === "overall" ? "Компоненты" : tab === "competitions" ? "Активность" : "Матчи"}</span><span>{tab === "competitions" ? "Подтверждения" : tab === "duels" ? "Серия" : "Направления"}</span><span className="text-right">{TAB_META[tab].metric}</span></div><Stagger delay={0.04}>{rows.map((row, index) => <StaggerItem key={row.id}><RatingRow row={row} rank={index + 1} tab={tab} direction={direction} /><MobileRatingCard row={row} rank={index + 1} tab={tab} direction={direction} /></StaggerItem>)}</Stagger></div> : <div className="mt-5 border-y border-dashed border-border py-16 text-center"><Search className="mx-auto text-muted-foreground" size={28} /><h3 className="mt-4 font-heading text-xl font-extrabold">Участники не найдены</h3><p className="mt-2 text-sm text-muted-foreground">Измените поиск или выберите другое направление.</p></div>}
      </section>

      <Reveal className="mt-10" delay={0.08}><section className="grid gap-px border border-border bg-border md:grid-cols-3">{[[ShieldCheck, "Premium не влияет на место", "Подписка не меняет формулы, лимиты рейтинговых попыток и подбор соперников."], [Zap, "Вызов ML-Арены ограничен", "Победа даёт небольшой бонус 0–10, максимум 40 за сезон. Поражение не отнимает рейтинг."], [Info, "Рейтинг — не оценка знаний", "Это сравнительный результат текущего сезона. Доказательства навыков хранятся в ML-паспорте."]].map(([Icon, title, text]) => <article key={title} className="bg-card p-6"><Icon size={20} className="text-primary" /><h3 className="mt-5 font-heading text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</section></Reveal>
    </div>
  );
}

export function RatingMethodology() {
  const [searchParams] = useSearchParams();
  const methodology = useQuery({ queryKey: ["rating-methodology", searchParams.get("season")], queryFn: () => api.rating.methodology({ ...(searchParams.get("season") ? { season: searchParams.get("season") } : {}) }), staleTime: 60000 });
  const method = methodology.data || {};
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6 md:px-6 lg:px-8 lg:py-10">
      <Link to="/rating" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft size={16} />Вернуться к рейтингу</Link>
      <header className="mt-7 border-b border-border pb-8"><h1 className="font-heading text-4xl font-extrabold leading-tight sm:text-5xl">Как считается рейтинг</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{method.description || "Методика Founder Season. Рейтинг начинается заново в каждом сезоне, а подтверждённые результаты прошлых сезонов остаются в ML-паспорте и архиве."}</p><div className="mt-5 flex flex-wrap gap-2"><span className="border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">{method.version || method.code || "rating_v3_founder"}</span><span className="border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">{method.competition_weight_percent ?? 70}% соревнования · {method.duel_weight_percent ?? 30}% дуэли</span></div></header>

      <Reveal className="mt-8"><MethodSection number="01" icon={Trophy} title="Соревнования" lead="Любой валидный финальный результат даёт минимум 50 очков. Высокое место, сложность задачи и размер события увеличивают награду."><Formula>50 + 950 × (1 − процентиль)² × сложность × надёжность</Formula><div className="mt-5 grid gap-px border border-border bg-border sm:grid-cols-4">{[["Начальная", "×0,90"], ["Стандартная", "×1,00"], ["Продвинутая", "×1,10"], ["Экспертная", "×1,20"]].map(([label, value]) => <div key={label} className="bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-xl font-extrabold">{value}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Если валидных финальных участников меньше 10, бонус за место не начисляется, но сохраняются 50 очков за завершение.</p></MethodSection></Reveal>

      <Reveal className="mt-6" delay={0.05}><MethodSection number="02" icon={Swords} title="Дуэли" lead="Сезон начинается с рейтинга 1000. Победа над более сильным соперником даёт больше, ожидаемая победа над слабым — меньше."><Formula>Ожидаемый исход по Elo · базовая ставка около 5% · изменение не больше ±75</Formula><div className="mt-5 grid gap-3 sm:grid-cols-3">{[["1000 против 1000", "+50 / −50"], ["1200 побеждает 1000", "примерно +24"], ["1000 побеждает 1200", "до +75"]].map(([label, value]) => <div key={label} className="border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-xl font-extrabold">{value}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Первые пять человеческих дуэлей — калибровка. Число видно сразу, публичное место появляется после пятого матча.</p></MethodSection></Reveal>

      <Reveal className="mt-6" delay={0.08}><MethodSection number="03" icon={Crown} title="Общий рейтинг" lead="Очки соревнований и рейтинг дуэлей имеют разные шкалы, поэтому напрямую не складываются. Сначала они переводятся в положение участника внутри каждой таблицы."><Formula>Общий результат = 70% индекса соревнований + 30% индекса дуэлей</Formula><div className="mt-5 border border-primary/20 bg-primary/5 p-5"><p className="text-sm font-semibold">Пример</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Участник №12 из 200 получает индекс соревнований 945. В дуэлях он №40 из 300 и получает индекс 870. Общий результат: 0,70 × 945 + 0,30 × 870 ≈ <strong className="text-foreground">923</strong>.</p></div></MethodSection></Reveal>

      <Reveal className="mt-6" delay={0.11}><MethodSection number="04" icon={Target} title="Направления" lead="Направление — это фильтр той же сезонной системы, а не отдельная валюта. При выборе области расчёт выполняется только по событиям этого направления."><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{DIRECTIONS.slice(1).map(([, label]) => <div key={label} className="border border-border bg-card p-3 text-sm font-semibold">{label}</div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">При числе участников меньше 10 показываются результаты и статистика, но позиция отмечается как недостаточно устойчивая.</p></MethodSection></Reveal>

      <Reveal className="mt-6" delay={0.14}><section className="border border-border bg-card p-6 sm:p-8"><CheckCircle2 size={22} className="text-primary" /><h2 className="mt-5 font-heading text-2xl font-extrabold">Что не даёт рейтинговых очков</h2><div className="mt-5 grid gap-px bg-border sm:grid-cols-3">{[["Premium", "Не меняет коэффициенты, лимиты и подбор соперников."], ["Внешние достижения", "Дополняют ML-паспорт, но не покупают место в сезоне."], ["Проверка кода", "Повышает доверие к результату, но не добавляет очков."]].map(([title, text]) => <div key={title} className="bg-card p-4"><p className="text-sm font-bold">{title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></div>)}</div></section></Reveal>
    </div>
  );
}

function MethodSection({ number, icon: Icon, title, lead, children }) {
  return <section className="border border-border bg-card p-6 sm:p-8"><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/20 bg-primary/10 text-primary"><Icon size={19} /></span><div><p className="text-xs text-muted-foreground">{number}</p><h2 className="mt-1 font-heading text-2xl font-extrabold">{title}</h2></div></div><p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">{lead}</p><div className="mt-5">{children}</div></section>;
}

function Formula({ children }) {
  return <div className="overflow-x-auto border border-border bg-secondary/45 p-4 font-mono text-sm font-semibold text-foreground">{children}</div>;
}
