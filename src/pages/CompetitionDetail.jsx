import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleUserRound,
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
import { api, uploadFile, waitForSubmission } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
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

function pluralize(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function getStatus(competition) {
  if (["completed", "finished", "archived"].includes(competition.status)) return "finished";
  if (["scheduled", "approved_scheduled", "draft", "moderation", "submitted_for_review", "changes_requested"].includes(competition.status)) return "upcoming";
  if (competition.status === "finalizing") return "finalizing";
  return competition.status === "active" ? "active" : competition.status;
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

function formatPrize(competition) {
  const amount = Number(competition.prize_amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `${Math.round(amount / 100).toLocaleString("ru-RU")} ${competition.prize_currency || ""}`.trim();
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

function OverviewTab({ competition }) {
  const higher = isHigherBetter(competition.metric);
  const isCommunity = competition.origin === "community";
  const prize = formatPrize(competition);
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
          ["Формат", competition.prediction_column ? `CSV · ${competition.prediction_column}` : "CSV по шаблону", FileText],
          ["Сложность", competition.difficulty || "Не указана", BarChart3],
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
            <h2 className="font-heading text-xl font-bold">
              {isCommunity ? "Практика и история активности" : prize ? "Призовой фонд и возможности" : "Рейтинг и карьерные возможности"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {isCommunity
                ? "Результат сохраняется в отдельной истории сообщества. Он не меняет сезонный рейтинг, лигу и подтверждённую часть ML-паспорта."
                : prize
                ? "Лучшие участники получают денежные призы, а сильные решения могут стать поводом для знакомства с компаниями-партнёрами."
                : "Результат влияет на рейтинг, лигу и видимость ML-паспорта для компаний-партнёров."}
            </p>
          </div>
          <Trophy className="hidden text-primary sm:block" size={24} />
        </div>
        {prize && (
          <p className="mt-5 font-heading text-3xl font-bold text-primary">{prize}</p>
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

      <section className="border-t border-border py-7">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
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
              {competition.prediction_column
                ? `Колонка прогноза: ${competition.prediction_column}${competition.group_column ? `. Колонка группировки: ${competition.group_column}` : ""}. Используйте структуру sample_submission.`
                : "Используйте структуру и названия колонок из sample_submission."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmitTab({ competition, participation, submissions, onSubmitted, locked, joined, onJoin }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const mySubmissions = submissions;
  const dailyLimit = competition.daily_submission_limit;
  const attemptsUsed = participation?.attempts_used_today;
  const attemptsLeft = participation?.attempts_left_today;

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
      const upload = await uploadFile(file, "competition_submission", { competition_id: competition.id });
      setProgress(100);
      setStatus("validating");
      setStatus("scoring");
      const created = await api.competitions.submit(competition.id, upload.id, competition.current_dataset_version_id);
      const submission = created.id ? await waitForSubmission(created.id) : created;
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
    queued: ["Решение принято", "Ожидает обработки сервером"],
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
        <div className="text-sm font-semibold">{attemptsUsed ?? "—"} из {dailyLimit ?? "—"} попыток сегодня</div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${dailyLimit > 0 && attemptsUsed != null ? Math.min(100, (attemptsUsed / dailyLimit) * 100) : 0}%` }} />
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
            <p className="mt-1 text-xs text-muted-foreground">{file ? `${(file.size / 1024).toFixed(1)} КБ · готов к отправке` : competition.prediction_column ? `CSV · колонка ${competition.prediction_column} · до 10 МБ` : "CSV по шаблону · до 10 МБ"}</p>
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
                  <span className="text-muted-foreground">{submission.created_at ? new Date(submission.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                  <span className="font-semibold text-accent">{submission.status}</span>
                  <span className="font-semibold">{safeScore(Number(submission.public_score ?? submission.score), competition.metric)}</span>
                  <span className="text-muted-foreground">{submission.private_score == null ? "После финала" : safeScore(Number(submission.private_score), competition.metric)}</span>
                  <span>{participation?.best_public_score != null && Number(submission.public_score ?? submission.score) === Number(participation.best_public_score) ? "Лучший" : "—"}</span>
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

function LeaderboardTab({ competition }) {
  const [mode, setMode] = useState("public");
  const [search, setSearch] = useState("");
  const leaderboardQuery = useQuery({
    queryKey: ["competition-leaderboard", competition.id, mode, search.trim()],
    queryFn: () => api.competitions.leaderboard(competition.id, { kind: mode, ...(search.trim() ? { q: search.trim() } : {}), limit: 100, offset: 0 }),
  });
  const response = leaderboardQuery.data || {};
  const current = response.current_user;
  const rows = response.items || [];
  const leaderboard = current && !rows.some((row) => row.user_id === current.user_id) ? [...rows, current] : rows;
  const normalized = leaderboard.map((row) => ({ ...row, id: row.user_id, score: Number(row.best_score), is_current_user: current?.user_id === row.user_id }));
  const lockedPrivate = Boolean(response.private_locked) || (mode === "private" && getStatus(competition) !== "finished");
  const currentUser = normalized.find((submission) => submission.is_current_user);

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
          <span className="font-heading text-lg font-bold">#{currentUser.rank}</span>
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
          {normalized.map((submission) => {
            return (
              <Link
                key={submission.id}
                to={submission.is_current_user ? "/profile" : `/profile/${submission.user_id}`}
                className={cn(
                  "grid min-h-16 grid-cols-[60px_minmax(220px,1fr)_120px_90px_120px] items-center border-b border-border text-sm transition-colors hover:bg-secondary/40",
                  submission.is_current_user && "bg-primary/5",
                )}
              >
                <span className="font-heading font-bold">#{submission.rank}</span>
                <div className="flex items-center gap-3">
                  <Avatar name={submission.user_name} src={submission.user_avatar} size={32} />
                  <span className="font-semibold">{submission.user_name}</span>
                </div>
                <span className="font-heading font-bold text-primary">{safeScore(submission.score, competition.metric)}</span>
                <span className="text-muted-foreground">{submission.attempts ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString("ru-RU") : "—"}</span>
              </Link>
            );
          })}
          {leaderboardQuery.isLoading && <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={16} /> Загружаем рейтинг</div>}
          {leaderboardQuery.error && <div className="py-12 text-center text-sm text-destructive">{leaderboardQuery.error.message}</div>}
          {!leaderboardQuery.isLoading && !leaderboardQuery.error && !normalized.length && <div className="py-12 text-center text-sm text-muted-foreground">Участники не найдены.</div>}
        </div>
      </div>
    </div>
  );
}

function RulesTab({ competition }) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Правила соревнования</h2>
      {competition.rules
        ? <p className="mt-5 max-w-4xl whitespace-pre-wrap border-y border-border py-6 text-sm leading-7 text-muted-foreground">{competition.rules}</p>
        : <p className="mt-5 border-y border-dashed border-border py-10 text-center text-sm text-muted-foreground">Правила ещё не опубликованы.</p>}
    </div>
  );
}

function DiscussionTab({ discussions }) {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Обсуждение</h2>
      <div className="divide-y divide-border">
        {discussions.map((discussion) => (
          <article key={discussion.id} className="flex gap-3 py-5">
            <Avatar name={discussion.author_name} src={discussion.author_avatar} size={36} />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{discussion.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{discussion.content}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{discussion.author_name}</span>
                <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> {discussion.comments_count ?? "—"}</span>
              </div>
            </div>
          </article>
        ))}
        {!discussions.length && <p className="py-12 text-center text-sm text-muted-foreground">Обсуждений пока нет.</p>}
      </div>
    </div>
  );
}

function ParticipationPanel({ competition, participation, status, joined, onJoin, onLeave, onSubmit, leaving }) {
  const bestScore = participation?.best_public_score;
  const rank = participation?.public_rank;
  const attemptsLeft = participation?.attempts_left_today;
  const isCommunity = competition.origin === "community";
  const restricted = competition.is_private || competition.access_type === "invite_only" || competition.access_type === "application";
  const joinLabel = competition.access_type === "application" ? "Подать заявку" : restricted ? "Доступ по приглашению" : "Присоединиться";

  return (
    <aside className="border-y border-border bg-card p-5 lg:sticky lg:top-5">
      <h2 className="font-heading text-lg font-bold">Моё участие</h2>
      <div className="mt-4 flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-md", joined ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground")}>
          {joined ? <Check size={19} /> : <Trophy size={19} />}
        </div>
        <div>
          <p className="text-sm font-semibold">{status === "finished" ? "Соревнование завершено" : joined ? (bestScore != null ? "Есть валидный submit" : "Вы участвуете") : "Вы ещё не участвуете"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{status === "active" ? getDeadlineLabel(competition) : "Статус результатов доступен"}</p>
        </div>
      </div>

      <div className="mt-5 divide-y divide-border border-y border-border">
        <div className="flex items-center justify-between py-3 text-sm"><span className="text-muted-foreground">Лучший public score</span><span className="font-semibold">{safeScore(bestScore == null ? null : Number(bestScore), competition.metric)}</span></div>
        <div className="flex items-center justify-between py-3 text-sm"><span className="text-muted-foreground">Место</span><span className="font-semibold">{rank ? `#${rank}` : "—"}</span></div>
        <div className="flex items-center justify-between py-3 text-sm"><span className="text-muted-foreground">Попыток осталось</span><span className="font-semibold">{status === "active" ? (attemptsLeft ?? "—") : "Закрыто"}</span></div>
      </div>

      {!joined && status === "active" ? (
        <Button className="mt-5 w-full" onClick={onJoin}>
          {restricted ? <Lock size={15} /> : <Trophy size={15} />}
          {joinLabel}
        </Button>
      ) : status === "active" ? (
        <div className="mt-5 space-y-2"><Button className="w-full" onClick={onSubmit}><Upload size={15} /> Загрузить CSV</Button><Button className="w-full" variant="ghost" onClick={onLeave} disabled={leaving}>{leaving ? <Loader2 size={15} className="animate-spin" /> : null}Выйти из соревнования</Button></div>
      ) : status === "upcoming" ? (
        <Button className="mt-5 w-full" disabled><Clock3 size={15} /> Ещё не началось</Button>
      ) : (
        <Button asChild className="mt-5 w-full"><Link to={`/competitions/${competition.id}/leaderboard`}><Trophy size={15} /> Смотреть результаты</Link></Button>
      )}
      <p className="mt-3 text-center text-[11px] leading-4 text-muted-foreground">{isCommunity ? "Результат сохранится как активность сообщества и не повлияет на сезонный рейтинг." : "Лимиты рейтингового соревнования одинаковы для всех."}</p>
    </aside>
  );
}

export default function CompetitionDetail() {
  const { id, section } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const activeTab = TABS.some((tab) => tab.id === section) ? section : "overview";

  const { data: competition, isLoading, isError } = useQuery({
    queryKey: ["competition", id],
    queryFn: () => api.competitions.get(id),
    enabled: Boolean(id && isAuthenticated),
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
  const submissionsQuery = useQuery({
    queryKey: ["submissions", id],
    queryFn: () => api.competitions.submissions(id, { limit: 100, offset: 0 }),
    enabled: Boolean(id && isAuthenticated),
  });
  const submissions = submissionsQuery.data?.data || submissionsQuery.data?.items || [];
  const resultCardQuery = useQuery({
    queryKey: ["competition-result-card", id],
    queryFn: () => api.competitions.resultCard(id),
    enabled: Boolean(id && competition && ["completed", "finished"].includes(competition.status)),
    retry: false,
  });
  const { data: discussionsResponse } = useQuery({
    queryKey: ["discussions", id],
    queryFn: () => api.competitions.discussion(id),
    enabled: Boolean(id),
  });
  const discussions = Array.isArray(discussionsResponse) ? discussionsResponse : discussionsResponse?.items || [];

  useEffect(() => {
    setJoined(Boolean(participation));
  }, [participation]);

  const join = async () => {
    if (joining || joined || !competition) return;
    setJoining(true);
    try {
      if (competition.origin === "community") {
        if ((competition.access || competition.access_type) === "invite_only") {
          toast("Для участия нужно системное приглашение");
          return;
        }
        if ((competition.access || competition.access_type) === "application") {
          await api.communityCompetitions.apply(id, "Хочу принять участие в соревновании");
          toast.success("Заявка отправлена организатору");
          return;
        }
      }
      const rules = await api.competitions.rules(id);
      if (!rules.version) throw new Error("Сервер не вернул актуальную версию правил");
      await api.competitions.join(id, rules.version);
      setJoined(true);
      await queryClient.invalidateQueries({ queryKey: ["competition-participation", id] });
      toast.success("Вы участвуете в соревновании");
    } catch (error) {
      toast.error(error.message || "Не удалось присоединиться к соревнованию");
    } finally {
      setJoining(false);
    }
  };

  const leave = async () => {
    if (leaving || !joined) return;
    setLeaving(true);
    try {
      await api.competitions.leave(id);
      setJoined(false);
      await queryClient.invalidateQueries({ queryKey: ["competition-participation", id] });
      toast.success("Вы вышли из соревнования");
    } catch (error) {
      toast.error(error.message || "Не удалось выйти из соревнования");
    } finally {
      setLeaving(false);
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
  const isCommunity = competition.origin === "community";
  const prize = formatPrize(competition);
  const restricted = competition.is_private || competition.access_type === "invite_only" || competition.access_type === "application";
  const locked = ["upcoming", "finished", "finalizing"].includes(status) || (restricted && !joined);
  const statusLabel = { active: "Активно", upcoming: "Скоро", finalizing: "Финализация", finished: "Завершено" }[status];

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 pb-24 pt-6 md:px-6 lg:px-8 lg:py-10">
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

      {isCommunity && (
        <div className="mt-5 flex gap-3 border border-violet-500/25 bg-violet-500/5 p-4">
          <CircleUserRound className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" size={18} />
          <div><p className="text-sm font-semibold">Соревнование сообщества</p><p className="mt-1 text-xs leading-5 text-muted-foreground">ML-Арена проверяет формат CSV и считает результат, но не проверяет код решения. Результат не влияет на сезонный рейтинг и хранится отдельно в ML-паспорте.</p></div>
        </div>
      )}

      {resultCardQuery.data && (
        <div className="mt-5 grid gap-px border border-border bg-border sm:grid-cols-3">
          {[["Итоговое место", resultCardQuery.data.rank ? `#${resultCardQuery.data.rank}` : "—"], ["Итоговый результат", safeScore(resultCardQuery.data.score ?? resultCardQuery.data.final_score, competition.metric)], ["Статус проверки", resultCardQuery.data.verification_status || resultCardQuery.data.status || "—"]].map(([label, value]) => <div key={label} className="bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-lg font-bold">{value}</p></div>)}
        </div>
      )}

      <header className="mt-5 border-y border-border bg-card">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="flex min-h-[260px] flex-col justify-between p-6 md:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-semibold", isCommunity ? "border-violet-500/25 bg-violet-500/5 text-violet-600 dark:text-violet-400" : "border-primary/20 bg-primary/5 text-primary")}>
                  {isCommunity ? <CircleUserRound size={10} /> : <ShieldCheck size={10} />}
                  {isCommunity ? "Сообщество" : competition.origin === "official_partner" ? "Партнёрское" : "Официальное"}
                </span>
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", status === "active" ? "text-accent" : "text-primary")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabel}
                </span>
                <span className="border border-border px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">{TASK_TYPE_LABELS[competition.task_type]}</span>
                <span className="border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground">{competition.difficulty || "Не указана"}</span>
                {restricted && <span className="inline-flex items-center gap-1 border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground"><Lock size={10} /> {competition.access_type === "application" ? "По заявке" : "По приглашению"}</span>}
              </div>
              <h1 className="mt-5 max-w-4xl font-heading text-3xl font-bold leading-tight md:text-4xl">{competition.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{competition.description}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Users size={14} /> {competition.participants_count} участников</span>
              <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} /> {status === "active" ? getDeadlineLabel(competition) : statusLabel}</span>
              <span className="inline-flex items-center gap-1.5"><Award size={14} /> {prize || "Без призового фонда"}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-border lg:border-l lg:border-t-0">
            {[
              [Target, "Метрика", METRIC_LABELS[competition.metric]],
              [Trophy, isCommunity ? "Сезонный рейтинг" : "Призовой фонд", isCommunity ? "Не влияет" : prize || "Без приза"],
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
          {activeTab === "overview" && <OverviewTab competition={competition} />}
          {activeTab === "data" && <DataTab competition={competition} locked={status === "upcoming" || !joined} />}
          {activeTab === "submit" && (
            <SubmitTab
              competition={competition}
              participation={participation}
              submissions={submissions}
              onSubmitted={onSubmitted}
              locked={locked}
              joined={joined}
              onJoin={join}
            />
          )}
          {activeTab === "leaderboard" && <LeaderboardTab competition={competition} />}
          {activeTab === "rules" && <RulesTab competition={competition} />}
          {activeTab === "discussion" && (
            <DiscussionTab discussions={discussions} />
          )}
        </main>

        <ParticipationPanel
          competition={competition}
          participation={participation}
          status={status}
          joined={joined}
          onJoin={join}
          onLeave={leave}
          leaving={leaving}
          onSubmit={() => navigate(`/competitions/${id}/submit`)}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden">
        {!joined && status === "active" ? (
          <Button className="w-full" onClick={join}>
            {restricted ? <Lock size={15} /> : <Trophy size={15} />}
            {competition.access_type === "application" ? "Подать заявку" : restricted ? "Доступ по приглашению" : "Присоединиться"}
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
