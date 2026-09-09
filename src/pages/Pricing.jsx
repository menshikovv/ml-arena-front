import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Compass,
  FileText,
  FlaskConical,
  LineChart,
  LockKeyhole,
  MessagesSquare,
  Presentation,
  Route,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { PageFrame } from "@/components/ml/PageFrame";
import { api } from "@/api/mlArenaApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

function PricingReveal({ children, className, index = 0, direction = "up" }) {
  const reduceMotion = useReducedMotion();
  const offset = direction === "left" ? { x: -34, y: 0 } : direction === "right" ? { x: 34, y: 0 } : { x: 0, y: 34 };
  return <motion.div className={className}
    initial={reduceMotion ? false : { opacity: 0, filter: "blur(8px)", scale: 0.985, ...offset }}
    whileInView={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)", scale: 1 }}
    viewport={{ once: true, amount: 0.18 }}
    transition={{ duration: reduceMotion ? 0 : 0.78, delay: reduceMotion ? 0 : Math.min(index, 4) * 0.09, ease: [0.16, 1, 0.3, 1] }}
  >{children}</motion.div>;
}

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "ML Coach",
    description: "После активности получайте понятный разбор результата: что получилось, что стоит проверить и какой следующий шаг выбрать.",
    note: "После значимой активности",
  },
  {
    icon: Route,
    title: "Персональный план",
    description: "Вместо случайного набора задач — несколько приоритетных шагов, подобранных по вашему ML-паспорту и цели.",
    note: "2–4 приоритетных шага",
  },
  {
    icon: LineChart,
    title: "Расширенная аналитика",
    description: "Следите за динамикой по направлениям, стабильностью результатов, свежестью и достаточностью подтверждений.",
    note: "Полная картина прогресса",
  },
  {
    icon: FlaskConical,
    title: "Лаборатория практики",
    description: "Получайте нерейтинговые задачи, подсказки и подробные разборы подходов после основной попытки.",
    note: "Без влияния на рейтинг",
  },
  {
    icon: ClipboardCheck,
    title: "Экспертный разбор",
    description: "Раз в месяц отправляйте один результат на стандартизированный письменный разбор специалисту ML-Арены.",
    note: "1 разбор в месяц",
  },
  {
    icon: BriefcaseBusiness,
    title: "Карьерная готовность",
    description: "Понимайте, какие компетенции уже подтверждены под выбранное направление и где пока недостаточно данных.",
    note: "Без платного продвижения",
  },
  {
    icon: Presentation,
    title: "Вебинары",
    description: "Встречи и групповые разборы от экспертов, которые помогают развивать навыки и выбирать следующий шаг.",
    note: "Встречи с экспертами",
  },
  {
    icon: MessagesSquare,
    title: "Сообщество",
    description: "Общий чат участников и разработчиков ML-Арены для вопросов, обмена опытом и обсуждения платформы.",
    note: "Чат участников",
  },
];

const COMPARISON_ROWS = [
  { label: "Открытые практические активности", free: "Да", premium: "Да" },
  { label: "Базовый ML-паспорт и подтверждённые результаты", free: "Да", premium: "Да" },
  { label: "Рейтинги и место по направлениям", free: "Да", premium: "Да" },
  { label: "Внешние достижения", free: "Да", premium: "Да" },
  { label: "Базовый результат активности", free: "Да", premium: "Да" },
  { label: "Расширенная аналитика и динамика", free: "Базово", premium: "Полно" },
  { label: "ML Coach после активности", free: "Ограниченно", premium: "Да" },
  { label: "Персональный план развития", free: "Нет", premium: "Да" },
  { label: "Лаборатория практики", free: "Нет", premium: "Да" },
  { label: "Еженедельный отчёт прогресса", free: "Нет", premium: "Да" },
  { label: "Карьерная готовность", free: "Базово", premium: "Расширенно" },
  { label: "Экспертный разбор", free: "Нет", premium: "1 в месяц" },
  { label: "Вебинары и Premium-сообщество", free: "Нет", premium: "Да" },
];

const COACH_INSIGHTS = [
  {
    icon: CheckCircle2,
    title: "Что получилось",
    text: "ML Coach сопоставляет результат с доступной историей и эталоном задачи.",
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: ShieldCheck,
    title: "Где есть риск",
    text: "На поздних временных периодах качество снижается сильнее. Проверьте схему валидации.",
    tone: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: BarChart3,
    title: "Что изменилось",
    text: "ML Coach показывает, как новый подтверждённый результат меняет картину по направлению.",
    tone: "text-primary",
  },
  {
    icon: Compass,
    title: "Следующий шаг",
    text: "Пройдите тренировочную задачу на временное ранжирование или разбор по временной валидации.",
    tone: "text-violet-600 dark:text-violet-400",
  },
];

const DEVELOPMENT_STEPS = [
  { title: "Временная валидация", status: "Приоритет", description: "Закрепить стабильность на данных с временной структурой." },
  { title: "Воспроизводимость", status: "Мало данных", description: "Подготовить одно решение к итоговой проверке кода." },
  { title: "RecSys", status: "Подтверждено", description: "Поддержать направление новым свежим результатом." },
];

const FAQ_ITEMS = [
  {
    question: "Premium влияет на рейтинг?",
    answer: "Нет. Рейтинг и подтверждённые результаты зависят от практической активности, а не от оплаты подписки.",
  },
  {
    question: "Станет ли ML-паспорт сильнее только из-за Premium?",
    answer: "Нет. Premium помогает анализировать и развивать компетенции, но новые подтверждения появляются только из результатов и проверяемых достижений.",
  },
  {
    question: "Что входит в экспертный разбор?",
    answer: "Один стандартизированный письменный разбор выбранного результата в месяц. Формат и ожидаемый срок показываются до отправки.",
  },
  {
    question: "Можно ли отменить подписку?",
    answer: "Да. После отключения автопродления Premium остаётся доступен до конца оплаченного периода.",
  },
  {
    question: "Что будет с результатами после отмены?",
    answer: "Все бесплатные результаты, рейтинг и данные ML-паспорта сохраняются. Закрываются только Premium-функции анализа и обучения.",
  },
  {
    question: "Почему годовой тариф дешевле?",
    answer: "Если для годового плана предусмотрена скидка, актуальная стоимость отображается в карточке тарифа и приходит с сервера.",
  },
  {
    question: "Есть ли денежные призы для Premium?",
    answer: "В отдельных дополнительных активностях могут быть призы, но они не являются гарантированной ежемесячной частью подписки.",
  },
];

function SectionTitle({ title, description }) {
  return (
    <div className="mb-7 max-w-3xl">
      <h2 className="font-heading text-3xl font-extrabold leading-tight md:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>}
    </div>
  );
}

function ComparisonValue({ value, premium }) {
  const available = value !== "Нет";
  return (
    <span className={cn("inline-flex items-center justify-center gap-1.5 text-xs font-semibold sm:text-sm", available ? (premium ? "text-primary" : "text-foreground") : "text-muted-foreground")}>
      {available ? <Check size={14} /> : <X size={14} />}
      {value}
    </span>
  );
}

export default function Pricing() {
  const [period, setPeriod] = useState("month");
  const [openFaq, setOpenFaq] = useState(0);
  const reduceMotion = useReducedMotion();
  const { toast } = useToast();
  const annual = period === "year";
  const plansQuery = useQuery({ queryKey: ["billing-plans"], queryFn: api.billing.plans, staleTime: 60000 });
  const plans = Array.isArray(plansQuery.data) ? plansQuery.data : [];
  const premiumPlans = plans.filter((plan) => String(plan.code || plan.name).toLowerCase().includes("premium"));
  const monthlyPlan = premiumPlans.find((plan) => plan.billing_period === "month");
  const annualPlan = premiumPlans.find((plan) => ["year", "annual"].includes(plan.billing_period));
  const premiumPlan = annual ? annualPlan : monthlyPlan;
  const price = Number.isFinite(Number(premiumPlan?.amount)) ? Math.round(Number(premiumPlan.amount) / 100) : null;
  const comparePrice = Number.isFinite(Number(premiumPlan?.compare_at_amount)) ? Math.round(Number(premiumPlan.compare_at_amount) / 100) : null;
  const currency = premiumPlan?.currency === "RUB" ? "₽" : premiumPlan?.currency || "";

  const requestPremium = () => {
    toast({
      title: "Оформление Premium готовится",
      description: "Страница доступна для проверки. Подключение появится после готовности платёжного сценария.",
    });
  };

  return (
    <PageFrame>
      <Reveal>
        <section className="grid items-center gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.72fr)] lg:gap-16 lg:pb-16">
          <div className="max-w-3xl">
            <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
              Разбирайте результаты глубже. Развивайтесь точнее.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Персональная аналитика, ML Coach, план развития, тренировочный режим и обратная связь от специалистов — поверх ваших практических результатов в ML-Арене.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={requestPremium} className="h-12 px-6 shadow-lg shadow-primary/20">
                Подключить Premium <ArrowRight size={17} />
              </Button>
              <Button variant="outline" size="lg" asChild className="h-12 px-6">
                <a href="#premium-includes">Посмотреть, что входит</a>
              </Button>
            </div>
            <p className="mt-4 flex max-w-xl items-start gap-2 text-sm leading-6 text-muted-foreground">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-primary" />
              Premium помогает развиваться быстрее, но не влияет на рейтинг и положение перед работодателями.
            </p>
          </div>

          <motion.div
            whileHover={reduceMotion ? undefined : { y: -6, scale: 1.008 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="group relative overflow-hidden border border-border bg-card p-5 shadow-2xl shadow-primary/10 sm:p-7"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-primary/20" />
            <motion.div
              className="absolute left-0 top-0 h-1 w-24 bg-primary"
              animate={reduceMotion ? undefined : { x: ["-100%", "520%"] }}
              transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
            />
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="font-heading text-xl font-extrabold">ML-Арена Premium</p>
                <p className="mt-1 text-sm text-muted-foreground">Один тариф, полный набор функций</p>
              </div>
              <span className="border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-bold text-primary">Founder Season</span>
            </div>

            <div className="my-6 grid grid-cols-2 border border-border bg-secondary/45 p-1" role="group" aria-label="Период оплаты">
              <button type="button" onClick={() => setPeriod("month")} className={cn("min-h-10 px-3 text-sm font-semibold transition-colors", !annual ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Месяц</button>
              <button type="button" onClick={() => setPeriod("year")} className={cn("min-h-10 px-3 text-sm font-semibold transition-colors", annual ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Год</button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={period} initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
                {annual ? (
                  <>
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-1"><span className="font-heading text-4xl font-extrabold sm:text-5xl">{price == null ? "—" : `${price.toLocaleString("ru-RU")} ${currency}`}</span><span className="pb-1 text-sm text-muted-foreground">в год</span></div>
                    {price != null && <p className="mt-2 text-sm font-semibold text-primary">{Math.round(price / 12).toLocaleString("ru-RU")} {currency} в месяц</p>}
                    {price != null && comparePrice != null && comparePrice > price && <p className="mt-2 text-sm"><span className="text-muted-foreground line-through">{comparePrice.toLocaleString("ru-RU")} {currency}</span><span className="ml-2 font-semibold text-emerald-600">экономия {Math.round((1 - price / comparePrice) * 100)}%</span></p>}
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-1"><span className="font-heading text-4xl font-extrabold sm:text-5xl">{price == null ? "—" : `${price.toLocaleString("ru-RU")} ${currency}`}</span><span className="pb-1 text-sm text-muted-foreground">в месяц</span></div>
                    {comparePrice != null && <p className="mt-2 text-sm"><span className="text-muted-foreground line-through">{comparePrice.toLocaleString("ru-RU")} {currency}</span></p>}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="my-6 space-y-3 border-y border-border py-5 text-sm">
              {(premiumPlan?.features || []).map((item) => (
                <div key={item} className="flex items-center gap-2.5"><CheckCircle2 size={17} className="shrink-0 text-accent" />{item}</div>
              ))}
              {!premiumPlan?.features?.length && <p className="text-muted-foreground">Состав тарифа пока не опубликован.</p>}
            </div>
            <Button size="lg" onClick={requestPremium} className="h-12 w-full overflow-hidden">
              Оформить Premium
              <motion.span animate={reduceMotion ? undefined : { x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2 }}><ArrowRight size={17} /></motion.span>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Автопродление можно отключить в личном кабинете.</p>
          </motion.div>
        </section>
      </Reveal>

      <Reveal className="mt-14" delay={0.04}>
        <section>
          <SectionTitle title="Free подтверждает навык. Premium помогает расти быстрее." description="Базовые результаты, рейтинг и ML-паспорт остаются бесплатными. Подписка добавляет анализ, обучение и понятный следующий шаг." />
          <div className="overflow-x-auto border border-border bg-card shadow-sm">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[minmax(340px,1fr)_150px_170px] border-b border-border bg-secondary/60">
                <div className="p-4 text-sm font-bold">Возможность</div>
                <div className="p-4 text-center text-sm font-bold">Free</div>
                <div className="border-l border-primary/15 bg-primary/10 p-4 text-center text-sm font-bold text-primary">Premium</div>
              </div>
              {COMPARISON_ROWS.map((row) => (
                <div key={row.label} className="grid grid-cols-[minmax(340px,1fr)_150px_170px] items-stretch border-b border-border last:border-b-0 hover:bg-secondary/25">
                  <div className="p-4 text-sm font-medium">{row.label}</div>
                  <div className="flex items-center justify-center p-4"><ComparisonValue value={row.free} /></div>
                  <div className="flex items-center justify-center border-l border-primary/10 bg-primary/[0.035] p-4"><ComparisonValue value={row.premium} premium /></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal id="premium-includes" className="mt-16" delay={0.07} viewportReveal>
        <section>
          <SectionTitle title="Персональный слой развития" description="Каждая функция отвечает на один вопрос: что делать дальше, чтобы подтверждённый уровень действительно рос." />
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" viewportReveal>
            {FEATURES.map((feature, index) => (
              <StaggerItem key={feature.title} className={cn("h-full", index === 0 && "lg:col-span-2")}>
                <motion.article
                  whileHover={reduceMotion ? undefined : { y: -7, scale: 1.012 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="group relative h-full overflow-hidden border border-border bg-card p-5 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/10 sm:p-6"
                >
                  <span className="absolute inset-y-0 left-0 w-1 bg-primary/0 transition-colors group-hover:bg-primary" />
                  <div className="flex items-start justify-between gap-4">
                    <motion.span
                      animate={reduceMotion ? undefined : { y: [0, -3, 0], rotate: [0, index % 2 ? -3 : 3, 0] }}
                      transition={{ duration: 3.2 + index * 0.12, delay: index * 0.16, repeat: Infinity, ease: "easeInOut" }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center border border-primary/15 bg-primary/10 text-primary"
                    ><feature.icon size={21} /></motion.span>
                    <span className="border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{feature.note}</span>
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-extrabold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  <motion.span className="absolute bottom-0 left-0 h-0.5 bg-primary" initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.12 + index * 0.06 }} />
                </motion.article>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.02} y={10} viewportReveal>
        <section className="relative grid gap-8 overflow-hidden border-y border-border bg-secondary/30 px-0 py-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-8">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-px bg-primary/35"
            animate={reduceMotion ? undefined : { x: [0, 1180, 0], opacity: [0, 0.7, 0] }}
            transition={{ duration: 7, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
          />
          <div className="px-4 sm:px-6 lg:px-0">
            <motion.span
              animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], boxShadow: ["0 0 0 0 rgba(37,99,235,0)", "0 0 0 8px rgba(37,99,235,0.08)", "0 0 0 0 rgba(37,99,235,0)"] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-12 w-12 items-center justify-center border border-primary/20 bg-primary/10 text-primary"
            ><BrainCircuit size={23} /></motion.span>
            <h2 className="mt-6 font-heading text-3xl font-extrabold leading-tight md:text-4xl">Не ещё одна цифра, а понятный разбор результата</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">ML Coach анализирует доступную статистику, формулирует проверяемые гипотезы и предлагает следующий практический шаг.</p>
            <p className="mt-5 flex gap-2 text-sm leading-6 text-muted-foreground"><LockKeyhole size={17} className="mt-0.5 shrink-0 text-primary" />Он не придумывает причины ошибок и не создаёт неподтверждённые факты в ML-паспорте.</p>
          </div>
          <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
            {COACH_INSIGHTS.map((insight, index) => (
              <PricingReveal key={insight.title} index={index} direction={index % 2 ? "right" : "left"} className="group relative overflow-hidden bg-card p-5 transition-colors hover:bg-background sm:p-6">
                <motion.div animate={reduceMotion ? undefined : { y: [0, -3, 0] }} transition={{ duration: 2.6, delay: index * 0.22, repeat: Infinity, ease: "easeInOut" }}>
                  <insight.icon size={20} className={insight.tone} />
                </motion.div>
                <h3 className="mt-5 font-heading text-lg font-extrabold">{insight.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.text}</p>
                <motion.span aria-hidden="true" className="absolute bottom-0 left-0 h-0.5 bg-primary" initial={{ width: 0 }} whileInView={{ width: `${32 + index * 18}%` }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 0.9, delay: 0.25 + index * 0.1 }} />
              </PricingReveal>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.02} y={10} viewportReveal>
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <SectionTitle title="План, который меняется вместе с результатами" description="Не бесконечная лента рекомендаций, а несколько приоритетных действий, пересчитанных после значимых новых подтверждений." />
            <div className="relative space-y-3">
              <motion.span aria-hidden="true" className="absolute bottom-5 left-5 top-5 w-px origin-top bg-primary/25" initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }} />
              {DEVELOPMENT_STEPS.map((step, index) => (
                <PricingReveal key={step.title} index={index} direction="left" className="group relative grid grid-cols-[42px_minmax(0,1fr)] gap-4 border border-border bg-card p-4 transition-[transform,border-color,box-shadow] hover:translate-x-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:p-5">
                  <motion.span animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }} transition={{ duration: 2.6, delay: index * 0.4, repeat: Infinity, repeatDelay: 1.2 }} className="relative z-10 flex h-10 w-10 items-center justify-center border border-primary/15 bg-card font-heading text-sm font-extrabold text-primary">{String(index + 1).padStart(2, "0")}</motion.span>
                  <div><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-heading font-extrabold">{step.title}</h3><span className="text-xs font-semibold text-primary">{step.status}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p></div>
                </PricingReveal>
              ))}
            </div>
          </div>

          <PricingReveal direction="right" className="relative overflow-hidden border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
              <div><p className="font-heading text-lg font-extrabold">Еженедельный прогресс</p><p className="mt-1 text-xs text-muted-foreground">Обновлено сегодня</p></div>
              <motion.div animate={reduceMotion ? undefined : { rotate: [0, -7, 7, 0] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6 }}><CalendarCheck2 size={22} className="text-primary" /></motion.div>
            </div>
            <div className="grid gap-3 py-5 sm:grid-cols-3">
              {["Новые подтверждения", "Изменение стабильности", "Следующие шаги"].map((label, index) => <motion.div key={label} initial={reduceMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={reduceMotion ? undefined : { y: -4 }} transition={{ duration: 0.45, delay: index * 0.12 }} className="relative overflow-hidden bg-secondary/55 p-4"><CheckCircle2 size={17} className="text-primary" /><p className="mt-3 text-sm font-semibold">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Значение рассчитывается по данным вашего профиля.</p><motion.span aria-hidden="true" className="absolute bottom-0 left-0 h-0.5 bg-primary" initial={{ width: 0 }} whileInView={{ width: `${58 + index * 16}%` }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.35 + index * 0.12 }} /></motion.div>)}
            </div>
            <motion.div whileHover={reduceMotion ? undefined : { x: 4 }} className="mt-6 flex items-start gap-3 border border-primary/15 bg-primary/5 p-4"><motion.span animate={reduceMotion ? undefined : { scale: [1, 1.14, 1] }} transition={{ duration: 2, repeat: Infinity }} className="mt-0.5 shrink-0 text-primary"><Target size={19} /></motion.span><div><p className="text-sm font-bold">Рекомендуемый следующий шаг</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Закрепить временную валидацию в тренировочной задаче без влияния на рейтинг.</p></div></motion.div>
          </PricingReveal>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.02} y={10} viewportReveal>
        <section className="grid gap-4 lg:grid-cols-3">
          <PricingReveal direction="left" className="group relative overflow-hidden border border-border bg-card p-6 lg:col-span-2">
            <motion.div animate={reduceMotion ? undefined : { rotate: [0, -5, 5, 0], y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="w-fit text-primary"><FlaskConical size={24} /></motion.div>
            <h2 className="mt-6 font-heading text-3xl font-extrabold">Продолжайте практику после рейтинговой попытки</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">Рейтинговый результат фиксируется, а дальше можно открыть тренировочный режим: проверить гипотезы, использовать подсказки и изучить разбор организатора.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">{["Рейтинг больше не меняется", "Подсказки открываются поэтапно", "Следующая задача подбирается по направлению"].map((item, index) => <motion.div key={item} initial={reduceMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={reduceMotion ? undefined : { y: -5 }} transition={{ duration: 0.5, delay: index * 0.12 }} className="relative overflow-hidden border-t-2 border-primary bg-secondary/40 p-4 text-sm font-semibold leading-6"><motion.span aria-hidden="true" className="absolute left-0 top-0 h-0.5 bg-accent" animate={reduceMotion ? undefined : { width: ["0%", "100%", "0%"], x: ["0%", "0%", "100%"] }} transition={{ duration: 3.6, delay: index * 0.5, repeat: Infinity, repeatDelay: 1.4 }} />{item}</motion.div>)}</div>
          </PricingReveal>
          <PricingReveal index={1} direction="right" className="group relative overflow-hidden border border-border bg-foreground p-6 text-background dark:bg-primary dark:text-primary-foreground">
            <motion.div animate={reduceMotion ? undefined : { y: [0, -4, 0], rotate: [0, 3, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} className="w-fit"><FileText size={24} /></motion.div>
            <h3 className="mt-6 font-heading text-2xl font-extrabold">1 экспертный разбор в месяц</h3>
            <p className="mt-4 text-sm leading-6 opacity-75">Письменный разбор одного выбранного результата с конкретными рекомендациями. Формат и срок видны до отправки.</p>
            <div className="mt-7 border-t border-current/20 pt-5 text-sm font-semibold">Разбор не превращается в преимущество в рейтинге.</div>
            <motion.span aria-hidden="true" className="absolute bottom-0 left-0 h-1 bg-accent" initial={{ width: 0 }} whileInView={{ width: "100%" }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 1.1, delay: 0.45 }} />
          </PricingReveal>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.02} y={10} viewportReveal>
        <section className="border border-primary/25 bg-primary/[0.055] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div><motion.div animate={reduceMotion ? undefined : { scale: [1, 1.09, 1] }} transition={{ duration: 2.8, repeat: Infinity }} className="w-fit text-primary"><ShieldCheck size={28} /></motion.div><h2 className="mt-5 font-heading text-3xl font-extrabold">Premium не покупает результат</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{["Не повышает рейтинг", "Не даёт рейтинговых попыток", "Не подбирает слабых соперников", "Не добавляет подтверждения без результата", "Не повышает профиль в выдаче компаний", "Не меняет правила соревнований"].map((item, index) => <motion.div key={item} initial={reduceMotion ? false : { opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} whileHover={reduceMotion ? undefined : { x: 4, borderColor: "hsl(var(--primary) / 0.35)" }} transition={{ duration: 0.42, delay: index * 0.07 }} className="flex items-center gap-2.5 border border-border bg-card px-4 py-3 text-sm font-semibold"><motion.span animate={reduceMotion ? undefined : { rotate: [0, -5, 5, 0] }} transition={{ duration: 2.6, delay: index * 0.2, repeat: Infinity, repeatDelay: 1.8 }} className="shrink-0 text-primary"><ShieldCheck size={16} /></motion.span>{item}</motion.div>)}</div>
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.02} y={10} viewportReveal>
        <section className="grid gap-8 lg:grid-cols-[0.58fr_1.42fr]">
          <SectionTitle title="Вопросы о Premium" description="Оплата не должна менять доказательную ценность рейтинга и ML-паспорта." />
          <div className="border-t border-border">
            {FAQ_ITEMS.map((item, index) => {
              const open = openFaq === index;
              const answerId = `pricing-faq-${index}`;
              return (
                <PricingReveal key={item.question} index={index} className="border-b border-border">
                  <motion.button whileHover={reduceMotion ? undefined : { x: 5 }} type="button" aria-expanded={open} aria-controls={answerId} onClick={() => setOpenFaq(open ? -1 : index)} className="flex w-full items-center justify-between gap-5 py-5 text-left font-heading text-base font-extrabold hover:text-primary sm:text-lg">
                    {item.question}<ChevronDown size={19} className={cn("shrink-0 transition-transform duration-200", open && "rotate-180 text-primary")} />
                  </motion.button>
                  <AnimatePresence initial={false}>
                    {open && <motion.div id={answerId} initial={reduceMotion ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduceMotion ? undefined : { height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"><p className="max-w-3xl pb-5 text-sm leading-6 text-muted-foreground">{item.answer}</p></motion.div>}
                  </AnimatePresence>
                </PricingReveal>
              );
            })}
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.02} y={10} viewportReveal>
        <section className="group relative flex flex-col gap-7 overflow-hidden border-t border-border bg-foreground px-6 py-9 text-background sm:px-8 lg:flex-row lg:items-center lg:justify-between dark:bg-card dark:text-foreground">
          <motion.span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent" animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45], scaleY: [0.55, 1, 0.55] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
          <div><h2 className="mt-3 max-w-3xl font-heading text-3xl font-extrabold leading-tight sm:text-4xl">Следующий результат должен объяснять, куда двигаться дальше.</h2><p className="mt-3 text-sm opacity-65">{monthlyPlan ? `От ${Math.round(Number(monthlyPlan.amount) / 100).toLocaleString("ru-RU")} ${monthlyPlan.currency === "RUB" ? "₽" : monthlyPlan.currency} в месяц.` : "Стоимость пока не опубликована."}</p></div>
          <Button size="lg" variant="secondary" onClick={requestPremium} className="h-12 shrink-0 px-6">Подключить Premium <motion.span animate={reduceMotion ? undefined : { x: [0, 5, 0] }} transition={{ duration: 1.35, repeat: Infinity, repeatDelay: 1 }}><ArrowRight size={17} /></motion.span></Button>
        </section>
      </Reveal>
    </PageFrame>
  );
}
