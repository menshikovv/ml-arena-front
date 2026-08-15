import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Database,
  Gauge,
  Layers3,
  Loader2,
  Mail,
  Network,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserRoundCheck,
  Users,
  Workflow,
} from "lucide-react";
import { api } from "@/api/mlArenaApi";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import ThemeToggle from "@/components/ml/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/AuthContext";

const RESULT_ITEMS = [
  { icon: Target, title: "Практическая ML-задача", text: "Превращаем прикладной кейс в постановку, данные, правила оценки и базовое решение для проверки корректности." },
  { icon: Users, title: "Целевая аудитория", text: "Привлекаем участников через профильные сообщества, университеты, каналы ML-Арены и каналы компании." },
  { icon: BarChart3, title: "Измеримые результаты", text: "Все работают с одной задачей, а результаты сравниваются по единой методике и скрытой части данных." },
  { icon: SearchCheck, title: "Проверка лучших решений", text: "Для финалистов можно запросить код, описание подхода и провести проверку воспроизводимости или онлайн-защиту." },
  { icon: UserRoundCheck, title: "ML-паспорта участников", text: "Компания видит подтверждённую историю результатов человека, а не только итог одного соревнования." },
  { icon: ClipboardCheck, title: "Список специалистов", text: "С согласия пользователей формируем список участников, подходящих по специализации и подтверждённым результатам." },
];

const PILOT_STEPS = [
  "Определяем задачу и цель",
  "Готовим данные, оценку и базовое решение",
  "Запускаем соревнование",
  "Получаем и оцениваем решения",
  "Проверяем лучших участников",
  "Передаём результаты и список специалистов",
];

const PASSPORT_ITEMS = [
  "Результаты по направлениям машинного обучения",
  "Место и процентиль относительно других участников",
  "Стабильность на открытой и скрытой части данных",
  "Количество независимых задач и свежесть результатов",
  "Проверка воспроизводимости сильных решений",
  "Внешние достижения с указанием источника и уровня проверки",
];

const EMPLOYER_QUESTIONS = [
  "В каких направлениях ML человек показывает сильные результаты?",
  "Это один удачный результат или стабильный уровень на нескольких задачах?",
  "Сохранился ли результат на скрытой части данных?",
  "Проходило ли решение дополнительную проверку или воспроизведение?",
  "Есть ли подтверждённые достижения на других ML-площадках?",
  "Открыт ли человек к стажировке или предложению о работе?",
];

const FORMATS = [
  { icon: Trophy, title: "Корпоративное ML-соревнование", text: "Для проверки практической задачи, привлечения ML-аудитории и сравнения участников в одинаковых условиях." },
  { icon: SearchCheck, title: "Поиск специалистов через задачу", text: "Когда главный результат — выявить кандидатов в конкретном направлении: рекомендации, временные ряды, CV и другие." },
  { icon: Layers3, title: "Серия задач и долгосрочная программа", text: "Для регулярного контакта с ML-аудиторией, нескольких направлений и накопления пула сильных специалистов." },
];

const COMPANY_NEEDS = ["Ответственный человек", "Бизнес-задача или направление", "Доменный эксперт", "Безопасные данные или описание доступных данных", "Критерии полезного результата", "Участие в оценке финалистов при необходимости"];
const ARENA_WORK = ["Проектирование формата и методология задачи", "Подготовка данных, правил оценки и базового решения", "Страница и техническое проведение соревнования", "Коммуникация и привлечение участников", "Итоговая аналитика", "Проверка лучших решений в согласованном объёме"];

const GOALS = [
  "Найти ML-специалистов",
  "Провести ML-соревнование",
  "Проверить прикладную задачу",
  "Развивать бренд работодателя среди ML-специалистов",
  "Другое",
];

const EMPTY_FORM = { name: "", company: "", email: "", role: "", goal: "", comment: "", consent: false, marketing: false, website: "" };

function scrollToForm() {
  const target = document.getElementById("cooperation-form");
  if (!target) return;
  const scroller = target.closest(".arena-app-main");
  if (scroller) {
    const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 24;
    scroller.scrollTo({ top, behavior: "smooth" });
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Cooperation({ embedded = false }) {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = `${window.location.origin}/contacts/cooperation`;
    canonical.dataset.cooperationCanonical = "true";
    document.head.appendChild(canonical);
    return () => canonical.remove();
  }, []);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError(false);
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Укажите имя — минимум 2 символа.";
    if (form.company.trim().length < 2) next.company = "Укажите название компании.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Укажите корректную рабочую почту.";
    if (!form.goal) next.goal = "Выберите задачу компании.";
    if (!form.consent) next.consent = "Нужно согласие на обработку персональных данных.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (form.website) {
      setSubmitted(true);
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(false);
    const params = new URLSearchParams(window.location.search);
    try {
      await api.cooperation.createLead({
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role.trim() || null,
        goal: form.goal,
        comment: form.comment.trim() || null,
        consent_privacy: true,
        consent_marketing: form.marketing,
        consent_document_version: "2026-08-14",
        source: {
          landing_path: window.location.pathname,
          referrer: document.referrer || null,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        },
      });
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground">
      {!embedded && <PublicHeader isAuthenticated={isAuthenticated} />}
      <main>
        <section className="relative overflow-hidden border-b border-border bg-card">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--primary)/.07)_1px,transparent_1px),linear-gradient(hsl(var(--primary)/.07)_1px,transparent_1px)] bg-[size:56px_56px] opacity-50" />
          <Reveal className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-20 xl:grid-cols-[1.12fr_.88fr] xl:items-center xl:py-24">
            <div>
              <h1 className="max-w-5xl font-heading text-4xl font-extrabold leading-[1.04] sm:text-5xl lg:text-6xl">Находите ML-специалистов по нашей системе ML-паспорта, а не только по резюме</h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">ML-Арена помогает компаниям проводить практические ML-соревнования, проверять участников на реальных задачах и находить сильных специалистов по измеримым результатам.</p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button type="button" size="lg" onClick={scrollToForm} className="h-12 px-6">Обсудить сотрудничество <ArrowRight size={17} /></Button>
                <p className="max-w-xl text-xs leading-5 text-muted-foreground">Можно прийти с готовой задачей или только с бизнес-проблемой — формат соревнования и способ оценки спроектируем вместе.</p>
              </div>
            </div>
            <div className="relative border border-border bg-background/90 p-5 shadow-xl shadow-primary/5 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2">
                {[{ icon: Building2, title: "Задача бизнеса" }, { icon: Workflow, title: "ML-соревнование" }, { icon: ShieldCheck, title: "Проверенные результаты" }, { icon: UserRoundCheck, title: "Сильные специалисты" }].map((item, index) => {
                  const Icon = item.icon;
                  return <div key={item.title} className="relative flex min-h-28 flex-col justify-between border border-border bg-card p-4"><span className="flex h-9 w-9 items-center justify-center bg-primary/10 text-primary"><Icon size={18} /></span><div className="mt-5 flex items-end justify-between gap-3"><span className="font-heading text-sm font-bold">{item.title}</span><span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span></div></div>;
                })}
              </div>
              <div className="mt-4 flex items-center gap-3 border-l-2 border-primary bg-primary/[0.045] px-4 py-3 text-xs leading-5 text-muted-foreground"><Network size={17} className="shrink-0 text-primary" />Одна цепочка: от прикладной задачи до списка подходящих специалистов.</div>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <Reveal><h2 className="max-w-5xl font-heading text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">Резюме показывает опыт. Практическая задача показывает, как человек работает с ML.</h2><p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">По резюме сложно сравнить кандидатов с похожим стеком. Практическая задача ставит участников в одинаковые условия и позволяет увидеть результат на одной шкале.</p></Reveal>
          <div className="mt-10 grid border border-border lg:grid-cols-2">
            <Reveal className="border-b border-border bg-secondary/25 p-6 lg:border-b-0 lg:border-r md:p-8">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center bg-card text-muted-foreground shadow-sm"><BriefcaseBusiness size={19} /></span><h3 className="font-heading text-xl font-bold">Что написано в резюме</h3></div>
              <div className="mt-8 grid grid-cols-2 gap-px bg-border">{["Стек технологий", "Роль в команде", "Опыт в годах", "Описание проектов"].map((item) => <div key={item} className="bg-card px-4 py-5 text-sm font-semibold">{item}</div>)}</div>
            </Reveal>
            <Reveal delay={0.08} className="bg-card p-6 md:p-8">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center bg-primary text-primary-foreground shadow-sm"><Gauge size={19} /></span><h3 className="font-heading text-xl font-bold">Что подтверждается на практике</h3></div>
              <ul className="mt-7 space-y-4">{["Одинаковая постановка для всех участников", "Единая метрика оценки", "Скрытая часть данных для итоговой проверки", "Дополнительная проверка лучших решений"].map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-6"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" /><span>{item}</span></li>)}</ul>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-border bg-secondary/25">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
            <Reveal><h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Что получает компания</h2><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Не набор функций платформы, а готовый путь от бизнес-задачи до измеримых результатов и подходящих специалистов.</p></Reveal>
            <Stagger className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{RESULT_ITEMS.map((item) => { const Icon = item.icon; return <StaggerItem key={item.title} className="h-full"><article className="flex h-full min-h-64 flex-col border border-border bg-card p-6 shadow-sm"><span className="flex h-11 w-11 items-center justify-center bg-primary/10 text-primary"><Icon size={20} /></span><h3 className="mt-8 font-heading text-xl font-bold">{item.title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p></article></StaggerItem>; })}</Stagger>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <Reveal className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Как проходит пилот</h2><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Компании не нужно самостоятельно придумывать механику конкурса и собирать все части проекта.</p></div><p className="max-w-md border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">Ориентир для полноценного корпоративного пилота — 8–10 недель. График зависит от готовности данных и сложности задачи.</p></Reveal>
          <Stagger className="relative mt-12 grid gap-3 md:grid-cols-2 xl:grid-cols-6"><div className="absolute left-8 right-8 top-5 hidden h-px bg-border xl:block" />{PILOT_STEPS.map((step, index) => <StaggerItem key={step} className="relative"><div className="grid h-full grid-cols-[42px_1fr] gap-3 border border-border bg-card p-4 xl:block xl:min-h-48"><span className="relative z-[1] flex h-10 w-10 items-center justify-center bg-primary font-mono text-xs font-bold text-primary-foreground">0{index + 1}</span><p className="self-center font-heading text-sm font-bold leading-6 xl:mt-10">{step}</p></div></StaggerItem>)}</Stagger>
        </section>

        <section className="overflow-hidden border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 xl:grid-cols-[.92fr_1.08fr] xl:items-center">
            <Reveal><h2 className="font-heading text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">Соревнование заканчивается. Выгода для компании только начинается.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">ML-паспорт собирает результаты человека по разным задачам и направлениям. Так виден не один удачный результат, а история навыков на дистанции.</p><ul className="mt-8 grid gap-3 sm:grid-cols-2">{PASSPORT_ITEMS.map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"><Check size={16} className="mt-1 shrink-0 text-primary" /><span>{item}</span></li>)}</ul></Reveal>
            <Reveal delay={0.08} className="border border-border bg-background p-5 shadow-xl shadow-primary/5 sm:p-7">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground"><UserRoundCheck size={20} /></span><div><p className="font-heading text-lg font-bold">ML-паспорт специалиста</p><p className="mt-1 text-xs text-muted-foreground">Подтверждённая история результатов</p></div></div><span className="border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Проверено</span></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">{[{ icon: Database, text: "Несколько задач" }, { icon: ShieldCheck, text: "Скрытая проверка" }, { icon: Code2, text: "Воспроизводимость" }].map((item) => { const Icon = item.icon; return <div key={item.text} className="border border-border bg-card p-4"><Icon size={18} className="text-primary" /><p className="mt-4 text-xs font-bold">{item.text}</p></div>; })}</div>
              <div className="mt-5 grid gap-px overflow-hidden border border-border bg-border">{["Классификация", "Временные ряды", "Рекомендательные системы"].map((label) => <div key={label} className="flex items-center justify-between gap-4 bg-card px-4 py-3 text-xs"><span className="font-semibold">{label}</span><span className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle2 size={14} className="text-emerald-500" /> подтверждено</span></div>)}</div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <Reveal><h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Не просто место в одном соревновании</h2><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">ML-паспорт помогает отвечать на прикладные вопросы о кандидате до следующего этапа отбора.</p></Reveal>
          <Stagger className="mt-10 grid border-l border-t border-border md:grid-cols-2 xl:grid-cols-3">{EMPLOYER_QUESTIONS.map((question, index) => <StaggerItem key={question} className="min-h-40 border-b border-r border-border bg-card p-5"><div className="flex items-start justify-between gap-5"><p className="max-w-sm font-heading text-base font-bold leading-6">{question}</p><span className="font-mono text-[10px] text-primary">0{index + 1}</span></div></StaggerItem>)}</Stagger>
        </section>

        <section className="border-y border-border bg-secondary/25">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
            <Reveal><h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Форматы сотрудничества</h2></Reveal>
            <Stagger className="mt-10 grid gap-4 lg:grid-cols-3">{FORMATS.map((item) => { const Icon = item.icon; return <StaggerItem key={item.title} className="h-full"><article className="flex h-full min-h-64 flex-col border border-border bg-card p-6"><Icon size={22} className="text-primary" /><h3 className="mt-9 font-heading text-xl font-bold">{item.title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p></article></StaggerItem>; })}</Stagger>
            <p className="mt-7 max-w-3xl border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">Формат и объём проекта подбираются под задачу компании. Если вы пока не знаете, какой формат нужен, это нормально — начнём с короткого обсуждения цели.</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <Reveal><h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Кто за что отвечает</h2><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Разделяем зоны ответственности заранее, чтобы пилот не превращался в дополнительный проект для команды компании.</p></Reveal>
          <div className="mt-10 grid border border-border lg:grid-cols-2">
            <Responsibility icon={Building2} title="От компании" items={COMPANY_NEEDS} />
            <Responsibility icon={Sparkles} title="От ML-Арены" items={ARENA_WORK} primary />
          </div>
        </section>

        <section className="bg-primary text-primary-foreground">
          <Reveal className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:py-16"><div><h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Открыты к пилотным проектам с компаниями</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-primary-foreground/75 sm:text-base">Сейчас ML-Арена формирует первые корпоративные кейсы и готова запускать ограниченное число пилотов. Для каждого проекта вместе фиксируем задачу, критерии результата, сроки и объём работ.</p></div><Button type="button" size="lg" variant="secondary" className="h-12 shrink-0" onClick={scrollToForm}>Обсудить пилот <ArrowRight size={17} /></Button></Reveal>
        </section>

        <section id="cooperation-form" className="scroll-mt-6 bg-background">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 xl:grid-cols-[.75fr_1.25fr]">
            <Reveal><h2 className="font-heading text-3xl font-extrabold sm:text-4xl">Обсудить сотрудничество</h2><p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">Расскажите в двух словах, какую задачу хотите решить. Мы свяжемся с вами по указанной почте и предложим следующий шаг.</p><div className="mt-8 flex items-start gap-3 border-l-2 border-primary bg-secondary/30 p-4 text-sm leading-6 text-muted-foreground"><Mail size={18} className="mt-0.5 shrink-0 text-primary" />Стоимость и объём проекта обсуждаются после знакомства с задачей компании.</div></Reveal>
            <Reveal delay={0.08}>
              {submitted ? (
                <div className="flex min-h-96 flex-col items-center justify-center border border-emerald-500/20 bg-emerald-500/[0.05] p-8 text-center"><span className="flex h-14 w-14 items-center justify-center bg-emerald-500 text-white"><CheckCircle2 size={25} /></span><h3 className="mt-6 font-heading text-2xl font-extrabold">Спасибо! Заявка получена.</h3><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Мы свяжемся с вами по указанной почте.</p><Button type="button" variant="outline" className="mt-7" onClick={() => setSubmitted(false)}>Отправить ещё одну заявку</Button></div>
              ) : (
                <form onSubmit={submit} noValidate className="border border-border bg-card shadow-sm">
                  <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                    <CooperationField id="cooperation-name" label="Имя" error={errors.name}><Input id="cooperation-name" value={form.name} onChange={(event) => update("name", event.target.value)} minLength={2} maxLength={80} autoComplete="name" className="h-11 bg-secondary/20" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "cooperation-name-error" : undefined} /></CooperationField>
                    <CooperationField id="cooperation-company" label="Компания" error={errors.company}><Input id="cooperation-company" value={form.company} onChange={(event) => update("company", event.target.value)} minLength={2} maxLength={160} autoComplete="organization" className="h-11 bg-secondary/20" aria-invalid={Boolean(errors.company)} aria-describedby={errors.company ? "cooperation-company-error" : undefined} /></CooperationField>
                    <CooperationField id="cooperation-email" label="Рабочая почта" error={errors.email}><Input id="cooperation-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} maxLength={254} autoComplete="email" placeholder="name@company.ru" className="h-11 bg-secondary/20" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "cooperation-email-error" : undefined} /></CooperationField>
                    <CooperationField id="cooperation-role" label="Роль"><Input id="cooperation-role" value={form.role} onChange={(event) => update("role", event.target.value)} maxLength={120} autoComplete="organization-title" placeholder="Руководитель ML, HR, инновации" className="h-11 bg-secondary/20" /></CooperationField>
                    <CooperationField id="cooperation-goal" label="Что хотите решить?" error={errors.goal} className="sm:col-span-2"><select id="cooperation-goal" value={form.goal} onChange={(event) => update("goal", event.target.value)} className="h-11 w-full rounded-md border border-input bg-secondary/20 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20" aria-invalid={Boolean(errors.goal)} aria-describedby={errors.goal ? "cooperation-goal-error" : undefined}><option value="">Выберите задачу</option>{GOALS.map((goal) => <option key={goal} value={goal}>{goal}</option>)}</select></CooperationField>
                    <CooperationField id="cooperation-comment" label="Комментарий" className="sm:col-span-2"><Textarea id="cooperation-comment" value={form.comment} onChange={(event) => update("comment", event.target.value)} maxLength={2000} rows={5} placeholder="Коротко опишите задачу, направление или ожидаемый результат" className="resize-none bg-secondary/20" /><span className="mt-1 block text-right text-[11px] tabular-nums text-muted-foreground">{form.comment.length}/2000</span></CooperationField>
                    <input type="text" value={form.website} onChange={(event) => update("website", event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                    <div className="space-y-3 sm:col-span-2">
                      <Consent checked={form.consent} onChange={(value) => update("consent", value)} error={errors.consent}>Я даю согласие на обработку персональных данных в соответствии с <Link to="/privacy" className="font-semibold text-primary hover:underline">политикой обработки данных</Link>.</Consent>
                      <Consent checked={form.marketing} onChange={(value) => update("marketing", value)} muted>Хочу получать новости о корпоративных форматах и проектах ML-Арены.</Consent>
                    </div>
                  </div>
                  {submitError && <div role="alert" className="border-t border-destructive/20 bg-destructive/5 px-5 py-4 text-sm leading-6 text-destructive sm:px-7">Не удалось отправить заявку. Попробуйте ещё раз или напишите нам на <a href="mailto:support@mlarena.ru?subject=Сотрудничество с ML-Ареной" className="font-semibold underline">support@mlarena.ru</a>.</div>}
                  <div className="flex flex-col justify-between gap-4 border-t border-border bg-secondary/20 px-5 py-4 sm:flex-row sm:items-center sm:px-7"><p className="text-xs leading-5 text-muted-foreground">Имя, компания, рабочая почта, задача и согласие обязательны.</p><Button type="submit" disabled={submitting} className="h-11 sm:min-w-44">{submitting ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />} Отправить заявку</Button></div>
                </form>
              )}
            </Reveal>
          </div>
        </section>
      </main>
    </div>
  );
}

function Responsibility({ icon: Icon, title, items, primary = false }) {
  return <Reveal className={`p-6 md:p-8 ${primary ? "bg-primary text-primary-foreground" : "border-b border-border bg-card lg:border-b-0 lg:border-r"}`}><span className={`flex h-11 w-11 items-center justify-center ${primary ? "bg-primary-foreground/10 text-primary-foreground" : "bg-primary/10 text-primary"}`}><Icon size={20} /></span><h3 className="mt-7 font-heading text-2xl font-bold">{title}</h3><ul className="mt-6 space-y-3">{items.map((item) => <li key={item} className={`flex items-start gap-3 text-sm leading-6 ${primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}><Check size={16} className={`mt-1 shrink-0 ${primary ? "text-primary-foreground" : "text-primary"}`} /><span>{item}</span></li>)}</ul></Reveal>;
}

function CooperationField({ id, label, error, className = "", children }) {
  return <div className={`space-y-2 ${className}`}><Label htmlFor={id}>{label}</Label>{children}{error && <p id={`${id}-error`} className="text-xs text-destructive">{error}</p>}</div>;
}

function Consent({ checked, onChange, error, muted = false, children }) {
  return <div><label className={`flex cursor-pointer items-start gap-3 border p-3 text-sm leading-6 transition-colors ${checked ? "border-primary/25 bg-primary/[0.045]" : "border-border bg-secondary/20 hover:border-primary/20"} ${muted ? "text-muted-foreground" : "text-foreground"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" /><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}>{checked && <Check size={14} strokeWidth={3} />}</span><span>{children}</span></label>{error && <p className="mt-2 text-xs text-destructive">{error}</p>}</div>;
}

function PublicHeader({ isAuthenticated }) {
  return <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"><Link to="/" className="flex items-center gap-2.5"><img src="/logo.svg" alt="" className="h-8 w-8 object-contain" /><span className="font-heading text-lg font-bold">ML-Арена</span></Link><div className="flex items-center gap-2"><ThemeToggle /><Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/contacts">Контакты</Link></Button><Button asChild><Link to={isAuthenticated ? "/profile" : "/login"}>{isAuthenticated ? "Профиль" : "Войти"}</Link></Button></div></div></header>;
}
