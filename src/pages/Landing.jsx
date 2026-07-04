import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Swords, Trophy, Brain, Zap, Shield, Users, Building2,
  ArrowRight, Github, Code2, Target, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LeagueBadge from "@/components/ml/LeagueBadge";

const FEATURES = [
  { icon: Swords, title: "Дуэли 1×1", desc: "Сразись с соперником в реальном времени. Таймер, чат, автоматическое определение победителя.", color: "#7C3AED" },
  { icon: Trophy, title: "Соревнования", desc: "Участвуй в публичных и закрытых турнирах от компаний. Загружай решения в CSV.", color: "#06B6D4" },
  { icon: Brain, title: "ML-паспорт", desc: "Радарная диаграмма навыков, бейджи и подтверждённые достижения — твой цифровой портфель.", color: "#EC4899" },
  { icon: Building2, title: "HR-воронка", desc: "Компании видят твой паспорт и отправляют приглашения на собеседование.", color: "#F59E0B" },
  { icon: Shield, title: "Система лиг", desc: "Бронза, Серебро, Золото, Платина — расти в рейтинге и переходи в высшие лиги.", color: "#10B981" },
  { icon: Zap, title: "Автопроверка", desc: "Изолированное выполнение проверочных скриптов. Мгновенный скор и обновление лидерборда.", color: "#8B5CF6" },
];

const LEAGUES = [
  { name: "Бронза", range: "0–1099", class: "league-bronze", rating: 1000 },
  { name: "Серебро", range: "1100–1299", class: "league-silver", rating: 1200 },
  { name: "Золото", range: "1300–1499", class: "league-gold", rating: 1400 },
  { name: "Платина", range: "1500+", class: "league-platinum", rating: 1600 },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Swords size={16} className="text-white" />
            </div>
            <span className="font-heading font-bold">ML Арена</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm"><Link to="/competitions">Соревнования</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/duels">Дуэли</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/leaderboard">Рейтинг</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/pricing">Тарифы</Link></Button>
            <Button asChild size="sm" className="ml-1 glow-purple"><Link to="/login">Войти</Link></Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden grid-bg">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-40 right-1/4 w-96 h-96 rounded-full bg-accent/20 blur-[120px]" />

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Арена для <span className="text-gradient-purple">ML-гладиаторов</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Соревнования и дуэли 1×1 для ML-специалистов. Прокачивай навыки,
              поднимайся в рейтинге и попадай в поле зрения топовых компаний.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 px-8 text-base glow-purple">
                <Link to="/register">
                  Вступить в арену <ArrowRight size={18} className="ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                <Link to="/competitions">
                  <Trophy size={18} className="mr-2" /> Смотреть соревнования
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link to="/login">
                  <Github size={16} className="mr-1.5" /> Войти через GitHub
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
          >
            {[
              { value: "1,200+", label: "Участников", icon: Users },
              { value: "45", label: "Соревнований", icon: Trophy },
              { value: "830+", label: "Дуэлей", icon: Swords },
              { value: "12", label: "Компаний-партнёров", icon: Building2 },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <s.icon size={20} className="mx-auto text-muted-foreground mb-1.5" />
                <div className="text-2xl font-bold font-heading">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Leagues */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Система лиг</h2>
          <p className="text-muted-foreground">Побеждай в дуэлях и соревнованиях, чтобы подняться в рейтинге</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {LEAGUES.map((league, i) => (
            <motion.div
              key={league.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className={`rounded-xl p-5 text-center border border-border ${league.class}`}>
                <div className="inline-block mb-2">
                  <LeagueBadge rating={league.rating} size="lg" />
                </div>
                <div className="text-2xl font-bold font-heading text-black/80">{league.range}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Возможности платформы</h2>
          <p className="text-muted-foreground">Всё для роста и монетизации твоих ML-навыков</p>
        </div>
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
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${f.color}20`, color: f.color }}
              >
                <f.icon size={20} />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Как это работает</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Code2, step: "01", title: "Регистрируйся", desc: "Создай профиль, заполни ML-паспорт и получи стартовый рейтинг 1000." },
            { icon: Target, step: "02", title: "Соревнуйся", desc: "Участвуй в соревнованиях или вызывай соперников на дуэли 1×1." },
            { icon: TrendingUp, step: "03", title: "Расти и найди работу", desc: "Поднимайся в лигах, получай бейджи и приглашения от компаний." },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="text-5xl font-bold text-primary/10 font-heading absolute -top-4 -left-2">{item.step}</div>
              <div className="relative pt-6">
                <item.icon size={24} className="text-primary mb-3" />
                <h3 className="font-heading font-semibold text-lg mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 md:p-12 text-center">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary/20 blur-[80px]" />
          <div className="relative">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Готов выйти на арену?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Присоединяйся к сообществу ML-гладиаторов и начни свой путь к Платине уже сегодня.
            </p>
            <Button asChild size="lg" className="h-12 px-8 glow-purple">
              <Link to="/register">
                Создать аккаунт <ArrowRight size={18} className="ml-1" />
              </Link>
            </Button>
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
          <p className="text-sm text-muted-foreground">© 2026 ML Арена. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}