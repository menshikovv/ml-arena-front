import React from "react";
import { Link } from "react-router-dom";
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
  FileSpreadsheet,
  Flame,
  GraduationCap,
  LineChart,
  Medal,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LeagueBadge from "@/components/ml/LeagueBadge";

const FEATURES = [
  { icon: Trophy, title: "Соревнования", desc: "Публичные и закрытые ML-задачи: regression, classification, NLP, CV и tabular. Загружай решения и двигайся вверх по leaderboard.", color: "text-primary bg-primary/10" },
  { icon: Swords, title: "Дуэли 1x1", desc: "Быстрые сражения с таймером, submit и сравнением результата. Формат для практики, азарта и проверки себя.", color: "text-accent-foreground bg-accent/20" },
  { icon: Medal, title: "Рейтинг и лиги", desc: "Единая система прогресса: соревнования, дуэли, сезоны и переходы из Бронзы к Платине.", color: "text-[hsl(var(--chart-5))] bg-[hsl(var(--chart-5)/0.16)]" },
  { icon: Brain, title: "ML-паспорт", desc: "Score, бейджи, сильные стороны и подтвержденные результаты вместо пустых слов в резюме.", color: "text-[hsl(var(--chart-3))] bg-[hsl(var(--chart-3)/0.16)]" },
  { icon: Building2, title: "Компании", desc: "HR-воронка для поиска junior ML/DS и молодых AI-специалистов, которые уже показали практический результат.", color: "text-[hsl(var(--chart-2))] bg-[hsl(var(--chart-2)/0.16)]" },
  { icon: Zap, title: "Автопроверка", desc: "CSV-submit, расчет score, обновление leaderboard и понятная обратная связь по решению.", color: "text-primary bg-primary/10" },
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
  { icon: Upload, title: "CSV", desc: "Загружаешь готовый CSV-файл. Платформа автоматически проверяет формат, считает score по метрике соревнования и фиксирует результат." },
  { icon: BarChart3, title: "Leaderboard", desc: "Сразу видишь свою позицию относительно других участников. Сравниваешь подходы и понимаешь, где твой текущий уровень." },
  { icon: LineChart, title: "Рейтинг", desc: "Каждый результат влияет на рейтинг. Растешь через соревнования, побеждаешь в дуэлях и поднимаешься по лигам от Бронзы к Платине." },
  { icon: Radar, title: "ML-паспорт", desc: "Все результаты, score и бейджи собираются в один профиль — подтвержденное доказательство навыков для работодателей и коллег." },
];

const AUDIENCES = [
  { icon: Rocket, title: "Новички", desc: "Starter-задачи, baseline и разборы помогают сделать первый валидный submit." },
  { icon: GraduationCap, title: "Студенты", desc: "Сравнивай себя с участниками из других вузов и участвуй в кампусных челленджах." },
  { icon: ShieldCheck, title: "Junior ML/DS", desc: "Покажи практический уровень через score, стабильность и решения на задачах." },
  { icon: Flame, title: "Сильные участники", desc: "Соревнуйся в рейтинговых турнирах, дуэлях и private leaderboard." },
  { icon: Building2, title: "Компании", desc: "Находите людей, которые уже доказали результат на практических задачах." },
];

const STATS = [
  { value: "Founder", label: "предсезон до запуска", icon: Sparkles },
  { value: "CSV", label: "формат решений", icon: FileSpreadsheet },
  { value: "1x1", label: "дуэли и сезоны", icon: Swords },
  { value: "4", label: "лиги роста", icon: Medal },
];

function SectionTitle({ eyebrow, title, desc, align = "center" }) {
  const isLeft = align === "left";

  return (
    <div className={`${isLeft ? "text-left" : "text-center"} mb-10`}>
      {eyebrow && <p className="text-xs font-semibold uppercase text-primary mb-3">{eyebrow}</p>}
      <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4 max-w-4xl mx-auto">{title}</h2>
      {desc && <p className={`text-muted-foreground max-w-2xl leading-relaxed ${isLeft ? "" : "mx-auto"}`}>{desc}</p>}
    </div>
  );
}

function ArenaPreview() {
  const rows = [
    { rank: "01", name: "datawizard", task: "Credit Scoring", score: "0.9412", change: "+24" },
    { rank: "02", name: "ml_ninja", task: "NLP Sentiment", score: "0.9368", change: "+18" },
    { rank: "03", name: "Ты", task: "House Prices", score: "0.9214", change: "+31", active: true },
  ];

  return (
    <div className="relative mx-auto mt-12 max-w-5xl">
      <div className="flex items-center justify-between border-b border-border/80 px-2 pb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Арена сейчас
        </span>
        <span>Season 01 · Live leaderboard</span>
      </div>
      <div className="divide-y divide-border/70">
        {rows.map((row, index) => (
          <motion.div
            key={row.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 + index * 0.1 }}
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
      <div className="pointer-events-none absolute -left-16 top-10 hidden h-20 w-1 bg-primary md:block" />
      <div className="pointer-events-none absolute -right-12 bottom-8 hidden h-28 w-1 bg-accent md:block" />
    </div>
  );
}

function PassportPreview() {
  const skills = [
    { label: "Tabular", value: "92%" },
    { label: "Classification", value: "88%" },
    { label: "Feature engineering", value: "81%" },
  ];

  return (
    <div className="border border-border bg-card p-5 shadow-2xl shadow-primary/10 md:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <div className="font-heading font-bold">ML-паспорт</div>
            <div className="text-sm text-muted-foreground">Junior ML Engineer</div>
          </div>
        </div>
        <LeagueBadge rating={1420} />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          ["12", "submit"],
          ["4", "задачи"],
          ["86%", "percentile"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-lg bg-secondary/70 p-3 text-center">
            <div className="font-heading text-xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {skills.map((skill) => (
          <div key={skill.label}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">{skill.label}</span>
              <span className="text-muted-foreground">{skill.value}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-primary" style={{ width: skill.value }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-background/70 p-3 text-sm text-muted-foreground">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
        Подтвержденные результаты, score и бейджи вместо самооценки в профиле.
      </div>
    </div>
  );
}

export default function Landing() {
  const reduceMotion = useReducedMotion();
  const reveal = {
    hidden: reduceMotion ? {} : { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0 },
  };
  const transition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] };

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Swords size={16} className="text-white" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent" />
            </div>
            <span className="font-heading text-lg font-bold">ML Арена</span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/competitions">Соревнования</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/duels">Дуэли</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/leaderboard">Лидерборд</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/pricing">Тарифы</Link></Button>
          </nav>
          <Button asChild size="sm" className="ml-1 shadow-lg shadow-primary/20">
            <Link to="/register">Войти на арену <ArrowRight size={15} className="ml-1" /></Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative border-b border-border bg-card">
          <div className="absolute left-0 top-28 h-24 w-1 bg-primary" />
          <div className="absolute right-0 top-56 h-40 w-1 bg-accent" />
          <div className="relative max-w-7xl mx-auto px-4 pt-14 pb-12 text-center md:pt-20">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition}
            >
              <h1 className="font-heading text-5xl md:text-7xl font-bold mb-5">
                ML Арена
              </h1>
              <p className="text-2xl md:text-4xl font-heading font-semibold max-w-4xl mx-auto mb-5">
                Докажи навык в машинном обучении результатом
              </p>
              <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
                Соревнования, дуэли и подтвержденный ML-паспорт для тех, <br />кто входит в AI через практику.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/20">
                  <Link to="/register">
                    Регистрация <ArrowRight size={18} className="ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background">
                  <Link to="/competitions">
                    <Trophy size={18} className="mr-2" /> Смотреть соревнования
                  </Link>
                </Button>
              </div>
            </motion.div>

            <ArenaPreview />
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={reveal}
                transition={{ ...transition, delay: index * 0.06 }}
                className="border-b border-r border-border p-5 text-center md:border-b-0 md:p-7"
              >
                <stat.icon size={20} className="mx-auto mb-2 text-primary" />
                <div className="font-heading text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-b border-border bg-secondary/35">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={reveal}
            transition={transition}
            className="max-w-7xl mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:py-20"
          >
            <div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">Founder Season</h2>
              <p className="max-w-xl text-muted-foreground leading-relaxed">
                ML Арена еще находится в разработке. В предсезоне первые участники получат мини-задачи,
                разборы, ранний рейтинг, подготовку к соревнованию открытия и специальные награды.
              </p>
              <Button asChild className="mt-6">
                <Link to="/register">
                  Попасть в Founder Season <ArrowRight size={16} className="ml-1" />
                </Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-3 border-y border-border">
              {["Мини-задачи", "Разборы", "Ранний рейтинг"].map((item, index) => (
                <div key={item} className="border-b border-border p-5 sm:border-b-0 sm:border-r">
                  <span className="mb-6 block font-mono text-xs text-primary">0{index + 1}</span>
                  <p className="font-heading font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto grid gap-12 px-4 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={reveal}
            transition={transition}
          >
            <h2 className="font-heading text-4xl md:text-5xl font-bold">
              Войти в ML сложно. Доказать навык еще сложнее.
            </h2>
          </motion.div>
          <div className="border-t border-border">
            {PROBLEMS.map((problem, index) => (
              <motion.div
                key={problem}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={reveal}
                transition={{ ...transition, delay: index * 0.05 }}
                className="grid grid-cols-[44px_1fr] gap-4 border-b border-border py-5 md:py-6"
              >
                <span className="font-mono text-sm text-primary">0{index + 1}</span>
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">{problem}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-20 lg:py-24">
            <SectionTitle
              title="От задачи до ML-паспорта"
              desc="Шесть понятных шагов превращают работу над моделью в подтвержденный результат."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 border-l border-t border-border">
              {WORKFLOW.map((step, index) => (
                <motion.div
                  key={step.title}
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
            title="Все для роста в одном контуре"
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

        <section className="border-y border-border bg-secondary/35">
          <div className="max-w-7xl mx-auto px-4 py-20 lg:py-24">
            <SectionTitle
              title="Четыре лиги. Один понятный маршрут."
              desc="Побеждай в соревнованиях и дуэлях, чтобы перейти от первого результата к Платине."
            />
            <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-border">
              {LEAGUES.map((league, index) => (
                <motion.div
                  key={league.name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                  variants={reveal}
                  transition={{ ...transition, delay: index * 0.08 }}
                  className="relative border-b border-r border-border bg-background p-5 text-center md:p-7"
                >
                  <div className="absolute left-0 right-0 top-0 h-1 bg-primary" style={{ opacity: 0.35 + index * 0.2 }} />
                  <div className="mb-4 inline-block"><LeagueBadge rating={league.rating} size="lg" /></div>
                  <div className="font-heading font-semibold">{league.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{league.range}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <SectionTitle title="Для кого ML Арена" />
          <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 lg:grid-cols-5">
            {AUDIENCES.map((audience, index) => (
              <motion.div
                key={audience.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={reveal}
                transition={{ ...transition, delay: index * 0.05 }}
                className="bg-background p-5 md:p-6"
              >
                <audience.icon size={23} className="text-primary mb-7" />
                <h3 className="font-heading font-semibold mb-2">{audience.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{audience.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
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
                Score, лиги, бейджи и история submit собираются в одном профиле и показывают работодателям реальный уровень.
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
                <Link to="/register">
                  Регистрация <ArrowRight size={18} className="ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 border-primary-foreground/30 bg-transparent px-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/login">
                  <Users size={18} className="mr-2" /> Уже есть аккаунт
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-border py-9">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Swords size={16} className="text-white" />
            </div>
            <span className="font-heading font-bold">ML Арена</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 ML Арена. Практика, рейтинг и ML-паспорт.</p>
        </div>
      </footer>
    </div>
  );
}
