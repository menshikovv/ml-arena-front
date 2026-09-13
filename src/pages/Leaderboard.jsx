import React, { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
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
  Loader2,
  Medal,
  Search,
  Swords,
  Target,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { api } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import { PageFrame, PageHeader } from "@/components/ml/PageFrame";
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

const TAB_META = {
  overall: { label: "Общий", icon: Crown, metric: "Общий результат", description: "70% соревнования + 30% дуэли после нормализации мест" },
  competitions: { label: "Соревнования", icon: Trophy, metric: "Очки сезона", description: "Сумма очков всех финализированных рейтинговых событий" },
  duels: { label: "Дуэли", icon: Swords, metric: "Рейтинг дуэлей", description: "Сезонный рейтинг после пяти калибровочных матчей" },
};

function adaptRatingRow(entry, currentUserId) {
  const profile = entry.profile || entry.user || entry;
  const duelCount = entry.human_duels_count ?? entry.human_duel_count ?? entry.duels_count ?? null;
  const id = entry.user_id || profile.id;
  return {
    id,
    name: profile.nickname || profile.user_name || profile.username || entry.nickname || "Участник",
    avatar: profile.avatar_url || entry.avatar_url,
    rank: entry.rank ?? null,
    score: entry.score == null ? null : Number(entry.score),
    overall: entry.overall_score ?? entry.score ?? entry.rating ?? null,
    competition: entry.competition_score ?? entry.competition_points ?? null,
    competitionRank: entry.competition_rank ?? null,
    competitions: entry.competition_events_count ?? entry.competition_count ?? entry.competitions_count ?? null,
    best: entry.best_percentile ?? null,
    duel: entry.duel_rating ?? entry.duel_score ?? null,
    duelRank: entry.duel_rank ?? null,
    duels: duelCount,
    wins: entry.wins ?? null,
    losses: entry.losses ?? null,
    streak: entry.win_streak ?? entry.streak ?? null,
    activity: entry.updated_at || entry.last_activity_at || null,
    directions: entry.directions || profile.strong_directions || [],
    directionScores: entry.direction_scores || {},
    verified: entry.verified_results_count ?? entry.competition_count ?? null,
    me: Boolean(entry.is_current_user || (currentUserId && id === currentUserId)),
  };
}

function rankValue(row, tab, direction) {
  if (direction !== "all") return row.score;
  if (tab === "competitions") return row.competition;
  if (tab === "duels") return row.duel;
  return row.overall;
}

function displayRating(value) {
  return value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toLocaleString("ru-RU");
}

function configNumber(value) {
  return value == null || !Number.isFinite(Number(value)) ? null : Number(value);
}

function displayFactor(value) {
  const number = configNumber(value);
  return number == null ? "—" : `×${number.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function displayPercent(value) {
  const number = configNumber(value);
  return number == null ? "—" : `${Math.round(number * 100)}%`;
}

function calculateDuelWinDelta(userRating, opponentRating, duelConfig) {
  const stakePercent = configNumber(duelConfig.stake_percent);
  const stakeMin = configNumber(duelConfig.stake_min);
  const stakeMax = configNumber(duelConfig.stake_max);
  const deltaCap = configNumber(duelConfig.delta_cap);
  if ([userRating, opponentRating, stakePercent, stakeMin, stakeMax, deltaCap].some((value) => value == null)) return null;
  const average = (userRating + opponentRating) / 2;
  const baseStake = Math.min(stakeMax, Math.max(stakeMin, Math.round(stakePercent * average)));
  const expected = 1 / (1 + 10 ** ((opponentRating - userRating) / 400));
  return Math.min(deltaCap, Math.max(-deltaCap, Math.round(2 * baseStake * (1 - expected))));
}

function SeasonSelector({ value, onChange, seasons }) {
  return <label className="relative block"><span className="sr-only">Сезон</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 appearance-none border border-border bg-card pl-4 pr-10 text-sm font-semibold outline-none hover:border-primary/40 focus:border-primary">{seasons.map((item) => <option key={item.slug} value={item.slug}>{item.name || item.title || item.slug}{item.status === "active" ? " · активен" : item.status === "archived" ? " · архив" : ""}</option>)}</select><History className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} /></label>;
}

function formatSeasonDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", ...options });
}

function SeasonDetailsDialog({ open, onOpenChange, season, methodology, participants, competitionEvents }) {
  if (!season) return null;
  const description = season.description || season.long_description || season.summary || null;
  const competitionWeight = configNumber(methodology?.overall?.competition_weight);
  const duelWeight = configNumber(methodology?.overall?.duel_weight);
  const duelStart = configNumber(methodology?.duel?.start);
  const calibrationMatches = configNumber(methodology?.duel?.calibration_matches);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-card shadow-2xl focus:outline-none">
          <div aria-hidden="true" className="grid h-1 grid-cols-[2fr_1fr_1fr]"><span className="bg-primary" /><span className="bg-accent" /><span className="bg-primary/30" /></div>
          <header className="border-b border-border p-6 sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <Dialog.Title className="font-heading text-3xl font-extrabold sm:text-4xl">{season.name || season.slug}</Dialog.Title>
                <Dialog.Description className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                  {description || "Для этого сезона пока указаны только сроки и параметры рейтинга."}
                </Dialog.Description>
              </div>
              <Dialog.Close className="flex h-10 w-10 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground" aria-label="Закрыть"><X size={18} /></Dialog.Close>
            </div>
          </header>

          <div className="p-6 sm:p-8">
            <section className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Начало</p><p className="mt-2 font-semibold">{formatSeasonDate(season.start_at)}</p></div>
              <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Окончание</p><p className="mt-2 font-semibold">{formatSeasonDate(season.end_at)}</p></div>
              <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Участников в рейтинге</p><p className="mt-2 font-heading text-2xl font-extrabold">{participants ?? "—"}</p></div>
              <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Зачтено соревнований</p><p className="mt-2 font-heading text-2xl font-extrabold">{competitionEvents ?? "—"}</p><p className="mt-1 text-[11px] text-muted-foreground">в вашем рейтинге</p></div>
            </section>

            <section className="mt-8">
              <h3 className="font-heading text-xl font-extrabold">Как формируется место</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Соревнования и дуэли считаются отдельно, затем их позиции объединяются с весами текущего сезона.</p>
              <div className="mt-5 grid gap-px border border-border bg-border sm:grid-cols-3">
                <div className="bg-secondary/25 p-5"><p className="text-sm font-semibold">Соревнования</p><p className="mt-3 font-heading text-2xl font-extrabold">{displayPercent(competitionWeight)}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">доля результатов соревнований в общей позиции</p></div>
                <div className="bg-secondary/25 p-5"><p className="text-sm font-semibold">Дуэли</p><p className="mt-3 font-heading text-2xl font-extrabold">{displayPercent(duelWeight)}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">доля дуэльной позиции после нормализации</p></div>
                <div className="bg-secondary/25 p-5"><p className="text-sm font-semibold">Базовый рейтинг дуэлей</p><p className="mt-3 font-heading text-2xl font-extrabold">{displayRating(duelStart)}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">публичное место появится после {displayRating(calibrationMatches)} матчей</p></div>
              </div>
            </section>

            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button asChild variant="outline"><Link to={`/rating/methodology?season=${encodeURIComponent(season.slug)}`}><BookOpenCheck size={16} /> Полная методика</Link></Button>
              <Dialog.Close asChild><Button>Вернуться к рейтингу</Button></Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MyPosition({ row, rank, tab, direction, archived, duelStart, calibrationMatches }) {
  const duelCount = Number(row.duels || 0);
  const value = tab === "duels" && direction === "all" && row.duel == null && duelCount === 0 ? duelStart : rankValue(row, tab, direction);
  const details = tab === "overall" ? [`Соревнования №${row.competitionRank ?? "—"}`, `Дуэли №${row.duelRank ?? "—"}`] : tab === "competitions" ? [`${row.competitions ?? "—"} соревнований`, row.best == null ? "лучший результат: —" : `лучший результат: верхние ${row.best}%`] : [`${row.duels ?? "—"} дуэлей`, row.duels && row.wins != null ? `${Math.round((row.wins / row.duels) * 100)}% побед` : "процент побед: —"];
  const emptyText = tab === "competitions" && Number(row.competitions || 0) === 0
    ? "Ваш рейтинг соревнований начнётся после первого финального результата этого сезона."
    : tab === "duels" && duelCount === 0
      ? `Дуэльный рейтинг сезона начинается с ${displayRating(duelStart)}. Сыграйте первую рейтинговую дуэль.`
      : tab === "duels" && calibrationMatches && duelCount < calibrationMatches
        ? `Калибровка: ещё ${calibrationMatches - duelCount} дуэлей до публичного места.`
        : tab === "overall"
          ? "Общий рейтинг уже считается, но один из компонентов пока равен нулю."
          : "В этой выборке пока нет рейтингового результата.";
  return (
    <section className="grid gap-px border border-border bg-border lg:grid-cols-[minmax(0,1fr)_200px_200px_auto]">
      <div className="bg-card p-5"><div className="flex items-center gap-3"><Avatar name={row.name} src={row.avatar} size={44} /><div><p className="text-xs text-muted-foreground">Моя позиция</p><p className="mt-1 font-heading text-lg font-extrabold">{row.name}</p></div></div></div>
      <div className="bg-card p-5"><p className="text-xs text-muted-foreground">Место</p><p className="mt-2 font-heading text-3xl font-extrabold">{rank ? `#${rank}` : "—"}</p></div>
      <div className="bg-card p-5"><p className="text-xs text-muted-foreground">{TAB_META[tab].metric}</p><p className="mt-2 font-heading text-3xl font-extrabold">{displayRating(value)}</p></div>
      <div className="flex min-w-60 flex-col justify-center bg-card p-5"><p className="text-xs leading-5 text-muted-foreground">{rank ? details.join(" · ") : emptyText}</p><Button asChild variant="outline" className="mt-3"><Link to={archived ? "/profile" : tab === "duels" ? "/duels" : "/competitions"}>{archived ? "Открыть ML-паспорт" : "Улучшить позицию"}<ArrowRight size={15} /></Link></Button></div>
    </section>
  );
}

function RatingRow({ row, rank, tab, direction }) {
  const value = rankValue(row, tab, direction);
  const winRate = row.duels && row.wins != null ? Math.round((row.wins / row.duels) * 100) : null;
  return (
    <Link to={`/profile/${row.id}`} className={cn("group hidden min-h-20 grid-cols-[64px_minmax(210px,1.2fr)_minmax(170px,0.8fr)_minmax(160px,0.7fr)_140px] items-center border-b border-border px-5 transition-colors hover:bg-secondary/35 md:grid", row.me && "bg-primary/5")}>
      <Rank rank={rank} />
      <div className="flex min-w-0 items-center gap-3"><Avatar name={row.name} src={row.avatar} size={40} /><div className="min-w-0"><p className="truncate text-sm font-bold group-hover:text-primary">{row.name}{row.me && <span className="ml-2 text-[10px] text-primary">Это вы</span>}</p><div className="mt-1 flex flex-wrap gap-1">{row.directions.slice(0, 2).map((item) => <span key={item} className="text-[10px] text-muted-foreground">{DIRECTION_LABELS[item]}</span>)}</div></div></div>
      {tab === "overall" ? <div><p className="text-xs text-muted-foreground">Соревнования {row.competitionRank ? `#${row.competitionRank}` : "—"}</p><p className="mt-1 text-xs text-muted-foreground">Дуэли {row.duelRank ? `#${row.duelRank}` : "—"}</p></div> : tab === "competitions" ? <div><p className="text-sm font-semibold">{row.competitions ?? "—"} событий</p><p className="mt-1 text-xs text-muted-foreground">{row.best == null ? "—" : `верхние ${row.best}%`}</p></div> : <div><p className="text-sm font-semibold">{row.duels ?? "—"} дуэлей</p><p className="mt-1 text-xs text-muted-foreground">{row.wins ?? "—"} побед · {winRate == null ? "—" : `${winRate}%`}</p></div>}
      {tab === "competitions" ? <div><p className="text-xs text-muted-foreground">Проверки</p><p className="mt-1 text-sm font-semibold">{row.verified == null ? "—" : `${row.verified} подтверждено`}</p></div> : tab === "duels" ? <div><p className="text-xs text-muted-foreground">Серия</p><p className="mt-1 text-sm font-semibold">{row.streak ? `${row.streak} побед` : "—"}</p><p className="mt-1 text-[10px] text-muted-foreground">{row.activity}</p></div> : <div><p className="text-xs text-muted-foreground">Сильные области</p><p className="mt-1 text-sm font-semibold">{row.directions.slice(0, 2).map((item) => DIRECTION_LABELS[item]).join(" · ") || "—"}</p></div>}
      <div className="text-right"><p className="font-heading text-xl font-extrabold tabular-nums">{displayRating(value)}</p><p className="mt-1 text-[10px] text-muted-foreground">{TAB_META[tab].metric}</p></div>
    </Link>
  );
}

function MobileRatingCard({ row, rank, tab, direction }) {
  const value = rankValue(row, tab, direction);
  const winRate = row.duels && row.wins != null ? Math.round((row.wins / row.duels) * 100) : null;
  return <Link to={`/profile/${row.id}`} className={cn("block border-b border-border bg-card p-4 md:hidden", row.me && "bg-primary/5")}><div className="flex items-center gap-3"><Rank rank={rank} /><Avatar name={row.name} src={row.avatar} size={38} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{row.name}{row.me && <span className="ml-2 text-[10px] text-primary">Это вы</span>}</p><p className="mt-1 text-[10px] text-muted-foreground">{row.directions.slice(0, 2).map((item) => DIRECTION_LABELS[item]).join(" · ")}</p></div><div className="text-right"><p className="font-heading text-lg font-extrabold">{displayRating(value)}</p><p className="text-[9px] text-muted-foreground">{TAB_META[tab].metric}</p></div></div><div className="mt-4 grid grid-cols-2 gap-px bg-border text-xs">{tab === "overall" ? <><div className="bg-card p-3">Соревнования <strong className="float-right">{row.competitionRank ? `#${row.competitionRank}` : "—"}</strong></div><div className="bg-card p-3">Дуэли <strong className="float-right">{row.duelRank ? `#${row.duelRank}` : "—"}</strong></div></> : tab === "competitions" ? <><div className="bg-card p-3">Событий <strong className="float-right">{row.competitions ?? "—"}</strong></div><div className="bg-card p-3">Лучший <strong className="float-right">{row.best == null ? "—" : `верхние ${row.best}%`}</strong></div></> : <><div className="bg-card p-3">Дуэлей <strong className="float-right">{row.duels ?? "—"}</strong></div><div className="bg-card p-3">Победы <strong className="float-right">{winRate == null ? "—" : `${winRate}%`}</strong></div></>}</div></Link>;
}

function Rank({ rank }) {
  if (rank == null) return <span className="w-10 shrink-0 font-mono text-sm text-muted-foreground">—</span>;
  if (rank === 1) return <span className="flex w-10 shrink-0 items-center gap-1 font-heading text-lg font-extrabold text-amber-600 dark:text-amber-400"><Crown size={17} />1</span>;
  if (rank <= 3) return <span className="flex w-10 shrink-0 items-center gap-1 font-heading text-lg font-extrabold text-primary"><Medal size={16} />{rank}</span>;
  return <span className="w-10 shrink-0 font-mono text-sm text-muted-foreground">{String(rank).padStart(2, "0")}</span>;
}

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [seasonDetailsOpen, setSeasonDetailsOpen] = useState(false);
  const tab = TAB_META[searchParams.get("tab")] ? searchParams.get("tab") : "overall";
  const direction = DIRECTION_LABELS[searchParams.get("direction")] ? searchParams.get("direction") : "all";
  const seasonParam = searchParams.get("season") || "";
  const seasonsQuery = useQuery({ queryKey: ["rating-seasons"], queryFn: api.rating.seasons, staleTime: 60000 });
  const seasons = Array.isArray(seasonsQuery.data) ? seasonsQuery.data : seasonsQuery.data?.items || [];
  const activeSeason = seasons.find((item) => item.status === "active")?.slug || seasons[0]?.slug || "";
  const season = seasons.some((item) => item.slug === seasonParam) ? seasonParam : activeSeason;
  const archived = seasons.find((item) => item.slug === season)?.status === "archived";
  const ratingQuery = useQuery({ queryKey: ["rating-v3", tab, season, direction], queryFn: () => api.rating.get({ tab, season, ...(direction !== "all" ? { direction } : {}) }), enabled: Boolean(season) });
  const methodologyQuery = useQuery({ queryKey: ["rating-methodology", season], queryFn: () => api.rating.methodology({ season }), enabled: Boolean(season), staleTime: 60000 });
  const ratingPayload = ratingQuery.data || {};
  const ratingItems = Array.isArray(ratingPayload) ? ratingPayload : ratingPayload.items || ratingPayload.rows || ratingPayload.entries || [];
  const currentUserId = ratingPayload.current_user?.user_id || ratingPayload.current_user?.id;
  const serverRows = ratingItems.map((entry) => adaptRatingRow(entry, currentUserId));
  if (ratingPayload.current_user && !serverRows.some((row) => row.me)) serverRows.push(adaptRatingRow(ratingPayload.current_user, currentUserId));
  const sourceRows = serverRows;
  const rankedRows = useMemo(() => [...sourceRows].sort((a, b) => (a.rank ?? Number.POSITIVE_INFINITY) - (b.rank ?? Number.POSITIVE_INFINITY)), [sourceRows]);
  const rows = useMemo(() => rankedRows.filter((row) => !search.trim() || row.name.toLowerCase().includes(search.trim().toLowerCase())), [rankedRows, search]);

  const myRow = sourceRows.find((row) => row.me);
  const myRank = myRow?.rank ?? null;
  const updateParam = (key, value, defaultValue) => { const next = new URLSearchParams(searchParams); if (value === defaultValue) next.delete(key); else next.set(key, value); setSearchParams(next); };
  const eligibleCount = ratingPayload.total ?? rows.length;
  const seasonData = ratingPayload.season || seasons.find((item) => item.slug === season);
  const seasonEnd = seasonData?.end_at ? formatSeasonDate(seasonData.end_at, { year: undefined }) : null;
  const seasonStart = seasonData?.start_at ? formatSeasonDate(seasonData.start_at, { year: undefined }) : null;
  const competitionEventsCount = ratingPayload.current_user?.competition_events_count ?? null;
  const duelStart = configNumber(methodologyQuery.data?.duel?.start);
  const calibrationMatches = configNumber(methodologyQuery.data?.duel?.calibration_matches);

  return (
    <PageFrame>
      <Reveal><PageHeader title="Рейтинг ML-Арены" description="Результаты участников в текущем сезоне. Соревнования и дуэли считаются отдельно, а общий рейтинг объединяет их с весами 70% и 30%. Выберите направление, чтобы сравнить участников в конкретной области ML." actions={<>{seasons.length ? <SeasonSelector value={season} seasons={seasons} onChange={(value) => updateParam("season", value, activeSeason)} /> : null}<Button asChild variant="outline"><Link to={`/rating/methodology${season ? `?season=${encodeURIComponent(season)}` : ""}`}><BookOpenCheck size={16} />Как считается рейтинг?</Link></Button></>} /></Reveal>

      {archived && <div className="mt-5 flex items-start gap-3 border border-border bg-secondary/50 p-4 text-sm"><History size={18} className="mt-0.5 shrink-0 text-primary" /><div><p className="font-semibold">Сезон завершён</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Рейтинг зафиксирован и доступен только для просмотра. Долгосрочные результаты сохранены в ML-паспортах участников.</p></div></div>}

      {seasonData && <Reveal className="mt-6" delay={0.03}><section className="relative grid overflow-hidden border border-primary/20 bg-card md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch"><span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" /><div className="p-6 pl-7"><h2 className="font-heading text-2xl font-extrabold sm:text-3xl">{seasonData.name || seasonData.slug}</h2><p className="mt-3 line-clamp-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-muted-foreground">{seasonData.description || seasonData.long_description || seasonData.summary || "Описание сезона пока не добавлено."}</p><Button type="button" variant="outline" className="mt-5" onClick={() => setSeasonDetailsOpen(true)}>Подробнее о сезоне <ArrowRight size={15} /></Button></div><div className="grid grid-cols-2 border-t border-border bg-secondary/25 md:min-w-64 md:grid-cols-1 md:border-l md:border-t-0"><div className="p-4 md:p-5"><p className="text-[10px] text-muted-foreground">Старт</p><p className="mt-2 text-sm font-bold">{seasonStart || "—"}</p></div><div className="border-l border-border p-4 md:border-l-0 md:border-t md:p-5"><p className="text-[10px] text-muted-foreground">Финиш</p><p className="mt-2 text-sm font-bold">{seasonEnd || "—"}</p></div></div></section></Reveal>}

      <Reveal className="mt-4" delay={0.04}><div className="grid gap-px border border-border bg-border sm:grid-cols-3">{[[Users, "Участников", ratingPayload.total ?? "—", "с рейтинговой активностью"], [Trophy, "Зачтено соревнований", competitionEventsCount ?? "—", competitionEventsCount === null ? "у вас пока нет финального результата" : "в вашем рейтинге этого сезона"], [Clock3, "Начало сезона", seasonStart || "—", seasonData?.status === "active" ? "сезон активен" : seasonData?.status || "статус неизвестен"]].map(([Icon, label, value, detail]) => <div key={label} className="bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon size={14} className="text-primary" />{label}</div><p className="mt-3 font-heading text-xl font-extrabold">{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></div>)}</div></Reveal>

      <SeasonDetailsDialog open={seasonDetailsOpen} onOpenChange={setSeasonDetailsOpen} season={seasonData} methodology={methodologyQuery.data} participants={ratingPayload.total} competitionEvents={competitionEventsCount} />

      <section className="mt-7">
        <div className="flex overflow-x-auto border border-border bg-card p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{Object.entries(TAB_META).map(([value, item]) => <button key={value} type="button" onClick={() => updateParam("tab", value, "overall")} className={cn("flex min-h-12 min-w-[180px] flex-1 items-center justify-center gap-2 px-5 text-sm font-semibold text-muted-foreground transition-colors sm:min-w-0", tab === value ? "bg-primary text-primary-foreground" : "hover:bg-secondary hover:text-foreground")}><item.icon size={17} />{item.label}</button>)}</div>
        <p className="mt-3 text-xs text-muted-foreground">{TAB_META[tab].description}</p>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти участника по нику" className="h-11 pl-10" /></div>
          <label className="relative lg:w-[280px]"><span className="sr-only">Направление ML</span><select value={direction} onChange={(event) => updateParam("direction", event.target.value, "all")} className="h-11 w-full appearance-none border border-border bg-card pl-4 pr-10 text-sm font-semibold outline-none hover:border-primary/40 focus:border-primary">{DIRECTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Target className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} /></label>
        </div>
      </section>

      {direction !== "all" && eligibleCount < 10 && <div className="mt-5 flex items-start gap-3 border border-amber-500/25 bg-amber-500/5 p-4"><CircleHelp className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={18} /><div><p className="text-sm font-semibold">Недостаточно данных для устойчивого места</p><p className="mt-1 text-xs leading-5 text-muted-foreground">В направлении «{DIRECTION_LABELS[direction]}» сейчас {eligibleCount} участников. Результаты уже сохраняются в ML-паспорте, но громкий статус лидера направления пока не присваивается.</p></div></div>}

      {myRow && <Reveal className="mt-6" delay={0.06}><MyPosition row={myRow} rank={myRank} tab={tab} direction={direction} archived={archived} duelStart={duelStart} calibrationMatches={calibrationMatches} /></Reveal>}

      {!seasonsQuery.isLoading && !season ? <div className="mt-8 border border-dashed border-border bg-card px-6 py-16 text-center"><CalendarClock className="mx-auto text-muted-foreground" size={28} /><h2 className="mt-4 font-heading text-2xl font-extrabold">Новый сезон ещё не начался</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Таблица появится здесь после старта следующего рейтингового сезона.</p></div> : <section className="mt-8">
        <div className="flex items-end justify-between gap-4"><div><h2 className="font-heading text-2xl font-extrabold md:text-3xl">{TAB_META[tab].label}{direction !== "all" ? ` · ${DIRECTION_LABELS[direction]}` : ""}</h2><p className="mt-2 text-xs text-muted-foreground">{rows.length} участников в текущей выборке</p></div>{search && <button type="button" onClick={() => setSearch("")} className="text-xs font-semibold text-primary hover:underline">Сбросить поиск</button>}</div>
        {ratingQuery.isLoading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div> : ratingQuery.error ? <div className="mt-5 border border-destructive/25 bg-destructive/5 px-6 py-12 text-center"><CircleHelp className="mx-auto text-destructive" size={28} /><h3 className="mt-4 font-heading text-xl font-extrabold">Не удалось загрузить рейтинг</h3><p className="mt-2 text-sm text-muted-foreground">{ratingQuery.error.message || "Повторите попытку позже."}</p></div> : rows.length ? <div className="mt-5 overflow-hidden border border-border bg-card"><div className="hidden grid-cols-[64px_minmax(210px,1.2fr)_minmax(170px,0.8fr)_minmax(160px,0.7fr)_140px] border-b border-border bg-secondary/40 px-5 py-3 text-[10px] font-semibold text-muted-foreground md:grid"><span>Место</span><span>Участник</span><span>{tab === "overall" ? "Компоненты" : tab === "competitions" ? "Активность" : "Матчи"}</span><span>{tab === "competitions" ? "Подтверждения" : tab === "duels" ? "Серия" : "Направления"}</span><span className="text-right">{TAB_META[tab].metric}</span></div><Stagger delay={0.04}>{rows.map((row) => <StaggerItem key={row.id}><RatingRow row={row} rank={row.rank} tab={tab} direction={direction} /><MobileRatingCard row={row} rank={row.rank} tab={tab} direction={direction} /></StaggerItem>)}</Stagger></div> : <div className="mt-5 border-y border-dashed border-border py-16 text-center"><Search className="mx-auto text-muted-foreground" size={28} /><h3 className="mt-4 font-heading text-xl font-extrabold">Участники не найдены</h3><p className="mt-2 text-sm text-muted-foreground">Измените поиск или выберите другое направление.</p></div>}
      </section>}

      <Reveal className="mt-10" delay={0.08}><section className="grid gap-8 border-t border-border py-8 lg:grid-cols-2 lg:gap-12"><div className="border-l-2 border-primary pl-6"><h2 className="font-heading text-2xl font-extrabold">Рейтинг — результат сезона</h2><p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Он сравнивает результаты участников, а не оценивает все ваши знания. Подтверждённые навыки и достижения собраны в ML-паспорте.</p><Link to="/ml-passport" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Открыть ML-паспорт <ArrowRight size={15} /></Link></div><div className="divide-y divide-border">{[["Premium не влияет на место", "Подписка не меняет формулы, лимиты рейтинговых попыток и подбор соперников."], ["Как учитывается вызов ML-Арены", "Победа даёт небольшой бонус 0–10, максимум 40 за сезон. Поражение не отнимает рейтинг."], ["Призы за высокие места в сезоне", "Лучшие участники сезона могут получить призы. Состав наград, число призовых мест и условия получения публикуются в правилах конкретного сезона."]].map(([title, text]) => <details key={title} className="group py-5 first:pt-0"><summary className="cursor-pointer font-heading text-base font-bold leading-6 marker:text-primary">{title}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></details>)}</div></section></Reveal>
    </PageFrame>
  );
}

export function RatingMethodology() {
  const [searchParams] = useSearchParams();
  const methodology = useQuery({ queryKey: ["rating-methodology", searchParams.get("season")], queryFn: () => api.rating.methodology({ ...(searchParams.get("season") ? { season: searchParams.get("season") } : {}) }), staleTime: 60000 });
  const method = methodology.data || {};
  const competition = method.competition || {};
  const duel = method.duel || {};
  const challenge = method.challenge || {};
  const overall = method.overall || {};
  const competitionWeight = configNumber(overall.competition_weight ?? (method.competition_weight_percent == null ? null : method.competition_weight_percent / 100));
  const duelWeight = configNumber(overall.duel_weight ?? (method.duel_weight_percent == null ? null : method.duel_weight_percent / 100));
  const duelStart = configNumber(duel.start);
  const calibrationMatches = configNumber(duel.calibration_matches);
  const duelCap = configNumber(duel.delta_cap);
  const duelExamples = duelStart == null ? [] : [
    [`${duelStart} против ${duelStart}`, calculateDuelWinDelta(duelStart, duelStart, duel)],
    [`${duelStart + 200} побеждает ${duelStart}`, calculateDuelWinDelta(duelStart + 200, duelStart, duel)],
    [`${duelStart} побеждает ${duelStart + 200}`, calculateDuelWinDelta(duelStart, duelStart + 200, duel)],
  ];
  const difficultyRows = [
    ["Начальная", competition.difficulty?.beginner ?? competition.difficulty?.easy],
    ["Стандартная", competition.difficulty?.standard ?? competition.difficulty?.medium],
    ["Продвинутая", competition.difficulty?.advanced ?? competition.difficulty?.hard],
    ["Экспертная", competition.difficulty?.expert],
  ].filter(([, value]) => configNumber(value) != null);
  const reliabilityRows = [
    ["100+ участников", competition.reliability?.["100"]],
    ["50-99 участников", competition.reliability?.["50"]],
    ["30-49 участников", competition.reliability?.["30"]],
    ["10-29 участников", competition.reliability?.["10"]],
    ["Меньше 10", competition.reliability?.["0"]],
  ].filter(([, value]) => configNumber(value) != null);
  const baseParticipation = configNumber(competition.base_participation);
  const maxBonus = configNumber(competition.max_bonus);
  const challengeCap = configNumber(challenge.delta_cap);
  const challengeSeasonCap = configNumber(challenge.season_cap);
  const challengeDirectionCap = configNumber(challenge.direction_cap);
  const challengeDelay = configNumber(challenge.no_match_after_seconds);
  const directionMinUsers = configNumber(method.direction_min_users);
  const competitionMaximum = competitionWeight == null ? null : Math.round(1000 * competitionWeight);
  const duelMaximum = duelWeight == null ? null : Math.round(1000 * duelWeight);
  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-6 md:px-6 lg:px-8 lg:py-10">
      <Link to="/rating" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft size={16} />Вернуться к рейтингу</Link>
      <header className="mt-7 border-b border-border pb-7"><h1 className="font-heading text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">Как считается рейтинг</h1>{methodology.isLoading ? <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={16} /> Загружаем параметры сезона</div> : methodology.error ? <p className="mt-5 text-sm text-destructive">Не удалось загрузить правила рейтинга. Попробуйте ещё раз позже.</p> : <><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">Рейтинг начинается заново в каждом сезоне. Прошлые результаты остаются в ML-паспорте и архиве.</p><div className="mt-5 flex flex-wrap gap-2">{competitionWeight != null && duelWeight != null && <span className="border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">{displayPercent(competitionWeight)} соревнования · {displayPercent(duelWeight)} дуэли</span>}{method.method_version && <span className="border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">{method.method_version}</span>}</div></>}</header>

      {methodology.isSuccess && <>
        <Reveal className="mt-8"><MethodSection number="01" icon={CalendarClock} title="Сезоны" lead="У каждого сезона своя таблица. В новом сезоне соревнования начинаются с нуля, а дуэльный рейтинг - со стартового значения. Завершённые сезоны остаются доступны только для просмотра."><div className="grid gap-px border border-border bg-border sm:grid-cols-3">{[["Соревнования", "0 очков"], ["Дуэли", displayRating(duelStart)], ["История", "Сохраняется"]].map(([label, value]) => <div key={label} className="bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-xl font-extrabold">{value}</p></div>)}</div></MethodSection></Reveal>

        <Reveal className="mt-6" delay={0.04}><MethodSection number="02" icon={Trophy} title="Соревнования" lead={`Любой валидный финальный результат даёт ${displayRating(baseParticipation)} очков. Высокое место, сложность задачи и размер события увеличивают награду.`}><Formula>{displayRating(baseParticipation)} + {displayRating(maxBonus)} × (1 - p)² × D × R, где p = (место - 1) / (участники - 1)</Formula><div className="mt-5 grid gap-6 lg:grid-cols-2"><div><p className="mb-3 text-xs font-semibold text-muted-foreground">Сложность задачи</p><div className="grid gap-px border border-border bg-border sm:grid-cols-2">{difficultyRows.map(([label, value]) => <div key={label} className="bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-xl font-extrabold">{displayFactor(value)}</p></div>)}</div></div><div><p className="mb-3 text-xs font-semibold text-muted-foreground">Размер события</p><div className="grid gap-px border border-border bg-border sm:grid-cols-2">{reliabilityRows.map(([label, value]) => <div key={label} className="bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-xl font-extrabold">{displayFactor(value)}</p></div>)}</div></div></div><p className="mt-4 text-xs leading-5 text-muted-foreground">При коэффициенте размера события ×0 бонус за место не начисляется, но очки за валидное завершение сохраняются.</p></MethodSection></Reveal>

        <Reveal className="mt-6" delay={0.07}><MethodSection number="03" icon={Swords} title="Дуэли" lead={`Сезон начинается с рейтинга ${displayRating(duelStart)}. Победа над более сильным соперником даёт больше, ожидаемая победа над слабым - меньше.`}><Formula>Ожидаемый исход по Elo · базовая ставка {displayPercent(duel.stake_percent)} от среднего рейтинга в пределах {displayRating(duel.stake_min)}-{displayRating(duel.stake_max)} · изменение не больше ±{displayRating(duelCap)}</Formula><div className="mt-5 grid gap-3 sm:grid-cols-3">{duelExamples.map(([label, value]) => <div key={label} className="border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-xl font-extrabold">{value == null ? "—" : `+${value}`}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Первые {displayRating(calibrationMatches)} дуэлей с людьми - калибровка. Рейтинг виден сразу, публичное место появляется после завершения калибровки.</p></MethodSection></Reveal>

        <Reveal className="mt-6" delay={0.1}><MethodSection number="04" icon={Target} title="Вызов ML-Арены" lead={`Если соперник не найден за ${challengeDelay == null ? "—" : `${Math.round(challengeDelay / 60)} мин`}, можно сыграть против эталонного решения. Победа даёт небольшой бонус, поражение не отнимает рейтинг.`}><Formula>Бонус за победу: 0…{displayRating(challengeCap)} · максимум {displayRating(challengeSeasonCap)} за сезон · максимум {displayRating(challengeDirectionCap)} в одном направлении</Formula><div className="mt-5 grid gap-px border border-border bg-border sm:grid-cols-3">{[["Победа", `до +${displayRating(challengeCap)}`], ["Поражение", `+${displayRating(challenge.loss_delta)}`], ["Калибровка", "Не заменяет дуэли"]].map(([label, value]) => <div key={label} className="bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-xl font-extrabold">{value}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Одна задача приносит рейтинговый бонус только один раз. Одни вызовы не дают публичного места в дуэльной таблице.</p></MethodSection></Reveal>

        <Reveal className="mt-6" delay={0.13}><MethodSection number="05" icon={Crown} title="Общий рейтинг" lead="Очки соревнований и рейтинг дуэлей имеют разные шкалы, поэтому напрямую не складываются. Сначала они переводятся в положение участника внутри каждой таблицы."><Formula>Общий результат = {displayPercent(competitionWeight)} индекса соревнований + {displayPercent(duelWeight)} индекса дуэлей</Formula><div className="mt-5 grid gap-px border border-border bg-border sm:grid-cols-3">{[["Есть оба компонента", "Полный общий рейтинг"], ["Только соревнования", `Максимум ${displayRating(competitionMaximum)}`], ["Только дуэли", `Максимум ${displayRating(duelMaximum)}`]].map(([label, value]) => <div key={label} className="bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-sm font-bold">{value}</p></div>)}</div><div className="mt-5 border border-primary/20 bg-primary/5 p-5"><p className="text-sm font-semibold">Пример</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Участник №12 из 200 получает индекс соревнований 945. В дуэлях он №40 из 300 и получает индекс 870. При текущих весах общий результат равен <strong className="text-foreground">{competitionWeight == null || duelWeight == null ? "—" : Math.round(competitionWeight * 945 + duelWeight * 870)}</strong>.</p></div></MethodSection></Reveal>

        <Reveal className="mt-6" delay={0.16}><MethodSection number="06" icon={Target} title="Направления" lead="Направление - это фильтр той же сезонной системы. При выборе области учитываются только результаты в этой области ML."><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{DIRECTIONS.slice(1).map(([, label]) => <div key={label} className="border border-border bg-card p-3 text-sm font-semibold">{label}</div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Если участников меньше {displayRating(directionMinUsers)}, результаты показываются без устойчивого публичного места.</p></MethodSection></Reveal>

        <Reveal className="mt-6" delay={0.19}><section className="border border-border bg-card p-6 sm:p-8"><CheckCircle2 size={22} className="text-primary" /><h2 className="mt-5 font-heading text-2xl font-extrabold">Что не даёт рейтинговых очков</h2><div className="mt-5 grid gap-px bg-border sm:grid-cols-3">{[["Premium", "Не меняет коэффициенты, лимиты и подбор соперников."], ["Внешние достижения", "Дополняют ML-паспорт, но не влияют на место в сезоне."], ["Проверка кода", "Повышает доверие к результату, но не добавляет очков."]].map(([title, text]) => <div key={title} className="bg-card p-4"><p className="text-sm font-bold">{title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></div>)}</div></section></Reveal>
      </>}
    </div>
  );
}

function MethodSection({ icon: Icon, title, lead, children }) {
  return <section className="border border-border bg-card p-6 sm:p-8"><div className="flex items-center gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/20 bg-primary/10 text-primary"><Icon size={19} /></span><h2 className="font-heading text-2xl font-extrabold">{title}</h2></div><p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">{lead}</p><div className="mt-5">{children}</div></section>;
}

function Formula({ children }) {
  return <div className="overflow-x-auto border border-border bg-secondary/45 p-4 font-mono text-sm font-semibold text-foreground">{children}</div>;
}
