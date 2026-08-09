import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  BadgeCheck,
  Building2,
  CalendarClock,
  ChevronDown,
  Filter,
  History,
  Layers3,
  Loader2,
  Search,
  Send,
  Scale,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { base44 } from "@/api/base44Client";
import CompetitionCard from "@/components/ml/CompetitionCard";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const COMPETITION_BENEFITS = [
  {
    number: "01",
    title: "Одинаковые лимиты",
    text: "В рейтинговых турнирах Premium не влияет на число попыток.",
    icon: Scale,
    iconClass: "bg-primary/10 text-primary",
    accentClass: "bg-primary",
  },
  {
    number: "02",
    title: "Призы и возможности",
    text: "Лучшие участники получают денежные призы, позиции в рейтинге и внимание компаний-партнёров.",
    icon: Trophy,
    iconClass: "bg-[hsl(var(--chart-5)/0.16)] text-[hsl(var(--chart-5))]",
    accentClass: "bg-[hsl(var(--chart-5))]",
  },
  {
    number: "03",
    title: "Обратная связь",
    text: "Участники загружают CSV и код итогового решения. Для работ, занявших призовые места, код проверяется на воспроизводимость.",
    icon: BadgeCheck,
    iconClass: "bg-accent/20 text-accent-foreground",
    accentClass: "bg-accent",
  },
];

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
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ company: "", name: "", contact: "", prize: "", description: "" });

  useEffect(() => {
    if (!requestOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setRequestOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [requestOpen]);

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

  const submitRequest = (event) => {
    event.preventDefault();
    toast.success("Заявка отправлена. Мы свяжемся с вами в ближайшее время.");
    setRequestOpen(false);
    setRequestForm({ company: "", name: "", contact: "", prize: "", description: "" });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-7">
      <section id="competition-catalog">
        <div className="flex flex-col justify-between gap-4 border-b border-border md:flex-row md:items-end">
          <div className="flex gap-1 overflow-x-auto">
            {[
              ["active", "Активные", Zap],
              ["upcoming", "Скоро", CalendarClock],
              ["finished", "Завершённые", History],
            ].map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "relative flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
                  statusFilter === value && "text-primary",
                )}
              >
                <Icon size={16} />
                {label}
                {statusFilter === value && <motion.span layoutId="competition-status" className="absolute inset-x-2 bottom-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mb-2 self-start md:self-auto" onClick={() => setRequestOpen(true)}>
            <Building2 size={15} /> Провести соревнование
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
            <Layers3 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-10 w-full appearance-none rounded-md border border-input bg-card pl-10 pr-9 text-sm"
              aria-label="Тип задачи"
            >
              <option value="all">Все направления</option>
              {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          </div>
          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-10 w-full appearance-none rounded-md border border-input bg-card pl-10 pr-9 text-sm"
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

      <section className="mt-8 grid overflow-hidden border border-border bg-card md:grid-cols-3">
        {COMPETITION_BENEFITS.map((benefit, index) => {
          const Icon = benefit.icon;

          return (
            <motion.article
              key={benefit.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.32, delay: index * 0.08, ease: "easeOut" }}
              className={cn("group relative min-h-48 overflow-hidden p-6 md:p-7", index > 0 && "border-t border-border md:border-l md:border-t-0")}
            >
              <span className={cn("absolute inset-x-0 top-0 h-1", benefit.accentClass)} />
              <div className="flex items-start justify-between gap-4">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-200 group-hover:-translate-y-0.5", benefit.iconClass)}>
                  <Icon size={19} />
                </div>
                <span className="font-mono text-[11px] font-medium text-muted-foreground">{benefit.number}</span>
              </div>
              <div className="mt-8">
                <h3 className="font-heading text-base font-semibold">{benefit.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{benefit.text}</p>
              </div>
            </motion.article>
          );
        })}
      </section>

      <AnimatePresence>
        {requestOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setRequestOpen(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="competition-request-title"
              className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-start justify-between gap-5 border-b border-border px-5 py-5 md:px-6">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 size={19} />
                  </span>
                  <div>
                    <h2 id="competition-request-title" className="font-heading text-xl font-bold">Провести соревнование</h2>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">Расскажите о задаче — мы предложим формат и поможем с запуском.</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setRequestOpen(false)} aria-label="Закрыть форму">
                  <X size={17} />
                </Button>
              </div>

              <form className="space-y-4 px-5 py-5 md:px-6" onSubmit={submitRequest}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-medium">
                    <span>Компания или проект</span>
                    <Input required value={requestForm.company} onChange={(event) => setRequestForm({ ...requestForm, company: event.target.value })} placeholder="Название компании" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    <span>Ваше имя</span>
                    <Input required value={requestForm.name} onChange={(event) => setRequestForm({ ...requestForm, name: event.target.value })} placeholder="Как к вам обращаться" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-medium">
                    <span>Email или Telegram</span>
                    <Input required value={requestForm.contact} onChange={(event) => setRequestForm({ ...requestForm, contact: event.target.value })} placeholder="contact@company.ru" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    <span>Призовой фонд</span>
                    <Input value={requestForm.prize} onChange={(event) => setRequestForm({ ...requestForm, prize: event.target.value })} placeholder="Например, 300 000 ₽" />
                  </label>
                </div>
                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Кратко о задаче</span>
                  <Textarea required rows={4} value={requestForm.description} onChange={(event) => setRequestForm({ ...requestForm, description: event.target.value })} placeholder="Что нужно решить, для кого соревнование и какой результат вы ожидаете" />
                </label>
                <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setRequestOpen(false)}>Отмена</Button>
                  <Button type="submit"><Send size={15} /> Отправить заявку</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
