import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Tabs from "@radix-ui/react-tabs";
import { Link, useParams } from "react-router-dom";
import { Award, BadgeCheck, BriefcaseBusiness, CheckCircle2, Crown, Flame, Github, GraduationCap, History, Link as LinkIcon, Loader2, MapPin, Medal, Sparkles, Star, Swords, Target, Trophy, UserRoundSearch } from "lucide-react";
import { api } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import { PageFrame } from "@/components/ml/PageFrame";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DIRECTIONS = [
  ["classification", "Классификация"], ["regression", "Регрессия"], ["nlp", "NLP"], ["cv", "Компьютерное зрение"],
  ["time_series", "Временные ряды"], ["ranking", "Ранжирование"], ["clustering", "Кластеризация"], ["recsys", "RecSys"],
];

const list = (value) => Array.isArray(value) ? value : value?.items || value?.data || [];
const currentRating = (value) => value?.current_user || value?.currentUser || null;
const shown = (value) => value === undefined || value === null ? "—" : value;

const BADGE_ICONS = {
  award: Award,
  badge: BadgeCheck,
  badge_check: BadgeCheck,
  crown: Crown,
  flame: Flame,
  medal: Medal,
  sparkles: Sparkles,
  star: Star,
  swords: Swords,
  target: Target,
  trophy: Trophy,
};

const BADGE_COLORS = {
  "blue-500": "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-300",
  "cyan-500": "border-cyan-500/25 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
  "emerald-500": "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  "amber-500": "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  "orange-500": "border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-300",
  "rose-500": "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  "violet-500": "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-300",
};

function SummaryMetric({ label, value, detail }) {
  return <div className="h-full border-b border-border px-5 py-6 sm:border-l sm:border-b-0"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-4 font-heading text-4xl font-extrabold tabular-nums">{shown(value)}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">{detail}</p></div>;
}

function EmptyState({ title, text }) {
  return <div className="border border-dashed border-border bg-card px-5 py-12 text-center"><History className="mx-auto text-muted-foreground" size={26} /><h3 className="mt-4 font-heading text-xl font-extrabold">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

const DIRECTION_STYLE = {
  classification: ["CL", "text-teal-700 dark:text-teal-300", "bg-teal-500"],
  regression: ["RG", "text-blue-700 dark:text-blue-300", "bg-blue-500"],
  nlp: ["NLP", "text-violet-700 dark:text-violet-300", "bg-violet-500"],
  cv: ["CV", "text-rose-700 dark:text-rose-300", "bg-rose-500"],
  time_series: ["TS", "text-cyan-700 dark:text-cyan-300", "bg-cyan-500"],
  ranking: ["RK", "text-amber-700 dark:text-amber-300", "bg-amber-500"],
  clustering: ["KM", "text-emerald-700 dark:text-emerald-300", "bg-emerald-500"],
  recsys: ["RS", "text-indigo-700 dark:text-indigo-300", "bg-indigo-500"],
};

function DirectionCard({ code, title, score }) {
  const value = Number(score);
  const hasData = score != null && Number.isFinite(value) && value > 0;
  const progress = hasData ? Math.max(0, Math.min(100, value)) : 0;
  const [mark, ink, accent] = DIRECTION_STYLE[code];
  return <article className="group relative flex min-h-[280px] min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg motion-reduce:transform-none">
    <div className={cn("absolute inset-x-0 top-0 h-1", accent)} />
    <div className="flex items-center justify-between gap-4"><span aria-hidden="true" className={cn("font-mono text-3xl font-semibold", ink)}>{mark}<span className="opacity-35">/</span></span><span className="text-[10px] font-semibold text-muted-foreground">ML-АРЕНА</span></div>
    <h3 className="mt-6 break-words font-heading text-xl font-extrabold leading-snug">{title}</h3>
    <p className={cn("mt-2 text-xs", hasData ? ink : "text-muted-foreground")}>{hasData ? "Подтверждено" : "Пока нет результатов"}</p>
    <div className="mt-auto pt-7"><div className="flex items-end justify-between gap-3"><span className="text-xs text-muted-foreground">Уровень</span><strong className="font-heading text-2xl tabular-nums">{hasData ? `${value}%` : "—"}</strong></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={cn("h-full rounded-full transition-[width] duration-500", accent)} style={{ width: `${progress}%` }} /></div></div>
  </article>;
}

function BadgeCard({ grant }) {
  const badge = grant?.badge || grant || {};
  const Icon = BADGE_ICONS[badge.icon_key] || Award;
  const awardedAt = grant?.awarded_at || grant?.granted_at;
  const colorClass = BADGE_COLORS[badge.color_token] || "border-primary/20 bg-primary/10 text-primary";
  const awardedDate = awardedAt ? new Date(awardedAt) : null;

  return (
    <article className="group relative flex min-h-[340px] min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card p-6 text-center transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl motion-reduce:transform-none">
      <div className="flex min-h-5 items-center justify-between gap-3 text-[10px] font-semibold text-muted-foreground">
        <span>ML-АРЕНА</span>
        {grant?.status === "active" && <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Получен</span>}
      </div>
      <div aria-hidden="true" className={cn("relative mx-auto mb-3 mt-7 flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-2 shadow-[inset_0_2px_0_rgb(255_255_255/0.5),0_8px_20px_rgb(0_0_0/0.06)] transition-transform duration-500 group-hover:-rotate-6 motion-reduce:transform-none", colorClass)}>
        <span className="absolute inset-2 rounded-full border border-current opacity-25" />
        <span className="absolute inset-4 rounded-full border border-dashed border-current opacity-20" />
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-card/70 shadow-sm"><Icon size={34} strokeWidth={1.5} /></span>
        <span className="absolute -bottom-2 flex h-7 w-7 items-center justify-center rotate-45 rounded-sm border border-current bg-card"><Star size={13} className="-rotate-45 fill-current" /></span>
      </div>
      <h3 className="mt-6 break-words font-heading text-xl font-extrabold leading-snug [overflow-wrap:anywhere]">{badge.name || badge.title || "Бейдж"}</h3>
      {badge.description && <p className="mx-auto mt-3 max-w-sm break-words text-sm leading-6 text-muted-foreground">{badge.description}</p>}
      {awardedDate && !Number.isNaN(awardedDate.getTime()) && <div className="mt-auto pt-6"><p className="border-t border-border pt-4 text-xs text-muted-foreground">Получен <time dateTime={awardedDate.toISOString()} className="font-semibold text-foreground">{awardedDate.toLocaleDateString("ru-RU")}</time></p></div>}
    </article>
  );
}

function RatingHistory({ history }) {
  if (!history.length) return <EmptyState title="История рейтинга пока пуста" text="Изменения появятся после первого рейтингового результата." />;
  const validHistory = history.filter((item) => Number.isFinite(Number(item.rating)));
  if (!validHistory.length) return <EmptyState title="История рейтинга пока пуста" text="Изменения появятся после первого рейтингового результата." />;
  const values = validHistory.map((item) => Number(item.rating));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  return <div className="border border-border bg-card p-5"><div className="flex h-44 items-end gap-2">{validHistory.map((item) => { const height = 20 + ((Number(item.rating) - min) / range) * 80; return <div key={`${item.date}-${item.rating}`} className="group flex min-w-0 flex-1 flex-col items-center justify-end"><span className="mb-2 hidden text-[10px] font-semibold group-hover:block">{item.rating}</span><div className="w-full bg-primary/75" style={{ height: `${height}%` }} /><span className="mt-2 max-w-full truncate text-[9px] text-muted-foreground">{item.date}</span></div>; })}</div></div>;
}

export default function Profile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("directions");
  const isOwner = !id || id === "me";
  const profileQuery = useQuery({ queryKey: ["profile", id || "me"], queryFn: () => isOwner ? api.profiles.me() : api.profiles.get(id) });
  const profile = profileQuery.data;
  const profileUserId = isOwner ? profile?.user_id : id;
  const badgesQuery = useQuery({ queryKey: ["profile-badges", profileUserId], queryFn: () => api.profiles.badges(profileUserId), enabled: Boolean(profileUserId) });
  const seasonsQuery = useQuery({ queryKey: ["rating-seasons"], queryFn: api.rating.seasons, staleTime: 60000, enabled: isOwner });
  const seasons = list(seasonsQuery.data);
  const season = seasons.find((item) => item.status === "active")?.slug || seasons[0]?.slug || null;
  const overallQuery = useQuery({ queryKey: ["profile-rating", "overall", season], queryFn: () => api.rating.get({ tab: "overall", season }), enabled: Boolean(isOwner && season) });
  const competitionsQuery = useQuery({ queryKey: ["profile-rating", "competitions", season], queryFn: () => api.rating.get({ tab: "competitions", season }), enabled: Boolean(isOwner && season) });
  const duelsQuery = useQuery({ queryKey: ["profile-rating", "duels", season], queryFn: () => api.rating.get({ tab: "duels", season }), enabled: Boolean(isOwner && season) });

  const badges = list(badgesQuery.data);
  const stats = profile?.stats || {};
  const skills = profile?.skills || {};
  const overall = currentRating(overallQuery.data);
  const competitionRating = currentRating(competitionsQuery.data);
  const duelRating = currentRating(duelsQuery.data);
  const humanDuels = duelRating?.human_duel_count ?? stats.duels_count ?? null;
  const duelWins = duelRating?.wins ?? stats.duels_won;
  const duelLosses = duelRating?.losses ?? stats.duels_lost;
  const challengeBonus = duelRating?.challenge_bonus;
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  const displayName = fullName || profile?.user_name || "Участник";
  const directionCards = useMemo(() => DIRECTIONS.map(([code, title]) => ({ code, title, score: skills[code] })), [skills]);

  if (profileQuery.isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  if (!profile) return <div className="py-20 text-center text-muted-foreground">ML-паспорт не найден</div>;

  return <div className="min-h-full bg-secondary/35"><PageFrame>
    <Reveal>
      <div className="mb-7 flex items-center justify-between gap-4 border-b border-border pb-4"><p className="font-heading text-sm font-bold">ML-паспорт</p><img src="/logo.svg" alt="ML-Арена" className="h-8 w-8 object-contain" /></div>
      <header className="flex flex-col justify-between gap-7 border-b border-border pb-9 pt-3 xl:flex-row xl:items-end">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={displayName} src={profile.avatar_url} size={128} className="shrink-0 ring-8 ring-card shadow-lg" />
          <div className="min-w-0">
            <h1 className="mt-3 break-words font-heading text-3xl font-extrabold leading-tight [overflow-wrap:anywhere] sm:text-4xl">{displayName}</h1>
            {fullName && profile.user_name && <p className="mt-1 text-sm text-muted-foreground">@{profile.user_name}</p>}
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{profile.bio || "Описание профиля пока не заполнено."}</p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">{profile.city && <span className="flex items-center gap-1.5"><MapPin size={13} />{profile.city}</span>}{profile.university && <span className="flex items-center gap-1.5"><GraduationCap size={13} />{profile.university}</span>}{profile.company && <span className="flex items-center gap-1.5"><BriefcaseBusiness size={13} />{profile.company}</span>}{profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary"><Github size={13} />GitHub</a>}{profile.kaggle_url && <a href={profile.kaggle_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary"><LinkIcon size={13} />Kaggle</a>}</div>
          </div>
        </div>
        {isOwner && <Button asChild variant="outline" className="shrink-0 self-start lg:self-auto"><Link to="/profile/edit">Редактировать профиль</Link></Button>}
      </header>
      <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-5 border-b border-border py-7">
        <div className="flex min-w-0 items-center gap-5 sm:gap-7">
          <span aria-hidden="true" className="h-14 w-1 shrink-0 rounded-full bg-primary" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Рейтинг профиля</p>
            <p className="mt-2 font-heading text-4xl font-extrabold tabular-nums leading-none sm:text-5xl">{profile.rating != null && Number.isFinite(Number(profile.rating)) ? Number(profile.rating).toLocaleString("ru-RU") : "—"}</p>
          </div>
        </div>
        {overall?.rank != null && <div className="sm:text-right"><p className="text-xs text-muted-foreground">Место в текущем сезоне</p><p className="mt-2 font-heading text-2xl font-extrabold tabular-nums">#{overall.rank}</p></div>}
      </div>
    </Reveal>

    <Stagger className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StaggerItem><SummaryMetric icon={Trophy} label="Рейтинг сезона" value={overall?.score ?? overall?.rating} detail={overall?.rank ? `Место #${overall.rank}` : "Место появится после участия"} /></StaggerItem><StaggerItem><SummaryMetric icon={CheckCircle2} label="Соревнования" value={stats.competitions_participated} detail={competitionRating?.rank ? `Место #${competitionRating.rank} в сезоне` : "Завершённые участия"} /></StaggerItem><StaggerItem><SummaryMetric icon={Swords} label="Рейтинговые дуэли" value={humanDuels} detail={duelRating?.calibration_status || "Завершённые матчи"} /></StaggerItem><StaggerItem><SummaryMetric icon={Award} label="Бейджи" value={badges.length} detail="Полученные достижения" /></StaggerItem></Stagger>

    <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mt-8">
      <Tabs.List className="flex overflow-x-auto border border-border bg-card p-1" aria-label="Разделы ML-паспорта">{[["directions", "Направления", Target], ["rating", "Рейтинг", Trophy], ["practice", "Практика", Swords], ["badges", "Бейджи", Award], ["career", "Профиль", UserRoundSearch]].map(([value, label, Icon]) => <Tabs.Trigger key={value} value={value} className="flex min-h-11 min-w-36 flex-1 items-center justify-center gap-2 px-4 text-sm font-semibold text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Icon size={16} />{label}</Tabs.Trigger>)}</Tabs.List>

      <Tabs.Content value="directions" className="mt-9 outline-none"><Reveal><h2 className="font-heading text-2xl font-extrabold sm:text-3xl">Карта компетенций</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Ваши подтверждённые результаты в машинном обучении.</p><div className="mt-7 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">{directionCards.map((item) => <DirectionCard key={item.code} {...item} />)}</div></Reveal></Tabs.Content>

      <Tabs.Content value="rating" className="mt-7 outline-none"><Reveal>{isOwner && !seasonsQuery.isLoading && !season ? <EmptyState title="Новый сезон ещё не начался" text="После старта сезона здесь появятся общий рейтинг, результаты соревнований и дуэлей." /> : <><div className="grid gap-3 md:grid-cols-3"><SummaryMetric icon={Trophy} label="Общий рейтинг" value={overall?.score ?? overall?.rating} detail={overall?.rank ? `Место #${overall.rank}` : "Место появится после участия"} /><SummaryMetric icon={Target} label="Соревнования" value={competitionRating?.score ?? competitionRating?.rating} detail={competitionRating?.rank ? `Место #${competitionRating.rank}` : "Недостаточно результатов"} /><SummaryMetric icon={Swords} label="Дуэли" value={duelRating?.score ?? duelRating?.rating} detail={duelRating?.rank ? `Место #${duelRating.rank}` : "Место появится после калибровки"} /></div><div className="mt-6"><h2 className="mb-4 font-heading text-2xl font-extrabold">История рейтинга</h2><RatingHistory history={profile.rating_history || []} /></div></>}</Reveal></Tabs.Content>

      <Tabs.Content value="practice" className="mt-7 outline-none"><Reveal><h2 className="font-heading text-2xl font-extrabold sm:text-3xl">Практика</h2><p className="mt-2 text-sm text-muted-foreground">История рейтинговых дуэлей и результатов против заданий ML-Арены.</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><SummaryMetric icon={Swords} label="Дуэли с людьми" value={humanDuels} detail="Завершённые матчи" /><SummaryMetric icon={CheckCircle2} label="Победы" value={duelWins} detail="В дуэлях с участниками" /><SummaryMetric icon={History} label="Поражения" value={duelLosses} detail="В дуэлях с участниками" /><SummaryMetric icon={Award} label="Бонус вызовов" value={challengeBonus} detail="За задания ML-Арены" /></div>{humanDuels === 0 && challengeBonus == null && <div className="mt-6"><EmptyState title="Практики пока нет" text="Завершите первую дуэль или вызов ML-Арены, чтобы здесь появилась статистика." /></div>}</Reveal></Tabs.Content>

      <Tabs.Content value="badges" className="mt-7 outline-none"><Reveal>{badges.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{badges.map((grant) => <BadgeCard key={grant.id || grant.badge?.id || grant.code} grant={grant} />)}</div> : <EmptyState title="Бейджей пока нет" text="Достижения появятся здесь после участия в активностях ML-Арены." />}</Reveal></Tabs.Content>

      <Tabs.Content value="career" className="mt-7 outline-none"><Reveal><div className="grid gap-3 md:grid-cols-2"><Card className="border-border bg-card p-6"><BriefcaseBusiness size={21} className="text-primary" /><h2 className="mt-5 font-heading text-2xl font-extrabold">Карьерные данные</h2><div className="mt-5 divide-y divide-border">{[["Город", profile.city], ["Университет", profile.university], ["Компания", profile.company], ["Виден работодателям", profile.visible_to_employers ? "Да" : "Нет"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><span className="text-muted-foreground">{label}</span><strong className="text-right">{shown(value)}</strong></div>)}</div></Card><Card className="border-border bg-card p-6"><UserRoundSearch size={21} className="text-primary" /><h2 className="mt-5 font-heading text-2xl font-extrabold">Публичность</h2><div className="mt-5 divide-y divide-border">{[["Публичный профиль", profile.public_profile ? "Да" : "Нет"], ["Показывать имя", profile.show_real_name ? "Да" : "Нет"], ["Показывать карьерные данные", profile.show_career_details ? "Да" : "Нет"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>)}</div></Card></div></Reveal></Tabs.Content>
    </Tabs.Root>
  </PageFrame></div>;
}
