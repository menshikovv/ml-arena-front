import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  Filter,
  Loader2,
  Search,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import CompetitionCard from "@/components/ml/CompetitionCard";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TASK_TYPE_LABELS } from "@/lib/ml-arena";
import { cn } from "@/lib/utils";

const COMPETITION_META = {
  c1: { difficulty: "Средняя", access: "Открыто", domain: "Финтех" },
  c2: { difficulty: "Лёгкая", access: "Открыто", domain: "NLP" },
  c3: { difficulty: "Высокая", access: "Открыто", domain: "Финтех" },
  c4: { difficulty: "Высокая", access: "Открыто", domain: "Ритейл" },
  c5: { difficulty: "Средняя", access: "Открыто", domain: "Транспорт" },
  c6: { difficulty: "Начальная", access: "Открыто", domain: "Синтетика" },
  c7: { difficulty: "Экспертная", access: "Открыто", domain: "Исследования" },
  c8: { difficulty: "Лёгкая", access: "Открыто", domain: "Телеком" },
  c9: { difficulty: "Высокая", access: "Партнёрское", domain: "Здравоохранение" },
  c10: { difficulty: "Экспертная", access: "По приглашению", domain: "Беспилотники" },
};

const USER_STATES = {
  c1: { joined: true, rank: 17, score: "2.0731", attemptsLeft: 2 },
  c2: { joined: true, attemptsLeft: 5 },
  c6: { joined: true, rank: 12, score: "98.71%" },
};

function pluralize(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function getStatus(competition) {
  if (competition.status === "completed") return "finished";
  if (competition.status === "draft") return "upcoming";
  if (competition.status === "active" && competition.deadline && new Date(competition.deadline).getTime() < Date.now()) {
    return "finalizing";
  }
  return "active";
}

export default function Competitions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("deadline");

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: () => base44.entities.Competition.list("-created_date", 50),
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = competitions.filter((competition) => {
      const status = getStatus(competition);
      const statusMatches = statusFilter === "finished"
        ? ["finished", "finalizing"].includes(status)
        : status === statusFilter;
      const searchMatches = !query
        || competition.title.toLowerCase().includes(query)
        || competition.description.toLowerCase().includes(query)
        || competition.company_name?.toLowerCase().includes(query);
      return statusMatches && searchMatches && (typeFilter === "all" || competition.task_type === typeFilter);
    });

    return result.sort((a, b) => {
      if (sort === "participants") return (b.participants_count || 0) - (a.participants_count || 0);
      if (sort === "prize") return (b.prize_fund || 0) - (a.prize_fund || 0);
      if (sort === "newest") return String(b.id).localeCompare(String(a.id));
      return new Date(a.deadline || "2100-01-01") - new Date(b.deadline || "2100-01-01");
    });
  }, [competitions, search, sort, statusFilter, typeFilter]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSort("deadline");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-7">
      <section id="competition-catalog">
        <div className="flex flex-col justify-between gap-4 border-b border-border md:flex-row md:items-end">
          <div className="flex gap-1 overflow-x-auto">
            {[
              ["active", "Активные"],
              ["upcoming", "Скоро"],
              ["finished", "Завершённые"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "relative h-11 shrink-0 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary",
                  statusFilter === value && "text-primary",
                )}
              >
                {label}
                {statusFilter === value && <motion.span layoutId="competition-status" className="absolute inset-x-2 bottom-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
          <Button asChild variant="ghost" size="sm" className="mb-2 self-start md:self-auto">
            <Link to="/company/dashboard"><Building2 size={15} /> Провести соревнование</Link>
          </Button>
        </div>

        <Reveal className="mt-5 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_210px]" delay={0.05}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Название, задача или компания"
              className="h-10 pl-10"
            />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-10 w-full appearance-none rounded-md border border-input bg-card px-3 pr-9 text-sm"
              aria-label="Тип задачи"
            >
              <option value="all">Все направления</option>
              {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-10 w-full appearance-none rounded-md border border-input bg-card px-3 pr-9 text-sm"
              aria-label="Сортировка"
            >
              <option value="deadline">Ближайший дедлайн</option>
              <option value="participants">По участникам</option>
              <option value="prize">По призовому фонду</option>
              <option value="newest">Сначала новые</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          </div>
        </Reveal>

        <div className="mt-9 flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-heading text-2xl font-bold md:text-3xl">
              {statusFilter === "active"
                ? "События в центре внимания"
                : statusFilter === "upcoming"
                  ? "Следующие старты"
                  : "Архив больших результатов"}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} {pluralize(filtered.length, "соревнование", "соревнования", "соревнований")}
          </p>
        </div>

        <div className="mt-3 flex justify-end">
          {(search || typeFilter !== "all" || sort !== "deadline") && (
            <button type="button" onClick={clearFilters} className="text-xs font-medium text-primary hover:underline">
              Сбросить фильтры
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={26} />
          </div>
        ) : filtered.length ? (
          <Stagger className="mt-6 space-y-6" delay={0.06}>
            {filtered.map((competition, index) => (
              <StaggerItem key={competition.id}>
                <CompetitionCard
                  competition={competition}
                  status={getStatus(competition)}
                  meta={COMPETITION_META[competition.id] || { difficulty: "Средняя", access: "Открыто", domain: "Другое" }}
                  userState={USER_STATES[competition.id]}
                  featured={index === 0}
                  sequence={index + 1}
                />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="mt-5 border-y border-dashed border-border py-16 text-center">
            <Filter className="mx-auto text-muted-foreground" size={28} />
            <h2 className="mt-4 font-heading text-lg font-bold">По этим условиям ничего не найдено</h2>
            <p className="mt-2 text-sm text-muted-foreground">Сбрось фильтры или посмотри соревнования в другой стадии.</p>
            <Button variant="outline" className="mt-5" onClick={clearFilters}>Сбросить фильтры</Button>
          </div>
        )}
      </section>

      <section className="grid border-y border-border bg-card md:grid-cols-[1fr_1fr_1fr]">
        {[
          ["Одинаковые лимиты", "В рейтинговых турнирах Premium не влияет на число попыток."],
          ["Призы и возможности", "Лучшие участники получают денежные призы, позиции в рейтинге и внимание компаний-партнёров."],
          ["Только CSV", "Код не запускается на платформе, а формат проверяется до расчёта результата."],
        ].map(([title, text], index) => (
          <div key={title} className={cn("p-5 md:p-6", index > 0 && "border-t border-border md:border-l md:border-t-0")}>
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
