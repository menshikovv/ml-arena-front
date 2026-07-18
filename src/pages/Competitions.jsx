import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import CompetitionCard from "@/components/ml/CompetitionCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2, Trophy, Archive } from "lucide-react";
import { TASK_TYPE_LABELS } from "@/lib/ml-arena";
import { Link } from "react-router-dom";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";

export default function Competitions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showArchive, setShowArchive] = useState(false);

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: () => base44.entities.Competition.list("-created_date", 50),
  });

  const filtered = useMemo(() => {
    if (!competitions) return [];
    return competitions.filter((c) => {
      if (showArchive && c.status !== "completed") return false;
      if (!showArchive && c.status === "completed") return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (!showArchive && statusFilter !== "all" && c.status !== statusFilter) return false;
      if (typeFilter !== "all" && c.task_type !== typeFilter) return false;
      return true;
    });
  }, [competitions, search, statusFilter, typeFilter, showArchive]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <Reveal className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">
            {showArchive ? "Архив соревнований" : "Соревнования"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {showArchive
              ? "Завершённые соревнования и их результаты"
              : "Участвуй в ML-турнирах и зарабатывай рейтинг"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowArchive((v) => !v)}>
            <Archive size={16} className="mr-1.5" />
            {showArchive ? "К активным" : "Архив"}
          </Button>
          <Button asChild>
            <Link to="/company/dashboard">
              <Trophy size={16} className="mr-1.5" /> Создать соревнование
            </Link>
          </Button>
        </div>
      </Reveal>

      {/* Filters */}
      <Reveal className="flex flex-col md:flex-row gap-3 mb-6" delay={0.08}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {!showArchive && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-card border border-border text-sm"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="draft">Черновики</option>
            </select>
          )}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-card border border-border text-sm"
          >
            <option value="all">Все типы</option>
            {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </Reveal>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {showArchive ? "Архив пуст" : "Соревнования не найдены"}
          </p>
        </div>
      ) : (
        <Stagger className="flex flex-col gap-4">
          {filtered.map((c) => (
            <StaggerItem key={c.id}>
              <CompetitionCard competition={c} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
