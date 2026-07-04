import React from "react";
import { Card } from "@/components/ui/card";
import { TASK_TYPE_LABELS, TASK_TYPE_COLORS, METRIC_LABELS } from "@/lib/ml-arena";
import { Users, Clock, Trophy, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function CompetitionCard({ competition }) {
  const color = TASK_TYPE_COLORS[competition.task_type] || "#7C3AED";
  const isActive = competition.status === "active";

  return (
    <Link to={`/competitions/${competition.id}`}>
      <Card className="group relative overflow-hidden p-5 bg-card/60 border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer h-full">
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
        />
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span
              className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide mb-2"
              style={{ background: `${color}20`, color }}
            >
              {TASK_TYPE_LABELS[competition.task_type]}
            </span>
            <h3 className="font-heading font-semibold text-base leading-snug group-hover:text-primary transition-colors">
              {competition.title}
            </h3>
          </div>
          {competition.is_private && <Lock size={14} className="text-muted-foreground shrink-0" />}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {competition.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users size={13} /> {competition.participants_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <Trophy size={13} /> {METRIC_LABELS[competition.metric]?.split(" ")[0]}
          </span>
          {competition.deadline && (
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {isActive ? "Активно" : "Завершено"}
            </span>
          )}
        </div>
        {competition.prize_fund > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-sm font-semibold text-gradient-purple">
              Приз: {competition.prize_fund.toLocaleString()} ₽
            </span>
          </div>
        )}
      </Card>
    </Link>
  );
}