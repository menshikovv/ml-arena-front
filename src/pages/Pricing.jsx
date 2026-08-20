import React, { useState } from "react";
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
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  X,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
    icon: UsersRound,
    title: "Вебинары и сообщество",
    description: "Участвуйте в групповых разборах, вебинарах и обсуждениях с другими активными участниками.",
    note: "1–2 события в месяц",
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
    text: "Результат выше вашего медианного результата по ранжированию. Эталон среднего уровня превышен на 3,8%.",
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
    text: "Это третий подтверждённый результат по ранжированию. Достаточность данных по направлению выросла.",
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
    answer: "Годовая оплата снижает стандартную стоимость до 990 ₽ в месяц и экономит 3 600 ₽ относительно 12 платежей по основной цене 1 290 ₽.",
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

  const requestPremium = () => {
    toast({
      title: "Оформление Premium готовится",
      description: "Страница доступна для проверки. Подключение появится после готовности платёжного сценария.",
    });
  };

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-7 sm:px-6 lg:px-8 lg:py-12">
      <Reveal>
        <section className="grid items-center gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.72fr)] lg:gap-16 lg:pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
              <Sparkles size={15} /> ML-Арена Premium
            </div>
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

          <div className="relative border border-border bg-card p-5 shadow-2xl shadow-primary/10 sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
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
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-1"><span className="font-heading text-4xl font-extrabold sm:text-5xl">11 880 ₽</span><span className="pb-1 text-sm text-muted-foreground">в год</span></div>
                    <p className="mt-2 text-sm font-semibold text-primary">990 ₽ в месяц · экономия 3 600 ₽ от основной цены</p>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-1"><span className="font-heading text-4xl font-extrabold sm:text-5xl">790 ₽</span><span className="pb-1 text-sm text-muted-foreground">в месяц</span></div>
                    <p className="mt-2 text-sm"><span className="text-muted-foreground line-through">1 290 ₽</span><span className="ml-2 font-semibold text-primary">временная Founder-цена</span></p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="my-6 space-y-3 border-y border-border py-5 text-sm">
              {["ML Coach и персональный план", "Лаборатория нерейтинговой практики", "1 экспертный разбор в месяц", "Расширенная аналитика и вебинары"].map((item) => (
                <div key={item} className="flex items-center gap-2.5"><CheckCircle2 size={17} className="shrink-0 text-accent" />{item}</div>
              ))}
            </div>
            <Button size="lg" onClick={requestPremium} className="h-12 w-full">Оформить Premium <ArrowRight size={17} /></Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Автопродление можно отключить в личном кабинете.</p>
          </div>
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

      <Reveal id="premium-includes" className="mt-16" delay={0.07}>
        <section>
          <SectionTitle title="Персональный слой развития" description="Каждая функция отвечает на один вопрос: что делать дальше, чтобы подтверждённый уровень действительно рос." />
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <StaggerItem key={feature.title} className={cn("h-full", index === 0 && "lg:col-span-2")}>
                <article className="group relative h-full overflow-hidden border border-border bg-card p-5 shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:p-6">
                  <span className="absolute inset-y-0 left-0 w-1 bg-primary/0 transition-colors group-hover:bg-primary" />
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-primary/15 bg-primary/10 text-primary"><feature.icon size={21} /></span>
                    <span className="border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{feature.note}</span>
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-extrabold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.1}>
        <section className="grid gap-8 border-y border-border bg-secondary/30 px-0 py-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-8">
          <div className="px-4 sm:px-6 lg:px-0">
            <span className="flex h-12 w-12 items-center justify-center border border-primary/20 bg-primary/10 text-primary"><BrainCircuit size={23} /></span>
            <h2 className="mt-6 font-heading text-3xl font-extrabold leading-tight md:text-4xl">Не ещё одна цифра, а понятный разбор результата</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">ML Coach анализирует доступную статистику, формулирует проверяемые гипотезы и предлагает следующий практический шаг.</p>
            <p className="mt-5 flex gap-2 text-sm leading-6 text-muted-foreground"><LockKeyhole size={17} className="mt-0.5 shrink-0 text-primary" />Он не придумывает причины ошибок и не создаёт неподтверждённые факты в ML-паспорте.</p>
          </div>
          <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
            {COACH_INSIGHTS.map((insight) => (
              <div key={insight.title} className="bg-card p-5 sm:p-6">
                <insight.icon size={20} className={insight.tone} />
                <h3 className="mt-5 font-heading text-lg font-extrabold">{insight.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.text}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.12}>
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <SectionTitle title="План, который меняется вместе с результатами" description="Не бесконечная лента рекомендаций, а несколько приоритетных действий, пересчитанных после значимых новых подтверждений." />
            <div className="space-y-3">
              {DEVELOPMENT_STEPS.map((step, index) => (
                <div key={step.title} className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 border border-border bg-card p-4 transition-colors hover:border-primary/30 sm:p-5">
                  <span className="flex h-10 w-10 items-center justify-center border border-primary/15 bg-primary/10 font-heading text-sm font-extrabold text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <div><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-heading font-extrabold">{step.title}</h3><span className="text-xs font-semibold text-primary">{step.status}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
              <div><p className="font-heading text-lg font-extrabold">Еженедельный прогресс</p><p className="mt-1 text-xs text-muted-foreground">Обновлено сегодня</p></div>
              <CalendarCheck2 size={22} className="text-primary" />
            </div>
            <div className="grid grid-cols-3 gap-2 py-5">
              {[{ value: "+2", label: "подтверждения" }, { value: "+6%", label: "стабильность" }, { value: "3", label: "шага дальше" }].map((item) => <div key={item.label} className="bg-secondary/55 p-3 text-center"><p className="font-heading text-xl font-extrabold">{item.value}</p><p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">{item.label}</p></div>)}
            </div>
            <div className="space-y-4 border-t border-border pt-5">
              {[{ label: "Табличные данные", value: 88 }, { label: "Ранжирование", value: 72 }, { label: "Временные ряды", value: 44 }].map((skill) => <div key={skill.label}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{skill.label}</span><span className="text-muted-foreground">{skill.value}%</span></div><div className="h-2 overflow-hidden bg-secondary"><motion.div className="h-full bg-gradient-to-r from-primary to-accent" initial={reduceMotion ? false : { width: 0 }} whileInView={{ width: `${skill.value}%` }} viewport={{ once: true }} transition={{ duration: 0.7 }} /></div></div>)}
            </div>
            <div className="mt-6 flex items-start gap-3 border border-primary/15 bg-primary/5 p-4"><Target size={19} className="mt-0.5 shrink-0 text-primary" /><div><p className="text-sm font-bold">Рекомендуемый следующий шаг</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Закрепить временную валидацию в тренировочной задаче без влияния на рейтинг.</p></div></div>
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.14}>
        <section className="grid gap-4 lg:grid-cols-3">
          <article className="border border-border bg-card p-6 lg:col-span-2">
            <FlaskConical size={24} className="text-primary" />
            <h2 className="mt-6 font-heading text-3xl font-extrabold">Продолжайте практику после рейтинговой попытки</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">Рейтинговый результат фиксируется, а дальше можно открыть тренировочный режим: проверить гипотезы, использовать подсказки и изучить разбор организатора.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">{["Рейтинг больше не меняется", "Подсказки открываются поэтапно", "Следующая задача подбирается по направлению"].map((item) => <div key={item} className="border-t-2 border-primary bg-secondary/40 p-4 text-sm font-semibold leading-6">{item}</div>)}</div>
          </article>
          <article className="border border-border bg-foreground p-6 text-background dark:bg-primary dark:text-primary-foreground">
            <FileText size={24} />
            <h3 className="mt-6 font-heading text-2xl font-extrabold">1 экспертный разбор в месяц</h3>
            <p className="mt-4 text-sm leading-6 opacity-75">Письменный разбор одного выбранного результата с конкретными рекомендациями. Формат и срок видны до отправки.</p>
            <div className="mt-7 border-t border-current/20 pt-5 text-sm font-semibold">Разбор не превращается в преимущество в рейтинге.</div>
          </article>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.16}>
        <section className="border border-primary/25 bg-primary/[0.055] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div><ShieldCheck size={28} className="text-primary" /><h2 className="mt-5 font-heading text-3xl font-extrabold">Premium не покупает результат</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{["Не повышает рейтинг", "Не даёт рейтинговых попыток", "Не подбирает слабых соперников", "Не добавляет подтверждения без результата", "Не повышает профиль в выдаче компаний", "Не меняет правила соревнований"].map((item) => <div key={item} className="flex items-center gap-2.5 border border-border bg-card px-4 py-3 text-sm font-semibold"><ShieldCheck size={16} className="shrink-0 text-primary" />{item}</div>)}</div>
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-16" delay={0.18}>
        <section className="grid gap-8 lg:grid-cols-[0.58fr_1.42fr]">
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

      <Reveal className="mt-16" delay={0.2}>
        <section className="flex flex-col gap-7 border-t border-border bg-foreground px-6 py-9 text-background sm:px-8 lg:flex-row lg:items-center lg:justify-between dark:bg-card dark:text-foreground">
          <div><p className="flex items-center gap-2 text-sm font-bold text-accent"><Sparkles size={17} /> ML-Арена Premium</p><h2 className="mt-3 max-w-3xl font-heading text-3xl font-extrabold leading-tight sm:text-4xl">Следующий результат должен объяснять, куда двигаться дальше.</h2><p className="mt-3 text-sm opacity-65">От 790 ₽ в месяц на этапе Founder Season.</p></div>
          <Button size="lg" variant="secondary" onClick={requestPremium} className="h-12 shrink-0 px-6">Подключить Premium <ArrowRight size={17} /></Button>
        </section>
      </Reveal>
    </div>
  );
}
