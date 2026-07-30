import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Crown,
  Loader2,
  MapPin,
  Medal,
  Shield,
  Swords,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SKILL_LABELS = {
  skill_nlp: "NLP",
  skill_cv: "Computer Vision",
  skill_tabular: "Tabular ML",
  skill_regression: "Regression",
  skill_classification: "Classification",
  skill_time_series: "Time Series",
};

function getRatingDelta(profile) {
  const history = profile.rating_history || [];
  if (history.length < 2) return 0;
  return (history.at(-1)?.rating || 0) - (history[0]?.rating || 0);
}

function getWinRate(profile) {
  const wins = profile.duels_won || 0;
  const total = wins + (profile.duels_lost || 0);
  return total ? Math.round((wins / total) * 100) : 0;
}

function getTopSkill(profile) {
  const [key, score] = Object.keys(SKILL_LABELS)
    .map((skillKey) => [skillKey, profile[skillKey] || 0])
    .sort((a, b) => b[1] - a[1])[0];

  return { label: SKILL_LABELS[key], score };
}

function ChampionCard({ profile }) {
  const delta = getRatingDelta(profile);
  const topSkill = getTopSkill(profile);

  return (
    <Link to={`/profile/${profile.id}`} className="group block h-full">
      <Card className="relative h-full min-h-[390px] overflow-hidden border-foreground bg-foreground p-0 text-background shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
        <div className="h-1.5 bg-primary" />
        <div className="flex min-h-[388px] flex-col justify-between p-7 md:p-9">
          <div>
            <div className="flex items-start justify-between gap-6 border-b border-background/15 pb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-background/60">
                <Crown size={16} className="text-background" />
                Лидер сезона
              </div>
              <span className="font-mono text-xs text-background/40">RANK 01</span>
            </div>

            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
              <Avatar name={profile.user_name} src={profile.avatar_url} size={76} />
              <div className="min-w-0">
                <p className="text-sm text-background/55">{profile.full_name || profile.user_name}</p>
                <h2 className="mt-1 truncate font-heading text-3xl font-bold md:text-4xl">{profile.user_name}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-background/55">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={13} />
                    {profile.company || "Независимый участник"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} />
                    {profile.city || "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase text-background/45">Рейтинг</p>
                <p className="mt-1 font-heading text-5xl font-bold tabular-nums">{profile.rating || 1000}</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-background">
                <TrendingUp size={16} />
                +{delta} за сезон
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 border-t border-background/15 pt-5">
            <div>
              <p className="text-[10px] uppercase text-background/40">Сильная область</p>
              <p className="mt-1 text-sm font-semibold">{topSkill.label}</p>
            </div>
            <div className="border-l border-background/15 pl-4">
              <p className="text-[10px] uppercase text-background/40">Побед</p>
              <p className="mt-1 text-sm font-semibold">{profile.competitions_won || 0}</p>
            </div>
            <div className="border-l border-background/15 pl-4">
              <p className="text-[10px] uppercase text-background/40">Win rate</p>
              <p className="mt-1 text-sm font-semibold">{getWinRate(profile)}%</p>
            </div>
          </div>
        </div>
        <ArrowRight className="absolute bottom-8 right-8 transition-transform duration-300 group-hover:translate-x-1" size={20} />
      </Card>
    </Link>
  );
}

function ContenderCard({ profile, rank }) {
  const delta = getRatingDelta(profile);
  const topSkill = getTopSkill(profile);

  return (
    <Link to={`/profile/${profile.id}`} className="group block h-full">
      <Card className="h-full min-h-[188px] overflow-hidden border-border bg-card p-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
        <div className="flex h-full">
          <div className="flex w-20 shrink-0 flex-col items-center justify-between border-r border-border bg-secondary/30 py-6">
            <Medal size={22} className="text-primary" />
            <span className="font-heading text-3xl font-bold text-muted-foreground">0{rank}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={profile.user_name} src={profile.avatar_url} size={48} />
                <div className="min-w-0">
                  <h3 className="truncate font-heading text-lg font-bold group-hover:text-primary">{profile.user_name}</h3>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{profile.company || profile.city || "Независимый участник"}</p>
                </div>
              </div>
              <LeagueBadge rating={profile.rating} size="sm" showName={false} />
            </div>

            <div className="mt-6 grid grid-cols-[1fr_auto] items-end gap-5 border-t border-border pt-4">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">{topSkill.label} · {topSkill.score}</p>
                <p className="mt-1 text-xs font-semibold text-accent">+{delta} за сезон</p>
              </div>
              <p className="font-heading text-3xl font-bold tabular-nums">{profile.rating || 1000}</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function Leaderboard() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => base44.entities.MLProfile.list("-rating", 50),
  });

  const sorted = useMemo(() => {
    if (!profiles) return [];
    return [...profiles].sort((a, b) => (b.rating || 1000) - (a.rating || 1000));
  }, [profiles]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const leaderRating = top3[0]?.rating || 0;
  const ratingGap = top3.length > 1 ? leaderRating - (top3[1]?.rating || 0) : 0;
  const totalCompetitionWins = sorted.reduce((sum, profile) => sum + (profile.competitions_won || 0), 0);

  const leagueStats = useMemo(() => {
    const leagues = [
      { name: "Платина", count: sorted.filter((profile) => profile.rating >= 1500).length },
      { name: "Золото", count: sorted.filter((profile) => profile.rating >= 1300 && profile.rating < 1500).length },
      { name: "Серебро", count: sorted.filter((profile) => profile.rating >= 1100 && profile.rating < 1300).length },
      { name: "Бронза", count: sorted.filter((profile) => profile.rating < 1100).length },
    ];
    const max = Math.max(...leagues.map((league) => league.count), 1);
    return leagues.map((league) => ({ ...league, percent: (league.count / max) * 100 }));
  }, [sorted]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-7">
      <Reveal>
        <section className="border-y border-border bg-card">
          <div className="grid lg:grid-cols-12">
            <div className="flex min-h-[286px] flex-col justify-between p-6 md:p-9 lg:col-span-7">
              <div>
                <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight md:text-5xl">
                  Рейтинг, который показывает форму сезона
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Итог соревнований, дуэлей и подтверждённых результатов в одной таблице.
                </p>
              </div>
              <div className="mt-7 flex items-center gap-3 text-xs text-muted-foreground">
                <Shield size={15} className="text-primary" />
                Рейтинг обновлён сегодня
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-border lg:col-span-5 lg:border-l lg:border-t-0">
              {[
                { icon: Users, label: "Участников", value: sorted.length || "—" },
                { icon: Crown, label: "Рейтинг лидера", value: leaderRating || "—" },
                { icon: TrendingUp, label: "Отрыв лидера", value: ratingGap ? `+${ratingGap}` : "—" },
                { icon: Trophy, label: "Побед в сезоне", value: totalCompetitionWins || "—" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={cn(
                      "flex min-h-36 flex-col justify-between p-5",
                      index % 2 === 1 && "border-l border-border",
                      index > 1 && "border-t border-border",
                    )}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon size={15} className="text-primary" />
                      {item.label}
                    </div>
                    <p className="font-heading text-2xl font-bold tabular-nums">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </Reveal>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : sorted.length === 0 ? (
        <div className="border-y border-dashed border-border py-20 text-center">
          <Trophy className="mx-auto text-muted-foreground" size={36} />
          <h2 className="mt-4 font-heading text-xl font-bold">Рейтинг ещё формируется</h2>
          <p className="mt-2 text-sm text-muted-foreground">Первые места появятся после результатов сезона.</p>
        </div>
      ) : (
        <>
          <section className="py-9">
            <Reveal className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-bold md:text-3xl">Тройка лидеров</h2>
              </div>
            </Reveal>

            <div className="grid gap-4 lg:grid-cols-5">
              {top3[0] && (
                <Reveal className="lg:col-span-3">
                  <ChampionCard profile={top3[0]} />
                </Reveal>
              )}
              <Stagger className="grid gap-4 lg:col-span-2" delay={0.08}>
                {top3.slice(1).map((profile, index) => (
                  <StaggerItem key={profile.id}>
                    <ContenderCard profile={profile} rank={index + 2} />
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </section>

          <section className="grid gap-6 pb-2 lg:grid-cols-12">
            <Reveal className="lg:col-span-9">
              <div className="border-y border-border bg-card">
                <div className="flex items-end justify-between gap-4 border-b border-border px-5 py-5 md:px-6">
                  <div>
                    <h2 className="font-heading text-xl font-bold">Остальные участники</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{rest.length} позиций</span>
                </div>

                <div className="grid grid-cols-[42px_minmax(0,1fr)_68px] border-b border-border bg-secondary/25 px-4 py-3 text-[10px] font-semibold uppercase text-muted-foreground md:grid-cols-[52px_minmax(190px,1fr)_120px_100px_76px] md:px-6">
                  <span>Место</span>
                  <span>Участник</span>
                  <span className="hidden md:block">Сильная область</span>
                  <span className="hidden text-right md:block">Результаты</span>
                  <span className="text-right">Рейтинг</span>
                </div>

                <Stagger className="divide-y divide-border" delay={0.08}>
                  {rest.map((profile, index) => {
                    const skill = getTopSkill(profile);
                    const delta = getRatingDelta(profile);
                    return (
                      <StaggerItem key={profile.id}>
                        <Link
                          to={`/profile/${profile.id}`}
                          className="group grid min-h-20 grid-cols-[42px_minmax(0,1fr)_68px] items-center px-4 transition-colors hover:bg-secondary/35 md:grid-cols-[52px_minmax(190px,1fr)_120px_100px_76px] md:px-6"
                        >
                          <span className="font-mono text-sm text-muted-foreground">{String(index + 4).padStart(2, "0")}</span>
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={profile.user_name} src={profile.avatar_url} size={38} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold transition-colors group-hover:text-primary">{profile.user_name}</p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">{profile.company || profile.city || "—"}</p>
                            </div>
                          </div>
                          <div className="hidden md:block">
                            <p className="text-xs font-medium">{skill.label}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">{skill.score} / 100</p>
                          </div>
                          <div className="hidden text-right md:block">
                            <p className="inline-flex items-center justify-end gap-1.5 text-xs">
                              <Trophy size={12} className="text-primary" />
                              {profile.competitions_won || 0}
                            </p>
                            <p className="mt-1 inline-flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                              <Swords size={11} />
                              {getWinRate(profile)}% побед
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-heading text-base font-bold tabular-nums">{profile.rating || 1000}</p>
                            <p className="mt-0.5 text-[10px] font-semibold text-accent">+{delta}</p>
                          </div>
                        </Link>
                      </StaggerItem>
                    );
                  })}
                </Stagger>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-3" delay={0.12}>
              <aside className="border-y border-border bg-card lg:sticky lg:top-5">
                <div className="border-b border-border p-5">
                  <h2 className="font-heading text-xl font-bold">Распределение сил</h2>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Состав общего рейтинга по текущему уровню участников.
                  </p>
                </div>
                <div className="space-y-5 p-5">
                  {leagueStats.map((league) => (
                    <div key={league.name}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">{league.name}</span>
                        <span className="text-muted-foreground">{league.count}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden bg-secondary">
                        <div className="h-full bg-primary" style={{ width: `${league.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/competitions"
                  className="flex min-h-12 items-center justify-between border-t border-border px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                >
                  Улучшить позицию
                  <ArrowRight size={16} />
                </Link>
              </aside>
            </Reveal>
          </section>
        </>
      )}
    </div>
  );
}
