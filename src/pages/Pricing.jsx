import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Compass,
  FlaskConical,
  LineChart,
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
import "./Pricing.css";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "ML Coach",
    description: "Понятный разбор результата и рекомендации по следующему шагу.",
    note: "После активности",
  },
  {
    icon: Route,
    title: "Персональный план",
    description: "Набор приоритетных задач по вашему ML-паспорту и целям.",
    note: "2–4 шага вперёд",
  },
  {
    icon: LineChart,
    title: "Расширенная аналитика",
    description: "Динамика по направлениям, стабильность результатов и ключевые показатели.",
    note: "Полная картина",
  },
  {
    icon: FlaskConical,
    title: "Лаборатория практики",
    description: "Нерейтинговые задачи, подсказки и подробные разборы подходов.",
    note: "Без влияния на рейтинг",
  },
  {
    icon: ClipboardCheck,
    title: "Экспертный разбор",
    description: "Письменный разбор решения специалистом ML-Арены.",
    note: "1 разбор в месяц",
  },
  {
    icon: LineChart,
    title: "Еженедельный прогресс",
    description: "Сводка с новыми подтверждениями, изменениями стабильности и следующими шагами.",
    note: "Полная картина прогресса",
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
    answer: "Если для годового плана предусмотрена скидка, актуальная стоимость отображается в карточке тарифа.",
  },
  {
    question: "Есть ли денежные призы для Premium?",
    answer: "В отдельных дополнительных активностях могут быть призы, но они не являются гарантированной ежемесячной частью подписки.",
  },
];

function SectionTitle({ title, description }) {
  return (
    <div className="pricing-section-title">
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
  const [openFaq, setOpenFaq] = useState(-1);
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
    <PageFrame className="pricing-page">
      <Reveal viewportReveal className="pricing-hero-reveal">
        <section className="pricing-hero">
          <div className="pricing-hero__copy relative max-w-3xl">
            <h1 className="font-heading text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
              <span>Разбирайте</span>{" "}
              <span>результаты глубже.</span>{" "}
              <span>Развивайтесь точнее.</span>
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

          <div className="pricing-hero__plan group relative overflow-hidden border border-primary/20 bg-background p-5 shadow-2xl shadow-primary/10 transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 sm:p-7 motion-reduce:transform-none">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="font-heading text-xl font-extrabold">ML-Арена Premium</p>
                <p className="mt-1 text-sm text-muted-foreground">Один тариф, полный набор функций</p>
              </div>
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
              {(premiumPlan?.features?.length ? premiumPlan.features : ["Расширенная аналитика", "ML Coach", "Персональный план"]).slice(0, 3).map((item) => (
                <div key={item} className="flex items-center gap-2.5"><CheckCircle2 size={17} className="shrink-0 text-accent" />{item}</div>
              ))}
            </div>
            <Button size="lg" onClick={requestPremium} className="h-12 w-full overflow-hidden">
              Оформить Premium
              <ArrowRight size={17} />
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Автопродление можно отключить в личном кабинете.</p>
          </div>
        </section>
      </Reveal>

      <Reveal className="pricing-comparison-reveal" viewportReveal>
        <section className="pricing-comparison">
          <SectionTitle title="Free подтверждает навык. Premium помогает расти быстрее." description="Базовые результаты, рейтинг и ML-паспорт остаются бесплатными. Подписка добавляет анализ, обучение и понятный следующий шаг." />
          <div className="pricing-comparison__table overflow-x-auto border border-border bg-card shadow-sm">
            <div className="min-w-[680px]">
              <div className="pricing-comparison__head grid grid-cols-[minmax(340px,1fr)_150px_170px] border-b border-border bg-secondary/60">
                <div className="p-4 text-sm font-bold">Возможность</div>
                <div className="p-4 text-center text-sm font-bold">Free</div>
                <div className="border-l border-primary/15 bg-primary/10 p-4 text-center text-sm font-bold text-primary">Premium</div>
              </div>
              {COMPARISON_ROWS.map((row) => (
                <div key={row.label} className="pricing-comparison__row grid grid-cols-[minmax(340px,1fr)_150px_170px] items-stretch border-b border-border last:border-b-0 hover:bg-secondary/25">
                  <div className="p-4 text-sm font-medium">{row.label}</div>
                  <div className="pricing-comparison__value flex items-center justify-center p-4"><ComparisonValue value={row.free} /></div>
                  <div className="pricing-comparison__value pricing-comparison__value--premium flex items-center justify-center border-l border-primary/10 bg-primary/[0.035] p-4"><ComparisonValue value={row.premium} premium /></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <div id="premium-includes" className="pricing-features-reveal">
        <section className="pricing-growth">
          <Reveal viewportReveal className="pricing-growth__heading">
            <h2>Персональный слой<br />развития</h2>
            <p>Каждая функция помогает делать следующий шаг — от анализа текущих результатов до уверенного роста в ML-Арене.</p>
          </Reveal>
          <div className="pricing-growth__content">
            <Stagger className="pricing-features__grid" viewportReveal>
              {FEATURES.map((feature) => (
                <StaggerItem key={feature.title} className="h-full">
                  <article className="pricing-feature">
                    <div className="pricing-feature__top">
                      <span className="pricing-feature__icon"><feature.icon size={22} /></span>
                      <span className="pricing-feature__note">{feature.note}</span>
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal viewportReveal className="pricing-progress">
              <div className="pricing-progress__header"><h3>Еженедельный прогресс</h3><CalendarCheck2 size={21} /></div>
              <ol className="pricing-progress__timeline">
                {["Новые подтверждения", "Изменение стабильности", "Следующие шаги", "Рекомендации ML Coach", "Обновление целей"].map((label, index) => (
                  <li key={label} className={index < 2 ? "is-done" : ""}><span>{index < 2 && <Check size={15} />}</span>{label}</li>
                ))}
              </ol>
              <div className="pricing-progress__note"><Target size={22} /><span>Сводка обновляется автоматически вместе с вашим прогрессом.</span></div>
            </Reveal>
          </div>
        </section>
      </div>

      <Reveal className="pricing-coach-reveal" viewportReveal>
        <section className="pricing-coach">
          <h2>Понятный разбор результата</h2>
          <ul>
            {COACH_INSIGHTS.map((insight) => (
              <li key={insight.title}><insight.icon size={20} className={insight.tone} /><strong>{insight.title}</strong></li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal className="pricing-plan-reveal" viewportReveal>
        <section className="pricing-plan">
          <h2>План, который<br />меняется вместе с вами</h2>
          <ol>
            {DEVELOPMENT_STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="pricing-plan__number">{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.title}</strong>
                <span className="pricing-plan__status">{step.status}</span>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal className="pricing-practice-reveal" viewportReveal>
        <section className="pricing-practice">
          <div>
            <h2>Продолжайте практику после рейтинговой попытки</h2>
            <p>Рейтинговый результат фиксируется, а дальше можно открыть тренировочный режим: проверить гипотезы, использовать подсказки и изучить разбор организатора.</p>
          </div>
          <Button asChild variant="secondary"><Link to="/competitions">Перейти к практике <ArrowRight size={17} /></Link></Button>
        </section>
      </Reveal>

      <Reveal className="pricing-fairness-reveal" viewportReveal>
        <section className="pricing-fairness border border-primary/25 bg-primary/[0.055] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div><ShieldCheck size={28} className="text-primary" /><h2 className="mt-5 font-heading text-3xl font-extrabold">Premium не покупает результат</h2><p className="pricing-fairness__intro">Оплата не должна менять доказательную ценность рейтинга и ML-паспорта.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">{["Не повышает рейтинг", "Не даёт рейтинговых попыток", "Не подбирает слабых соперников", "Не добавляет подтверждения без результата", "Не повышает профиль в выдаче компаний", "Не меняет правила соревнований"].map((item) => <div key={item} className="flex items-center gap-2.5 border border-border bg-card px-4 py-3 text-sm font-semibold transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 motion-reduce:transform-none"><ShieldCheck size={16} className="shrink-0 text-primary" />{item}</div>)}</div>
          </div>
        </section>
      </Reveal>

      <Reveal className="pricing-faq-reveal" viewportReveal>
        <section className="pricing-faq grid gap-8 lg:grid-cols-[0.58fr_1.42fr]">
          <SectionTitle title="Вопросы о Premium" description="Оплата не должна менять доказательную ценность рейтинга и ML-паспорта." />
          <div className="border-t border-border">
            {FAQ_ITEMS.map((item, index) => {
              const open = openFaq === index;
              const answerId = `pricing-faq-${index}`;
              return (
                <div key={item.question} className="border-b border-border">
                  <button type="button" aria-expanded={open} aria-controls={answerId} onClick={() => setOpenFaq(open ? -1 : index)} className="flex w-full items-center justify-between gap-5 py-5 text-left font-heading text-base font-extrabold hover:text-primary sm:text-lg">
                    {item.question}<ChevronDown size={19} className={cn("shrink-0 transition-transform duration-200", open && "rotate-180 text-primary")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && <motion.div id={answerId} initial={reduceMotion ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduceMotion ? undefined : { height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"><p className="max-w-3xl pb-5 text-sm leading-6 text-muted-foreground">{item.answer}</p></motion.div>}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      </Reveal>

      <Reveal className="pricing-final-reveal" viewportReveal>
        <section className="pricing-final group relative flex flex-col gap-7 overflow-hidden border-t border-border bg-foreground px-6 py-9 text-background sm:px-8 lg:flex-row lg:items-center lg:justify-between dark:bg-card dark:text-foreground">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent" />
          <div><h2 className="mt-3 max-w-3xl font-heading text-3xl font-extrabold leading-tight sm:text-4xl">Следующий результат должен объяснять, куда двигаться дальше.</h2><p className="mt-3 text-sm opacity-65">{monthlyPlan ? `От ${Math.round(Number(monthlyPlan.amount) / 100).toLocaleString("ru-RU")} ${monthlyPlan.currency === "RUB" ? "₽" : monthlyPlan.currency} в месяц.` : "Стоимость пока не опубликована."}</p></div>
          <Button size="lg" variant="secondary" onClick={requestPremium} className="h-12 shrink-0 px-6">Подключить Premium <ArrowRight size={17} /></Button>
        </section>
      </Reveal>
    </PageFrame>
  );
}
