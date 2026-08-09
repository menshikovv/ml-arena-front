import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  ChevronRight,
  Code2,
  Flame,
  GraduationCap,
  FileCheck2,
  LineChart,
  LogOut,
  Medal,
  Menu,
  Pencil,
  Play,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Upload,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import LeagueBadge from "@/components/ml/LeagueBadge";

const FEATURES = [
  { icon: Trophy, title: "Соревнования", desc: "Открытые и закрытые ML-задачи: Классификация, Регрессия, NLP, Компьютерное зрение, Временные ряды, Ранжирование, Кластеризация, RecSys. Загружай решения и двигайся вверх по рейтингу.", color: "text-primary bg-primary/10" },
  { icon: Swords, title: "Дуэли 1x1", desc: "Быстрые сражения с таймером, отправкой решения и сравнением результата. Формат для практики, азарта и проверки себя.", color: "text-accent-foreground bg-accent/20" },
  { icon: Medal, title: "Рейтинг и лиги", desc: "Единая система прогресса: соревнования, дуэли, сезоны и переходы из Бронзы к Платине.", color: "text-[hsl(var(--chart-5))] bg-[hsl(var(--chart-5)/0.16)]" },
  { icon: Brain, title: "ML-паспорт", desc: "Рейтинг, бейджи, сильные стороны и подтверждённые результаты вместо пустых слов в резюме.", color: "text-[hsl(var(--chart-3))] bg-[hsl(var(--chart-3)/0.16)]" },
  { icon: Building2, title: "Компании", desc: "Инструмент для поиска начинающих ML/DS и AI-специалистов, которые уже показали практический результат.", color: "text-[hsl(var(--chart-2))] bg-[hsl(var(--chart-2)/0.16)]" },
  { icon: Zap, title: "Автопроверка", desc: "Отправка CSV, расчет результата, обновление рейтинга и понятная обратная связь по решению.", color: "text-primary bg-primary/10" },
];

const LEAGUES = [
  { name: "Бронза", range: "0-1099", rating: 1000 },
  { name: "Серебро", range: "1100-1299", rating: 1200 },
  { name: "Золото", range: "1300-1499", rating: 1400 },
  { name: "Платина", range: "1500+", rating: 1600 },
];

const PROBLEMS = [
  "Курсы дают знания, но не всегда дают доказательство навыка.",
  "Резюме новичка часто выглядит пусто.",
  "Крупные соревнования могут быть слишком сложными для старта.",
  "Компаниям трудно понять, кто действительно умеет решать задачи.",
];

const WORKFLOW = [
  { icon: Target, title: "Задача", desc: "Выбираешь соревнование из каталога, скачиваешь датасет и читаешь описание — какая метрика, какие ограничения и что ожидается от решения." },
  { icon: Code2, title: "Модель", desc: "Пишешь решение на Python: pandas, sklearn, CatBoost, PyTorch — любой стек. Работаешь локально, как привычно." },
  { icon: Upload, title: "Решение", desc: "Загружаешь готовый CSV-файл. Платформа автоматически проверяет формат, считает результат по метрике соревнования и фиксирует его." },
  { icon: BarChart3, title: "Позиция в рейтинге", desc: "Сразу видишь свою позицию относительно других участников. Сравниваешь подходы и понимаешь, где твой текущий уровень." },
  { icon: LineChart, title: "Рейтинг", desc: "Каждый результат влияет на рейтинг. Растешь через соревнования, побеждаешь в дуэлях и поднимаешься по лигам от Бронзы к Платине." },
  { icon: Radar, title: "ML-паспорт", desc: "Все результаты и бейджи собираются в один профиль — подтвержденное доказательство навыков для работодателей и коллег." },
];

const AUDIENCES = [
  { icon: Rocket, title: "Новички", desc: "Начальные задачи, базовые решения и разборы помогают сделать первую корректную отправку." },
  { icon: GraduationCap, title: "Студенты", desc: "Сравнивай себя с участниками из других вузов и участвуй в университетских соревнованиях." },
  { icon: ShieldCheck, title: "Начинающие ML/DS", desc: "Покажи практический уровень через результаты, стабильность и решения на задачах." },
  { icon: Flame, title: "Сильные участники", desc: "Соревнуйся в рейтинговых турнирах и дуэлях, получай денежные призы за сильные результаты." },
  { icon: Building2, title: "Компании", desc: "Находите людей, которые уже доказали результат на практических задачах." },
];

const STATS = [
  { value: "Founder Season", label: "предсезон до запуска", icon: Sparkles },
  { value: "Призы", label: "денежный фонд", icon: Trophy },
  { value: "1x1", label: "дуэли и сезоны", icon: Swords },
  { value: "4", label: "лиги роста", icon: Medal },
];

const FOUNDER_STEPS = [
  { icon: Target, title: "Мини-задачи", desc: "короткий вход в практику" },
  { icon: Code2, title: "Разборы", desc: "понятная обратная связь" },
  { icon: LineChart, title: "Ранний рейтинг", desc: "первые позиции до запуска" },
];

function SectionTitle({ title, desc, align = "center" }) {
  const isLeft = align === "left";

  return (
    <div className={`${isLeft ? "text-left" : "text-center"} mb-10`}>
      <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4 max-w-4xl mx-auto">{title}</h2>
      {desc && <p className={`text-muted-foreground max-w-2xl leading-relaxed ${isLeft ? "" : "mx-auto"}`}>{desc}</p>}
    </div>
  );
}

function HeroCompanion({ reduceMotion }) {
  const float = (x, y) => reduceMotion
    ? undefined
    : { x, y };

  const glassClass = "absolute z-20 rounded-[20px] border border-white/70 bg-gradient-to-br from-white/80 to-white/45 px-4 py-3 text-left shadow-[inset_0_2.5px_4px_rgba(255,255,255,0.8),0_12px_32px_-4px_rgba(0,132,255,0.14)] ring-1 ring-black/5 backdrop-blur-[24px] pointer-events-auto";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-[500px] w-full items-center justify-center py-8 lg:justify-end"
    >
      <div className="absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/30" />
      <div className="absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-blue-300/35" />

      <motion.div
        className="relative w-full max-w-[600px]"
        animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, 0.35, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <video
          className="pointer-events-none block h-auto w-full select-none rounded-[24px]"
          src="/hero_robo_video.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={(event) => {
            event.currentTarget.currentTime = 0;
            event.currentTarget.play().catch(() => {});
          }}
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noremoteplayback noplaybackrate nofullscreen"
          aria-label="Интерактивный помощник ML Арены"
          style={{ filter: "brightness(1.02) contrast(1.04)" }}
        />

        <motion.div
          initial={false}
          animate={float([0, 2, 0], [0, -8, 0])}
          whileHover={reduceMotion ? undefined : { scale: 1.05, rotate: 1 }}
          transition={{ duration: 5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          className={`${glassClass} right-0 top-[13%] sm:-right-3 lg:-right-5`}
        >
          <Link to="/competitions" aria-label="Перейти к соревнованиям" className="absolute inset-0 z-10 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" />
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0084FF] to-[#0066CC] text-white shadow-[0_4px_12px_rgba(0,132,255,0.3)]">
              <FileCheck2 size={17} />
            </span>
            <span>
              <span className="block text-[13px] font-bold text-neutral-900">Соревнование</span>
              <span className="mt-0.5 block text-[10px] font-semibold text-neutral-500">результат 0.9412</span>
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={float([0, -2, 0], [0, 8, 0])}
          whileHover={reduceMotion ? undefined : { scale: 1.05, rotate: -1 }}
          transition={{ duration: 5.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          className={`${glassClass} left-0 top-[47%] sm:-left-4 lg:-left-8`}
        >
          <Link to="/duels" aria-label="Перейти к дуэлям" className="absolute inset-0 z-10 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" />
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
              <Swords size={17} />
            </span>
            <span>
              <span className="block text-[13px] font-bold text-neutral-900">Дуэль 1×1</span>
              <span className="mt-0.5 block text-[10px] font-semibold text-neutral-500">соперник найден</span>
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={float([0, -1, 0], [0, -10, 0])}
          whileHover={reduceMotion ? undefined : { scale: 1.05, rotate: 1.5 }}
          transition={{ duration: 4.8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          className={`${glassClass} bottom-[12%] right-1 sm:-right-2 lg:-right-4`}
        >
          <Link to="/ml-passport" aria-label="Перейти в ML-паспорт" className="absolute inset-0 z-10 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" />
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#9333EA] to-[#7E22CE] text-white shadow-[0_4px_12px_rgba(147,51,234,0.3)]">
              <Brain size={17} />
            </span>
            <span>
              <span className="block text-[13px] font-bold text-neutral-900">ML-паспорт</span>
              <span className="mt-0.5 block text-[10px] font-semibold text-neutral-500">рейтинг 1420</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function ArenaPreview() {
  const rows = [
    { rank: "01", name: "datawizard", task: "Кредитный скоринг", score: "0.9412", change: "+24" },
    { rank: "02", name: "ml_ninja", task: "Тональность отзывов", score: "0.9368", change: "+18" },
    { rank: "03", name: "Ты", task: "Цены на жильё", score: "0.9214", change: "+31", active: true },
  ];

  return (
    <div className="relative border border-border bg-background p-4 shadow-xl shadow-primary/5 md:p-6">
      <div className="flex items-center justify-between border-b border-border/80 px-1 pb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Онлайн-рейтинг
        </span>
        <span>Сезон 01</span>
      </div>
      <div className="divide-y divide-border/70">
        {rows.map((row, index) => (
          <motion.div
            key={row.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`grid grid-cols-[42px_1fr_auto] md:grid-cols-[60px_1fr_1fr_auto_auto] items-center gap-3 px-2 py-4 md:px-4 ${
              row.active ? "bg-primary/8" : ""
            }`}
          >
            <span className="font-mono text-sm text-muted-foreground">{row.rank}</span>
            <div className="min-w-0">
              <p className="truncate font-heading font-semibold">{row.name}</p>
              <p className="text-xs text-muted-foreground md:hidden">{row.task}</p>
            </div>
            <span className="hidden text-sm text-muted-foreground md:block">{row.task}</span>
            <span className="font-mono text-sm font-semibold">{row.score}</span>
            <span className="hidden rounded-full bg-accent/15 px-2 py-1 text-xs font-semibold text-accent-foreground md:block">
              {row.change}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Рейтинг обновляется после каждого результата</span>
        <BarChart3 size={16} className="text-primary" />
      </div>
    </div>
  );
}

function PassportPreview() {
  const reduceMotion = useReducedMotion();
  const skills = [
    { label: "Табличные данные", value: "92%", progress: 92 },
    { label: "Классификация", value: "88%", progress: 88 },
    { label: "Инженерия признаков", value: "81%", progress: 81 },
  ];
  const stats = [
    ["12", "отправок"],
    ["4", "задачи"],
    ["86%", "перцентиль"],
  ];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden border border-border bg-card p-5 shadow-[0_24px_60px_rgba(37,99,235,0.12)] md:p-6"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="pointer-events-none absolute -right-12 -top-14 text-primary/[0.045]">
        <Brain size={180} strokeWidth={1} />
      </div>
      <div className="relative flex items-center justify-between gap-4 border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={reduceMotion ? undefined : { rotate: [0, -4, 4, 0] }}
            transition={{ duration: 1.1, delay: 0.55, ease: "easeInOut" }}
            className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <Brain size={24} className="text-white" />
          </motion.div>
          <div>
            <div className="font-heading font-bold">ML-паспорт</div>
            <div className="text-sm text-muted-foreground">Младший ML-инженер</div>
          </div>
        </div>
        <LeagueBadge rating={1420} />
      </div>
      <div className="relative grid grid-cols-3 gap-3 mb-5">
        {stats.map(([value, label], index) => (
          <motion.div
            key={label}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.32, delay: 0.15 + index * 0.08 }}
            className="rounded-lg border border-border/70 bg-secondary/60 p-3 text-center"
          >
            <div className="font-heading text-xl font-bold">{value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
          </motion.div>
        ))}
      </div>
      <div className="relative space-y-4">
        {skills.map((skill, index) => (
          <div key={skill.label}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">{skill.label}</span>
              <span className="text-muted-foreground">{skill.value}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <motion.div
                initial={{ width: reduceMotion ? `${skill.progress}%` : "0%" }}
                whileInView={{ width: `${skill.progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.25 + index * 0.1, ease: "easeOut" }}
                className="relative h-2 rounded-full bg-primary"
              >
                <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-0.5 rounded-full bg-white shadow-[0_0_0_3px_rgba(37,99,235,0.14)]" />
              </motion.div>
            </div>
          </div>
        ))}
      </div>
      <div className="relative mt-5 flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/[0.035] p-3 text-sm text-muted-foreground">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
        Подтверждённые результаты в ML-паспорте.
      </div>
    </motion.div>
  );
}

function ArenaLogoMark({ className = "h-8 w-8" }) {
  return (
    <img
      src="/logo.svg"
      alt=""
      className={`shrink-0 object-contain ${className}`}
      aria-hidden="true"
    />
  );
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const registrationTarget = `/register${location.search}`;
  const primaryTarget = isAuthenticated ? "/profile" : registrationTarget;
  const reduceMotion = useReducedMotion();
  const reveal = {
    hidden: reduceMotion ? {} : { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0 },
  };
  const transition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] };

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <motion.header
        initial={reduceMotion ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none fixed left-0 right-0 top-[22px] z-50 flex justify-center px-4 md:top-[30px]"
      >
        <div className="pointer-events-auto flex h-12 w-full max-w-[1440px] items-center justify-between overflow-hidden rounded-[16px] border border-white/70 bg-white/75 px-4 shadow-[0_6px_18px_-14px_rgba(15,23,42,0.12)] backdrop-blur-[32px] md:px-6">
          <Link to="/" className="flex items-center gap-2.5 font-[var(--font-fustat)] text-[21px] font-extrabold text-black">
            <ArenaLogoMark className="h-8 w-8" />
            ML-Арена
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {[
              ["/competitions", "Соревнования"],
              ["/duels", "Дуэли"],
              ["/rating", "Рейтинг"],
              ["/ml-passport", "ML-паспорт"],
            ].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className="relative py-2 font-[var(--font-sans)] text-[15px] font-semibold text-[#0B2B55] transition-colors duration-300 after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-[#0084FF] after:transition-[width] after:duration-300 hover:text-[#0084FF] hover:after:w-full"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="group hidden h-9 items-center gap-2 rounded-[12px] border border-[#071A3A]/10 bg-white/35 px-5 font-[var(--font-sans)] text-[14px] font-semibold text-[#071A3A] transition-all hover:bg-white/55 hover:shadow-md sm:flex">
                  <UserRound size={15} /> Профиль
                </Link>
                <button type="button" onClick={logout} className="hidden h-9 w-9 items-center justify-center rounded-[12px] border border-[#071A3A]/10 bg-white/35 text-[#071A3A] hover:bg-white/55 sm:flex" title="Выйти"><LogOut size={15} /></button>
              </>
            ) : (
              <>
                <Link to="/login" className="group hidden h-9 items-center gap-2 rounded-[12px] border border-[#071A3A]/10 bg-white/35 px-4 font-[var(--font-sans)] text-[14px] font-semibold text-[#071A3A] transition-all hover:bg-white/55 hover:shadow-md sm:flex">Войти</Link>
                <Link to={registrationTarget} className="group hidden h-9 items-center gap-2 rounded-[12px] bg-[#0084FF] px-4 font-[var(--font-sans)] text-[14px] font-semibold text-white transition-colors hover:bg-[#0074E0] lg:flex">Предрегистрация <ArrowRight size={14} /></Link>
              </>
            )}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[#071A3A]/10 bg-white/35 text-[#071A3A] md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </motion.header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/15" onClick={() => setMobileMenuOpen(false)}>
          <motion.div
            initial={reduceMotion ? false : { x: 260 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-[260px] border-l border-black/10 bg-white/95 p-5 backdrop-blur-[40px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-10 flex items-center justify-between">
              <span className="flex items-center gap-2.5 font-[var(--font-fustat)] text-lg font-extrabold text-black">
                <ArenaLogoMark className="h-8 w-8" />
                ML-Арена
              </span>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-black/5 text-black"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Закрыть меню"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {[
                ["/competitions", "Соревнования"],
                ["/duels", "Дуэли"],
                ["/rating", "Рейтинг"],
                ["/ml-passport", "ML-паспорт"],
              ].map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-3 font-[var(--font-sans)] text-sm font-semibold text-black/65 transition-colors hover:bg-black/5 hover:text-black"
                >
                  {label}
                </Link>
              ))}
            </nav>
            {isAuthenticated ? (
              <div className="mt-6 space-y-2">
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#0084FF] px-5 font-[var(--font-sans)] text-sm font-bold text-white"><UserRound size={16} /> Профиль</Link>
                <Link to="/profile/edit" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center gap-2 rounded-[14px] border border-black/10 px-5 font-[var(--font-sans)] text-sm font-semibold text-black"><Pencil size={15} /> Редактировать</Link>
                <button type="button" onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] px-5 font-[var(--font-sans)] text-sm font-semibold text-black/60"><LogOut size={15} /> Выйти</button>
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center rounded-[14px] border border-black/10 px-5 font-[var(--font-sans)] text-sm font-semibold text-black">Войти</Link>
                <Link to={registrationTarget} onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#0084FF] px-5 font-[var(--font-sans)] text-sm font-bold text-white">Предрегистрация <ArrowRight size={15} /></Link>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <main>
        <section className="relative isolate overflow-hidden bg-white text-black">
          <div className="relative mx-auto w-full max-w-[1440px] px-6 pb-12 pt-[118px] sm:px-10 md:pt-[128px] lg:px-12 xl:px-16">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex max-w-[680px] flex-col items-start justify-center text-left lg:col-span-6 lg:pr-4"
              >
                <div className="flex w-fit items-center gap-3 rounded-full border border-black/5 bg-black/5 px-3 py-1.5 shadow-sm">
                  <div className="flex -space-x-2">
                    {["B", "S", "G", "P"].map((letter, index) => (
                      <span
                        key={letter}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white transition-transform hover:-translate-y-1"
                        style={{ backgroundColor: ["#B7794B", "#8E9AA8", "#D4A928", "#7167E8"][index] }}
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                  <span className="font-[var(--font-sans)] text-[12px] text-black/75">
                    ML-Арена Founder Season · <strong className="text-neutral-900">регистрация открыта</strong>
                  </span>
                </div>

                <h1 className="mt-6 select-none font-[var(--font-outfit)] text-[42px] font-black leading-[1.08] text-black sm:text-[50px] lg:text-[60px]">
                  ML-Арена
                </h1>
                <p className="mt-3 font-[var(--font-outfit)] text-[29px] font-bold leading-[1.1] text-black sm:text-[34px] lg:text-[41px]">
                  Докажи навык в машинном обучении результатом
                </p>
                <p className="mt-5 max-w-[500px] font-[var(--font-sans)] text-[17px] leading-relaxed text-black/60">
                  Соревнования, дуэли и подтвержденный ML-паспорт для тех, кто входит в AI через практику.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <motion.div
                    whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  >
                    <Link
                      to={primaryTarget}
                      className="group flex w-fit items-center gap-4 rounded-[16px] bg-[#0084FF] py-2 pl-6 pr-2 font-[var(--font-sans)] text-sm font-bold text-white transition-colors hover:bg-[#0074E0]"
                      style={{ boxShadow: "inset 0 4px 4px rgba(255,255,255,0.35), 0 10px 25px -5px rgba(0,132,255,0.25)" }}
                    >
                      {isAuthenticated ? "Открыть профиль" : "Предрегистрация"}
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0084FF]">
                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </motion.div>

                  <Link to="/competitions" className="group flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#0084FF] transition-colors group-hover:bg-blue-100">
                      <Play size={14} fill="currentColor" />
                    </span>
                    <span className="font-[var(--font-sans)] text-[14px] font-bold text-[#0084FF] transition-colors group-hover:text-[#0074E0]">
                      Смотреть соревнования
                    </span>
                  </Link>
                </div>
              </motion.div>

              <div className="lg:col-span-6">
                <HeroCompanion reduceMotion={reduceMotion} />
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-0">
              {STATS.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.55, delay: 0.65 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3 rounded-[18px] border border-white/70 bg-white/55 p-3 shadow-[inset_0_2px_3px_rgba(255,255,255,0.8),0_10px_30px_-18px_rgba(0,132,255,0.35)] ring-1 ring-black/5 backdrop-blur-[24px] transition-transform duration-150 ease-out hover:-translate-y-[3px]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0084FF]">
                    <stat.icon size={17} />
                  </span>
                  <span>
                    <span className="block font-[var(--font-outfit)] text-lg font-bold leading-none text-black">{stat.value}</span>
                    <span className="mt-1 block font-[var(--font-sans)] text-[10px] text-black/45">{stat.label}</span>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary/30">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={reveal}
            transition={transition}
            className="max-w-7xl mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[0.95fr_1.25fr] lg:items-center lg:py-20"
          >
            <div className="relative">

              <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">ML-Арена Founder Season</h2>
              <p className="max-w-xl text-muted-foreground leading-relaxed">
                Предсезон для первых участников: мини-задачи, разборы, ранний рейтинг,
                подготовка к соревнованию открытия и специальные награды.
              </p>
              <Button asChild className="mt-6">
                <Link to={primaryTarget}>
                  {isAuthenticated ? "Открыть профиль Founder Season" : "Попасть в ML-Арена Founder Season"} <ArrowRight size={16} className="ml-1" />
                </Link>
              </Button>
            </div>
            <div className="relative grid gap-3 sm:grid-cols-3">
              <div className="pointer-events-none absolute left-8 right-8 top-9 hidden h-px bg-gradient-to-r from-primary/10 via-primary/35 to-cyan-400/20 sm:block" />
              {FOUNDER_STEPS.map((step, index) => (
                <motion.div
                  key={`${step.title}-${index}`}
                  whileHover={reduceMotion ? undefined : { y: -5 }}
                  className="group relative overflow-hidden rounded-[22px] border border-white/80 bg-background/75 p-5 shadow-[0_18px_45px_-32px_rgba(37,99,235,0.55)] ring-1 ring-black/5 backdrop-blur-xl"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#155BFF] to-[#20D6C6] opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="mb-8 flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                      <step.icon size={21} />
                    </span>
                    <span className="font-mono text-xs font-semibold text-primary/70">0{index + 1}</span>
                  </div>
                  <p className="font-heading text-lg font-semibold">{step.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto grid gap-12 px-4 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={reveal}
            transition={transition}
            className="lg:pr-8"
          >
            <h2 className="font-heading text-4xl md:text-5xl font-bold leading-tight">
              Войти в ML сложно. Доказать навык еще сложнее.
            </h2>
          </motion.div>
          <div className="grid gap-3">
            {PROBLEMS.map((problem, index) => (
              <motion.div
                key={problem}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={reveal}
                transition={{ ...transition, delay: index * 0.05 }}
                whileHover={reduceMotion ? undefined : { x: 6 }}
                className="group relative grid grid-cols-[54px_1fr] gap-4 overflow-hidden rounded-[20px] border border-border/80 bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-background"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 font-mono text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  0{index + 1}
                </span>
                <p className="self-center text-base leading-relaxed text-muted-foreground md:text-lg">{problem}</p>
                {index < PROBLEMS.length - 1 && (
                  <span className="absolute bottom-0 left-[27px] top-[58px] hidden w-px bg-gradient-to-b from-primary/25 to-transparent md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </section>

        <section className="bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 py-20 lg:py-24">
            <SectionTitle
              title="От задачи до ML-паспорта"
              desc="Шесть понятных шагов превращают работу над моделью в подтвержденный результат."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 border-l border-t border-border">
              {WORKFLOW.map((step, index) => (
                <motion.div
                  key={`${step.title}-${index}`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.25 }}
                  variants={reveal}
                  transition={{ ...transition, delay: index * 0.05 }}
                  className="group relative border-b border-r border-border p-6 md:p-7"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <step.icon size={21} />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <SectionTitle
            title="Всё для роста в одном месте"
            desc="Практика, соревнование и карьерный профиль связаны между собой, поэтому каждый результат работает дальше."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                whileHover={reduceMotion ? undefined : { y: -5 }}
                viewport={{ once: true, amount: 0.3 }}
                variants={reveal}
                transition={{ ...transition, delay: index * 0.05 }}
                className="group border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/40"
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-8 ${feature.color}`}>
                  <feature.icon size={21} />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                <ChevronRight size={18} className="mt-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </motion.div>
            ))}
          </div>
        </section>

        <section className="bg-card">
          <div className="max-w-7xl mx-auto px-4 py-20 lg:py-24">
            <SectionTitle
              title={<>Четыре лиги.<br />Один понятный маршрут.</>}
              desc="Каждый результат меняет позицию в рейтинге и приближает к следующей лиге."
            />
            <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-stretch">
              <div className="grid grid-cols-2 border-l border-t border-border">
                {LEAGUES.map((league, index) => (
                  <motion.div
                    key={league.name}
                    initial="hidden"
                    whileInView="visible"
                    whileHover={reduceMotion ? undefined : { y: -5, scale: 1.015 }}
                    viewport={{ once: true, amount: 0.4 }}
                    variants={reveal}
                    transition={{ ...transition, delay: index * 0.08 }}
                    className="group relative border-b border-r border-border bg-background p-5 text-center transition-shadow hover:z-10 hover:shadow-lg md:p-7"
                  >
                    <motion.div
                      className="absolute left-0 right-0 top-0 h-1 bg-primary"
                      style={{ opacity: 0.35 + index * 0.2 }}
                      animate={reduceMotion ? undefined : { scaleX: [0.75, 1, 0.75] }}
                      transition={{ duration: 2.8 + index * 0.25, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="mb-4 inline-block"
                      animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
                      transition={{ duration: 3.2 + index * 0.2, delay: index * 0.15, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <LeagueBadge rating={league.rating} size="lg" />
                    </motion.div>
                    <div className="font-heading font-semibold">{league.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{league.range}</div>
                  </motion.div>
                ))}
              </div>
              <ArenaPreview />
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <SectionTitle title="Для кого ML-Арена" />
          <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 lg:grid-cols-5">
            {AUDIENCES.map((audience, index) => (
              <motion.div
                key={audience.title}
                initial="hidden"
                whileInView="visible"
                whileHover={reduceMotion ? undefined : { y: -5 }}
                viewport={{ once: true, amount: 0.4 }}
                variants={reveal}
                transition={{ ...transition, delay: index * 0.05 }}
                className="group bg-background p-5 transition-shadow hover:z-10 hover:shadow-lg md:p-6"
              >
                <motion.div
                  className="mb-7 w-fit text-primary"
                  animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
                  transition={{ duration: 3 + index * 0.18, delay: index * 0.12, repeat: Infinity, ease: "easeInOut" }}
                >
                  <audience.icon size={23} />
                </motion.div>
                <h3 className="font-heading font-semibold mb-2">{audience.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{audience.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="bg-secondary/30">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={transition}
            className="max-w-7xl mx-auto grid gap-12 px-4 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-28"
          >
            <div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold mb-5">
                Навыки, которые не нужно доказывать словами
              </h2>
              <p className="max-w-xl text-muted-foreground leading-relaxed">
                Результаты, лиги, бейджи и история отправок собираются в одном профиле и показывают работодателям реальный уровень.
              </p>
              <div className="mt-6 flex items-center gap-3 text-sm font-medium">
                <Award size={18} className="text-primary" />
                Подтверждено результатами на платформе
              </div>
            </div>
            <PassportPreview />
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={reveal}
            transition={transition}
            className="relative overflow-hidden border border-primary/30 bg-primary px-6 py-12 text-center text-primary-foreground md:px-12 md:py-16"
          >
            <Sparkles className="mx-auto mb-5 opacity-80" size={28} />
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">Готов выйти на арену?</h2>
            <p className="mx-auto mb-8 max-w-xl text-primary-foreground/75">
              Начни с первой задачи и преврати практику в результат, который видно.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="h-12 px-8">
                <Link to={primaryTarget}>
                  {isAuthenticated ? "Открыть профиль" : "Предрегистрация"} <ArrowRight size={18} className="ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 border-primary-foreground/30 bg-transparent px-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to={isAuthenticated ? "/competitions" : "/login"}>
                  <Users size={18} className="mr-2" /> {isAuthenticated ? "Будущие разделы" : "Уже есть аккаунт"}
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-border py-9">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ArenaLogoMark className="h-8 w-8" />
            <span className="font-heading font-bold">ML-Арена</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 ML-Арена. Практика, рейтинг и ML-паспорт.</p>
        </div>
      </footer>
    </div>
  );
}
