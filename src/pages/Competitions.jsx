import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpDown,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  Filter,
  History,
  Layers3,
  Loader2,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { api } from "@/api/mlArenaApi";
import CompetitionCard from "@/components/ml/CompetitionCard";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { COMMUNITY_COMPETITIONS, TASK_TYPE_LABELS } from "@/lib/ml-arena";
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
  c9: { difficulty: "Высокая", access: "Открыто", domain: "Здравоохранение" },
  c10: { difficulty: "Экспертная", access: "По приглашению", domain: "Беспилотники" },
};

const COMMUNITY_META = {
  "community-churn": { difficulty: "Средняя", access: "Открыто", domain: "Продукты" },
  "community-demand": { difficulty: "Лёгкая", access: "По заявке", domain: "Транспорт" },
  "community-ranking": { difficulty: "Высокая", access: "По приглашению", domain: "EdTech" },
};

const USER_STATES = {
  c1: { joined: true, rank: 17, score: "2.0731", attemptsLeft: 2 },
  c2: { joined: true, attemptsLeft: 5 },
  c6: { joined: true, rank: 12, score: "98.71%" },
  "community-churn": { joined: true, rank: 9, score: "0.8842", attemptsLeft: 3 },
};

const FAIRNESS = [
  { icon: ShieldCheck, title: "Равные лимиты", text: "В рейтинговых соревнованиях число попыток одинаково для всех. Premium не даёт преимущества." },
  { icon: Trophy, title: "Итог определяет Private оценка", text: "Во время события виден Public результат, а места фиксируются после финального пересчёта." },
  { icon: CheckCircle2, title: "CSV и воспроизводимость", text: "Участники отправляют CSV. Код лучших официальных решений может проверяться после финала." },
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
  if (competition.status === "active" && competition.deadline && new Date(competition.deadline).getTime() < Date.now()) return "finalizing";
  return "active";
}

function enrichOfficial(competition, index) {
  return {
    ...competition,
    origin: competition.origin || (index % 3 === 1 ? "official_partner" : "official_platform"),
    rated: competition.rated !== false,
    access_type: competition.is_private ? "invite_only" : "open",
    passport_evidence_level: "arena_verified",
  };
}

export default function Competitions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get("section") === "community" ? "community" : "official";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [typeFilter, setTypeFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
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

  const { data: competitionsResponse, isLoading } = useQuery({
    queryKey: ["competitions", section],
    queryFn: () => api.competitions.list({ limit: 50, offset: 0, origin: section === "community" ? "community" : "official" }),
  });
  const serverCompetitions = Array.isArray(competitionsResponse) ? competitionsResponse : competitionsResponse?.data || competitionsResponse?.items || [];

  const competitions = useMemo(
    () => section === "community" ? (serverCompetitions.length ? serverCompetitions : COMMUNITY_COMPETITIONS) : serverCompetitions.map(enrichOfficial),
    [section, serverCompetitions],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...competitions]
      .filter((competition) => {
        const status = getStatus(competition);
        const statusMatches = statusFilter === "finished" ? ["finished", "finalizing"].includes(status) : status === statusFilter;
        const searchMatches = !query
          || competition.title.toLowerCase().includes(query)
          || competition.description.toLowerCase().includes(query)
          || competition.company_name?.toLowerCase().includes(query);
        const typeMatches = typeFilter === "all" || competition.task_type === typeFilter;
        const accessMatches = accessFilter === "all" || competition.access_type === accessFilter;
        return statusMatches && searchMatches && typeMatches && accessMatches;
      })
      .sort((a, b) => {
        if (sort === "participants") return (b.participants_count || 0) - (a.participants_count || 0);
        if (sort === "newest") return String(b.id).localeCompare(String(a.id));
        return new Date(a.deadline || "2100-01-01") - new Date(b.deadline || "2100-01-01");
      });
  }, [accessFilter, competitions, search, sort, statusFilter, typeFilter]);

  const switchSection = (value) => {
    setSearchParams(value === "community" ? { section: "community" } : {});
    setSearch("");
    setStatusFilter("active");
    setTypeFilter("all");
    setAccessFilter("all");
    setSort("deadline");
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setAccessFilter("all");
    setSort("deadline");
  };

  const requestMutation = useMutation({
    mutationFn: () => api.cooperation.createLead({
      name: requestForm.name.trim(),
      company: requestForm.company.trim(),
      email: requestForm.contact.trim().toLowerCase(),
      role: null,
      goal: "competition",
      comment: `${requestForm.description.trim()}${requestForm.prize.trim() ? `\nПризовой фонд: ${requestForm.prize.trim()}` : ""}`,
      consent_privacy: true,
      consent_marketing: false,
    }),
    onSuccess: () => {
      toast.success("Заявка отправлена команде ML-Арены");
      setRequestOpen(false);
      setRequestForm({ company: "", name: "", contact: "", prize: "", description: "" });
    },
    onError: (error) => toast.error(error.message || "Не удалось отправить заявку"),
  });

  const submitRequest = (event) => {
    event.preventDefault();
    requestMutation.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-6 md:px-6 lg:px-8 lg:py-10">
      <Reveal delay={0.04}>
        <section className="grid gap-px border border-border bg-border md:grid-cols-2">
          {[
            {
              id: "official",
              icon: ShieldCheck,
              title: "Главные",
              text: "Официальные соревнования ML-Арены и партнёров: рейтинговые очки, призы и проверка лучших решений.",
            },
            {
              id: "community",
              icon: CircleUserRound,
              title: "Сообщество",
              text: "Соревнования участников: практика, собственные задачи и отдельная история без сезонных рейтинговых очков.",
            },
          ].map((item) => {
            const active = section === item.id;
            return (
              <button key={item.id} type="button" onClick={() => switchSection(item.id)} className={cn("group flex min-h-32 items-start gap-4 bg-card p-5 text-left transition-colors sm:p-6", active ? "bg-primary text-primary-foreground" : "hover:bg-secondary/45")}>
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center border", active ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-primary/15 bg-primary/10 text-primary")}><item.icon size={21} /></span>
                <span><span className="font-heading text-xl font-extrabold">{item.title}</span><span className={cn("mt-2 block text-sm leading-6", active ? "text-primary-foreground/75" : "text-muted-foreground")}>{item.text}</span></span>
              </button>
            );
          })}
        </section>
      </Reveal>

      <section className="mt-7">
        <div className="flex flex-col justify-between gap-4 border-b border-border md:flex-row md:items-end">
          <div className="flex gap-1 overflow-x-auto">
            {[
              ["active", "Активные", Zap],
              ["upcoming", "Скоро", CalendarClock],
              ["finished", "Завершённые", History],
            ].map(([value, label, Icon]) => (
              <button key={value} type="button" onClick={() => setStatusFilter(value)} className={cn("relative flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-semibold text-muted-foreground hover:text-primary", statusFilter === value && "text-primary")}>
                <Icon size={16} />{label}
                {statusFilter === value && <motion.span layoutId="competition-status" className="absolute inset-x-2 bottom-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
          {section === "community" ? (
            <Button asChild className="mb-2 self-start md:self-auto"><Link to="/competitions/community/create"><Plus size={16} /> Создать соревнование</Link></Button>
          ) : (
            <Button variant="outline" className="mb-2 self-start md:self-auto" onClick={() => setRequestOpen(true)}><Building2 size={16} /> Провести с ML-Ареной</Button>
          )}
        </div>

        <div className={cn("mt-5 grid gap-3", section === "community" ? "lg:grid-cols-[minmax(260px,1fr)_190px_190px_190px]" : "lg:grid-cols-[minmax(260px,1fr)_220px_210px]")}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Название, задача или организатор" className="h-11 pl-10" />
          </div>
          <SelectControl icon={Layers3} label="Направление" value={typeFilter} onChange={setTypeFilter}>
            <option value="all">Все направления</option>
            {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </SelectControl>
          {section === "community" && (
            <SelectControl icon={Users} label="Доступ" value={accessFilter} onChange={setAccessFilter}>
              <option value="all">Любой доступ</option>
              <option value="open">Открыто</option>
              <option value="application">По заявке</option>
              <option value="invite_only">По приглашению</option>
            </SelectControl>
          )}
          <SelectControl icon={ArrowUpDown} label="Сортировка" value={sort} onChange={setSort}>
            <option value="deadline">Ближайший дедлайн</option>
            <option value="participants">По участникам</option>
            <option value="newest">Сначала новые</option>
          </SelectControl>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-extrabold md:text-3xl">{section === "community" ? "Задачи сообщества" : "События сезона"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{filtered.length} {pluralize(filtered.length, "соревнование", "соревнования", "соревнований")}</p>
          </div>
          {(search || typeFilter !== "all" || accessFilter !== "all" || sort !== "deadline") && <button type="button" onClick={clearFilters} className="text-xs font-semibold text-primary hover:underline">Сбросить фильтры</button>}
        </div>

        {isLoading && section === "official" ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" size={26} /></div>
        ) : filtered.length ? (
          <Stagger className="mt-6 space-y-5" delay={0.05}>
            {filtered.map((competition, index) => (
              <StaggerItem key={competition.id}>
                <CompetitionCard
                  competition={competition}
                  status={getStatus(competition)}
                  meta={(section === "community" ? COMMUNITY_META : COMPETITION_META)[competition.id] || { difficulty: "Средняя", access: "Открыто", domain: "Другое" }}
                  userState={USER_STATES[competition.id]}
                  featured={section === "official" && index === 0}
                  sequence={index + 1}
                />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="mt-6 border-y border-dashed border-border py-16 text-center">
            <Filter className="mx-auto text-muted-foreground" size={28} />
            <h2 className="mt-4 font-heading text-xl font-extrabold">По этим условиям ничего не найдено</h2>
            <p className="mt-2 text-sm text-muted-foreground">Измените фильтры или откройте соревнования в другой стадии.</p>
            <Button variant="outline" className="mt-5" onClick={clearFilters}>Сбросить фильтры</Button>
          </div>
        )}
      </section>

      <Reveal className="mt-12" delay={0.08}>
        <section className="grid gap-px border border-border bg-border md:grid-cols-3">
          {FAIRNESS.map((item) => (
            <article key={item.title} className="bg-card p-6">
              <item.icon size={21} className="text-primary" />
              <h3 className="mt-5 font-heading text-lg font-extrabold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </section>
      </Reveal>

      <AnimatePresence>
        {requestOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setRequestOpen(false); }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="competition-request-title" className="w-full max-w-xl overflow-hidden border border-border bg-card shadow-2xl" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}>
              <div className="flex items-start justify-between gap-5 border-b border-border px-5 py-5 md:px-6">
                <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 text-primary"><Building2 size={19} /></span><div><h2 id="competition-request-title" className="font-heading text-xl font-extrabold">Провести соревнование с ML-Ареной</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Расскажите о задаче, и команда свяжется с вами.</p></div></div>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setRequestOpen(false)} aria-label="Закрыть форму"><X size={17} /></Button>
              </div>
              <form className="space-y-4 px-5 py-5 md:px-6" onSubmit={submitRequest}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Компания или проект"><Input required value={requestForm.company} onChange={(event) => setRequestForm({ ...requestForm, company: event.target.value })} placeholder="Название компании" /></Field>
                  <Field label="Ваше имя"><Input required value={requestForm.name} onChange={(event) => setRequestForm({ ...requestForm, name: event.target.value })} placeholder="Как к вам обращаться" /></Field>
                  <Field label="Email"><Input required type="email" value={requestForm.contact} onChange={(event) => setRequestForm({ ...requestForm, contact: event.target.value })} placeholder="contact@company.ru" /></Field>
                  <Field label="Призовой фонд"><Input value={requestForm.prize} onChange={(event) => setRequestForm({ ...requestForm, prize: event.target.value })} placeholder="Например, 300 000 ₽" /></Field>
                </div>
                <Field label="Кратко о задаче"><Textarea required rows={4} value={requestForm.description} onChange={(event) => setRequestForm({ ...requestForm, description: event.target.value })} placeholder="Что нужно решить и какой результат вы ожидаете" /></Field>
                <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setRequestOpen(false)}>Отмена</Button><Button type="submit" disabled={requestMutation.isPending}>{requestMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Отправить заявку</Button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SelectControl({ icon: Icon, label, value, onChange, children }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none border border-input bg-card pl-10 pr-9 text-sm" aria-label={label}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block space-y-1.5 text-sm font-semibold"><span>{label}</span>{children}</label>;
}
