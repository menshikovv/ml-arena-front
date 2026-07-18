import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import StatCard from "@/components/ml/StatCard";
import { getLeagueProgress } from "@/lib/ml-arena";
import {
  MapPin, Building2, Github, Link as LinkIcon, Loader2,
  Trophy, Swords, Target, Eye, EyeOff, Award, TrendingUp, Star
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";

const BADGE_ICONS = {
  "Первая победа": Trophy,
  "Гладиатор недели": Star,
  "10 дуэлей": Swords,
  "Чемпион": Award,
};

export default function Profile() {
  const { id } = useParams();
  const profileId = id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", profileId],
    queryFn: () => base44.entities.MLProfile.get(profileId),
    enabled: !!profileId,
  });

  const { data: badges } = useQuery({
    queryKey: ["badges", profile?.user_name],
    queryFn: () => base44.entities.Badge.filter({ user_name: profile?.user_name }, "-created_date", 20),
    enabled: !!profile?.user_name,
  });

  const skillData = useMemo(() => {
    if (!profile) return [];
    return [
      { skill: "NLP", value: profile.skill_nlp || 0 },
      { skill: "CV", value: profile.skill_cv || 0 },
      { skill: "Табличные", value: profile.skill_tabular || 0 },
      { skill: "Регрессия", value: profile.skill_regression || 0 },
      { skill: "Классификация", value: profile.skill_classification || 0 },
      { skill: "Time Series", value: profile.skill_time_series || 0 },
    ];
  }, [profile]);

  const ratingHistory = useMemo(() => {
    if (!profile?.rating_history?.length) {
      return [{ date: "Старт", rating: 1000 }, { date: "Сейчас", rating: profile?.rating || 1000 }];
    }
    return profile.rating_history;
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Профиль не найден</p>
      </div>
    );
  }

  const progress = getLeagueProgress(profile.rating || 1000);
  const winRate = profile.duels_won + profile.duels_lost > 0
    ? Math.round((profile.duels_won / (profile.duels_won + profile.duels_lost)) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header card */}
      <Reveal className="mb-6">
        <Card className="relative overflow-hidden p-6 bg-card/60 border-border">
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          <div className="relative flex flex-col md:flex-row gap-5">
          <Avatar name={profile.user_name} src={profile.avatar_url} size={88} className="ring-2 ring-primary/30" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="font-heading text-2xl font-bold">{profile.user_name}</h1>
                {profile.full_name && <p className="text-sm text-muted-foreground">{profile.full_name}</p>}
              </div>
              <LeagueBadge rating={profile.rating} size="lg" />
            </div>
            {profile.bio && <p className="text-sm text-muted-foreground mt-2 max-w-xl">{profile.bio}</p>}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              {profile.city && <span className="flex items-center gap-1"><MapPin size={14} /> {profile.city}</span>}
              {profile.university && <span className="flex items-center gap-1"><Building2 size={14} /> {profile.university}</span>}
              {profile.company && <span className="flex items-center gap-1"><Building2 size={14} /> {profile.company}</span>}
              {profile.github_url && <a href={profile.github_url} className="flex items-center gap-1 hover:text-foreground"><Github size={14} /> GitHub</a>}
              {profile.kaggle_url && <a href={profile.kaggle_url} className="flex items-center gap-1 hover:text-foreground"><LinkIcon size={14} /> Kaggle</a>}
            </div>
          </div>
          </div>

          {/* League progress bar */}
          <div className="relative mt-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>До следующей лиги: {progress.current}/{progress.max === "∞" ? "∞" : progress.max}</span>
            <span>{profile.rating} очков</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${Math.min(progress.percent, 100)}%` }} />
          </div>
          </div>
        </Card>
      </Reveal>

      {/* Stats */}
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StaggerItem><StatCard icon={TrendingUp} label="Рейтинг" value={profile.rating || 1000} color="#7C3AED" /></StaggerItem>
        <StaggerItem><StatCard icon={Trophy} label="Победы в турнирах" value={profile.competitions_won || 0} color="#FFD700" /></StaggerItem>
        <StaggerItem><StatCard icon={Swords} label="Дуэли" value={`${profile.duels_won || 0}–${profile.duels_lost || 0}`} sublabel={`${winRate}% побед`} color="#06B6D4" /></StaggerItem>
        <StaggerItem><StatCard icon={Target} label="Участий" value={profile.competitions_participated || 0} color="#EC4899" /></StaggerItem>
      </Stagger>

      <Stagger className="grid md:grid-cols-2 gap-6 mb-6" delay={0.14}>
        {/* Skills radar */}
        <StaggerItem>
          <Card className="p-5 bg-card/40 border-border">
            <h3 className="font-heading font-semibold mb-4">ML-паспорт · Навыки</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={skillData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </StaggerItem>

        {/* Rating history */}
        <StaggerItem>
          <Card className="p-5 bg-card/40 border-border">
            <h3 className="font-heading font-semibold mb-4">Динамика рейтинга</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ratingHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} domain={[800, "auto"]} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="rating" stroke="#06B6D4" strokeWidth={2} dot={{ fill: "#06B6D4", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </StaggerItem>
      </Stagger>

      {/* Badges */}
      <Reveal delay={0.2}>
        <Card className="p-5 bg-card/40 border-border">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <Award size={18} /> Бейджи и достижения
        </h3>
        {badges?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Пока нет бейджей</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {badges?.map((b) => {
              const Icon = BADGE_ICONS[b.name] || Award;
              return (
                <div key={b.id} className="flex flex-col items-center text-center p-3 rounded-lg bg-secondary/50">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: `${b.color}20`, color: b.color }}>
                    <Icon size={18} />
                  </div>
                  <p className="text-xs font-medium">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{b.description}</p>
                </div>
              );
            })}
          </div>
        )}
        </Card>
      </Reveal>

      {/* Visibility toggle */}
      <Reveal className="flex items-center justify-between mt-6 p-4 rounded-lg bg-card/40 border border-border" delay={0.24}>
        <div className="flex items-center gap-2">
          {profile.visible_to_employers ? <Eye size={16} className="text-emerald-400" /> : <EyeOff size={16} className="text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium">Видимость для работодателей</p>
            <p className="text-xs text-muted-foreground">
              {profile.visible_to_employers ? "Компании видят твой ML-паспорт" : "Профиль скрыт от компаний"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          {profile.visible_to_employers ? "Скрыть" : "Показать"}
        </Button>
      </Reveal>
    </div>
  );
}
