import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Award, BarChart3, Brain, Building2, CheckCircle2,
  Code2, FileText, Flame, GraduationCap, LineChart, LogOut, Menu,
  Pencil, Play, Rocket, ShieldCheck, Sparkles, Swords, Target, Trophy,
  Upload, UserRound, Users, X, Zap,
} from "lucide-react";
import { api } from "@/api/mlArenaApi";
import { useAuth } from "@/lib/AuthContext";
import ThemeToggle from "@/components/ml/ThemeToggle";
import "./LandingNext.css";

const NAV = [
  ["/competitions", "Соревнования", "competitions"],
  ["/duels", "Дуэли", "duels"],
  ["/rating", "Рейтинг", "rating"],
  ["/ml-passport", "ML-паспорт", "ml_passport"],
  ["/blog", "Блог"],
  ["/companies", "Компаниям"],
  ["/support", "Поддержка"],
];

const FOUNDER = [
  { icon: Target, title: "Мини-задачи", text: "Короткий вход в практику" },
  { icon: Code2, title: "Разборы", text: "Понятная обратная связь" },
  { icon: LineChart, title: "Ранний рейтинг", text: "Первые позиции и награды" },
];

const PROBLEMS = [
  { icon: GraduationCap, title: "Курсы не дают доказательства", text: "Знания есть, но нет подтверждения навыка." },
  { icon: FileText, title: "Резюме выглядит пусто", text: "Новичку сложно выделиться среди других кандидатов." },
  { icon: BarChart3, title: "Высокий порог входа", text: "Крупные соревнования кажутся слишком сложными для старта." },
  { icon: Users, title: "Непонятно, кто сильный", text: "Компании трудно оценить, кто реально умеет решать задачи." },
];

const STEPS = [
  { icon: Target, title: "Задача", text: "Выбираешь соревнование из каталога" },
  { icon: Code2, title: "Модель", text: "Пишешь решение на Python" },
  { icon: Upload, title: "Решение", text: "Загружаешь результат (CSV-файл)" },
  { icon: BarChart3, title: "Позиция в рейтинге", text: "Видишь своё место среди участников" },
  { icon: LineChart, title: "Рейтинг", text: "Результат влияет на рейтинг и лиги" },
  { icon: Brain, title: "ML-паспорт", text: "Все достижения собираются в один профиль" },
];

const FEATURES = [
  { icon: Trophy, title: "Соревнования", text: "Открытые и закрытые задачи из реальных кейсов.", to: "/competitions", feature: "competitions", tone: "blue" },
  { icon: Swords, title: "Дуэли 1x1", text: "Быстрые сражения с таймером.", to: "/duels", feature: "duels", tone: "green" },
  { icon: BarChart3, title: "Рейтинг", text: "Сезонная система прогресса и лиги.", to: "/rating", feature: "rating", tone: "amber" },
  { icon: Brain, title: "ML-паспорт", text: "Подтверждённые результаты и бейджи.", to: "/ml-passport", feature: "ml_passport", tone: "violet" },
  { icon: Building2, title: "Компаниям", text: "Поиск талантов и решений для рекрутинга.", to: "/companies", tone: "blue" },
  { icon: Zap, title: "Автопроверка", text: "Быстрая и честная проверка решений.", to: "/competitions", tone: "blue" },
];

const AUDIENCES = [
  { icon: Rocket, title: "Новички", text: "Начальные задачи и базовые решения." },
  { icon: GraduationCap, title: "Студенты", text: "Сравнивай себя с участниками вузов." },
  { icon: ShieldCheck, title: "Начинающие ML/DS", text: "Покажи практический уровень навыка." },
  { icon: Flame, title: "Сильные участники", text: "Соревнуйся в лигах и получай призы." },
  { icon: Building2, title: "Компании", text: "Находите таланты и проверяйте навыки." },
];

const SKILLS = [
  ["Классификация", 92, "blue"], ["Регрессия", 84, "green"],
  ["NLP", 76, "violet"], ["Временные ряды", 68, "amber"],
];

const MotionLink = motion(Link);

function Reveal({ children, className = "", delay = 0 }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45, margin: "0px 0px -65px 0px" }} transition={{ duration: reduced ? 0 : 0.62, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

function TileIcon({ icon: Icon, tone = "blue" }) {
  return <span className={`landing2-icon landing2-icon--${tone}`}><Icon size={19} strokeWidth={2.2} /></span>;
}

function SectionHeading({ title, text }) {
  return <div className="landing2-heading"><h2>{title}</h2>{text && <p>{text}</p>}</div>;
}

function Header({ isAuthenticated, loginTarget, logout, featureEnabled }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => { if (event.key === "Escape") setMobileMenuOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [mobileMenuOpen]);

  const links = NAV.filter(([, , feature]) => !feature || featureEnabled(feature));
  return <>
    <motion.header initial={reduced ? false : { opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="pointer-events-none fixed left-0 right-0 top-[22px] z-50 flex justify-center px-4 md:top-[30px]">
      <div className="pointer-events-auto flex h-12 w-full max-w-[1440px] items-center justify-between overflow-hidden rounded-[16px] border border-white/70 bg-white/75 px-4 shadow-[0_6px_18px_-14px_rgba(15,23,42,0.12)] backdrop-blur-[32px] dark:border-white/10 dark:bg-[#080d19]/85 dark:shadow-[0_12px_36px_-18px_rgba(37,99,235,0.65)] md:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-[var(--font-science)] text-[21px] font-extrabold text-black dark:text-white"><img src="/logo.svg" alt="" className="h-8 w-8 shrink-0 object-contain" /> ML-Арена</Link>
        <nav className="hidden items-center gap-6 xl:flex">{links.map(([to, label]) => <Link key={to} to={to} className="relative py-2 font-[var(--font-sans)] text-[15px] font-semibold text-[#0B2B55] transition-colors duration-300 after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-[#0084FF] after:transition-[width] after:duration-300 hover:text-[#0084FF] hover:after:w-full dark:text-slate-200 dark:hover:text-blue-400">{label}</Link>)}</nav>
        <div className="flex items-center gap-2"><ThemeToggle />{isAuthenticated ? <><Link to="/profile" className="group hidden h-9 items-center gap-2 rounded-[12px] border border-[#071A3A]/10 bg-white/35 px-5 font-[var(--font-sans)] text-[14px] font-semibold text-[#071A3A] transition-all hover:bg-white/55 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:flex"><UserRound size={15} /> Профиль</Link><button type="button" onClick={logout} className="hidden h-9 w-9 items-center justify-center rounded-[12px] border border-[#071A3A]/10 bg-white/35 text-[#071A3A] hover:bg-white/55 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:flex" title="Выйти"><LogOut size={15} /></button></> : <Link to={loginTarget} className="group hidden h-9 items-center gap-2 rounded-[12px] border border-[#071A3A]/10 bg-white/35 px-4 font-[var(--font-sans)] text-[14px] font-semibold text-[#071A3A] transition-all hover:bg-white/55 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:flex">Войти</Link>}
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#071A3A]/10 bg-white/35 text-[#071A3A] dark:border-white/10 dark:bg-white/5 dark:text-white xl:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Открыть меню" aria-expanded={mobileMenuOpen} aria-controls="landing-mobile-navigation"><Menu size={18} /></button>
        </div>
      </div>
    </motion.header>
    <AnimatePresence>{mobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.22 }} className="fixed inset-0 z-[60] flex justify-start bg-black/15 dark:bg-black/55" onClick={() => setMobileMenuOpen(false)}><motion.div initial={reduced ? false : { x: -280 }} animate={{ x: 0 }} exit={reduced ? undefined : { x: -280 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} id="landing-mobile-navigation" className="h-full w-[280px] max-w-[88vw] overflow-y-auto border-r border-black/10 bg-white/95 p-5 backdrop-blur-[40px] dark:border-white/10 dark:bg-[#070c17]/95" onClick={(event) => event.stopPropagation()}><div className="mb-10 flex items-center justify-between"><span className="flex items-center gap-2.5 font-[var(--font-science)] text-lg font-extrabold text-black dark:text-white"><img src="/logo.svg" alt="" className="h-8 w-8" />ML-Арена</span><div className="flex items-center gap-2"><ThemeToggle /><button type="button" className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-black/5 text-black dark:bg-white/5 dark:text-white" onClick={() => setMobileMenuOpen(false)} aria-label="Закрыть меню"><X size={18} /></button></div></div><nav className="flex flex-col gap-2">{links.map(([to, label]) => <Link key={to} to={to} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 font-[var(--font-sans)] text-sm font-semibold text-black/65 transition-colors hover:bg-black/5 hover:text-black dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">{label}</Link>)}</nav>{isAuthenticated ? <div className="mt-6 space-y-2"><Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#0084FF] px-5 font-[var(--font-sans)] text-sm font-bold text-white"><UserRound size={16} /> Профиль</Link><Link to="/profile/edit" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-black/10 px-5 font-[var(--font-sans)] text-sm font-semibold text-black dark:border-white/10 dark:text-white"><Pencil size={15} /> Редактировать</Link><button type="button" onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] px-5 font-[var(--font-sans)] text-sm font-semibold text-black/60 dark:text-slate-400"><LogOut size={15} /> Выйти</button></div> : <Link to={loginTarget} onClick={() => setMobileMenuOpen(false)} className="mt-6 flex h-11 items-center justify-center rounded-[14px] border border-black/10 px-5 font-[var(--font-sans)] text-sm font-semibold text-black dark:border-white/10 dark:text-white">Войти</Link>}</motion.div></motion.div>}</AnimatePresence>
  </>;
}

function RatingPreview({ entries, loading, error }) {
  const rows = entries.slice(0, 5).map((entry, index) => {
    const profile = entry.profile || entry.user || entry;
    const rating = entry.rating ?? entry.overall_score ?? entry.score;
    return {
      id: entry.user_id || profile.id || index,
      rank: entry.rank ?? index + 1,
      name: profile.nickname || profile.user_name || profile.username || entry.nickname || "Участник",
      rating: rating == null ? "—" : Number.isFinite(Number(rating)) ? Number(rating).toLocaleString("ru-RU") : String(rating),
      solved: entry.solutions_count ?? entry.submissions_count ?? entry.total_submissions ?? "—",
    };
  });
  return <div className="landing2-rating-table landing2-card"><div className="landing2-rating-top"><TileIcon icon={Trophy} /><div><strong>Таблица лидеров</strong><small>Текущий сезон · Обновляется автоматически</small></div><Link to="/rating">Смотреть всех <ArrowRight size={15} /></Link></div><div className="landing2-rating-head"><span>#</span><span>Участник</span><span>Рейтинг</span><span>Решения</span><span>Место</span></div>{loading ? <p className="landing2-rating-empty">Загружаем рейтинг…</p> : error ? <p className="landing2-rating-empty">Рейтинг временно недоступен</p> : !rows.length ? <p className="landing2-rating-empty">В текущем сезоне пока нет результатов</p> : rows.map((row, index) => <div className="landing2-rating-row" key={row.id}><span className={`landing2-rank landing2-rank--${index + 1}`}>{row.rank}</span><span className="landing2-rating-user"><span className="landing2-avatar">{row.name.slice(0, 1).toUpperCase()}</span><strong>{row.name}</strong></span><strong>{row.rating}</strong><span>{row.solved}</span><span className="landing2-rating-medal">{index < 3 ? <Trophy size={15} /> : "—"}</span></div>)}</div>;
}

function PassportPreview() {
  return <div className="landing2-passport landing2-card">
    <div className="landing2-passport-top">
      <div className="landing2-passport-identity"><TileIcon icon={Brain} /><div><strong>ML-паспорт <span className="landing2-tag">ПРИМЕР</span></strong><small>Подтверждённый профиль ML-инженера</small></div></div>
      <div className="landing2-passport-rating"><div className="landing2-passport-score"><strong>1684</strong><small>сезонный рейтинг</small></div><span className="landing2-league">Top-10<br />в общей таблице</span></div>
    </div>
    <div className="landing2-passport-stats"><div><strong>7</strong><small>соревнований</small></div><div><strong>18</strong><small>дуэлей</small></div><div><strong>24</strong><small>валидных решений</small></div></div>
    <div className="landing2-passport-detail"><div><h3>Подтверждённые навыки</h3>{SKILLS.map(([name, value, tone]) => <div className="landing2-skill" key={name}><span>{name}</span><div><i className={`landing2-skill--${tone}`} style={{ width: `${value}%` }} /></div><b>{value}%</b></div>)}</div><aside><h3>Достижения</h3><p><Trophy size={16} /> Финалист сезона</p><p><Swords size={16} /> Серия побед</p><p><Sparkles size={16} /> Первый топ-10</p></aside></div>
    <div className="landing2-passport-proof"><CheckCircle2 size={17} /> Результаты проверены ML-Ареной</div>
  </div>;
}

function Footer({ featureEnabled }) {
  const groups = [
    ["Платформа", [["/competitions", "Соревнования", "competitions"], ["/duels", "Дуэли", "duels"], ["/rating", "Рейтинг", "rating"], ["/ml-passport", "ML-паспорт", "ml_passport"]]],
    ["Материалы", [["/blog", "Блог"], ["/support", "Частые вопросы"]]],
    ["Компаниям", [["/companies", "Решения для компаний"], ["/companies#cooperation-form", "Обсудить сотрудничество"]]],
    ["Поддержка", [["/support", "Помощь и FAQ"], ["/login", "Войти"]]],
  ];
  return <footer className="landing2-footer"><div className="landing2-wrap landing2-footer-grid"><div><Link to="/" className="landing2-footer-brand"><img src="/logo.svg" alt="" /> ML-Арена</Link><p>Практические задачи, соревнования<br />и ML-паспорт с подтверждёнными результатами.</p></div>{groups.map(([title, links]) => <nav key={title} aria-label={title}><strong>{title}</strong>{links.filter(([, , feature]) => !feature || featureEnabled(feature)).map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}</nav>)}</div><div className="landing2-footer-bottom landing2-wrap"><span>© 2026 ML-Арена. Все права защищены.</span><div><Link to="/terms">Условия использования</Link><Link to="/privacy">Обработка данных</Link></div></div></footer>;
}

export default function LandingNext() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const { appPublicSettings, isAuthenticated, logout } = useAuth();
  const loginTarget = `/login${location.search}`;
  const primaryTarget = isAuthenticated ? "/profile" : loginTarget;
  const featureEnabled = (name) => appPublicSettings?.features?.[name] !== false;
  const stats = useQuery({ queryKey: ["public-platform-stats"], queryFn: api.public.stats, staleTime: 60000 });
  const leaderboard = useQuery({ queryKey: ["public-leaderboard-preview"], queryFn: api.public.leaderboard, staleTime: 30000 });
  const entries = leaderboard.data?.items || leaderboard.data?.rows || (Array.isArray(leaderboard.data) ? leaderboard.data : []);
  const metrics = [
    { icon: Users, value: stats.data?.users, label: "участников" },
    { icon: Trophy, value: stats.data?.active_competitions, label: "активных соревнований" },
    { icon: Swords, value: stats.data?.completed_duels, label: "завершённых дуэлей" },
    { icon: Upload, value: stats.data?.submissions, label: "отправок решений" },
  ];
  const heroInitial = reduced ? false : { opacity: 0, y: 18 };
  const heroTransition = (delay) => ({ duration: reduced ? 0 : 0.58, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] });

  return <div className="landing2 min-h-screen"><Header isAuthenticated={isAuthenticated} loginTarget={loginTarget} logout={logout} featureEnabled={featureEnabled} /><main>
    <section className="landing2-hero"><div className="landing2-grid" aria-hidden="true" /><div className="landing2-wrap landing2-hero-inner"><div className="landing2-hero-copy"><motion.h1 initial={heroInitial} animate={{ opacity: 1, y: 0 }} transition={heroTransition(0.08)}>ML-Арена</motion.h1><motion.h2 initial={heroInitial} animate={{ opacity: 1, y: 0 }} transition={heroTransition(0.16)}>Докажи навык<br />в машинном обучении<br />результатом</motion.h2><motion.p initial={heroInitial} animate={{ opacity: 1, y: 0 }} transition={heroTransition(0.24)}>Соревнования, дуэли, рейтинг и ML-паспорт для тех, кто хочет расти в AI через практику.</motion.p><motion.div className="landing2-hero-actions" initial={heroInitial} animate={{ opacity: 1, y: 0 }} transition={heroTransition(0.32)}><Link className="landing2-primary" to={primaryTarget}>Открыть профиль <span><ArrowRight size={16} /></span></Link><Link className="landing2-secondary" to="/competitions"><span><Play size={14} fill="currentColor" /></span> Смотреть соревнования</Link></motion.div></div><div className="landing2-hero-art" aria-label="Робот-помощник ML-Арены"><motion.img src="/landing-robot.png" alt="Дружелюбный робот с графиком результатов" initial={reduced ? false : { opacity: 0, y: 22, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={heroTransition(0.18)} /><MotionLink to="/duels" className="landing2-float landing2-float--duel" initial={heroInitial} animate={{ opacity: 1, y: 0, rotate: -6 }} whileHover={reduced ? undefined : { y: -3, rotate: 0 }} transition={heroTransition(0.43)}><TileIcon icon={Swords} tone="green" /><span><strong>Дуэль 1x1</strong><small>Найди соперника</small></span></MotionLink><MotionLink to="/competitions" className="landing2-float landing2-float--competition" initial={heroInitial} animate={{ opacity: 1, y: 0, rotate: 6 }} whileHover={reduced ? undefined : { y: -3, rotate: 0 }} transition={heroTransition(0.5)}><TileIcon icon={Trophy} /><span><strong>Соревнование</strong><small>Решай реальные задачи</small></span></MotionLink><MotionLink to="/ml-passport" className="landing2-float landing2-float--passport" initial={heroInitial} animate={{ opacity: 1, y: 0, rotate: 5 }} whileHover={reduced ? undefined : { y: -3, rotate: 0 }} transition={heroTransition(0.57)}><TileIcon icon={Brain} tone="violet" /><span><strong>ML-паспорт</strong><small>Подтверждённые навыки</small></span></MotionLink></div><div className="landing2-metrics">{metrics.map(({ icon: Icon, value, label }, index) => <motion.div className="landing2-metric landing2-card" key={label} initial={heroInitial} animate={{ opacity: 1, y: 0 }} transition={heroTransition(0.52 + index * 0.07)}><TileIcon icon={Icon} /><div><strong>{typeof value === "number" ? value.toLocaleString("ru-RU") : value ?? "—"}</strong><small>{label}</small></div></motion.div>)}</div></div></section>

    <section className="landing2-band landing2-founder"><div className="landing2-wrap landing2-founder-inner"><Reveal className="landing2-founder-copy"><span className="landing2-eyebrow">ПЕРВЫЙ СЕЗОН</span><h2>ML-Арена<br />Founder Season</h2><p>Мини-задачи, разборы, ранний рейтинг и специальные награды для первых участников.</p><Link className="landing2-primary landing2-primary--small" to={primaryTarget}>Открыть профиль Founder Season <ArrowRight size={16} /></Link></Reveal><div className="landing2-founder-steps">{FOUNDER.map(({ icon, title, text }, index) => <Reveal key={title} delay={index * 0.06} className="landing2-founder-card landing2-card"><div className="landing2-card-number"><TileIcon icon={icon} /><span>0{index + 1}</span></div><h3>{title}</h3><p>{text}</p></Reveal>)}</div></div></section>

    <section className="landing2-band"><div className="landing2-wrap landing2-problems"><Reveal className="landing2-problems-copy"><h2>Войти в ML сложно.<br />Доказать навык<br />ещё сложнее.</h2><p>Мы меняем это — даём честные соревнования, прозрачный рейтинг и подтверждённые результаты.</p></Reveal><div className="landing2-problem-grid">{PROBLEMS.map(({ icon, title, text }, index) => <Reveal key={title} className="landing2-problem landing2-card" delay={index * 0.05}><TileIcon icon={icon} /><div><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></div></Reveal>)}</div></div></section>

    <section className="landing2-band landing2-band--tint"><div className="landing2-wrap"><SectionHeading title="От задачи до ML-паспорта" text="Шесть простых шагов превращают практику в подтверждённый результат." /><div className="landing2-steps">{STEPS.map(({ icon, title, text }, index) => <Reveal key={title} className="landing2-step landing2-card" delay={index * 0.035}><div className="landing2-card-number"><TileIcon icon={icon} /><span>0{index + 1}</span></div><h3>{title}</h3><p>{text}</p>{index < STEPS.length - 1 && <ArrowRight className="landing2-step-arrow" size={18} />}</Reveal>)}</div></div></section>

    <section className="landing2-band"><div className="landing2-wrap"><SectionHeading title="Всё для роста в одном месте" text="Практика, соревнования и карьерный профиль — всё, что нужно для развития в ML." /><div className="landing2-features">{FEATURES.filter(({ feature }) => !feature || featureEnabled(feature)).map(({ icon, title, text, to, tone }, index) => <Reveal key={title} delay={index * 0.04}><Link to={to} className="landing2-feature landing2-card"><TileIcon icon={icon} tone={tone} /><span><strong>{title}</strong><small>{text}</small></span><ArrowRight size={17} /></Link></Reveal>)}</div></div></section>

    <section className="landing2-band landing2-band--tint"><div className="landing2-wrap landing2-rating"><Reveal className="landing2-rating-copy"><h2>Рейтинг по результатам.<br />Без ручных оценок.</h2><p>Актуальная сезонная таблица: место меняется после подтверждённых результатов в соревнованиях и дуэлях.</p><Link className="landing2-primary landing2-primary--small" to="/rating">Полный рейтинг <ArrowRight size={16} /></Link></Reveal><Reveal><RatingPreview entries={entries} loading={leaderboard.isLoading} error={leaderboard.isError} /></Reveal></div></section>

    <section className="landing2-band"><div className="landing2-wrap"><SectionHeading title="Для кого ML-Арена" /><div className="landing2-audiences">{AUDIENCES.map(({ icon, title, text }, index) => <Reveal key={title} delay={index * 0.04} className="landing2-audience landing2-card"><TileIcon icon={icon} /><h3>{title}</h3><p>{text}</p></Reveal>)}</div></div></section>

    <section className="landing2-band landing2-band--tint"><div className="landing2-wrap landing2-passport-section"><Reveal><h2>Навыки, которые<br />не нужно доказывать<br />словами</h2><p>Результаты, лиги, бейджи и история отправок собираются в одном профиле и показывают работодателям реальный уровень.</p><div className="landing2-proof-label"><Award size={18} /> Подтверждено результатами на платформе</div></Reveal><Reveal><PassportPreview /></Reveal></div></section>

    <section className="landing2-final"><div className="landing2-wrap landing2-final-inner"><Sparkles size={27} /><div><h2>Готов выйти на арену?</h2><p>Начни с первой задачи и преврати практику в результат.</p></div><div className="landing2-final-actions"><Link to={primaryTarget}>Открыть профиль <ArrowRight size={16} /></Link><Link to="/competitions"><Play size={16} /> Смотреть соревнования</Link></div></div></section>
  </main><Footer featureEnabled={featureEnabled} /></div>;
}
