import React, { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Crown,
  FileText,
  Flag,
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
import { PageFrame } from "@/components/ml/PageFrame";
import { Reveal } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import "./Leaderboard.css";

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
const directionLabel = (value) => value === "cv" ? "Компьютерное зрение" : DIRECTION_LABELS[value] || value;

const TAB_META = {
  overall: { label: "Общий", icon: Crown, metric: "Общий результат", description: "70% соревнования + 30% дуэли после нормализации мест" },
  competitions: { label: "Соревнования", icon: Trophy, metric: "Очки сезона", description: "Сумма очков всех финализированных рейтинговых событий" },
  duels: { label: "Дуэли", icon: Swords, metric: "Рейтинг дуэлей", description: "Сезонный рейтинг после пяти калибровочных матчей" },
};

function adaptRatingRow(entry, currentUserId) {
  const profile = entry.profile || entry.user || entry;
  const duelCount = entry.human_duels_count ?? entry.human_duel_count ?? entry.duels_count ?? null;
  const id = entry.user_id || profile.user_id || profile.id;
  return {
    id,
    name: profile.nickname || profile.user_name || profile.username || entry.nickname || "Участник",
    avatar: profile.avatar_url || profile.user_avatar || entry.avatar_url || entry.user_avatar,
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
  return <label className="rating-season-select"><span className="sr-only">Сезон</span><span className="rating-season-select__dot" aria-hidden="true" /><select value={value} onChange={(event) => onChange(event.target.value)}>{seasons.map((item) => <option key={item.slug} value={item.slug}>{item.name || item.title || item.slug}{item.status === "active" ? " · активен" : item.status === "archived" ? " · архив" : ""}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></label>;
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
              <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Событий</p><p className="mt-2 font-heading text-2xl font-extrabold">{competitionEvents ?? "—"}</p><p className="mt-1 text-[11px] text-muted-foreground">зачтено в рейтинге</p></div>
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
    <section className="rating-my-position">
      <div className="rating-my-position__person"><Avatar name={row.name} src={row.avatar} size={54} /><div><p>Моя позиция</p><strong>{row.name}</strong></div></div>
      <div className="rating-my-position__metric"><p>Место</p><strong>{rank ? `#${rank}` : "—"}</strong></div>
      <div className="rating-my-position__metric"><p>{TAB_META[tab].metric}</p><strong>{displayRating(value)}</strong></div>
      <Button asChild className="rating-my-position__action"><Link to={archived ? "/profile" : tab === "duels" ? "/duels" : "/competitions"}>{archived ? "Открыть ML-паспорт" : "Улучшить позицию"}<ArrowRight size={17} /></Link></Button>
      {!rank && <p className="rating-my-position__note">{emptyText}</p>}
    </section>
  );
}

function RatingRow({ row, rank, tab, direction }) {
  const value = rankValue(row, tab, direction);
  const winRate = row.duels && row.wins != null ? Math.round((row.wins / row.duels) * 100) : null;
  return (
    <Link to={`/profile/${row.id}`} className={cn("rating-table__row", row.me && "is-me")}>
      <Rank rank={rank} />
      <div className="rating-table__person"><Avatar name={row.name} src={row.avatar} size={42} /><div><strong>{row.name}</strong>{row.me && <span className="rating-table__me">Это вы</span>}<small>{row.directions.slice(0, 2).map(directionLabel).join(" · ") || "Направление не указано"}</small></div></div>
      <div className="rating-table__components">{tab === "overall" ? <><span>Соревнования {row.competitionRank ? `#${row.competitionRank}` : "—"}</span><span>Дуэли {row.duelRank ? `#${row.duelRank}` : "—"}</span></> : tab === "competitions" ? <><span>{row.competitions ?? "—"} событий</span><span>{row.best == null ? "Лучший результат —" : `Верхние ${row.best}%`}</span></> : <><span>{row.duels ?? "—"} дуэлей</span><span>{row.wins ?? "—"} побед · {winRate == null ? "—" : `${winRate}%`}</span></>}</div>
      <div className="rating-table__directions"><span>{tab === "competitions" ? "Подтверждения" : tab === "duels" ? "Серия" : "Сильные области"}</span><strong>{tab === "competitions" ? row.verified == null ? "—" : `${row.verified} подтверждено` : tab === "duels" ? row.streak ? `${row.streak} побед` : "—" : row.directions.slice(0, 2).map(directionLabel).join(" · ") || "—"}</strong></div>
      <strong className="rating-table__score">{displayRating(value)}</strong>
    </Link>
  );
}

function MobileRatingCard({ row, rank, tab, direction }) {
  const value = rankValue(row, tab, direction);
  const winRate = row.duels && row.wins != null ? Math.round((row.wins / row.duels) * 100) : null;
  return <Link to={`/profile/${row.id}`} className={cn("rating-mobile-row", row.me && "is-me")}><div className="rating-mobile-row__top"><Rank rank={rank} /><Avatar name={row.name} src={row.avatar} size={42} /><div className="rating-mobile-row__person"><strong>{row.name}</strong>{row.me && <span className="rating-table__me">Это вы</span>}<small>{row.directions.slice(0, 2).map(directionLabel).join(" · ") || "Направление не указано"}</small></div><strong className="rating-mobile-row__score">{displayRating(value)}</strong></div><div className="rating-mobile-row__bottom">{tab === "overall" ? <><span>Соревнования <strong>{row.competitionRank ? `#${row.competitionRank}` : "—"}</strong></span><span>Дуэли <strong>{row.duelRank ? `#${row.duelRank}` : "—"}</strong></span></> : tab === "competitions" ? <><span>Событий <strong>{row.competitions ?? "—"}</strong></span><span>Лучший <strong>{row.best == null ? "—" : `верхние ${row.best}%`}</strong></span></> : <><span>Дуэлей <strong>{row.duels ?? "—"}</strong></span><span>Победы <strong>{winRate == null ? "—" : `${winRate}%`}</strong></span></>}</div></Link>;
}

function Rank({ rank }) {
  if (rank == null) return <span className="rating-rank">—</span>;
  if (rank === 1) return <span className="rating-rank is-first"><Crown size={19} />1</span>;
  if (rank <= 3) return <span className={`rating-rank is-${rank}`}><Medal size={18} />{rank}</span>;
  return <span className="rating-rank">{String(rank).padStart(2, "0")}</span>;
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
    <PageFrame className="rating-page">
      <Reveal>
      <header className="rating-hero">
        <div className="rating-hero__content"><h1>Рейтинг ML-Арены</h1><p>Результаты участников в текущем сезоне. Соревнования и дуэли считаются отдельно, а общий рейтинг объединяет их с весами 70% и 30%. Выберите направление, чтобы сравнить участников в конкретной области ML.</p></div>
        <img className="rating-hero__trophy" src="/rating-trophy.webp" alt="" aria-hidden="true" />
        <div className="rating-hero__actions">{seasons.length ? <SeasonSelector value={season} seasons={seasons} onChange={(value) => updateParam("season", value, activeSeason)} /> : null}<Button asChild variant="outline"><Link to={`/rating/methodology${season ? `?season=${encodeURIComponent(season)}` : ""}`}><BookOpenCheck size={18} />Как считается рейтинг?</Link></Button></div>
      </header>
      </Reveal>

      {archived && <Reveal delay={0.04}><div className="rating-archived"><CalendarClock size={19} /><div><strong>Сезон завершён</strong><p>Рейтинг зафиксирован и доступен для просмотра. Результаты сохранены в ML-паспортах участников.</p></div></div></Reveal>}

      {seasonData && <Reveal delay={0.04}><section className="rating-season-card"><div className="rating-season-card__visual"><img src="/rating-trophy.webp" alt="" aria-hidden="true" /></div><div className="rating-season-card__copy"><h2>{seasonData.name || seasonData.slug}</h2><p>{seasonData.description || seasonData.long_description || seasonData.summary || "Описание сезона пока не добавлено."}</p><Button type="button" onClick={() => setSeasonDetailsOpen(true)}>Подробнее о сезоне <ArrowRight size={17} /></Button></div><div className="rating-season-card__dates"><div><span className="rating-season-card__date-icon is-start"><CalendarDays size={24} /></span><p>Старт<strong>{seasonStart || "—"}</strong></p></div><div><span className="rating-season-card__date-icon is-finish"><Flag size={23} /></span><p>Финиш<strong>{seasonEnd || "—"}</strong></p></div></div></section></Reveal>}

      <Reveal delay={0.08}><div className="rating-stats">{[[Users, "Участников", ratingPayload.total ?? "—", "с рейтинговой активностью", "people"], [Trophy, "Событий", competitionEventsCount ?? "—", competitionEventsCount === null ? "финальных результатов пока нет" : "зачтено в рейтинге сезона", "events"], [CalendarDays, "Начало сезона", seasonStart || "—", seasonData?.status === "active" ? "сезон активен" : seasonData?.status || "статус неизвестен", "season"]].map(([Icon, label, value, detail, tone]) => <div key={label} className="rating-stat"><span className={`rating-stat__icon is-${tone}`}><Icon size={28} /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></div>)}</div></Reveal>

      <SeasonDetailsDialog open={seasonDetailsOpen} onOpenChange={setSeasonDetailsOpen} season={seasonData} methodology={methodologyQuery.data} participants={ratingPayload.total} competitionEvents={competitionEventsCount} />

      <Reveal delay={0.1}><section className="rating-controls">
        <div className="rating-tabs" role="tablist" aria-label="Тип рейтинга">{Object.entries(TAB_META).map(([value, item]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => updateParam("tab", value, "overall")} className={cn("rating-tabs__tab", tab === value && "is-active")}><item.icon size={20} />{item.label}</button>)}</div>
        <p className="rating-controls__description">{TAB_META[tab].description}</p>
        <div className="rating-filters"><label className="rating-filters__search"><Search size={19} aria-hidden="true" /><span className="sr-only">Поиск участника</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти участника по нику" /></label><label className="rating-filters__direction"><span className="sr-only">Направление ML</span><select value={direction} onChange={(event) => updateParam("direction", event.target.value, "all")}>{DIRECTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={16} aria-hidden="true" /><Target size={18} aria-hidden="true" /></label></div>
      </section></Reveal>

      {direction !== "all" && eligibleCount < 10 && <div className="mt-5 flex items-start gap-3 border border-amber-500/25 bg-amber-500/5 p-4"><CircleHelp className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={18} /><div><p className="text-sm font-semibold">Недостаточно данных для устойчивого места</p><p className="mt-1 text-xs leading-5 text-muted-foreground">В направлении «{DIRECTION_LABELS[direction]}» сейчас {eligibleCount} участников. Результаты уже сохраняются в ML-паспорте, но громкий статус лидера направления пока не присваивается.</p></div></div>}

      {myRow && <Reveal delay={0.12}><MyPosition row={myRow} rank={myRank} tab={tab} direction={direction} archived={archived} duelStart={duelStart} calibrationMatches={calibrationMatches} /></Reveal>}

      <Reveal key={`${tab}-${direction}-${season}-${ratingQuery.isLoading}`} delay={0.14} viewportReveal viewport={{ once: true, amount: "some", margin: "0px 0px -60px" }}>
      {!seasonsQuery.isLoading && !season ? <div className="rating-empty"><CalendarClock size={30} /><h2>Новый сезон ещё не начался</h2><p>Таблица появится здесь после старта следующего рейтингового сезона.</p></div> : <section className="rating-board">
        <div className="rating-board__heading"><div><h2>{TAB_META[tab].label}{direction !== "all" ? ` · ${DIRECTION_LABELS[direction]}` : ""}</h2><p>{rows.length} участников в текущей выборке</p></div>{search && <button type="button" onClick={() => setSearch("")}>Сбросить поиск</button>}</div>
        {ratingQuery.isLoading ? <div className="rating-board__loading"><Loader2 className="animate-spin" size={28} /></div> : ratingQuery.error ? <div className="rating-empty is-error"><CircleHelp size={28} /><h3>Не удалось загрузить рейтинг</h3><p>{ratingQuery.error.message || "Повторите попытку позже."}</p></div> : rows.length ? <div className="rating-table"><div className="rating-table__head"><span>Место</span><span>Участник</span><span>{tab === "overall" ? "Компоненты" : tab === "competitions" ? "Активность" : "Матчи"}</span><span>{tab === "competitions" ? "Подтверждения" : tab === "duels" ? "Серия" : "Направления"}</span><span>{TAB_META[tab].metric}</span></div>{rows.map((row) => <React.Fragment key={row.id}><RatingRow row={row} rank={row.rank} tab={tab} direction={direction} /><MobileRatingCard row={row} rank={row.rank} tab={tab} direction={direction} /></React.Fragment>)}</div> : <div className="rating-empty"><Search size={28} /><h3>Участники не найдены</h3><p>Измените поиск или выберите другое направление.</p></div>}
      </section>}
      </Reveal>

      <Reveal delay={0.16} viewportReveal><section className="rating-extras"><div className="rating-extras__passport"><span className="rating-extras__icon"><FileText size={25} /></span><div><h2>Рейтинг — результат сезона</h2><p>Он сравнивает результаты участников, а не оценивает все ваши знания. Подтверждённые навыки и достижения собраны в ML-паспорте.</p><Link to="/ml-passport">Открыть ML-паспорт <ArrowRight size={16} /></Link></div></div><div className="rating-extras__faq">{[["Premium не влияет на место", "Подписка не меняет формулы, лимиты рейтинговых попыток и подбор соперников."], ["Как учитывается вызов ML-Арены", "Победа даёт небольшой бонус 0–10, максимум 40 за сезон. Поражение не отнимает рейтинг."], ["Призы за высокие места в сезоне", "Лучшие участники сезона могут получить призы. Состав наград, число призовых мест и условия получения публикуются в правилах конкретного сезона."]].map(([title, text]) => <details key={title}><summary><span>{title}</span><ChevronRight size={18} /></summary><p>{text}</p></details>)}</div></section></Reveal>
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
