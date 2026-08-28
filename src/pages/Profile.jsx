import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Tabs from "@radix-ui/react-tabs";
import { Link, useParams } from "react-router-dom";
import { Award, BriefcaseBusiness, CheckCircle2, Github, GraduationCap, History, Link as LinkIcon, Loader2, MapPin, ShieldCheck, Swords, Target, Trophy, UserRoundSearch } from "lucide-react";
import { api } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
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

function SummaryMetric({ icon: Icon, label, value, detail }) {
  return <Card className="h-full border-border bg-card p-5"><Icon size={19} className="text-primary" /><p className="mt-5 text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-2xl font-extrabold">{shown(value)}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></Card>;
}

function EmptyState({ title, text }) {
  return <div className="border border-dashed border-border bg-card px-5 py-12 text-center"><History className="mx-auto text-muted-foreground" size={26} /><h3 className="mt-4 font-heading text-xl font-extrabold">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

function DirectionCard({ code, title, score }) {
  const value = Number(score || 0);
  const hasData = value > 0;
  return <article className="flex min-h-48 flex-col border border-border bg-card p-5"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary"><Target size={18} /></span><span className={cn("border px-2 py-1 text-[10px] font-semibold", hasData ? "border-primary/20 bg-primary/5 text-primary" : "border-border text-muted-foreground")}>{hasData ? "Есть данные" : "Нет данных"}</span></div><h3 className="mt-5 font-heading text-xl font-extrabold">{title}</h3><div className="mt-auto pt-6"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Уровень из профиля</span><strong>{hasData ? `${value}%` : "—"}</strong></div><div className="mt-2 h-2 overflow-hidden bg-secondary"><div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div><p className="mt-3 text-[11px] leading-5 text-muted-foreground">{hasData ? `Получено из profile.skills.${code}.` : "Сервер пока не вернул статистику по направлению."}</p></div></article>;
}

function RatingHistory({ history }) {
  if (!history.length) return <EmptyState title="История рейтинга пока пуста" text="Изменения появятся после рейтинговых событий, рассчитанных сервером." />;
  const values = history.map((item) => Number(item.rating || 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  return <div className="border border-border bg-card p-5"><div className="flex h-44 items-end gap-2">{history.map((item) => { const height = 20 + ((Number(item.rating || 0) - min) / range) * 80; return <div key={`${item.date}-${item.rating}`} className="group flex min-w-0 flex-1 flex-col items-center justify-end"><span className="mb-2 hidden text-[10px] font-semibold group-hover:block">{item.rating}</span><div className="w-full bg-primary/75" style={{ height: `${height}%` }} /><span className="mt-2 max-w-full truncate text-[9px] text-muted-foreground">{item.date}</span></div>; })}</div></div>;
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
  const humanDuels = duelRating?.human_duel_count ?? ((stats.duels_won ?? 0) + (stats.duels_lost ?? 0));
  const duelWins = duelRating?.wins ?? stats.duels_won;
  const duelLosses = duelRating?.losses ?? stats.duels_lost;
  const challengeBonus = duelRating?.challenge_bonus;
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  const displayName = fullName || profile?.user_name || "Участник";
  const directionCards = useMemo(() => DIRECTIONS.map(([code, title]) => ({ code, title, score: skills[code] })), [skills]);

  if (profileQuery.isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  if (!profile) return <div className="py-20 text-center text-muted-foreground">ML-паспорт не найден</div>;

  return <div className="mx-auto w-full max-w-[1380px] px-4 py-6 md:px-6 lg:px-8 lg:py-10">
    <Reveal className="grid gap-px border border-border bg-border lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.5fr)]">
      <section className="relative overflow-hidden bg-card p-6 sm:p-8"><div className="absolute inset-x-0 top-0 h-1 bg-primary" /><div className="flex flex-col gap-6 sm:flex-row"><Avatar name={displayName} src={profile.avatar_url} size={104} className="ring-2 ring-primary/20" /><div className="min-w-0 flex-1"><LeagueBadge rating={profile.rating} size="lg" /><h1 className="mt-4 font-heading text-3xl font-extrabold sm:text-4xl">{displayName}</h1>{fullName && profile.user_name && <p className="mt-1 text-sm text-muted-foreground">@{profile.user_name}</p>}<p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{profile.bio || "Описание профиля пока не заполнено."}</p><div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">{profile.city && <span className="flex items-center gap-1.5"><MapPin size={13} />{profile.city}</span>}{profile.university && <span className="flex items-center gap-1.5"><GraduationCap size={13} />{profile.university}</span>}{profile.company && <span className="flex items-center gap-1.5"><BriefcaseBusiness size={13} />{profile.company}</span>}{profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary"><Github size={13} />GitHub</a>}{profile.kaggle_url && <a href={profile.kaggle_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary"><LinkIcon size={13} />Kaggle</a>}</div></div></div></section>
      <aside className="flex flex-col bg-card p-6 sm:p-8"><ShieldCheck size={24} className="text-primary" /><p className="mt-5 text-xs text-muted-foreground">ML-паспорт</p><h2 className="mt-2 font-heading text-2xl font-extrabold">Данные профиля</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Направления берутся из профиля, рейтинг — из сезонных снимков, бейджи — из серверных выдач.</p>{isOwner && <Button asChild variant="outline" className="mt-auto"><Link to="/profile/edit">Редактировать профиль</Link></Button>}</aside>
    </Reveal>

    <Stagger className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StaggerItem><SummaryMetric icon={Trophy} label="Рейтинг сезона" value={overall?.score ?? overall?.rating ?? profile.rating} detail={overall?.rank ? `Место #${overall.rank}` : "Место сервером не рассчитано"} /></StaggerItem><StaggerItem><SummaryMetric icon={CheckCircle2} label="Соревнования" value={stats.competitions_participated} detail={competitionRating?.rank ? `Место #${competitionRating.rank} в сезоне` : "Участия из profile.stats"} /></StaggerItem><StaggerItem><SummaryMetric icon={Swords} label="Рейтинговые дуэли" value={humanDuels} detail={duelRating?.calibration_status || "Только матчи с людьми"} /></StaggerItem><StaggerItem><SummaryMetric icon={Award} label="Бейджи" value={badges.length} detail="Активные выдачи с сервера" /></StaggerItem></Stagger>

    <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mt-8">
      <Tabs.List className="flex overflow-x-auto border border-border bg-card p-1" aria-label="Разделы ML-паспорта">{[["directions", "Направления", Target], ["rating", "Рейтинг", Trophy], ["practice", "Практика", Swords], ["badges", "Бейджи", Award], ["career", "Профиль", UserRoundSearch]].map(([value, label, Icon]) => <Tabs.Trigger key={value} value={value} className="flex min-h-11 min-w-36 flex-1 items-center justify-center gap-2 px-4 text-sm font-semibold text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Icon size={16} />{label}</Tabs.Trigger>)}</Tabs.List>

      <Tabs.Content value="directions" className="mt-7 outline-none"><Reveal><h2 className="font-heading text-3xl font-extrabold">Восемь направлений</h2><p className="mt-2 text-sm text-muted-foreground">Значения отображаются напрямую из поля <code>profile.skills</code>. Отсутствующие значения не заменяются демонстрационными данными.</p><div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{directionCards.map((item) => <DirectionCard key={item.code} {...item} />)}</div></Reveal></Tabs.Content>

      <Tabs.Content value="rating" className="mt-7 outline-none"><Reveal>{isOwner && !seasonsQuery.isLoading && !season ? <EmptyState title="Сезон рейтинга ещё не создан" text="Когда администратор создаст и активирует сезон, здесь появятся общая, соревновательная и дуэльная части рейтинга." /> : <><div className="grid gap-3 md:grid-cols-3"><SummaryMetric icon={Trophy} label="Общий рейтинг" value={overall?.score ?? overall?.rating ?? profile.rating} detail={overall?.rank ? `Место #${overall.rank}` : "Текущий профиль"} /><SummaryMetric icon={Target} label="Компонент соревнований" value={competitionRating?.score ?? competitionRating?.rating} detail={competitionRating?.rank ? `Место #${competitionRating.rank}` : "Недостаточно рейтинговых событий"} /><SummaryMetric icon={Swords} label="Компонент дуэлей" value={duelRating?.score ?? duelRating?.rating} detail={duelRating?.rank ? `Место #${duelRating.rank}` : "Место появится после калибровки"} /></div><div className="mt-6"><h2 className="mb-4 font-heading text-2xl font-extrabold">История рейтинга</h2><RatingHistory history={profile.rating_history || []} /></div></>}</Reveal></Tabs.Content>

      <Tabs.Content value="practice" className="mt-7 outline-none"><Reveal><h2 className="font-heading text-3xl font-extrabold">Практика</h2><p className="mt-2 text-sm text-muted-foreground">Числа берутся из <code>profile.stats</code> и строки текущего пользователя в сезонном рейтинге.</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><SummaryMetric icon={Swords} label="Дуэли с людьми" value={humanDuels} detail="Рейтинговые завершённые матчи" /><SummaryMetric icon={CheckCircle2} label="Победы" value={duelWins} detail="Только человеческие дуэли" /><SummaryMetric icon={History} label="Поражения" value={duelLosses} detail="Только человеческие дуэли" /><SummaryMetric icon={Award} label="Бонус вызовов" value={challengeBonus} detail="Значение из rating.current_user" /></div>{humanDuels === 0 && challengeBonus == null && <div className="mt-6"><EmptyState title="Практика пока не рассчитана" text="После завершённых дуэлей и вызовов сервер обновит сезонную строку пользователя." /></div>}</Reveal></Tabs.Content>

      <Tabs.Content value="badges" className="mt-7 outline-none"><Reveal>{badges.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{badges.map((badge) => <article key={badge.id || badge.slug || badge.name} className="border border-border bg-card p-5"><Award size={20} className="text-primary" /><h3 className="mt-4 font-heading text-xl font-extrabold">{badge.name || badge.title}</h3>{badge.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{badge.description}</p>}{badge.granted_at && <p className="mt-4 text-xs text-muted-foreground">Выдан {new Date(badge.granted_at).toLocaleDateString("ru-RU")}</p>}</article>)}</div> : <EmptyState title="Бейджей пока нет" text="Здесь появятся только активные выдачи backend." />}</Reveal></Tabs.Content>

      <Tabs.Content value="career" className="mt-7 outline-none"><Reveal><div className="grid gap-3 md:grid-cols-2"><Card className="border-border bg-card p-6"><BriefcaseBusiness size={21} className="text-primary" /><h2 className="mt-5 font-heading text-2xl font-extrabold">Карьерные данные</h2><div className="mt-5 divide-y divide-border">{[["Город", profile.city], ["Университет", profile.university], ["Компания", profile.company], ["Виден работодателям", profile.visible_to_employers ? "Да" : "Нет"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><span className="text-muted-foreground">{label}</span><strong className="text-right">{shown(value)}</strong></div>)}</div></Card><Card className="border-border bg-card p-6"><UserRoundSearch size={21} className="text-primary" /><h2 className="mt-5 font-heading text-2xl font-extrabold">Публичность</h2><div className="mt-5 divide-y divide-border">{[["Публичный профиль", profile.public_profile ? "Да" : "Нет"], ["Показывать имя", profile.show_real_name ? "Да" : "Нет"], ["Показывать карьерные данные", profile.show_career_details ? "Да" : "Нет"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>)}</div></Card></div></Reveal></Tabs.Content>
    </Tabs.Root>
  </div>;
}
