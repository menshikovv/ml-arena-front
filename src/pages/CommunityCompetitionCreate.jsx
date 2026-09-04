import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Database,
  Eye,
  FileCheck2,
  FileText,
  Gauge,
  LockKeyhole,
  Send,
  Settings2,
  ShieldCheck,
  Target,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, uploadFile } from "@/api/mlArenaApi";
import { TASK_TYPE_LABELS } from "@/lib/ml-arena";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "main", label: "Основное", icon: FileText },
  { id: "direction", label: "Направление", icon: Target },
  { id: "scoring", label: "Задача и метрика", icon: Gauge },
  { id: "data", label: "Данные", icon: Database },
  { id: "access", label: "Доступ", icon: Users },
  { id: "schedule", label: "Сроки", icon: CalendarClock },
  { id: "review", label: "Правила и проверка", icon: ShieldCheck },
];

const METRICS = {
  classification: ["ROC-AUC", "Accuracy", "F1", "LogLoss"],
  regression: ["RMSE", "MAE", "R²"],
  ranking: ["NDCG@10", "MAP@10"],
  recsys: ["NDCG@10", "MAP@10"],
  nlp: ["Accuracy", "F1", "ROC-AUC"],
  cv: ["Accuracy", "F1"],
  time_series: ["RMSE", "MAE"],
  clustering: ["Коэффициент силуэта"],
  other: [],
};

const INITIAL_FORM = {
  title: "",
  description: "",
  difficulty: "Средняя",
  direction: "classification",
  customDirection: "",
  statement: "",
  metric: "ROC-AUC",
  predictionFormat: "id, prediction",
  participantBundle: "",
  publicLabelsFile: "",
  privateLabelsFile: "",
  access: "open",
  maxParticipants: "",
  startsAt: "",
  endsAt: "",
  attempts: "5",
  split: "30/70",
  externalData: "forbidden",
  aiTools: "allowed",
  pretrainedModels: "allowed",
  tieBreak: "Более ранняя лучшая отправка",
  rightsConfirmed: false,
  noPersonalDataConfirmed: false,
  rulesConfirmed: false,
};

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      {hint && <span className="mt-1 block text-xs leading-5 text-muted-foreground">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function Select({ value, onChange, children }) {
  return <select value={value} onChange={onChange} className="h-11 w-full border border-input bg-card px-3 text-sm">{children}</select>;
}

function ToggleCard({ active, icon: Icon, title, text, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex min-h-28 items-start gap-3 border p-4 text-left transition-colors", active ? "border-primary bg-primary/7" : "border-border bg-card hover:border-primary/30")}>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center border", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground")}><Icon size={17} /></span>
      <span><span className="block font-heading font-extrabold">{title}</span><span className="mt-1.5 block text-xs leading-5 text-muted-foreground">{text}</span></span>
    </button>
  );
}

function FileSlot({ label, required, value, onChange, accept = ".csv,text/csv,application/csv", placeholder = "Выберите CSV-файл" }) {
  return (
    <label className="group flex min-h-24 cursor-pointer items-center gap-4 border border-dashed border-border bg-card p-4 hover:border-primary/40 hover:bg-primary/[0.025]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 text-primary"><Upload size={18} /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{label}{required && " *"}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{value?.name || placeholder}</span></span>
      <input type="file" className="sr-only" accept={accept} onChange={(event) => onChange(event.target.files?.[0] || null)} />
    </label>
  );
}

export default function CommunityCompetitionCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submittedCompetition, setSubmittedCompetition] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const metrics = METRICS[form.direction] || [];
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const canContinue = useMemo(() => {
    if (step === 0) return form.title.trim().length >= 5 && form.description.trim().length >= 12;
    if (step === 1) return form.direction !== "other" || form.customDirection.trim().length >= 3;
    if (step === 2) return form.statement.trim().length >= 20 && form.metric;
    if (step === 3) return Boolean(form.participantBundle && form.publicLabelsFile && form.privateLabelsFile);
    if (step === 5) return Boolean(form.startsAt && form.endsAt && new Date(form.endsAt) > new Date(form.startsAt));
    if (step === 6) return form.rightsConfirmed && form.noPersonalDataConfirmed && form.rulesConfirmed;
    return true;
  }, [form, step]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submitMutation = useMutation({
    mutationFn: async () => {
      setSubmitError("");
      const metricCodes = { "ROC-AUC": "roc_auc", Accuracy: "accuracy", F1: "f1", LogLoss: "logloss", RMSE: "rmse", MAE: "mae", "R²": "r2", "NDCG@10": "ndcg", "MAP@10": "map" };
      const difficulty = { "Начальная": "Starter", "Лёгкая": "Easy", "Средняя": "Medium", "Высокая": "Hard", "Экспертная": "Expert" }[form.difficulty] || form.difficulty;
      const competition = await api.communityCompetitions.create({
        title: form.title.trim(),
        short_description: form.description.trim(),
        description: form.statement.trim(),
        task_type: form.direction,
        custom_direction_label: form.direction === "other" ? form.customDirection.trim() : null,
        metric_code: metricCodes[form.metric] || form.metric.toLowerCase(),
        difficulty,
        access: form.access,
        max_participants: form.maxParticipants ? Number(form.maxParticipants) : null,
        starts_at: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        submission_deadline: new Date(form.endsAt).toISOString(),
        daily_submission_limit: Number(form.attempts),
        public_split_percent: Number(form.split.split("/")[0]),
        rules: "Один аккаунт на участника. Решения загружаются только в CSV.",
        external_data_policy: form.externalData === "forbidden" ? "Запрещены" : "Разрешены",
        ai_tools_policy: form.aiTools === "allowed" ? "Разрешены" : "Запрещены",
        tie_break_policy: form.tieBreak,
        rights_confirmed: form.rightsConfirmed,
      });
      const competitionId = competition.id;
      const dataset = await api.communityCompetitions.createDataset(competitionId, {
        name: `${form.title.trim()} — данные`,
        description: form.description.trim(),
        version: "1.0",
      });
      const versionId = dataset.version_id || dataset.current_version?.id || dataset.version?.id || dataset.id;
      const files = [
        [form.participantBundle, "participant_bundle", "participant"],
        [form.publicLabelsFile, "public_labels", "evaluator_only"],
        [form.privateLabelsFile, "private_labels", "evaluator_only"],
      ];
      for (let position = 0; position < files.length; position += 1) {
        const [file, kind, visibility] = files[position];
        const upload = await uploadFile(file, "competition_dataset", { community_competition_id: competitionId });
        await api.communityCompetitions.attachDatasetFile(competitionId, versionId, { upload_id: upload.id, kind, visibility, position });
      }
      await api.communityCompetitions.submitForReview(competitionId);
      return competition;
    },
    onSuccess: setSubmittedCompetition,
    onError: (error) => setSubmitError(error.message || "Не удалось отправить соревнование на модерацию."),
  });

  if (submittedCompetition) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-70px)] max-w-3xl items-center px-4 py-12">
        <div className="w-full border border-border bg-card p-7 text-center shadow-xl sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center bg-primary text-primary-foreground"><CheckCircle2 size={27} /></span>
          <h1 className="mt-7 font-heading text-3xl font-extrabold">Макет отправлен на модерацию</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">Черновик, датасет и файлы сохранены. Заявка № {submittedCompetition.id} передана модераторам ML-Арены.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={() => navigate(`/competitions/${submittedCompetition.id}`)}>Открыть соревнование</Button><Button asChild variant="outline"><Link to="/competitions?section=community">К соревнованиям сообщества</Link></Button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <Link to="/competitions?section=community" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> К соревнованиям сообщества</Link>

      <header className="mt-6 grid gap-6 border-b border-border pb-8 lg:grid-cols-[1fr_360px] lg:items-end">
        <div><h1 className="font-heading text-3xl font-extrabold sm:text-4xl">Создание соревнования сообщества</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">Соберите безопасную CSV-задачу, проверьте будущую карточку и подготовьте её к модерации ML-Арены.</p></div>
        <div><div className="flex justify-between text-xs font-semibold"><span>Шаг {step + 1} из {STEPS.length}</span><span className="text-primary">{progress}%</span></div><div className="mt-2 h-2 bg-secondary"><div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} /></div></div>
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="border border-border bg-card p-2" aria-label="Шаги создания соревнования">
            {STEPS.map((item, index) => {
              const Icon = item.icon;
              const active = index === step;
              const completed = index < step;
              return (
                <button key={item.id} type="button" onClick={() => { if (index <= step) setStep(index); }} className={cn("flex min-h-12 w-full items-center gap-3 px-3 text-left text-sm font-semibold", active ? "bg-primary text-primary-foreground" : completed ? "text-foreground hover:bg-secondary" : "cursor-default text-muted-foreground")}>
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center border", active ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-secondary")}>{completed ? <Check size={15} /> : <Icon size={15} />}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-4 border border-violet-500/20 bg-violet-500/5 p-4 text-xs leading-5 text-muted-foreground"><LockKeyhole size={17} className="mb-3 text-violet-600 dark:text-violet-400" />Соревнования сообщества не содержат денежных призов, не влияют на сезонный рейтинг и не получают статус проверки ML-Арены.</div>
        </aside>

        <div className="border border-violet-500/20 bg-violet-500/5 p-4 text-xs leading-5 text-muted-foreground lg:hidden">
          <LockKeyhole size={17} className="mb-2 text-violet-600 dark:text-violet-400" />
          Без денежных призов и влияния на сезонный рейтинг. Результат хранится как отдельная активность сообщества.
        </div>

        <main className="min-w-0 border border-border bg-card">
          <div className="border-b border-border px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary">{React.createElement(STEPS[step].icon, { size: 19 })}</span><div><p className="text-xs font-semibold text-muted-foreground">Шаг {step + 1}</p><h2 className="font-heading text-xl font-extrabold">{STEPS[step].label}</h2></div></div>
          </div>

          <div className="p-5 sm:p-7">
            {step === 0 && <div className="space-y-5"><Field label="Название" hint="Коротко и по существу, не больше двух строк в каталоге."><Input value={form.title} onChange={(event) => update("title", event.target.value)} maxLength={90} placeholder="Например, прогноз оттока пользователей" /></Field><Field label="Короткое описание" hint="Что требуется предсказать и на каких данных."><Textarea rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Опишите задачу в двух-трёх предложениях" /></Field><Field label="Сложность"><Select value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)}>{["Начальная", "Лёгкая", "Средняя", "Высокая", "Экспертная"].map((item) => <option key={item}>{item}</option>)}</Select></Field></div>}

            {step === 1 && <div><p className="mb-5 text-sm leading-6 text-muted-foreground">Выберите одно направление. «Другое» не увеличивает статистику по восьми направлениям ML-Арены.</p><div className="grid gap-3 sm:grid-cols-2">{[...Object.entries(TASK_TYPE_LABELS).filter(([key]) => key !== "tabular"), ["other", "Другое"]].map(([key, label]) => <ToggleCard key={key} active={form.direction === key} icon={Target} title={label} text={key === "other" ? "Пользовательское направление" : "Стандартное направление ML-Арены"} onClick={() => { update("direction", key); update("metric", (METRICS[key] || [])[0] || ""); }} />)}</div>{form.direction === "other" && <div className="mt-5"><Field label="Название направления"><Input value={form.customDirection} onChange={(event) => update("customDirection", event.target.value)} placeholder="Например, обработка графов" /></Field></div>}</div>}

            {step === 2 && <div className="space-y-5"><Field label="Полное условие" hint="Цель, target, доступные признаки и ожидаемый результат."><Textarea rows={7} value={form.statement} onChange={(event) => update("statement", event.target.value)} placeholder="Опишите постановку задачи..." /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Метрика" hint="Только из безопасного списка."><Select value={form.metric} onChange={(event) => update("metric", event.target.value)}><option value="">Выберите метрику</option>{metrics.map((item) => <option key={item}>{item}</option>)}</Select></Field><Field label="Формат предсказаний"><Input value={form.predictionFormat} onChange={(event) => update("predictionFormat", event.target.value)} placeholder="id, prediction" /></Field></div><div className="border border-primary/15 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground"><Settings2 size={18} className="mb-2 text-primary" />Пользовательский scoring.py не выполняется. Платформа использует выбранную метрику и безопасную конфигурацию.</div></div>}

            {step === 3 && <div><p className="mb-5 text-sm leading-6 text-muted-foreground">ZIP должен содержать в корне только train.csv, test.csv и sample_submission.csv. Ответы загрузите отдельными CSV.</p><div className="grid gap-3 sm:grid-cols-2"><FileSlot label="Данные участника" required value={form.participantBundle} onChange={(value) => update("participantBundle", value)} accept=".zip,application/zip" placeholder="Выберите ZIP-файл" /><FileSlot label="Публичные ответы" required value={form.publicLabelsFile} onChange={(value) => update("publicLabelsFile", value)} /><FileSlot label="Приватные ответы" required value={form.privateLabelsFile} onChange={(value) => update("privateLabelsFile", value)} /></div><div className="mt-4 flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-6 text-muted-foreground"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />Оба файла с ответами доступны только контуру проверки и не входят в ZIP участников.</div></div>}

            {step === 4 && <div className="grid gap-3 sm:grid-cols-3">{[{ id: "open", icon: Users, title: "Открыто", text: "Любой зарегистрированный участник может присоединиться." }, { id: "invite_only", icon: LockKeyhole, title: "По приглашению", text: "Доступ по системному приглашению или одноразовой ссылке." }, { id: "application", icon: FileCheck2, title: "По заявке", text: "Организатор принимает или отклоняет заявку по нику." }].map((item) => <ToggleCard key={item.id} active={form.access === item.id} icon={item.icon} title={item.title} text={item.text} onClick={() => update("access", item.id)} />)}<div className="sm:col-span-3"><Field label="Максимум участников" hint="Необязательно. Контактные данные участников организатору не передаются."><Input type="number" min="2" value={form.maxParticipants} onChange={(event) => update("maxParticipants", event.target.value)} placeholder="Без ограничения" /></Field></div></div>}

            {step === 5 && <div className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="Начало"><Input type="datetime-local" value={form.startsAt} onChange={(event) => update("startsAt", event.target.value)} /></Field><Field label="Окончание"><Input type="datetime-local" value={form.endsAt} onChange={(event) => update("endsAt", event.target.value)} /></Field><Field label="Попыток в сутки"><Select value={form.attempts} onChange={(event) => update("attempts", event.target.value)}>{["3", "5", "10"].map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field><Field label="Public / Private"><Select value={form.split} onChange={(event) => update("split", event.target.value)}><option value="20/80">20% / 80%</option><option value="30/70">30% / 70%</option><option value="40/60">40% / 60%</option></Select></Field></div><div className="border border-border bg-secondary/45 p-4 text-sm leading-6 text-muted-foreground">Private оценка скрыта до завершения. Итоговые места определяются после финального пересчёта.</div></div>}

            {step === 6 && <ReviewStep form={form} update={update} />}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border bg-secondary/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <Button type="button" variant="outline" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><ArrowLeft size={16} /> Назад</Button>
            {step < STEPS.length - 1 ? <Button type="button" onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))} disabled={!canContinue}>Продолжить <ArrowRight size={16} /></Button> : <div className="flex flex-col items-end gap-2">{submitError && <p className="max-w-xl text-right text-sm text-destructive">{submitError}</p>}<Button type="button" onClick={() => submitMutation.mutate()} disabled={!canContinue || submitMutation.isPending}><Send size={16} /> {submitMutation.isPending ? "Загружаем и отправляем..." : "Отправить на модерацию"}</Button></div>}
          </div>
        </main>
      </div>
    </div>
  );
}

function ReviewStep({ form, update }) {
  const accessLabel = { open: "Открыто", invite_only: "По приглашению", application: "По заявке" }[form.access];
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="border border-border bg-secondary/25 p-5"><div className="flex flex-wrap gap-2"><span className="bg-violet-500/10 px-2 py-1 text-xs font-bold text-violet-600 dark:text-violet-400">Сообщество</span><span className="bg-secondary px-2 py-1 text-xs font-bold">{accessLabel}</span><span className="bg-secondary px-2 py-1 text-xs font-bold">{TASK_TYPE_LABELS[form.direction] || form.customDirection}</span></div><h3 className="mt-5 font-heading text-2xl font-extrabold">{form.title || "Название соревнования"}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{form.description || "Короткое описание появится здесь."}</p><div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 text-xs"><div><span className="text-muted-foreground">Метрика</span><p className="mt-1 font-bold">{form.metric || "—"}</p></div><div><span className="text-muted-foreground">Попытки</span><p className="mt-1 font-bold">{form.attempts} в сутки</p></div><div><span className="text-muted-foreground">Рейтинг</span><p className="mt-1 font-bold">Не влияет</p></div><div><span className="text-muted-foreground">Призы</span><p className="mt-1 font-bold">Без денежных призов</p></div></div></div>
        <div className="border border-border bg-card p-5"><Eye size={20} className="text-primary" /><h3 className="mt-4 font-heading text-lg font-extrabold">Перед публикацией</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Модерация проверит права на данные, схему файлов, метрику и отсутствие запрещённого контента. Это не подтверждение научного качества задачи.</p></div>
      </div>
      <div className="mt-6 space-y-3">
        <ConfirmRow checked={form.rightsConfirmed} onChange={(value) => update("rightsConfirmed", value)} text="Я подтверждаю права на публикацию и использование данных." />
        <ConfirmRow checked={form.noPersonalDataConfirmed} onChange={(value) => update("noPersonalDataConfirmed", value)} text="В файлах нет лишних персональных данных и скрытых ответов среди материалов участников." />
        <ConfirmRow checked={form.rulesConfirmed} onChange={(value) => update("rulesConfirmed", value)} text="Я принимаю правила сообщества: без денежных призов, внешних платежей и влияния на сезонный рейтинг." />
      </div>
    </div>
  );
}

function ConfirmRow({ checked, onChange, text }) {
  return <label className="flex cursor-pointer items-start gap-3 border border-border bg-card p-4 text-sm leading-6"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" /><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-input bg-background text-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground"><Check size={13} /></span><span>{text}</span></label>;
}
