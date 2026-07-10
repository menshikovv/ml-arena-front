import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import { Card } from "@/components/ui/card";
import { Loader2, Trophy, Swords } from "lucide-react";

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

  const podiumStyles = [
    { order: "md:order-2", height: "md:mt-0", medal: "🥇", color: "#FFD700" },
    { order: "md:order-1", height: "md:mt-6", medal: "🥈", color: "#C0C0C0" },
    { order: "md:order-3", height: "md:mt-10", medal: "🥉", color: "#CD7F32" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Рейтинг участников</h1>
        <p className="text-muted-foreground text-sm mt-1">Топ ML-гладиаторов платформы</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Пока нет участников в рейтинге</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
              {top3.map((p, i) => (
                <Link key={p.id} to={`/profile/${p.id}`} className={`block ${podiumStyles[i].order}`}>
                  <Card className={`p-4 md:p-6 text-center bg-card/60 border-border hover:border-primary/40 transition-all ${podiumStyles[i].height}`}>
                    <div className="text-2xl md:text-3xl mb-2">{podiumStyles[i].medal}</div>
                    <Avatar name={p.user_name} src={p.avatar_url} size={i === 0 ? 56 : 44} className="mx-auto mb-2" />
                    <p className="font-semibold text-sm md:text-base truncate">{p.user_name}</p>
                    <div className="mt-1.5">
                      <LeagueBadge rating={p.rating} size="sm" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold font-heading mt-2" style={{ color: podiumStyles[i].color }}>
                      {p.rating || 1000}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Table */}
          {rest.length > 0 && (
            <Card className="overflow-hidden bg-card/40 border-border">
              <div className="divide-y divide-border">
                {rest.map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/profile/${p.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="w-8 text-center text-sm font-medium text-muted-foreground">{i + 4}</span>
                    <Avatar name={p.user_name} src={p.avatar_url} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.user_name}</p>
                      <p className="text-xs text-muted-foreground">{p.city || "—"}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Trophy size={12} /> {p.competitions_won || 0}
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Swords size={12} /> {p.duels_won || 0}–{p.duels_lost || 0}
                    </div>
                    <LeagueBadge rating={p.rating} size="sm" showName={false} />
                    <span className="w-12 text-right font-bold font-heading tabular-nums">{p.rating || 1000}</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}