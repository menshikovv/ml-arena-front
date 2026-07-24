import React from "react";
import { Card } from "@/components/ui/card";
import { TASK_TYPE_LABELS, TASK_TYPE_COLORS, METRIC_LABELS } from "@/lib/ml-arena";
import { Users, Clock, Trophy, Lock, ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function CompetitionCard({ competition }) {
  const color = TASK_TYPE_COLORS[competition.task_type] || "#7C3AED";
  const isActive = competition.status === "active";

  return (
    <Link to={`/competitions/${competition.id}`}>
      <Card className="group relative overflow-hidden p-6 md:min-h-[190px] md:px-7 md:py-7 bg-card/60 border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
        <div
          className="absolute top-0 left-0 bottom-0 w-1"
          style={{ background: color }}
        />
        <div className="flex h-full flex-col md:flex-row md:items-center gap-5 md:gap-7">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: `${color}20`, color }}
              >
                {TASK_TYPE_LABELS[competition.task_type]}
              </span>
              {isActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Активно
                </span>
              )}
              {competition.is_private && <Lock size={13} className="text-muted-foreground" />}
            </div>

            <h3 className="font-heading font-bold text-xl md:text-2xl leading-snug group-hover:text-primary transition-colors mb-2">
              {competition.title}
            </h3>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-3 mb-4 max-w-3xl">
              {competition.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs md:text-sm text-muted-foreground">
              {competition.company_name && (
                <span className="flex items-center gap-1">
                  <Building2 size={13} /> {competition.company_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users size={13} /> {competition.participants_count || 0} участников
              </span>
              <span className="flex items-center gap-1">
                <Trophy size={13} /> {METRIC_LABELS[competition.metric]}
              </span>
              {competition.deadline && (
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {isActive ? `До ${new Date(competition.deadline).toLocaleDateString("ru-RU")}` : "Завершено"}
                </span>
              )}
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:gap-2.5 shrink-0 md:pl-7 md:border-l border-border md:min-w-[180px]">
            {competition.prize_fund > 0 ? (
              <div className="text-left md:text-right">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Призовой фонд</div>
                <div className="text-xl font-bold text-gradient-purple">
                  {competition.prize_fund.toLocaleString()} ₽
                </div>
              </div>
            ) : (
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Без приза</div>
            )}
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              Участвовать <ArrowRight size={15} />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
