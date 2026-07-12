import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  { icon: Target, title: "Задача", desc: "Выбираешь соревнование, скачиваешь данные и описание." },
  { icon: Code2, title: "Модель", desc: "Работаешь с Python, pandas, sklearn, CatBoost или любыми другими инструментами." },
  { icon: Upload, title: "CSV", desc: "Загружаешь решение, платформа проверяет файл и считает score." },
  { icon: BarChart3, title: "Leaderboard", desc: "Сравниваешь результат с другими участниками." },
  { icon: LineChart, title: "Рейтинг", desc: "Растешь через соревнования, дуэли и сезоны." },
  { icon: Radar, title: "ML-паспорт", desc: "Результаты превращаются в понятное подтверждение навыков." },
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

function SectionTitle({ eyebrow, title, desc }) {
  return (
    <div className="text-center mb-10">
      {eyebrow && <p className="text-sm font-medium text-primary mb-2">{eyebrow}</p>}
      <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">{title}</h2>
      {desc && <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">{desc}</p>}
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
    <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-xl shadow-primary/10">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
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
          <div key={label} className="rounded-xl bg-secondary/70 p-3 text-center">
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
      <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-background/70 p-3 text-sm text-muted-foreground">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
        Подтвержденные результаты, score и бейджи вместо самооценки в профиле.
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Swords size={16} className="text-white" />
            </div>
            <span className="font-heading font-bold">ML Арена</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Button asChild variant="ghost" size="sm"><Link to="/competitions">Соревнования</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/duels">Дуэли</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/leaderboard">Рейтинг</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/pricing">Тарифы</Link></Button>
          </nav>
          <Button asChild size="sm" className="ml-1 shadow-lg shadow-primary/20">
            <Link to="/register">Предрегистрация</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--primary)/0.12),transparent_55%,hsl(var(--background)))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,hsl(var(--primary)/0.2),transparent_34%),radial-gradient(circle_at_70%_20%,hsl(var(--accent)/0.18),transparent_30%)]" />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-6">
              ML Арена
            </h1>
            <p className="text-2xl md:text-4xl font-heading font-semibold max-w-4xl mx-auto mb-5">
              Докажи навык в машинном обучении результатом
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              Платформа соревнований и дуэлей по ML для студентов,<br />junior-специалистов и всех, кто хочет войти в AI через практику.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20">
                <Link to="/register">
                  Пройти предрегистрацию <ArrowRight size={18} className="ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base bg-background/60">
                <Link to="/competitions">
                  <Trophy size={18} className="mr-2" /> Смотреть соревнования
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto"
          >
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card/70 p-4 text-center backdrop-blur">
                <s.icon size={20} className="mx-auto text-primary mb-2" />
                <div className="text-2xl font-bold font-heading">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-7 md:p-10"
        >
          <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Founder Season</h2>
              <p className="text-muted-foreground leading-relaxed">
                ML Арена еще находится в разработке, но мы уже собираем первых участников.
                В предсезоне будут мини-задачи, разборы, ранний рейтинг, подготовка к соревнованию открытия и призы для самых первых участников платформы.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                {["Мини-задачи", "Разборы", "Ранний рейтинг"].map((item) => (
                  <div key={item} className="rounded-xl bg-card p-4 text-sm font-medium">
                    {item}
                  </div>
                ))}
              </div>
              <Button asChild className="mt-5 w-full">
                <Link to="/register">
                  Попасть в Founder Season <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <SectionTitle
          title="Войти в ML сложно. Доказать навык еще сложнее."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROBLEMS.map((problem, i) => (
            <motion.div
              key={problem}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl p-5 bg-card/60 border border-border"
            >
              <div className="text-4xl font-bold text-primary/10 font-heading mb-2">0{i + 1}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{problem}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <SectionTitle
          eyebrow="Как работает ML Арена"
          title="Задача → CSV → Score → Leaderboard → Рейтинг → ML-паспорт"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-3">
          {WORKFLOW.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="relative rounded-xl border border-border bg-card/70 p-4"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <step.icon size={20} />
              </div>
              <div className="text-xs text-muted-foreground mb-1">0{i + 1}</div>
              <h3 className="font-heading font-semibold mb-2">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              {i < WORKFLOW.length - 1 && (
                <ChevronRight size={18} className="hidden lg:block absolute top-1/2 -right-3 text-muted-foreground bg-background rounded-full" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <SectionTitle
          title="Возможности платформы"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative group rounded-xl p-5 bg-card/60 border border-border hover:border-primary/40 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${f.color}`}>
                <f.icon size={20} />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <SectionTitle
          title="Система лиг"
          desc="Побеждай в соревнованиях и дуэлях, чтобы подниматься в рейтинге и переходить в высшие лиги."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {LEAGUES.map((league, i) => (
            <motion.div
              key={league.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl p-5 text-center border border-border bg-card/70"
            >
              <div className="inline-block mb-3">
                <LeagueBadge rating={league.rating} size="lg" />
              </div>
              <div className="font-heading font-semibold">{league.name}</div>
              <div className="text-sm text-muted-foreground">{league.range}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <SectionTitle
          title="Для кого ML Арена"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {AUDIENCES.map((audience, i) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card/60 p-5"
            >
              <audience.icon size={22} className="text-primary mb-3" />
              <h3 className="font-heading font-semibold mb-2">{audience.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{audience.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
          <div>
            <p className="text-sm font-medium text-primary mb-2">ML-паспорт</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              Покажи подтвержденные навыки, а не только слова в резюме
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Award size={18} className="text-primary" />
              Score, лиги, бейджи и история submit в одном профиле.
            </div>
          </div>
          <PassportPreview />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 md:p-12 text-center">
          <div className="relative">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Готов выйти на арену?</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 px-8 shadow-lg shadow-primary/20">
                <Link to="/register">
                  Пройти предрегистрацию <ArrowRight size={18} className="ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 bg-background/60">
                <Link to="/login">
                  <Users size={18} className="mr-2" /> Уже есть аккаунт
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
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
