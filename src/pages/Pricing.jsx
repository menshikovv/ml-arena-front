import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Crown,
  FileCheck2,
  MessageCircle,
  ShieldCheck,
  Target,
  Trophy,
  Video,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: FileCheck2,
    title: "Разбор от специалиста",
    description: "Раз в месяц отправьте одно решение на разбор и получите рекомендации по улучшению подхода.",
    note: "1 review credit в месяц",
  },
  {
    icon: BarChart3,
    title: "Детальная аналитика",
    description: "Score curve, baseline improvement, public/private gap, ошибки submit-ов и слабые места.",
    note: "Автоматическая аналитика без лимита",
  },
  {
    icon: MessageCircle,
    title: "Закрытый чат",
    description: "Обсуждения, вопросы, анонсы и мини-разборы в профессиональном Premium-сообществе.",
    note: "Комьюнити ML Арены",
  },
  {
    icon: Video,
    title: "Вебинары и семинары",
    description: "Разборы задач, типовые ошибки, валидация, ML system design и подготовка к собеседованиям.",
    note: "1–2 закрытых события в месяц",
  },
  {
    icon: Trophy,
    title: "Premium-соревнования",
    description: "Закрытые тренировки, мини-челленджи и отдельные соревнования с собственными правилами.",
    note: "В отдельных активностях есть призы",
  },
  {
    icon: Crown,
    title: "Premium-статус",
    description: "Бейдж Premium в профиле и доступ к закрытым разделам платформы.",
    note: "Статус для активного ядра ML Арены",
  },
];

const COMPARISON_ROWS = [
  { label: "Базовое участие в соревнованиях", free: true, premium: true },
  { label: "Публичные дуэли и leaderboard", free: true, premium: true },
  { label: "Базовый ML-паспорт", free: true, premium: true },
  { label: "Детальная аналитика решений", free: false, premium: true },
  { label: "Разбор специалистом", free: false, premium: true },
  { label: "Закрытые вебинары и чат", free: false, premium: true },
  { label: "Premium-соревнования", free: false, premium: true },
  { label: "Premium-бейдж и закрытые разделы", free: false, premium: true },
];

const HOW_IT_WORKS = [
  { icon: Target, title: "Решите задачу", description: "Участвуйте в соревнованиях и дуэлях как обычно." },
  { icon: BarChart3, title: "Изучите аналитику", description: "После submit увидьте score curve, baseline и устойчивость результата." },
  { icon: FileCheck2, title: "Отправьте на разбор", description: "Выберите один результат в месяц и получите обратную связь специалиста." },
  { icon: Video, title: "Приходите на вебинар", description: "Разбирайте типовые ошибки и практику вместе с сообществом." },
  { icon: Zap, title: "Улучшайте паспорт", description: "Превращайте каждый результат в следующий шаг роста в ML." },
];

const ACTIVITIES = [
  {
    type: "Вебинар",
    title: "Как не переобучаться под public leaderboard",
    detail: "Разбираем validation split, private gap и практические сигналы overfit.",
    date: "30 июля · 19:00",
    level: "Для всех уровней",
    icon: Video,
  },
  {
    type: "Premium-челлендж",
    title: "Табличный спринт: от baseline до top-10",
    detail: "Короткая задача на feature engineering и аккуратную валидацию.",
    date: "2 августа · дедлайн 23:59",
    level: "Средний уровень",
    icon: Trophy,
  },
];

const FAQ_ITEMS = [
  {
    question: "Можно ли отменить подписку?",
    answer: "Да. Автопродление можно отключить в личном кабинете. Уже оплаченный период останется доступен до даты окончания.",
  },
  {
    question: "Premium даёт преимущество в рейтинговых соревнованиях?",
    answer: "Нет. Подписка не повышает рейтинг, не влияет на подбор соперников и не даёт скрытых ответов. Соревнования остаются честными для всех.",
  },
  {
    question: "Что входит в разбор специалистом?",
    answer: "Вы выбираете один submit или дуэль и получаете рекомендации по подходу, валидации, ошибкам и следующему улучшению.",
  },
  {
    question: "Призы гарантированы в каждом закрытом соревновании?",
    answer: "Нет. В отдельных Premium-активностях могут быть призы или розыгрыши. Условия всегда указаны в правилах конкретного события.",
  },
  {
    question: "Будет ли Premium повышать мой приоритет у работодателей?",
    answer: "Нет. Premium-статус не влияет на HR-ранжирование. Работодатели видят реальные навыки и подтверждённые результаты ML-паспорта.",
  },
];

function SectionTitle({ title, description }) {
  return (
    <div className="mb-6 max-w-2xl">
      <h2 className="font-heading text-2xl font-bold md:text-3xl">{title}</h2>
      {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>
  );
}

function IncludedIcon({ included }) {
  return included ? (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
      <Check size={13} />
    </span>
  ) : (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
      <X size={13} />
    </span>
  );
}

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState(0);
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 md:px-6 md:py-10">
      <Reveal>
        <section className="relative overflow-hidden rounded-lg border border-border bg-card">
          <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          <div className="grid items-center gap-8 p-6 md:p-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <div>
              <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">ML Арена Premium</h1>
              <p className="mt-3 max-w-xl font-heading text-xl font-semibold leading-snug md:text-2xl">
                Больше практики. Больше обратной связи. Быстрее рост в ML.
              </p>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                Разбирайте свои решения глубже, получайте обратную связь от специалистов и участвуйте в закрытых ML-активностях платформы.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" className="shadow-lg shadow-primary/20">
                  Подключить Premium
                  <ArrowRight size={17} />
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="#features">Посмотреть, что входит</a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Можно отменить автопродление в личном кабинете.</p>
            </div>

            <div className="mx-auto w-full max-w-[440px]">
              <Card className="relative overflow-hidden border-foreground bg-foreground p-5 text-background shadow-xl shadow-foreground/10">
                <div className="flex items-start justify-between gap-4 border-b border-background/15 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground"><Crown size={18} /></span>
                      <div>
                        <p className="font-heading font-bold">ML Арена Premium</p>
                        <p className="text-xs text-background/60">Founder Season</p>
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full border border-background/15 bg-background/10 px-2.5 py-1 text-[11px] font-semibold text-background">Стартовая цена</span>
                </div>
                <div className="py-6">
                  <div className="flex items-end gap-3">
                    <span className="font-heading text-5xl font-bold">690 ₽</span>
                    <span className="pb-1 text-xl text-background/45 line-through decoration-background/55">990 ₽</span>
                  </div>
                  <p className="mt-1 text-sm text-background/60">в месяц · на старте Founder Season</p>
                </div>
                <div className="space-y-3 border-t border-background/15 pt-4 text-sm">
                  {[
                    "Детальная аналитика решений",
                    "1 разбор специалистом в месяц",
                    "Закрытые вебинары и чат",
                    "Premium-соревнования и бейдж",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-background/85"><CheckCircle2 size={16} className="shrink-0 text-accent" />{item}</div>
                  ))}
                </div>
                <Button className="mt-5 w-full bg-background text-foreground hover:bg-background/90" size="lg">Оформить Premium</Button>
              </Card>
            </div>
          </div>
          <div className="grid border-t border-border bg-secondary/35 sm:grid-cols-3">
            {[
              { value: "1 разбор", label: "специалиста в месяц" },
              { value: "1–2 события", label: "закрытых вебинара и семинара" },
              { value: "Без лимита", label: "детальная аналитика submit-ов" },
            ].map((item) => (
              <div key={item.value} className="border-b border-border px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <p className="font-heading text-lg font-bold">{item.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.06}>
        <section>
          <SectionTitle title="Free остаётся входной точкой" description="Базовое участие в ML Арене бесплатно. Premium добавляет слой обучения, аналитики и закрытой практики, но не закрывает соревнования и не меняет правила рейтинга." />
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_72px_88px] border-b border-border bg-secondary/60 md:grid-cols-[1fr_0.45fr_0.55fr]">
              <div className="p-4 text-sm font-semibold">Возможность</div>
              <div className="p-4 text-center text-sm font-semibold text-muted-foreground">Free</div>
              <div className="flex items-center justify-center gap-1.5 bg-primary/10 p-4 text-center text-sm font-semibold text-primary"><Crown size={14} /> Premium</div>
            </div>
            {COMPARISON_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_72px_88px] items-center border-b border-border transition-colors last:border-0 hover:bg-secondary/25 md:grid-cols-[1fr_0.45fr_0.55fr]">
                <div className="p-4 text-sm">{row.label}</div>
                <div className="flex justify-center p-4"><IncludedIcon included={row.free} /></div>
                <div className="flex h-full items-center justify-center bg-primary/[0.035] p-4"><IncludedIcon included={row.premium} /></div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal id="features" className="mt-16" delay={0.1}>
        <section>
          <SectionTitle title="Что входит в Premium" description="Все преимущества собраны вокруг одного результата: понимать, почему получился такой score, и знать, что улучшать дальше." />
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <StaggerItem key={feature.title} className="h-full">
                <div className="group relative h-full overflow-hidden rounded-lg border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-primary to-accent transition-transform duration-300 group-hover:scale-x-100" />
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <feature.icon size={19} />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  <p className="mt-4 inline-flex rounded-md bg-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground">{feature.note}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.12}>
        <section className="grid items-center gap-8 rounded-lg border border-border bg-secondary/35 p-5 md:p-8 lg:grid-cols-[0.76fr_1.24fr]">
          <div>
            <SectionTitle title="Не просто score. Понимание, как его улучшить." description="После submit Premium превращает сырые цифры в понятную картину: где вы относительно baseline, насколько устойчив private-результат и какие ошибки повторяются." />
            <Button variant="outline">Посмотреть пример аналитики <ArrowRight size={16} /></Button>
          </div>
          <Card className="border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="font-semibold">Детальная аналитика · Детекция аномалий</p>
                <p className="mt-1 text-xs text-muted-foreground">Private leaderboard · ROC-AUC</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Разбор готов</span>
            </div>
            <div className="grid grid-cols-2 gap-3 py-5 sm:grid-cols-4">
              {[
                { label: "Score", value: "0.941", detail: "+12.4% к baseline" },
                { label: "Private gap", value: "Низкий", detail: "−2 позиции" },
                { label: "Submit curve", value: "9", detail: "попыток" },
                { label: "Позиция", value: "top-1.3%", detail: "8 из 612" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 font-heading text-lg font-bold">{metric.value}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{metric.detail}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4">
              <div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Score curve</span><span className="font-semibold text-primary">baseline → best</span></div>
              <div className="flex h-20 items-end gap-1.5 rounded-lg bg-secondary/45 px-3 pb-2 pt-3">
                {[28, 38, 45, 43, 58, 64, 72, 68, 84, 93].map((height, index) => (
                  <div key={index} className="flex-1 rounded-t-sm bg-gradient-to-t from-primary to-accent" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </Card>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.14}>
        <section>
          <SectionTitle title="Как работает Premium" description="Один понятный маршрут от задачи до следующего улучшения ML-паспорта." />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title} className="relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm">
                <span className="absolute inset-x-0 top-0 h-0.5 bg-primary/60" />
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><step.icon size={17} /></span>
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.16}>
        <section>
          <SectionTitle title="Закрытые активности" description="Живая практика, дополнительные разборы и события для Premium-сообщества." />
          <div className="grid gap-4 md:grid-cols-2">
            {ACTIVITIES.map((activity) => (
              <div key={activity.title} className="flex flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><activity.icon size={19} /></span>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{activity.type}</span>
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold">{activity.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{activity.detail}</p>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays size={14} /> {activity.date}</span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">{activity.level} <ArrowRight size={13} /></span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.18}>
        <section className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-primary/5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck size={19} /></span>
            <div>
              <h2 className="font-heading text-lg font-bold">Честность leaderboard сохраняется</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Premium не влияет на рейтинг, не даёт скрытых ответов и не создаёт преимущества в публичных рейтинговых соревнованиях.</p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-semibold text-primary">Одинаковые правила для всех</span>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.2}>
        <section className="mx-auto max-w-3xl">
          <SectionTitle title="Частые вопросы" description="Коротко о подписке, разборе и правилах участия." />
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              const answerId = `pricing-faq-${index}`;

              return (
                <div key={item.question} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold transition-colors hover:bg-secondary/35",
                      isOpen && "bg-secondary/35",
                    )}
                  >
                    <span>{item.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
                    >
                      <ChevronDown size={17} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={answerId}
                        role="region"
                        initial={reduceMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-2xl px-5 pb-5 pr-14 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.22}>
        <section className="overflow-hidden rounded-lg bg-foreground text-background">
          <div className="grid items-center gap-6 p-6 md:grid-cols-[1fr_auto] md:p-10">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-background/70"><Crown size={16} /> ML Арена Premium</div>
              <h2 className="mt-2 max-w-xl font-heading text-2xl font-bold md:text-3xl">Превращайте каждый score в следующий шаг роста.</h2>
              <p className="mt-2 text-sm text-background/65">Обратная связь, аналитика и закрытая практика в одной подписке.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:flex-col md:items-end">
              <div className="text-left sm:text-right">
                <span className="font-heading text-3xl font-bold">690 ₽</span>
                <span className="ml-2 text-sm text-background/45 line-through">990 ₽</span>
                <p className="text-xs text-background/55">в месяц</p>
              </div>
              <Button size="lg" variant="secondary" className="shrink-0">Подключить Premium <ArrowRight size={17} /></Button>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-7 text-center" delay={0.24}>
        <p className="text-sm text-muted-foreground">Нужны особые условия для команды? <Link to="#" className="font-medium text-primary hover:underline">Свяжитесь с нами</Link></p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Clock3 size={13} /> Отмена автопродления доступна в личном кабинете.</p>
      </Reveal>
    </div>
  );
}
