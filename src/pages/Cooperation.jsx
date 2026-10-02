import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Gauge,
  Layers3,
  Loader2,
  Mail,
  SearchCheck,
  Sparkles,
  Target,
  Trophy,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { api } from "@/api/mlArenaApi";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import ThemeToggle from "@/components/ml/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/AuthContext";
import "./Cooperation.css";

const RESULT_ITEMS = [
  { icon: Target, title: "Практическая ML-задача", text: "Реальные навыки вместо только теоретических знаний." },
  { icon: Users, title: "Целевая аудитория", text: "Специалисты, которым действительно интересна работа с ML." },
  { icon: BarChart3, title: "Измеримые результаты", text: "Единая задача и объективная методика оценки." },
  { icon: SearchCheck, title: "Проверка лучших решений", text: "Код, подход и воспроизводимость решений финалистов." },
  { icon: UserRoundCheck, title: "ML-паспорт участника", text: "Подтверждённые результаты по задачам и направлениям." },
  { icon: ClipboardCheck, title: "Список специалистов", text: "Кандидаты под ваши требования, с их согласия." },
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
  "В ваших соревнованиях может участвовать несколько команд",
  "Эти специалисты доступны и для будущих поисков в компании",
  "Сохраняем все результаты в ML-паспорте",
  "Формируем пул кандидатов по направлениям",
  "Есть настраиваемые условия и формат участия",
  "Отчёты и аналитика остаются после завершения",
];

const FORMATS = [
  { icon: Trophy, title: "Корпоративное ML-соревнование", text: "Для решения конкретной задачи среди проверенных специалистов." },
  { icon: SearchCheck, title: "Поиск специалистов через задачу", text: "Задача, специально под вашу тематику и данные." },
  { icon: Layers3, title: "Серия задач длительного отбора", text: "Для регулярного поиска по ключевым направлениям." },
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
    canonical.href = `${window.location.origin}/companies`;
    canonical.dataset.cooperationCanonical = "true";
    document.head.appendChild(canonical);
    return () => canonical.remove();
  }, []);

  useEffect(() => {
    if (window.location.hash !== "#cooperation-form") return;
    const timer = window.setTimeout(scrollToForm, 80);
    return () => window.clearTimeout(timer);
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
    <div className="companies-page min-h-full bg-background text-foreground">
      {!embedded && <PublicHeader isAuthenticated={isAuthenticated} />}
      <main>
        <section className="companies-hero">
          <div className="companies-container companies-hero-inner">
            <Reveal viewportReveal className="companies-hero-copy">
              <h1 className="font-heading">Находите ML-специалистов по нашей системе ML-паспорта, а не только по резюме</h1>
              <p>ML-паспорт показывает практические результаты, задачи и исследовательские способности. Вы видите не только опыт из резюме, но и то, как кандидат работает с реальными результатами.</p>
              <Button type="button" onClick={scrollToForm} className="group companies-primary-button">Обсудить сотрудничество <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" /></Button>
            </Reveal>
            <div className="companies-hero-art" aria-hidden="true"><img src="/companies-hero.png" alt="" /></div>
          </div>
        </section>

        <section className="companies-section companies-container companies-comparison">
          <Reveal viewportReveal><h2 className="companies-heading font-heading">Резюме показывает опыт.<br />Практическая задача показывает,<br className="companies-desktop-break" /> как человек работает с ML.</h2></Reveal>
          <div className="companies-comparison-grid">
            <Reveal className="companies-panel companies-resume">
              <h3 className="companies-card-heading font-heading"><span className="companies-icon"><Users size={20} /></span>Что включено в резюме</h3>
              <div className="companies-resume-table">{[["Опыт работы", "Python, PyTorch, NLP..."], ["Роль в команде", "ML Engineer / Data Scientist"], ["Опыт и навыки", "3–6 лет"], ["Описание проектов", "Краткие описания, ссылки"]].map(([label, value]) => <div className="companies-resume-row" key={label}><span>{label}</span><span>{value}</span></div>)}</div>
            </Reveal>
            <Reveal className="companies-panel companies-practice">
              <h3 className="companies-card-heading font-heading"><span className="companies-icon companies-icon-filled"><Gauge size={20} /></span>Что подтверждено на практике</h3>
              <ul>{["Решение технических задач с реальными данными", "Качество кода и анализа", "Способность предлагать и запускать решения", "Самостоятельное мышление и суждение"].map((item) => <li key={item}><Check size={15} /><span>{item}</span></li>)}</ul>
            </Reveal>
          </div>
        </section>

        <section className="companies-band companies-benefits">
          <div className="companies-container companies-section">
            <Reveal viewportReveal><h2 className="companies-heading font-heading">Что получает компания</h2><p className="companies-intro">Мы подбираем специалистов, начиная с доказанных результатов, а не только с резюме.</p></Reveal>
            <Stagger viewportReveal className="companies-benefit-grid">{RESULT_ITEMS.map((item) => { const Icon = item.icon; return <StaggerItem key={item.title} className="h-full"><article className="companies-benefit-card"><span className="companies-icon"><Icon size={20} /></span><div><h3 className="font-heading">{item.title}</h3><p>{item.text}</p></div></article></StaggerItem>; })}</Stagger>
          </div>
        </section>

        <section className="companies-section companies-container companies-pilot">
          <Reveal viewportReveal><h2 className="companies-heading font-heading">Как проходит пилот</h2><p className="companies-intro">Мы проводим короткое соревнование под вашу задачу и критерии. Организацию и методическую часть берём на себя.</p></Reveal>
          <Stagger viewportReveal className="companies-pilot-grid">{PILOT_STEPS.map((step, index) => <StaggerItem key={step}><div className="companies-pilot-card"><span className="companies-pilot-number">0{index + 1}</span><span className="companies-icon"><PilotIcon index={index} /></span><p className="font-heading">{step}</p></div></StaggerItem>)}</Stagger>
        </section>

        <section className="companies-band companies-passport-band">
          <div className="companies-container companies-section companies-passport-layout">
            <Reveal viewportReveal><h2 className="companies-heading font-heading">Соревнование заканчивается.<br />Выгода для компании только начинается.</h2><p className="companies-intro">ML-паспорт собирает результаты участника по разным задачам и направлениям. Так вы видите сильные стороны, динамику развития и подходящих кандидатов в одном отчёте.</p><ul className="companies-check-grid">{PASSPORT_ITEMS.map((item) => <li key={item}><Check size={15} /><span>{item}</span></li>)}</ul></Reveal>
            <Reveal viewportReveal delay={0.08} className="companies-passport-demo">
              <div className="companies-demo-header"><span className="companies-demo-avatar"><UserRoundCheck size={26} /></span><div><h3 className="font-heading">ML-паспорт специалиста</h3><p>Пример подтверждённых результатов</p></div><span className="companies-verified">Подходит</span></div>
              <div className="companies-demo-stats"><div><strong>12</strong><span>проектов</span></div><div><strong>Топ 5%</strong><span>среди участников</span></div><div><strong>87%</strong><span>задач решено</span></div></div>
              <div className="companies-demo-bars">{[["Анализ данных", 92, "Топ 3%"], ["Моделирование", 76, "Топ 7%"], ["Исследовательский подход", 84, "Топ 10%"]].map(([label, value, rank]) => <div className="companies-demo-bar" key={label}><span>{label}</span><span className="companies-demo-track"><i style={{ width: `${value}%` }} /></span><small>{rank}</small></div>)}</div>
            </Reveal>
          </div>
        </section>

        <section className="companies-section companies-container companies-evidence">
          <Reveal viewportReveal><h2 className="companies-heading font-heading">Не пропадает место в одном соревновании</h2></Reveal>
          <Stagger viewportReveal className="companies-evidence-grid">{EMPLOYER_QUESTIONS.map((question, index) => <StaggerItem key={question}><article className="companies-evidence-card"><span>0{index + 1}</span><p>{question}</p></article></StaggerItem>)}</Stagger>
        </section>

        <section className="companies-band companies-formats">
          <div className="companies-container companies-section">
            <Reveal viewportReveal><h2 className="companies-heading font-heading">Форматы сотрудничества</h2></Reveal>
            <Stagger viewportReveal className="companies-formats-grid">{FORMATS.map((item) => { const Icon = item.icon; return <StaggerItem key={item.title}><article className="companies-format-card"><span className="companies-icon"><Icon size={20} /></span><div><h3 className="font-heading">{item.title}</h3><p>{item.text}</p></div></article></StaggerItem>; })}</Stagger>
          </div>
        </section>

        <section className="companies-section companies-container companies-responsibilities">
          <Reveal viewportReveal><h2 className="companies-heading font-heading">Кто за что отвечает</h2><p className="companies-intro">Разделяем зоны ответственности, чтобы пилот не превращался в дополнительный проект для вашей команды.</p></Reveal>
          <div className="companies-responsibility-grid">
            <Responsibility icon={Building2} title="От компании" items={COMPANY_NEEDS} />
            <Responsibility icon={Sparkles} title="От ML-Арены" items={ARENA_WORK} primary />
          </div>
        </section>

        <section className="companies-cta">
          <Reveal viewportReveal className="companies-container companies-cta-inner"><img className="companies-cta-trophy" src="/companies-trophy.png" alt="" aria-hidden="true" /><div><h2 className="font-heading">Открыты к пилотным проектам с компаниями</h2><p>Начните с одного небольшого пилота и получите первые результаты уже в ближайшее время. Мы подберём формат, сроки и задачи исходя из ваших целей.</p></div><Button type="button" variant="secondary" className="group" onClick={scrollToForm}>Обсудить пилот <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" /></Button></Reveal>
        </section>

        <section id="cooperation-form" className="companies-form-section scroll-mt-6">
          <div className="companies-container companies-section companies-form-layout">
            <Reveal viewportReveal><h2 className="companies-heading font-heading">Обсудить сотрудничество</h2><p className="companies-intro">Оставьте контакты и мы свяжемся с вами, чтобы обсудить подходящий формат сотрудничества и ответить на все вопросы.</p><div className="companies-form-note"><Mail size={18} />Мы поможем подобрать формат и ответим на любые вопросы.</div></Reveal>
            <Reveal viewportReveal delay={0.08}>
              {submitted ? (
                <div className="flex min-h-96 flex-col items-center justify-center border border-emerald-500/20 bg-emerald-500/[0.05] p-8 text-center"><span className="flex h-14 w-14 items-center justify-center bg-emerald-500 text-white"><CheckCircle2 size={25} /></span><h3 className="mt-6 font-heading text-2xl font-extrabold">Спасибо! Заявка получена.</h3><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Мы свяжемся с вами по указанной почте.</p><Button type="button" variant="outline" className="mt-7" onClick={() => setSubmitted(false)}>Отправить ещё одну заявку</Button></div>
              ) : (
                <form onSubmit={submit} noValidate className="companies-lead-form border border-border bg-card shadow-sm">
                  <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                    <CooperationField id="cooperation-name" label="Имя" error={errors.name}><Input id="cooperation-name" value={form.name} onChange={(event) => update("name", event.target.value)} minLength={2} maxLength={80} autoComplete="name" className="h-11 bg-secondary/20" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "cooperation-name-error" : undefined} /></CooperationField>
                    <CooperationField id="cooperation-company" label="Компания" error={errors.company}><Input id="cooperation-company" value={form.company} onChange={(event) => update("company", event.target.value)} minLength={2} maxLength={160} autoComplete="organization" className="h-11 bg-secondary/20" aria-invalid={Boolean(errors.company)} aria-describedby={errors.company ? "cooperation-company-error" : undefined} /></CooperationField>
                    <CooperationField id="cooperation-email" label="Рабочая почта" error={errors.email}><Input id="cooperation-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} maxLength={254} autoComplete="email" placeholder="name@company.ru" className="h-11 bg-secondary/20" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "cooperation-email-error" : undefined} /></CooperationField>
                    <CooperationField id="cooperation-role" label="Роль"><Input id="cooperation-role" value={form.role} onChange={(event) => update("role", event.target.value)} maxLength={120} autoComplete="organization-title" placeholder="Руководитель ML, HR, инновации" className="h-11 bg-secondary/20" /></CooperationField>
                    <CooperationField id="cooperation-goal" label="Что хотите решить?" error={errors.goal} className="sm:col-span-2"><select id="cooperation-goal" value={form.goal} onChange={(event) => update("goal", event.target.value)} className="h-11 w-full rounded-md border border-input bg-secondary/20 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20" aria-invalid={Boolean(errors.goal)} aria-describedby={errors.goal ? "cooperation-goal-error" : undefined}><option value="">Выберите задачу</option>{GOALS.map((goal) => <option key={goal} value={goal}>{goal}</option>)}</select></CooperationField>
                    <CooperationField id="cooperation-comment" label="Комментарий" className="sm:col-span-2"><Textarea id="cooperation-comment" value={form.comment} onChange={(event) => update("comment", event.target.value)} maxLength={2000} rows={5} placeholder="Коротко опишите задачу, направление или ожидаемый результат" className="resize-none bg-secondary/20" /><span className="mt-1 block text-right text-[11px] tabular-nums text-muted-foreground">{form.comment.length}/2000</span></CooperationField>
                    <input type="text" value={form.website} onChange={(event) => update("website", event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                    <div className="space-y-3 sm:col-span-2">
                      <Consent id="cooperation-consent" checked={form.consent} onChange={(value) => update("consent", value)} error={errors.consent}>Я даю согласие на обработку персональных данных в соответствии с <Link to="/privacy" className="font-semibold text-primary hover:underline">политикой обработки данных</Link>.</Consent>
                      <Consent id="cooperation-marketing" checked={form.marketing} onChange={(value) => update("marketing", value)} muted>Хочу получать новости о корпоративных форматах и проектах ML-Арены.</Consent>
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
  return <Reveal viewportReveal className={`companies-responsibility-card ${primary ? "companies-responsibility-primary" : ""}`}><h3 className="font-heading"><span className="companies-icon"><Icon size={19} /></span>{title}</h3><ul>{items.map((item) => <li key={item}><Check size={15} /><span>{item}</span></li>)}</ul></Reveal>;
}

function PilotIcon({ index }) {
  const icons = [Target, Database, Trophy, BarChart3, Users, ClipboardCheck];
  const Icon = icons[index];
  return <Icon size={20} />;
}

function CooperationField({ id, label, error, className = "", children }) {
  return <div className={`space-y-2 ${className}`}><Label htmlFor={id}>{label}</Label>{children}{error && <p id={`${id}-error`} className="text-xs text-destructive">{error}</p>}</div>;
}

function Consent({ id, checked, onChange, error, muted = false, children }) {
  return <div><div className={`flex items-start gap-3 border p-3 text-sm leading-6 transition-colors ${checked ? "border-primary/25 bg-primary/[0.045]" : "border-border bg-secondary/20"} ${muted ? "text-muted-foreground" : "text-foreground"}`}><input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" /><label htmlFor={id} className={`mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-2 ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-primary/40"}`} aria-label={checked ? "Снять отметку" : "Поставить отметку"}><Check aria-hidden="true" size={14} strokeWidth={3} className={`transition-opacity ${checked ? "opacity-100" : "opacity-0"}`} /></label><span>{children}</span></div>{error && <p className="mt-2 text-xs text-destructive">{error}</p>}</div>;
}

function PublicHeader({ isAuthenticated }) {
  return <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><Link to="/" className="flex items-center gap-2.5"><img src="/logo.svg" alt="" className="h-8 w-8 object-contain" /><span className="font-heading text-lg font-bold">ML-Арена</span></Link><div className="flex items-center gap-2"><ThemeToggle /><Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/support">Поддержка</Link></Button><Button asChild><Link to={isAuthenticated ? "/profile" : "/login"}>{isAuthenticated ? "Профиль" : "Войти"}</Link></Button></div></div></header>;
}
