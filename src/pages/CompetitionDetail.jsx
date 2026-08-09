import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  Download,
  FileCheck2,
  FileCode2,
  FileText,
  Gauge,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  Target,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { base44 } from "@/api/base44Client";
import { api } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  METRIC_LABELS,
  TASK_TYPE_LABELS,
  formatScore,
  isHigherBetter,
} from "@/lib/ml-arena";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Обзор", icon: FileText },
  { id: "data", label: "Данные", icon: Database },
  { id: "submit", label: "Отправка", icon: Upload },
  { id: "leaderboard", label: "Рейтинг", icon: Trophy },
  { id: "rules", label: "Правила", icon: ShieldCheck },
  { id: "discussion", label: "Обсуждение", icon: MessageSquare },
];

const META = {
  c1: { difficulty: "Средняя", domain: "Финтех", dataVersion: "1.2", dataSize: "48 МБ", baseline: "RMSE 2.5000" },
  c2: { difficulty: "Лёгкая", domain: "NLP", dataVersion: "1.0", dataSize: "22 МБ", baseline: "F1 0.7810" },
  c3: { difficulty: "Высокая", domain: "Финтех", dataVersion: "2.1", dataSize: "76 МБ", baseline: "ROC-AUC 0.8420" },
  c4: { difficulty: "Высокая", domain: "Ритейл", dataVersion: "1.1", dataSize: "1.4 ГБ", baseline: "Dice 0.7100" },
  c5: { difficulty: "Средняя", domain: "Транспорт", dataVersion: "0.9", dataSize: "18 МБ", baseline: "MAE 32.4000" },
  c6: { difficulty: "Начальная", domain: "Синтетика", dataVersion: "1.0", dataSize: "34 МБ", baseline: "Accuracy 0.9700" },
};

const RULE_SECTIONS = [
  ["Формат участия", "Соревнование индивидуальное. Один участник может использовать только один аккаунт."],
  ["Формат решения", "CSV с колонками id и prediction. Идентификаторы должны полностью совпадать с test.csv."],
  ["Лимиты", "Лимит попыток одинаков для всех участников рейтингового соревнования."],
  ["Внешние данные", "Использование внешних данных допускается только при явном разрешении организатора."],
  ["Предобученные модели", "Открытые предобученные модели разрешены, если в условии не указано обратное."],
  ["Рейтинг", "Во время турнира виден текущий результат. Итоговые места определяются после финальной проверки."],
  ["Дисквалификация", "Утечки, мультиаккаунты и атаки на платформу приводят к исключению результата."],
  ["Финальная проверка", "Участники top-10 могут получить запрос на воспроизводимый код решения."],
];

function pluralize(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function getStatus(competition) {
  if (competition.status === "completed") return "finished";
  if (competition.status === "draft") return "upcoming";
  if (competition.deadline && new Date(competition.deadline).getTime() < Date.now()) return "finalizing";
  return "active";
}

function getDeadlineLabel(competition) {
  if (!competition.deadline) return "Дата уточняется";
  const date = new Date(competition.deadline);
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
  return `${days} ${pluralize(days, "день", "дня", "дней")} · до ${date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`;
}

function safeScore(score, metric) {
  return typeof score === "number" ? formatScore(score, metric) : "—";
}

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

function CompetitionTabs({ competitionId, activeTab }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border scrollbar-thin" aria-label="Разделы соревнования">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            to={`/competitions/${competitionId}/${tab.id}`}
            className={cn(
              "relative flex h-12 shrink-0 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
              activeTab === tab.id && "text-primary",
            )}
          >
            <Icon size={15} />
            {tab.label}
            {activeTab === tab.id && <motion.span layoutId="competition-tab" className="absolute inset-x-2 bottom-0 h-0.5 bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}

function OverviewTab({ competition, meta }) {
  const higher = isHigherBetter(competition.metric);
  return (
    <div>
      <section className="border-b border-border pb-7">
        <h2 className="font-heading text-2xl font-bold">Что нужно сделать</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{competition.description}</p>
      </section>

      <section className="grid border-b border-border sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Тип задачи", TASK_TYPE_LABELS[competition.task_type] || competition.task_type, Target],
          ["Метрика", METRIC_LABELS[competition.metric] || competition.metric, Gauge],
          ["Формат", "CSV · id + prediction", FileText],
          ["Сложность", meta.difficulty, BarChart3],
        ].map(([label, value, Icon], index) => (
          <div key={label} className={cn("p-5", index > 0 && "border-t border-border sm:border-l sm:border-t-0", index === 2 && "sm:border-l-0 xl:border-l")}>
            <Icon className="text-primary" size={19} />
            <p className="mt-4 text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="border-b border-border py-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-heading text-xl font-bold">{METRIC_LABELS[competition.metric]}</h2>
          </div>
          <span className="text-sm font-semibold text-accent">{higher ? "Чем выше, тем лучше" : "Чем ниже, тем лучше"}</span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Результат рассчитывается на скрытой части тестовой выборки. Используй локальную валидацию, чтобы не подстраиваться под текущий рейтинг.
        </p>
      </section>

      <section className="border-b border-border py-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold">{competition.prize_fund ? "Призовой фонд и возможности" : "Рейтинг и карьерные возможности"}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {competition.prize_fund
                ? "Лучшие участники получают денежные призы, а сильные решения могут стать поводом для знакомства с компаниями-партнёрами."
                : "Результат влияет на рейтинг, лигу и видимость ML-паспорта для компаний-партнёров."}
            </p>
          </div>
          <Trophy className="hidden text-primary sm:block" size={24} />
        </div>
        {competition.prize_fund > 0 && (
          <p className="mt-5 font-heading text-3xl font-bold text-primary">{competition.prize_fund.toLocaleString("ru-RU")} ₽</p>
        )}
      </section>

      <section className="py-7">
        <h2 className="font-heading text-xl font-bold">Этапы соревнования</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            ["01", "Старт", "Данные открыты"],
            ["02", "Отправка решения", getDeadlineLabel(competition)],
            ["03", "Финальная проверка", "После дедлайна"],
            ["04", "Проверка лидеров", "Итоговый результат"],
          ].map(([number, title, text], index) => (
            <motion.div
              key={number}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ duration: 0.28, delay: index * 0.07, ease: "easeOut" }}
              className="group relative min-h-36 overflow-hidden rounded-lg border border-border bg-card p-4 transition-shadow duration-200 hover:shadow-md"
            >
              <span className="absolute inset-x-0 top-0 h-0.5 bg-primary/70" />
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 font-mono text-[10px] font-medium text-primary transition-transform duration-200 group-hover:-translate-y-0.5">{number}</span>
              <p className="mt-5 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 border-t border-border py-7 md:grid-cols-2">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="group rounded-lg border border-border bg-card p-5 md:p-6"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:-translate-y-0.5"><FileCode2 size={21} /></span>
          <h3 className="mt-5 font-heading text-lg font-bold">Начать с baseline</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Базовое решение даёт {meta.baseline} и показывает полный путь от данных до submit.</p>
          <Button variant="outline" className="mt-4" onClick={() => downloadCsv("baseline.py", "# Baseline ML Arena\n# Load train.csv, fit model, save submission.csv")}>
            <Download size={15} />
            Скачать baseline
          </Button>
        </motion.article>
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.3, delay: 0.08, ease: "easeOut" }}
          className="group rounded-lg border border-border bg-card p-5 md:p-6"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground transition-transform duration-200 group-hover:-translate-y-0.5"><ShieldCheck size={21} /></span>
          <h3 className="mt-5 font-heading text-lg font-bold">Одинаковые правила для всех</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Premium не меняет лимит submit-ов, score, положение в leaderboard или доступ к public данным.</p>
        </motion.article>
      </section>
    </div>
  );
}

function DataTab({ competition, locked }) {
  const [downloadingId, setDownloadingId] = useState(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["competition-files", competition.id],
    queryFn: () => api.competitions.files(competition.id),
    enabled: !locked,
    retry: false,
  });
  const files = data?.files || [];
  const download = async (file) => {
    setDownloadingId(file.id);
    try {
      const result = await api.competitions.fileUrl(competition.id, file.id);
      window.location.assign(result.url);
    } catch (downloadError) {
      toast.error(downloadError.message || "Не удалось скачать файл");
    } finally {
      setDownloadingId(null);
    }
  };
  const sizeLabel = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 ** 2) return `${Math.ceil(bytes / 1024)} КБ`;
    return `${(bytes / 1024 ** 2).toFixed(1)} МБ`;
  };

  return (
    <div>
      {locked && (
        <div className="mb-5 flex gap-3 border border-primary/25 bg-primary/5 p-4">
          <Lock className="mt-0.5 shrink-0 text-primary" size={18} />
          <div>
            <p className="text-sm font-semibold">Данные пока закрыты</p>
            <p className="mt-1 text-xs text-muted-foreground">Файлы станут доступны после старта соревнования.</p>
          </div>
        </div>
      )}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-heading text-2xl font-bold">Файлы соревнования</h2>
        </div>
        {data?.version && <div className="text-xs text-muted-foreground">Версия {data.version}</div>}
      </div>
      {isLoading && <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={17} /> Загружаем список файлов</div>}
      {error && <p className="my-5 border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error.message}</p>}
      <div className="grid gap-3 py-5 md:grid-cols-2">
        {files.map((file) => {
          const Icon = file.kind === "sample_submission" ? FileCheck2 : file.kind === "baseline" ? FileCode2 : Database;
          const filename = file.file?.original_filename || file.kind;
          const description = {
            train: "Признаки и целевая переменная",
            test: "Признаки без ответов",
            sample_submission: "Обязательный шаблон ответа",
            baseline: "Стартовое решение",
          }[file.kind] || "Файл соревнования";
          return (
            <div key={file.id} className="flex min-h-32 flex-col justify-between border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon size={18} /></div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{filename}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">{sizeLabel(file.file?.size_bytes)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={locked || downloadingId === file.id}
                  onClick={() => download(file)}
                  aria-label={`Скачать ${filename}`}
                >
                  {downloadingId === file.id ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                  Скачать
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-y border-border p-5">
        <div className="flex gap-3">
          <Info className="mt-0.5 shrink-0 text-primary" size={18} />
          <div>
            <p className="text-sm font-semibold">Формат решения</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Колонки id и prediction, без пропусков и NaN. Количество строк и id должны совпадать с test.csv.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmitTab({ competition, submissions, onSubmitted, locked, joined, onJoin }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const mySubmissions = submissions.filter((submission) => submission.user_name === "Ты");
  const attemptsUsed = Math.min(mySubmissions.length, competition.max_submits_free || 5);
  const attemptsLeft = Math.max(0, (competition.max_submits_free || 5) - attemptsUsed);

  const selectFile = (selected) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setStatus("invalid");
      setError("Нужен CSV-файл. Скачайте sample_submission и проверьте расширение.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFile(null);
      setStatus("invalid");
      setError("Файл больше допустимых 10 МБ.");
      return;
    }
    setFile(selected);
    setStatus("idle");
    setError("");
  };

  const submit = async () => {
    if (!file || locked || attemptsLeft === 0) return;
    try {
      setStatus("uploading");
      setProgress(24);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProgress(100);
      setStatus("validating");
      setStatus("scoring");
      const submission = await base44.entities.Submission.create({
        competition_id: competition.id,
        user_name: "Ты",
        file_url,
        attempt_number: mySubmissions.length + 1,
        created_date: new Date().toISOString(),
      });
      const score = Number(submission.public_score ?? submission.score);
      if (!Number.isFinite(score)) throw new Error("Проверка завершилась без результата");
      setStatus("scored");
      setFile(null);
      await onSubmitted(score);
    } catch (submitError) {
      setStatus("failed");
      setError(submitError.message || "Системная ошибка scoring. Попытка не списана.");
    }
  };

  const statusMeta = {
    uploading: ["Загружаем файл", `${progress}%`],
    validating: ["Проверяем CSV", "Колонки, id, пропуски и типы значений"],
    queued: ["Решение принято", "Позиция в очереди: 1"],
    scoring: ["Считаем public score", "Обычно это занимает меньше минуты"],
    scored: ["Score рассчитан", "Leaderboard обновлён"],
    invalid: ["Файл не принят", error],
    failed: ["Ошибка проверки", error],
  };

  if (!joined) {
    return (
      <div className="border-y border-border py-14 text-center">
        <Lock className="mx-auto text-primary" size={28} />
        <h2 className="mt-4 font-heading text-2xl font-bold">{locked ? "Submit пока недоступен" : "Сначала присоединитесь к соревнованию"}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          {locked ? "Соревнование ещё не началось, завершено или доступно только по приглашению." : "После вступления откроются данные, submit и история ваших попыток."}
        </p>
        <Button className="mt-5" onClick={onJoin} disabled={locked}><Trophy size={16} /> {locked ? "Доступ закрыт" : "Присоединиться"}</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-heading text-2xl font-bold">Загрузить решение</h2>
        </div>
        <div className="text-sm font-semibold">{attemptsUsed} из {competition.max_submits_free || 5} попыток сегодня</div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(attemptsUsed / (competition.max_submits_free || 5)) * 100}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Лимит одинаков для всех участников рейтингового соревнования.</p>

      {locked || attemptsLeft === 0 ? (
        <div className="mt-6 flex min-h-40 items-center justify-center border border-dashed border-border text-center">
          <div>
            <Lock className="mx-auto text-muted-foreground" size={22} />
            <p className="mt-3 text-sm font-semibold">{locked ? "Submit закрыт" : "Лимит на сегодня исчерпан"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{locked ? "Соревнование не принимает новые решения." : "Новые попытки появятся завтра."}</p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            selectFile(event.dataTransfer.files[0]);
          }}
          className="mt-6 flex min-h-44 w-full items-center justify-center border border-dashed border-border bg-secondary/20 p-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => selectFile(event.target.files[0])}
          />
          <div>
            <Upload className="mx-auto text-primary" size={28} />
            <p className="mt-4 text-sm font-semibold">{file ? file.name : "Перетащите CSV или выберите файл"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{file ? `${(file.size / 1024).toFixed(1)} КБ · готов к отправке` : "id + prediction · без пропусков · до 10 МБ"}</p>
          </div>
        </button>
      )}

      {file && status === "idle" && <Button className="mt-3 w-full" onClick={submit}><Send size={15} /> Загрузить решение</Button>}

      {statusMeta[status] && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 border border-border p-4">
          <div className="flex items-center gap-3">
            {["uploading", "validating", "queued", "scoring"].includes(status)
              ? <Loader2 className="animate-spin text-primary" size={18} />
              : status === "scored"
                ? <CheckCircle2 className="text-accent" size={18} />
                : <AlertCircle className="text-destructive" size={18} />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{statusMeta[status][0]}</p>
              <p className="truncate text-xs text-muted-foreground">{statusMeta[status][1]}</p>
            </div>
          </div>
          {status === "uploading" && <div className="mt-3 h-1 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>}
        </motion.div>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold">Мои submit-ы</h3>
          <span className="text-xs text-muted-foreground">{mySubmissions.length} {pluralize(mySubmissions.length, "попытка", "попытки", "попыток")}</span>
        </div>
        {mySubmissions.length ? (
          <div className="mt-3 overflow-x-auto border-y border-border">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[52px_120px_100px_110px_1fr_90px] border-b border-border py-3 text-xs text-muted-foreground">
                <span>#</span><span>Время</span><span>Статус</span><span>Public score</span><span>Private score</span><span>Лучший</span>
              </div>
              {mySubmissions.map((submission, index) => (
                <div key={submission.id} className="grid min-h-14 grid-cols-[52px_120px_100px_110px_1fr_90px] items-center border-b border-border text-xs">
                  <span className="font-mono">{submission.attempt_number || mySubmissions.length - index}</span>
                  <span className="text-muted-foreground">{new Date(submission.created_date).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="font-semibold text-accent">Scored</span>
                  <span className="font-semibold">{safeScore(submission.score, competition.metric)}</span>
                  <span className="text-muted-foreground">После финала</span>
                  <span>{index === 0 ? "Лучший" : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 border-y border-dashed border-border py-8 text-center text-sm text-muted-foreground">Валидных submit-ов пока нет.</div>
        )}
      </section>
    </div>
  );
}

function LeaderboardTab({ competition, leaderboard, submissions }) {
  const [mode, setMode] = useState("public");
  const [search, setSearch] = useState("");
  const lockedPrivate = getStatus(competition) !== "finished";
  const filtered = leaderboard.filter((submission) => submission.user_name.toLowerCase().includes(search.trim().toLowerCase()));
  const currentUser = leaderboard.find((submission) => submission.user_name === "Ты");

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
        <div>
          <h2 className="font-heading text-2xl font-bold">Leaderboard</h2>
        </div>
        <div className="flex border border-border p-1">
          <button type="button" onClick={() => setMode("public")} className={cn("h-8 px-4 text-xs font-semibold", mode === "public" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Public</button>
          <button
            type="button"
            disabled={lockedPrivate}
            onClick={() => setMode("private")}
            className={cn("flex h-8 items-center gap-1.5 px-4 text-xs font-semibold", mode === "private" ? "bg-primary text-primary-foreground" : "text-muted-foreground", lockedPrivate && "opacity-50")}
          >
            {lockedPrivate && <Lock size={12} />}
            Private
          </button>
        </div>
      </div>

      {lockedPrivate && (
        <div className="mt-5 flex gap-3 border border-primary/20 bg-primary/5 p-4">
          <Lock className="mt-0.5 shrink-0 text-primary" size={17} />
          <p className="text-xs leading-5 text-muted-foreground">Private score скрыт до завершения. Итоговые места определяются после private-пересчёта.</p>
        </div>
      )}

      <div className="relative mt-5">
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти участника" className="pl-10" />
      </div>

      {currentUser && (
        <div className="mt-4 grid grid-cols-[48px_1fr_auto] items-center gap-3 border border-primary/35 bg-primary/5 p-3">
          <span className="font-heading text-lg font-bold">#{leaderboard.indexOf(currentUser) + 1}</span>
          <div className="flex items-center gap-3">
            <Avatar name="Ты" size={32} />
            <div><p className="text-sm font-semibold">Ты</p><p className="text-xs text-muted-foreground">Закреплённая позиция</p></div>
          </div>
          <span className="font-heading font-bold text-primary">{safeScore(currentUser.score, competition.metric)}</span>
        </div>
      )}

      <div className="mt-4 overflow-x-auto border-y border-border">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[60px_minmax(220px,1fr)_120px_90px_120px] border-b border-border py-3 text-xs text-muted-foreground">
            <span>Rank</span><span>Участник</span><span>Score</span><span>Submits</span><span>Лучший submit</span>
          </div>
          {filtered.map((submission) => {
            const rank = leaderboard.indexOf(submission) + 1;
            const submitCount = submissions.filter((item) => item.user_name === submission.user_name).length;
            return (
              <Link
                key={submission.id}
                to={submission.user_name === "Ты" ? "/profile/me" : "/profile/p1"}
                className={cn(
                  "grid min-h-16 grid-cols-[60px_minmax(220px,1fr)_120px_90px_120px] items-center border-b border-border text-sm transition-colors hover:bg-secondary/40",
                  submission.user_name === "Ты" && "bg-primary/5",
                )}
              >
                <span className="font-heading font-bold">#{rank}</span>
                <div className="flex items-center gap-3">
                  <Avatar name={submission.user_name} src={submission.user_avatar} size={32} />
                  <span className="font-semibold">{submission.user_name}</span>
                  <LeagueBadge rating={1580 - rank * 35} size="sm" />
                </div>
                <span className="font-heading font-bold text-primary">{safeScore(submission.score, competition.metric)}</span>
                <span className="text-muted-foreground">{submitCount || 1}</span>
                <span className="text-xs text-muted-foreground">{new Date(submission.created_date).toLocaleDateString("ru-RU")}</span>
              </Link>
            );
          })}
          {!filtered.length && <div className="py-12 text-center text-sm text-muted-foreground">Участник не найден.</div>}
        </div>
      </div>
    </div>
  );
}

function RulesTab({ competition }) {
  const [open, setOpen] = useState(0);
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Правила соревнования</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{competition.rules}</p>
      <div className="mt-6 border-y border-border">
        {RULE_SECTIONS.map(([title, text], index) => (
          <div key={title} className="border-b border-border last:border-b-0">
            <button type="button" onClick={() => setOpen(open === index ? -1 : index)} className="flex min-h-14 w-full items-center gap-3 text-left">
              <span className="font-mono text-[10px] text-primary">{String(index + 1).padStart(2, "0")}</span>
              <span className="flex-1 text-sm font-semibold">{title}</span>
              <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", open === index && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
              {open === index && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className="pb-5 pl-9 pr-5 text-sm leading-6 text-muted-foreground">{text}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscussionTab({ discussions, newThread, setNewThread, onCreate }) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Обсуждение</h2>
      <div className="mt-6 border-y border-border py-5">
        <h3 className="text-sm font-semibold">Задать вопрос</h3>
        <div className="mt-3 space-y-3">
          <Input value={newThread.title} onChange={(event) => setNewThread({ ...newThread, title: event.target.value })} placeholder="Короткий заголовок" />
          <Textarea value={newThread.content} onChange={(event) => setNewThread({ ...newThread, content: event.target.value })} placeholder="Опиши вопрос или проблему" rows={4} />
          <Button onClick={onCreate} disabled={!newThread.title.trim() || !newThread.content.trim()}><Send size={15} /> Опубликовать</Button>
        </div>
      </div>
      <div className="divide-y divide-border">
        {discussions.map((discussion) => (
          <article key={discussion.id} className="flex gap-3 py-5">
            <Avatar name={discussion.author_name} src={discussion.author_avatar} size={36} />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{discussion.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{discussion.content}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{discussion.author_name}</span>
                <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> {discussion.comments_count || 0}</span>
              </div>
            </div>
          </article>
        ))}
        {!discussions.length && <p className="py-12 text-center text-sm text-muted-foreground">Обсуждений пока нет.</p>}
      </div>
    </div>
  );
}

function ParticipationPanel({ competition, status, joined, submissions, leaderboard, onJoin, onSubmit }) {
  const mySubmissions = submissions.filter((submission) => submission.user_name === "Ты");
  const best = mySubmissions.reduce((current, item) => {
    if (!current) return item;
    return isHigherBetter(competition.metric)
      ? (item.score > current.score ? item : current)
      : (item.score < current.score ? item : current);
  }, null);
  const rank = best ? leaderboard.findIndex((item) => item.id === best.id) + 1 : null;
  const attemptsLeft = Math.max(0, (competition.max_submits_free || 5) - mySubmissions.length);

  return (
    <aside className="border-y border-border bg-card p-5 lg:sticky lg:top-5">
      <h2 className="font-heading text-lg font-bold">Моё участие</h2>
      <div className="mt-4 flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-md", joined ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground")}>
          {joined ? <Check size={19} /> : <Trophy size={19} />}
        </div>
        <div>
          <p className="text-sm font-semibold">{status === "finished" ? "Соревнование завершено" : joined ? (best ? "Есть валидный submit" : "Вы участвуете") : "Вы ещё не участвуете"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{status === "active" ? getDeadlineLabel(competition) : "Статус результатов доступен"}</p>
        </div>
      </div>

      <div className="mt-5 divide-y divide-border border-y border-border">
        <div className="flex items-center justify-between py-3 text-sm"><span className="text-muted-foreground">Лучший public score</span><span className="font-semibold">{safeScore(best?.score, competition.metric)}</span></div>
        <div className="flex items-center justify-between py-3 text-sm"><span className="text-muted-foreground">Место</span><span className="font-semibold">{rank ? `#${rank}` : "—"}</span></div>
        <div className="flex items-center justify-between py-3 text-sm"><span className="text-muted-foreground">Попыток осталось</span><span className="font-semibold">{status === "active" ? `${attemptsLeft}/${competition.max_submits_free || 5}` : "Закрыто"}</span></div>
      </div>

      {!joined && status === "active" ? (
        <Button className="mt-5 w-full" onClick={onJoin}>
          {competition.is_private ? <Lock size={15} /> : <Trophy size={15} />}
          {competition.is_private ? "Доступ по приглашению" : "Присоединиться"}
        </Button>
      ) : status === "active" ? (
        <Button className="mt-5 w-full" onClick={onSubmit}><Upload size={15} /> Загрузить CSV</Button>
      ) : status === "upcoming" ? (
        <Button className="mt-5 w-full" disabled><Clock3 size={15} /> Ещё не началось</Button>
      ) : (
        <Button asChild className="mt-5 w-full"><Link to={`/competitions/${competition.id}/leaderboard`}><Trophy size={15} /> Смотреть результаты</Link></Button>
      )}
      <p className="mt-3 text-center text-[11px] leading-4 text-muted-foreground">Лимиты рейтингового соревнования одинаковы для всех.</p>
    </aside>
  );
}

export default function CompetitionDetail() {
  const { id, section } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newThread, setNewThread] = useState({ title: "", content: "" });
  const activeTab = TABS.some((tab) => tab.id === section) ? section : "overview";

  const { data: competition, isLoading, isError } = useQuery({
    queryKey: ["competition", id],
    queryFn: () => base44.entities.Competition.get(id),
    enabled: Boolean(id),
    retry: false,
  });
  const { data: participation } = useQuery({
    queryKey: ["competition-participation", id],
    queryFn: async () => {
      try {
        return await api.competitions.participation(id);
      } catch (error) {
        if (error.status === 404) return null;
        throw error;
      }
    },
    enabled: Boolean(id),
    retry: false,
  });
  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions", id],
    queryFn: () => base44.entities.Submission.filter({ competition_id: id }, "-score", 100),
    enabled: Boolean(id),
  });
  const { data: discussions = [] } = useQuery({
    queryKey: ["discussions", id],
    queryFn: () => base44.entities.Discussion.filter({ competition_id: id }, "-created_date", 50),
    enabled: Boolean(id),
  });

  const leaderboard = useMemo(() => {
    if (!competition) return [];
    const best = new Map();
    submissions.forEach((submission) => {
      if (typeof submission.score !== "number") return;
      const existing = best.get(submission.user_name);
      if (!existing || (isHigherBetter(competition.metric) ? submission.score > existing.score : submission.score < existing.score)) {
        best.set(submission.user_name, submission);
      }
    });
    return Array.from(best.values()).sort((a, b) => isHigherBetter(competition.metric) ? b.score - a.score : a.score - b.score);
  }, [competition, submissions]);

  useEffect(() => {
    setJoined(Boolean(participation));
  }, [participation]);

  const join = async () => {
    if (joining || joined || !competition) return;
    setJoining(true);
    try {
      const rules = await api.competitions.rules(id);
      await api.competitions.join(id, rules.version || competition.rules_version || "v1");
      setJoined(true);
      await queryClient.invalidateQueries({ queryKey: ["competition-participation", id] });
      toast.success("Вы участвуете в соревновании");
    } catch (error) {
      toast.error(error.message || "Не удалось присоединиться к соревнованию");
    } finally {
      setJoining(false);
    }
  };

  const createThread = async () => {
    if (!newThread.title.trim() || !newThread.content.trim()) return;
    try {
      await base44.entities.Discussion.create({
        competition_id: id,
        title: newThread.title.trim(),
        content: newThread.content.trim(),
        author_name: "Ты",
      });
      setNewThread({ title: "", content: "" });
      queryClient.invalidateQueries({ queryKey: ["discussions", id] });
      toast.success("Вопрос опубликован");
    } catch (error) {
      toast.error(error.message || "Не удалось опубликовать вопрос");
    }
  };

  const onSubmitted = async (score) => {
    await queryClient.invalidateQueries({ queryKey: ["submissions", id] });
    toast.success(`Score рассчитан: ${safeScore(score, competition.metric)}`);
  };

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  }

  if (isError || !competition) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto text-destructive" size={28} />
        <h1 className="mt-4 font-heading text-2xl font-bold">Соревнование не найдено</h1>
        <Button asChild variant="outline" className="mt-5"><Link to="/competitions"><ArrowLeft size={16} /> К каталогу</Link></Button>
      </div>
    );
  }

  const status = getStatus(competition);
  const meta = META[competition.id] || { difficulty: "Средняя", domain: "Другое", dataVersion: "1.0", dataSize: "до 100 МБ", baseline: "доступен" };
  const locked = ["upcoming", "finished", "finalizing"].includes(status) || (competition.is_private && !joined);
  const statusLabel = { active: "Активно", upcoming: "Скоро", finalizing: "Финализация", finished: "Завершено" }[status];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 md:px-6 md:py-7">
      <Link to="/competitions" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft size={16} />
        Все соревнования
      </Link>

      {status === "finalizing" && (
        <div className="mt-5 flex gap-3 border border-primary/25 bg-primary/5 p-4">
          <Loader2 className="mt-0.5 shrink-0 animate-spin text-primary" size={17} />
          <div><p className="text-sm font-semibold">Идёт private-пересчёт</p><p className="mt-1 text-xs text-muted-foreground">Места могут измениться до публикации итоговых результатов.</p></div>
        </div>
      )}

      <header className="mt-5 border-y border-border bg-card">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="flex min-h-[260px] flex-col justify-between p-6 md:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", status === "active" ? "text-accent" : "text-primary")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabel}
                </span>
                <span className="border border-border px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">{TASK_TYPE_LABELS[competition.task_type]}</span>
                <span className="border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground">{meta.difficulty}</span>
                {competition.is_private && <span className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground"><Lock size={10} /> По приглашению</span>}
              </div>
              <h1 className="mt-5 max-w-4xl font-heading text-3xl font-bold leading-tight md:text-4xl">{competition.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{competition.description}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Users size={14} /> {competition.participants_count} участников</span>
              <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} /> {status === "active" ? getDeadlineLabel(competition) : statusLabel}</span>
              <span className="inline-flex items-center gap-1.5"><Award size={14} /> {competition.prize_fund ? `${competition.prize_fund.toLocaleString("ru-RU")} ₽` : "Без призового фонда"}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-border lg:border-l lg:border-t-0">
            {[
              [Target, "Метрика", METRIC_LABELS[competition.metric]],
              [Trophy, "Призовой фонд", competition.prize_fund ? `${competition.prize_fund.toLocaleString("ru-RU")} ₽` : "Без приза"],
              [Clock3, "Дедлайн", status === "active" ? getDeadlineLabel(competition).split(" · ")[0] : statusLabel],
              [ShieldCheck, "Итоговый результат", "После финальной проверки"],
            ].map(([Icon, label, value], index) => (
              <div key={label} className={cn("flex min-h-32 flex-col justify-between p-5", index % 2 === 1 && "border-l border-border", index > 1 && "border-t border-border")}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon size={15} className="text-primary" /> {label}</div>
                <p className="font-heading text-lg font-bold leading-tight">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-5"><CompetitionTabs competitionId={id} activeTab={activeTab} /></div>

      <div className="mt-6 grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_310px]">
        <main className="min-w-0">
          {activeTab === "overview" && <OverviewTab competition={competition} meta={meta} />}
          {activeTab === "data" && <DataTab competition={competition} locked={status === "upcoming" || !joined} />}
          {activeTab === "submit" && (
            <SubmitTab
              competition={competition}
              submissions={submissions}
              onSubmitted={onSubmitted}
              locked={locked}
              joined={joined}
              onJoin={join}
            />
          )}
          {activeTab === "leaderboard" && <LeaderboardTab competition={competition} leaderboard={leaderboard} submissions={submissions} />}
          {activeTab === "rules" && <RulesTab competition={competition} />}
          {activeTab === "discussion" && (
            <DiscussionTab
              discussions={discussions}
              newThread={newThread}
              setNewThread={setNewThread}
              onCreate={createThread}
            />
          )}
        </main>

        <ParticipationPanel
          competition={competition}
          status={status}
          joined={joined}
          submissions={submissions}
          leaderboard={leaderboard}
          onJoin={join}
          onSubmit={() => navigate(`/competitions/${id}/submit`)}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden">
        {!joined && status === "active" ? (
          <Button className="w-full" onClick={join}>
            {competition.is_private ? <Lock size={15} /> : <Trophy size={15} />}
            {competition.is_private ? "Доступ по приглашению" : "Присоединиться"}
          </Button>
        ) : status === "active" ? (
          <Button className="w-full" onClick={() => navigate(`/competitions/${id}/submit`)}><Upload size={15} /> Загрузить CSV</Button>
        ) : status === "upcoming" ? (
          <Button className="w-full" disabled><Clock3 size={15} /> Ещё не началось</Button>
        ) : (
          <Button className="w-full" onClick={() => navigate(`/competitions/${id}/leaderboard`)}><Trophy size={15} /> Смотреть результаты</Button>
        )}
      </div>
    </div>
  );
}
