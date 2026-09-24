import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Tabs from "@radix-ui/react-tabs";
import { Link, useParams } from "react-router-dom";
import { Activity, Award, BadgeCheck, BarChart3, BriefcaseBusiness, CalendarDays, ChevronRight, CircleDot, Crown, ExternalLink, FileText, Flame, Github, Globe2, GraduationCap, History, Link as LinkIcon, ListFilter, Loader2, MapPin, Medal, Network, Pencil, ScanEye, ShieldCheck, Sparkles, Star, Swords, Target, TrendingUp, Trophy, UserRoundSearch } from "lucide-react";
import { api } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import { PageFrame } from "@/components/ml/PageFrame";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import ProfileRating from "./ProfileRating";
import ProfileCareer from "./ProfileCareer";
import ProfilePractice from "./ProfilePractice";
import "./Profile.css";

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

function SummaryMetric({ icon: Icon = Trophy, label, value, detail, tone = "blue", onActivate }) {
  const Element = onActivate ? "button" : "div";
  return <Element type={onActivate ? "button" : undefined} onClick={onActivate} className={cn("passport-stat", `passport-stat--${tone}`, onActivate && "passport-stat--interactive")}>
    <span className="passport-stat__icon"><Icon size={26} strokeWidth={2.4} /></span>
    <span className="passport-stat__copy"><span className="passport-stat__label">{label}</span><strong className="passport-stat__value">{shown(value)}</strong><span className="passport-stat__detail">{detail}</span></span>
    {onActivate && <ChevronRight size={19} className="passport-stat__arrow" aria-hidden="true" />}
  </Element>;
}

function EmptyState({ title, text }) {
  return <div className="border border-dashed border-border bg-card px-5 py-12 text-center"><History className="mx-auto text-muted-foreground" size={26} /><h3 className="mt-4 font-heading text-xl font-extrabold">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

const DIRECTION_STYLE = {
  classification: ["CL", BarChart3, "#08b88e", "#e0f7f0"],
  regression: ["RG", TrendingUp, "#356cf2", "#e3edff"],
  nlp: ["NLP", FileText, "#733bea", "#efe7ff"],
  cv: ["CV", ScanEye, "#eb2858", "#ffe4eb"],
  time_series: ["TS", Activity, "#09a8da", "#ddf5fc"],
  ranking: ["RK", ListFilter, "#f18b0b", "#fff0df"],
  clustering: ["KM", CircleDot, "#10ad69", "#e0f7ee"],
  recsys: ["RS", Network, "#7045e9", "#ece8ff"],
};

function DirectionCard({ code, title, score }) {
  const value = Number(score);
  const hasData = score != null && Number.isFinite(value) && value > 0;
  const progress = hasData ? Math.max(0, Math.min(100, value)) : 0;
  const [mark, Icon, accent, soft] = DIRECTION_STYLE[code] || DIRECTION_STYLE.classification;
  return <article className="passport-direction" style={{ "--direction-accent": accent, "--direction-soft": soft }}>
    <div className="passport-direction__top"><span className="passport-direction__icon"><Icon size={27} strokeWidth={2.4} /></span><span className="passport-direction__mark" aria-hidden="true">{mark}<span>/</span></span><span className="passport-direction__brand">ML-ARENA</span></div>
    <h3>{title}</h3>
    <p>{hasData ? "Подтверждено" : "Пока нет результатов"}</p>
    <div className="passport-direction__bottom"><span>Уровень</span><div className="passport-direction__track"><div style={{ width: `${progress}%` }} /></div><strong>{hasData ? `${value}%` : "—"}</strong></div>
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
      <div aria-hidden="true" className={cn("relative mx-auto mb-3 mt-7 flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-2 shadow-[inset_0_2px_0_rgb(255_255_255/0.5),0_8px_20px_rgb(0_0_0/0.06)] transition-transform duration-500 group-hover:-rotate-6 motion-reduce:transform-none", colorClass)}>
        <span className="absolute inset-2 rounded-full border border-current opacity-25" />
        <span className="absolute inset-4 rounded-full border border-dashed border-current opacity-20" />
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-card/70 shadow-sm"><Icon size={34} strokeWidth={1.5} /></span>
        <span className="absolute -bottom-2 flex h-7 w-7 items-center justify-center rotate-45 rounded-sm border border-current bg-card"><Star size={13} className="-rotate-45 fill-current" /></span>
      </div>
      <h3 className="mt-6 break-words font-heading text-xl font-extrabold leading-snug [overflow-wrap:anywhere]">{badge.name || badge.title || "Бейдж"}</h3>
      {grant?.status === "active" && <span className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Получен</span>}
      {badge.description && <p className="mx-auto mt-3 max-w-sm break-words text-sm leading-6 text-muted-foreground">{badge.description}</p>}
      {awardedDate && !Number.isNaN(awardedDate.getTime()) && <div className="mt-auto pt-6"><p className="border-t border-border pt-4 text-xs text-muted-foreground">Получен <time dateTime={awardedDate.toISOString()} className="font-semibold text-foreground">{awardedDate.toLocaleDateString("ru-RU")}</time></p></div>}
    </article>
  );
}

function externalAchievementUrl(achievement) {
  const value = achievement?.source_url || achievement?.evidence_url || achievement?.url;
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function ExternalAchievementCard({ achievement }) {
  const title = achievement.title || achievement.name || achievement.competition_name || "Внешнее достижение";
  const source = achievement.source || achievement.platform || achievement.provider || "Внешняя площадка";
  const place = achievement.place ?? achievement.rank;
  const status = achievement.verification_status || achievement.status;
  const verified = achievement.verified === true || ["verified", "approved", "confirmed"].includes(status);
  const pending = ["pending", "review", "in_review"].includes(status);
  const dateValue = achievement.achieved_at || achievement.awarded_at || achievement.verified_at;
  const date = dateValue ? new Date(dateValue) : null;
  const url = externalAchievementUrl(achievement);

  return <article className="group relative flex min-h-64 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg motion-reduce:transform-none">
    <div className="absolute inset-x-0 top-0 h-1 bg-cyan-500" />
    <div className="flex items-start justify-between gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"><Globe2 size={21} /></span>
    </div>
    <h3 className="mt-6 break-words font-heading text-xl font-extrabold leading-snug [overflow-wrap:anywhere]">{title}</h3>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">{source}</p>
      <span className={cn("inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] font-semibold", verified ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : pending ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-border bg-secondary text-muted-foreground")}>
        {verified && <ShieldCheck size={12} />}{verified ? "Подтверждено" : pending ? "На проверке" : "Не подтверждено"}
      </span>
    </div>
    {achievement.description && <p className="mt-3 break-words text-sm leading-6 text-muted-foreground">{achievement.description}</p>}
    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border pt-5">
      <div className="text-xs text-muted-foreground">{place != null ? <><span>Место</span><strong className="ml-2 font-heading text-lg text-foreground">#{place}</strong></> : date && !Number.isNaN(date.getTime()) ? <time dateTime={date.toISOString()}>{date.toLocaleDateString("ru-RU")}</time> : "Источник указан пользователем"}</div>
      {url && <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">Открыть <ExternalLink size={13} /></a>}
    </div>
  </article>;
}

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("directions");
  const [selectedSeason, setSelectedSeason] = useState("");
  const ownerIds = [user?.id, user?.user_id, user?.profile_id].filter(Boolean).map(String);
  const isOwner = !id || id === "me" || ownerIds.includes(String(id));
  const profileQuery = useQuery({ queryKey: ["profile", isOwner ? "me" : id], queryFn: () => isOwner ? api.profiles.me() : api.profiles.get(id) });
  const profile = profileQuery.data;
  const profileUserId = isOwner ? profile?.user_id : id;
  const badgesQuery = useQuery({ queryKey: ["profile-badges", profileUserId], queryFn: () => api.profiles.badges(profileUserId), enabled: Boolean(profileUserId) });
  const seasonsQuery = useQuery({ queryKey: ["rating-seasons"], queryFn: api.rating.seasons, staleTime: 60000, enabled: isOwner });
  const seasons = list(seasonsQuery.data);
  const season = seasons.some((item) => item.slug === selectedSeason) ? selectedSeason : seasons.find((item) => item.status === "active")?.slug || null;
  const overallQuery = useQuery({ queryKey: ["profile-rating", "overall", season], queryFn: () => api.rating.get({ tab: "overall", season }), enabled: Boolean(isOwner && season) });
  const competitionsQuery = useQuery({ queryKey: ["profile-rating", "competitions", season], queryFn: () => api.rating.get({ tab: "competitions", season }), enabled: Boolean(isOwner && season) });
  const duelsQuery = useQuery({ queryKey: ["profile-rating", "duels", season], queryFn: () => api.rating.get({ tab: "duels", season }), enabled: Boolean(isOwner && season) });
  const methodologyQuery = useQuery({ queryKey: ["profile-rating-methodology", season], queryFn: () => api.rating.methodology({ season }), enabled: Boolean(isOwner && season), staleTime: 60000 });
  const practiceDuelsQuery = useQuery({ queryKey: ["profile-practice-duels", profileUserId], queryFn: () => api.duels.list({ status: "completed", sort: "-completed_at", limit: 100 }), enabled: Boolean(isOwner && profileUserId && activeTab === "practice"), staleTime: 60000 });

  const badges = list(badgesQuery.data);
  const externalAchievements = list(profile?.external_achievements);
  const stats = profile?.stats || {};
  const skills = profile?.skills || {};
  const overall = currentRating(overallQuery.data);
  const competitionRating = currentRating(competitionsQuery.data);
  const duelRating = currentRating(duelsQuery.data);
  const overallScore = overall?.score ?? 0;
  const duelWins = duelRating?.wins ?? overall?.wins ?? stats.duels_won ?? 0;
  const duelLosses = duelRating?.losses ?? overall?.losses ?? stats.duels_lost ?? 0;
  const humanDuels = duelRating?.human_duels_count ?? overall?.human_duels_count ?? (Number(duelWins) + Number(duelLosses));
  const duelStart = methodologyQuery.data?.duel?.start ?? null;
  const duelScore = duelRating?.duel_rating ?? duelRating?.score ?? overall?.duel_rating ?? (Number(humanDuels) === 0 ? duelStart : null);
  const challengeBonus = duelRating?.challenge_bonus_total ?? overall?.challenge_bonus_total ?? 0;
  const seasonalScore = overallQuery.isSuccess ? overallScore : null;
  const seasonalDuelScore = duelsQuery.isSuccess ? duelScore : null;
  const seasonDuelHistory = duelRating?.history?.length ? duelRating.history : duelRating?.rating_history?.length ? duelRating.rating_history : null;
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  const displayName = fullName || profile?.user_name || "Участник";
  const directionCards = useMemo(() => DIRECTIONS.map(([code, title]) => ({ code, title, score: skills[code] })), [skills]);
  const passportTabs = [
    ["directions", "Направления", Target],
    ["rating", "Рейтинг", Trophy],
    ["practice", "Практика", Swords],
    ["badges", "Бейджи", Award],
    ["external", "Внешние достижения", Globe2],
    ...(isOwner ? [["career", "Профиль", UserRoundSearch]] : []),
  ];
  const tabAction = (tab) => passportTabs.some(([value]) => value === tab) ? () => setActiveTab(tab) : undefined;

  useEffect(() => {
    if (passportTabs.length && !passportTabs.some(([value]) => value === activeTab)) {
      setActiveTab(passportTabs[0][0]);
    }
  }, [activeTab, passportTabs]);

  if (profileQuery.isLoading) return <div className="passport-page min-h-full"><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div></div>;
  if (!profile) return <div className="passport-page min-h-full"><div className="py-20 text-center text-muted-foreground">ML-паспорт не найден</div></div>;
  const joinedAt = profile.created_at || (isOwner ? user?.registered_at : null);
  const joinedYear = joinedAt && !Number.isNaN(new Date(joinedAt).getTime()) ? new Date(joinedAt).getFullYear() : null;

  return <div className="passport-page min-h-full"><PageFrame className="passport-frame">
    <Reveal>
      <header className="passport-hero">
        <div className="passport-hero__art" aria-hidden="true"><span /><span /><span /></div>
        <span className="passport-hero__motto" aria-hidden="true">Больше,<br />чем ML</span>
        <div className="passport-hero__avatar"><Avatar name={displayName} src={profile.avatar_url} size={132} /></div>
        <div className="passport-hero__identity">
          <span className="passport-hero__rating"><Trophy size={18} fill="currentColor" /> Рейтинг {shown(seasonalScore)}</span>
          <h1>{displayName}</h1>
          {profile.user_name && <p className="passport-hero__handle">@{profile.user_name}</p>}
          <p className="passport-hero__bio">{profile.bio || "Описание профиля пока не заполнено."}</p>
          <div className="passport-hero__meta">{joinedYear && <span><CalendarDays size={17} />ML-Арена с {joinedYear}</span>}<span><BarChart3 size={17} />Участник сообщества</span>{profile.city && <span><MapPin size={17} />{profile.city}</span>}{profile.university && <span><GraduationCap size={17} />{profile.university}</span>}{profile.company && <span><BriefcaseBusiness size={17} />{profile.company}</span>}{profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer"><Github size={17} />GitHub</a>}{profile.kaggle_url && <a href={profile.kaggle_url} target="_blank" rel="noreferrer"><LinkIcon size={17} />Kaggle</a>}</div>
        </div>
        {isOwner && <Button asChild variant="outline" className="passport-hero__edit"><Link to="/profile/edit"><Pencil size={17} />Редактировать профиль</Link></Button>}
      </header>
    </Reveal>

    <Stagger className="passport-stats"><StaggerItem><SummaryMetric icon={Trophy} label="Рейтинг сезона" value={overall?.rank ? seasonalScore : null} detail={overall?.rank ? `Место #${overall.rank}` : "Место появится после участия"} tone="blue" onActivate={tabAction("rating")} /></StaggerItem><StaggerItem><SummaryMetric icon={BarChart3} label="Соревнования" value={stats.competitions_participated ?? 0} detail={competitionRating?.rank ? `Место #${competitionRating.rank} в сезоне` : "Завершённые участия"} tone="violet" onActivate={tabAction("rating")} /></StaggerItem><StaggerItem><SummaryMetric icon={Swords} label="Рейтинговые дуэли" value={Number(humanDuels) > 0 ? humanDuels : null} detail="Завершённые матчи" tone="orange" onActivate={tabAction("practice")} /></StaggerItem><StaggerItem><SummaryMetric icon={ShieldCheck} label="Бейджи" value={badges.length} detail="Полученные достижения" tone="green" onActivate={tabAction("badges")} /></StaggerItem></Stagger>

    <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="passport-tabs">
      <Tabs.List className="passport-tabs__list" aria-label="Разделы ML-паспорта">{passportTabs.map(([value, label, Icon]) => <Tabs.Trigger key={value} value={value} className="passport-tabs__trigger"><Icon size={19} />{label}</Tabs.Trigger>)}</Tabs.List>

      <Tabs.Content value="directions" className="passport-directions outline-none"><Reveal><div className="passport-section-title"><div><h2>Карта компетенций</h2><p>Ваши подтверждённые результаты в машинном обучении.</p></div><div className="passport-section-title__note"><BarChart3 size={26} /><span>Развивайтесь в разных направлениях<br />и получайте новые достижения!</span></div></div><div className="passport-directions__grid">{directionCards.map((item) => <DirectionCard key={item.code} {...item} />)}</div></Reveal></Tabs.Content>

      <Tabs.Content value="rating" className="outline-none"><Reveal>{isOwner && !seasonsQuery.isLoading && !season ? <EmptyState title="Новый сезон ещё не начался" text="После старта сезона здесь появятся общий рейтинг, результаты соревнований и дуэлей." /> : <ProfileRating seasons={seasons} season={season} onSeasonChange={setSelectedSeason} overall={overall} competition={competitionRating} duels={duelRating} ratingTotal={overallQuery.data?.total ?? overallQuery.data?.meta?.total} methodology={methodologyQuery.data} />}</Reveal></Tabs.Content>

      <Tabs.Content value="practice" className="outline-none"><Reveal><ProfilePractice matches={humanDuels} wins={duelWins} losses={duelLosses} bonus={challengeBonus} rating={seasonalDuelScore} startRating={duelStart} history={seasonDuelHistory || profile.rating_history || []} historySource={seasonDuelHistory ? "season" : "profile"} competitionScore={competitionsQuery.isSuccess ? competitionRating?.competition_score ?? competitionRating?.score : null} competitionsCount={stats.competitions_participated} duels={list(practiceDuelsQuery.data)} duelsLoading={practiceDuelsQuery.isLoading && isOwner} duelsError={practiceDuelsQuery.isError} ownerId={isOwner ? profileUserId : null} /></Reveal></Tabs.Content>

      <Tabs.Content value="badges" className="mt-7 outline-none"><Reveal>{badges.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{badges.map((grant) => <BadgeCard key={grant.id || grant.badge?.id || grant.code} grant={grant} />)}</div> : <EmptyState title="Бейджей пока нет" text="Достижения появятся здесь после участия в активностях ML-Арены." />}</Reveal></Tabs.Content>

      <Tabs.Content value="external" className="mt-7 outline-none"><Reveal><div className="mb-7"><h2 className="mt-2 font-heading text-2xl font-extrabold sm:text-3xl">Внешние достижения</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Результаты с ML-площадок, соревнований и олимпиад отображаются отдельно от внутреннего рейтинга.</p></div>{externalAchievements.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{externalAchievements.map((achievement, index) => <ExternalAchievementCard key={achievement.id || `${achievement.source || achievement.platform || "external"}-${index}`} achievement={achievement} />)}</div> : <EmptyState title="Внешних достижений пока нет" text="Здесь появятся достижения, которые передаст и подтвердит ML-Арена." />}</Reveal></Tabs.Content>

      {isOwner && <Tabs.Content value="career" className="outline-none"><Reveal><ProfileCareer profile={profile} /></Reveal></Tabs.Content>}
    </Tabs.Root>
  </PageFrame></div>;
}
