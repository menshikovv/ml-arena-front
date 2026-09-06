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
import { PageFrame, PageHeader } from "@/components/ml/PageFrame";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TASK_TYPE_LABELS } from "@/lib/ml-arena";
import { cn } from "@/lib/utils";

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
  if (["completed", "finished", "archived"].includes(competition.status)) return "finished";
  if (["scheduled", "approved_scheduled"].includes(competition.status)) return "upcoming";
  return competition.status;
}

const ACCESS_LABELS = {
  open: "Открыто",
  application: "По заявке",
  invite_only: "По приглашению",
  partner: "Партнёрское",
  premium: "Premium",
};

function getCardMeta(competition) {
  const access = competition.access;
  return {
    difficulty: competition.difficulty || "Не указана",
    access: ACCESS_LABELS[access] || access || "Не указан",
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
  const [requestForm, setRequestForm] = useState({ company: "", name: "", contact: "", description: "" });

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

  const competitions = serverCompetitions;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...competitions]
      .filter((competition) => {
        const status = getStatus(competition);
        const statusMatches = statusFilter === "finished" ? ["finished", "finalizing"].includes(status) : status === statusFilter;
        const searchMatches = !query
          || String(competition.title || "").toLowerCase().includes(query)
          || String(competition.description || "").toLowerCase().includes(query)
          || competition.company_name?.toLowerCase().includes(query);
        const typeMatches = typeFilter === "all" || competition.task_type === typeFilter;
        const accessMatches = accessFilter === "all" || competition.access === accessFilter;
        return statusMatches && searchMatches && typeMatches && accessMatches;
      })
      .sort((a, b) => {
        if (sort === "participants") return (b.participants_count || 0) - (a.participants_count || 0);
        if (sort === "newest") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        return (a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY) - (b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY);
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
      comment: requestForm.description.trim(),
      consent_privacy: true,
      consent_marketing: false,
    }),
    onSuccess: () => {
      toast.success("Заявка отправлена команде ML-Арены");
      setRequestOpen(false);
      setRequestForm({ company: "", name: "", contact: "", description: "" });
    },
    onError: (error) => toast.error(error.message || "Не удалось отправить заявку"),
  });

  const submitRequest = (event) => {
    event.preventDefault();
    requestMutation.mutate();
  };

  return (
    <PageFrame>
      <Reveal>
        <PageHeader
          title="Соревнования"
          description="Практические ML-задачи от ML-Арены, партнёров и сообщества. Выбирайте направление, отправляйте решение и сохраняйте результат в ML-паспорте."
        />
      </Reveal>
      <Reveal delay={0.04}>
        <section className="mt-7 grid gap-px border border-border bg-border md:grid-cols-2">
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

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" size={26} /></div>
        ) : filtered.length ? (
          <Stagger className="mt-6 space-y-5" delay={0.05}>
            {filtered.map((competition, index) => (
              <StaggerItem key={competition.id}>
                <CompetitionCard
                  competition={competition}
                  status={getStatus(competition)}
                  meta={getCardMeta(competition)}
                  featured={section === "official" && index === 0}
                  sequence={index + 1}
                />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="mt-6 border-y border-dashed border-border py-16 text-center">
            <Filter className="mx-auto text-muted-foreground" size={28} />
            <h2 className="mt-4 font-heading text-xl font-extrabold">{section === "community" ? "В сообществе пока нет соревнований" : "По этим условиям ничего не найдено"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{section === "community" ? "Новые соревнования появятся здесь после публикации организатором." : "Измените фильтры или откройте соревнования в другой стадии."}</p>
            {section === "community" ? <Button asChild className="mt-5"><Link to="/competitions/community/create"><Plus size={16} /> Создать соревнование</Link></Button> : <Button variant="outline" className="mt-5" onClick={clearFilters}>Сбросить фильтры</Button>}
          </div>
        )}
      </section>

      <Reveal className="mt-12" delay={0.08}>
        <section className="grid gap-8 border-t border-border py-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          <div><h2 className="mt-3 font-heading text-2xl font-extrabold">Сильнее решение.<br />Выше результат.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">Одинаковые возможности для участников на каждом этапе соревнования.</p></div>
          <div className="divide-y divide-border">{FAIRNESS.map((item, index) => <article key={item.title} className="flex gap-5 py-5 first:pt-0 last:pb-0"><span aria-hidden="true" className="pt-1 font-mono text-sm text-primary/60">0{index + 1}</span><div><h3 className="font-heading text-base font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></div></article>)}</div>
        </section>
      </Reveal>

      <AnimatePresence>
        {requestOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setRequestOpen(false); }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="competition-request-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-card shadow-2xl" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}>
              <div className="flex items-start justify-between gap-5 border-b border-border bg-secondary/40 px-5 py-6 sm:px-8 sm:py-8">
                <div><h2 id="competition-request-title" className="font-heading text-2xl font-extrabold leading-snug">Провести соревнование с ML-Ареной</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Расскажите о задаче, и команда свяжется с вами.</p></div>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setRequestOpen(false)} aria-label="Закрыть форму"><X size={17} /></Button>
              </div>
              <form className="space-y-6 px-5 py-6 sm:px-8 sm:py-7 [&_input]:h-11 [&_input]:rounded-md [&_input]:bg-secondary/20 [&_input]:font-normal [&_input]:shadow-none" onSubmit={submitRequest}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Компания или проект"><Input required value={requestForm.company} onChange={(event) => setRequestForm({ ...requestForm, company: event.target.value })} placeholder="Название компании" /></Field>
                  <Field label="Ваше имя"><Input required value={requestForm.name} onChange={(event) => setRequestForm({ ...requestForm, name: event.target.value })} placeholder="Как к вам обращаться" /></Field>
                </div>
                <Field label="Email для связи"><Input required type="email" autoComplete="email" value={requestForm.contact} onChange={(event) => setRequestForm({ ...requestForm, contact: event.target.value })} placeholder="contact@company.ru" /></Field>
                <Field label="Кратко о задаче"><Textarea required rows={5} className="min-h-32 resize-y rounded-md bg-secondary/20 p-3 font-normal leading-6 shadow-none" value={requestForm.description} onChange={(event) => setRequestForm({ ...requestForm, description: event.target.value })} placeholder="Что нужно решить и какой результат вы ожидаете" /></Field>
                <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={() => setRequestOpen(false)}>Отмена</Button><Button type="submit" className="min-h-11 px-6" disabled={requestMutation.isPending}>{requestMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Отправить заявку</Button></div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageFrame>
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
