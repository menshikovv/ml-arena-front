import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleUserRound,
  Code2,
  Clock3,
  Database,
  Download,
  FileCheck2,
  FileCode2,
  FileText,
  Flag,
  Gauge,
  Info,
  Loader2,
  Layers,
  Lock,
  MessageSquare,
  Send,
  Settings2,
  ShieldCheck,
  Target,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { api, uploadFile, waitForSubmission } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import SubmissionSourceCode from "@/components/ml/SubmissionSourceCode";
import { CompetitionContent, CompetitionSummary, CompetitionCodeSample } from "@/components/ml/CompetitionContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import {
  METRIC_LABELS,
  TASK_TYPE_LABELS,
  formatScore,
  getCompetitionMetricDirection,
  SUBMISSION_STATUS_LABELS,
  getSubmissionScore,
  canShowPrivateScore,
} from "@/lib/ml-arena";
import { cn } from "@/lib/utils";
import { downloadCompetitionPdf } from "@/lib/reportPdf";
import "./CompetitionDetail.css";

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
  const deadline = competition.submission_deadline || competition.deadline;
  if (!deadline) return "Дата уточняется";
  const date = new Date(deadline);
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
  return `${days} ${pluralize(days, "день", "дня", "дней")} · до ${date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`;
}

function safeScore(score, metric) {
  return typeof score === "number" && Number.isFinite(score) ? formatScore(score, metric) : "—";
}

function formatPrize(competition) {
  if (competition.prize_type === "non_cash" && competition.prize_description) return competition.prize_description;
  const amount = competition.cash_prize_amount_rub != null
    ? Number(competition.cash_prize_amount_rub)
    : Number(competition.prize_amount) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString("ru-RU")} ₽`;
  }
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

function OverviewTab({ competition, participationPanel }) {
  const isCommunity = competition.origin === "community";
  const rated = !isCommunity && competition.rated !== false;
  const prize = formatPrize(competition);
  const metric = competition.metric_name || METRIC_LABELS[competition.metric] || competition.metric || "Не указана";
  const preference = getCompetitionMetricDirection(competition);
  const reduced = useReducedMotion();
  const facts = [
    ["Отправок в день", competition.daily_submission_limit ?? "—", Upload],
    ["Начало", competition.starts_at ? new Date(competition.starts_at).toLocaleDateString("ru-RU") : "После публикации", CalendarClock],
    ["Финальные итоги", competition.final_results_at ? new Date(competition.final_results_at).toLocaleDateString("ru-RU") : "После проверки", CheckCircle2],
    ["Участники", competition.max_participants ? `${competition.participants_count || 0} из ${competition.max_participants}` : `${competition.participants_count || 0} · без лимита`, Users],
    ["Тип задачи", TASK_TYPE_LABELS[competition.task_type] || competition.task_type || "Не указан", Target],
    ["Метрика", metric, Gauge],
    ["Формат", competition.prediction_column ? `CSV · ${competition.prediction_column}` : "CSV по шаблону", FileText],
    ["Сложность", competition.difficulty || "Не указана", BarChart3],
  ];
  return (
    <div className="competition-overview">
      <div className="competition-overview-top">
        <div className="competition-overview-primary">
          <section className="competition-detail-panel competition-key-info">
            <h2>Ключевая информация</h2>
            <dl className="competition-key-grid">
              {facts.map(([label, value, Icon]) => <div key={label} className="competition-key-item">
                <span className="competition-detail-icon"><Icon size={21} /></span>
                <div><dt>{label}</dt><dd>{value}</dd></div>
              </div>)}
            </dl>
          </section>
          <section className="competition-detail-panel competition-statement">
            <h2>Что нужно сделать</h2>
            <CompetitionContent brief>{competition.description}</CompetitionContent>
          </section>
        </div>
        {participationPanel}
      </div>

      <section className="competition-detail-panel competition-metric-panel">
        <div className="competition-metric-main">
          <h2>Метрика и оценка решения</h2>
          <p>Оценка рассчитывается по метрике <strong>{metric}</strong>. Для первого запуска используйте данные участника и опубликованное стартовое решение.</p>
          <CompetitionCodeSample>{competition.description}</CompetitionCodeSample>
        </div>
        <aside className="competition-metric-note">
          <span className="competition-detail-icon"><BarChart3 size={22} /></span>
          <div><h3>{preference === "maximize" ? "Чем выше, тем лучше" : preference === "minimize" ? "Чем ниже, тем лучше" : "Оценка по метрике"}</h3>
          <p>Скрытая часть тестовой выборки используется только для итоговой оценки. Используйте локальную валидацию, чтобы не подстраиваться под текущий рейтинг.</p></div>
        </aside>
      </section>

      <section className="competition-detail-panel competition-opportunities">
        <div><h2>{isCommunity ? "Практика и история активности" : prize ? "Призовой фонд и возможности" : "Рейтинг и карьерные возможности"}</h2>
          <p>{isCommunity ? "Результат сохранится в истории сообщества без сезонных очков." : rated ? "Результат влияет на рейтинг, лигу и подтверждённую часть ML-паспорта." : "Результат сохранится в истории соревнований. Практика не влияет на сезонный рейтинг."}{prize && <> Призовой фонд: <strong>{prize}</strong>.</>}</p>
        </div>
        <div className="competition-opportunities-art" aria-hidden="true"><span /><span /><span /><Trophy size={34} /></div>
      </section>

      <section className="competition-detail-panel competition-stages">
        <h2>Этапы соревнования</h2>
        <div className="competition-stages-grid">
          {[
            ["01", "Старт", "Данные открыты", Send],
            ["02", "Отправка решения", getDeadlineLabel(competition), Database],
            ["03", "Финальная проверка", "После дедлайна", Settings2],
            ["04", "Проверка лидеров", "Итоговый результат", Trophy],
          ].map(([number, title, text, Icon], index) => <motion.div key={number}
            initial={reduced ? false : { opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.35, delay: index * 0.06 }}
            className="competition-stage">
            <span className="competition-stage-number">{number}</span><Icon size={22} />
            <div><h3>{title}</h3><p>{text}</p></div>
            {index < 3 && <ArrowRight className="competition-stage-arrow" size={16} aria-hidden="true" />}
          </motion.div>)}
        </div>
        <div className="competition-fairness-note"><span className="competition-detail-icon"><ShieldCheck size={23} /></span>
          <div><h3>Одинаковые правила для всех</h3><p>Premium не меняет лимит отправок, оценку, место в рейтинге или доступ к открытым данным.</p></div>
        </div>
      </section>

      {(competition.external_data_policy || competition.ai_tools_policy || competition.pretrained_models_policy) && <section className="competition-detail-panel competition-conditions">
        <h2>Дополнительные условия</h2>
        <dl>{[["Внешние данные", competition.external_data_policy, Database], ["AI-инструменты", competition.ai_tools_policy, Code2], ["Предобученные модели", competition.pretrained_models_policy, Layers]].filter(([, value]) => value).map(([label, value, Icon]) =>
          <div key={label}><dt><Icon size={16} />{label}</dt><dd><CompetitionContent className="competition-policy-content">{value}</CompetitionContent></dd></div>
        )}</dl>
      </section>}
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
          const Icon = file.kind === "statement_attachment" ? FileCheck2 : file.kind === "baseline" ? FileCode2 : Database;
          const filename = file.file?.original_filename || file.kind;
          const description = {
            participant_bundle: "ZIP с train.csv, test.csv и sample_submission.csv",
            baseline: "Стартовое решение",
            statement_attachment: "Материал условия",
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
  const queryClient = useQueryClient();
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["submissions", competition.id] }),
        queryClient.invalidateQueries({ queryKey: ["competition-participation", competition.id] }),
      ]);
      const score = getSubmissionScore(submission);
      if (score == null) throw new Error(submission.error_message || submission.failure_reason || "Решение не получило оценку. Проверьте статус и причину ошибки в истории решений.");
      setStatus("scored");
      setFile(null);
      await onSubmitted(score);
    } catch (submitError) {
      setStatus("failed");
      setError(submitError.message || "Не удалось проверить решение. Подробности доступны в истории решений.");
    }
  };

  const statusMeta = {
    uploading: ["Загружаем файл", `${progress}%`],
    validating: ["Проверяем CSV", "Колонки, id, пропуски и типы значений"],
    queued: ["Решение принято", "Ожидает проверки"],
    scoring: ["Проверяем результат", "Обычно это занимает меньше минуты"],
    scored: ["Результат готов", "Таблица обновлена"],
    invalid: ["Файл не принят", error],
    failed: ["Ошибка проверки", error],
  };
  const sourceCodePanel = <SubmissionSourceCode competition={competition} participation={participation} submissions={mySubmissions} />;

  if (!joined) {
    return (
      <><div className="border-y border-border py-14 text-center">
        <Lock className="mx-auto text-primary" size={28} />
        <h2 className="mt-4 font-heading text-2xl font-bold">{locked ? "Отправка пока недоступна" : "Сначала присоединитесь к соревнованию"}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          {locked ? "Соревнование ещё не началось, завершено или доступно только по приглашению." : "После вступления откроются данные, отправка решений и история ваших попыток."}
        </p>
        <Button className="mt-5" onClick={onJoin} disabled={locked}><Trophy size={16} /> {locked ? "Доступ закрыт" : "Присоединиться"}</Button>
      </div>{sourceCodePanel}</>
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
            <p className="mt-3 text-sm font-semibold">{locked ? "Приём решений закрыт" : "Лимит на сегодня исчерпан"}</p>
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

      {sourceCodePanel}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold">Мои решения</h3>
          <span className="text-xs text-muted-foreground">{mySubmissions.length} {pluralize(mySubmissions.length, "попытка", "попытки", "попыток")}</span>
        </div>
        {mySubmissions.length ? (
          <div className="mt-3 overflow-x-auto border-y border-border">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[52px_120px_100px_110px_1fr_90px] border-b border-border py-3 text-xs text-muted-foreground">
                <span>#</span><span>Время</span><span>Статус</span><span>Открытая оценка</span><span>Итоговая оценка</span><span>Лучшее</span>
              </div>
              {mySubmissions.map((submission, index) => {
                const score = getSubmissionScore(submission);
                const privateScoreVisible = canShowPrivateScore(competition, submission);
                const privateScore = privateScoreVisible ? getSubmissionScore(submission, "private") : null;
                const failed = ["failed", "error", "invalid", "rejected"].includes(submission.status);
                const reason = submission.error_message || submission.failure_reason || submission.error?.message || submission.error_code;
                return <div key={submission.id} className="border-b border-border">
                <div className="grid min-h-14 grid-cols-[52px_120px_100px_110px_1fr_90px] items-center gap-x-2 py-3 text-xs">
                  <span className="font-mono">{submission.attempt_number || mySubmissions.length - index}</span>
                  <span className="text-muted-foreground">{submission.created_at ? new Date(submission.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                  <span className={cn("font-semibold", failed ? "text-destructive" : ["scored", "evaluated", "completed"].includes(submission.status) ? "text-accent" : "text-muted-foreground")}>{SUBMISSION_STATUS_LABELS[submission.status] || "Статус уточняется"}</span>
                  <span className="font-semibold">{safeScore(score, competition.metric)}</span>
                  <span className="text-muted-foreground">{failed ? "—" : !["completed", "finished", "archived"].includes(competition.status) ? "После финала" : !privateScoreVisible ? "Не опубликована" : safeScore(privateScore, competition.metric)}</span>
                  <span>{score != null && participation?.best_public_score != null && score === Number(participation.best_public_score) ? "Лучшее" : "—"}</span>
                </div>
                {failed && <p className="break-words pb-3 text-xs leading-5 text-destructive">{typeof reason === "string" ? reason : "Решение не засчитано. Сервер не передал подробности ошибки проверки."}</p>}
                </div>;
              })}
            </div>
          </div>
        ) : (
          <div className="mt-3 border-y border-dashed border-border py-8 text-center text-sm text-muted-foreground">Отправленных решений пока нет.</div>
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
          <h2 className="font-heading text-2xl font-bold">Рейтинг участников</h2>
        </div>
        <div className="flex border border-border p-1">
          <button type="button" onClick={() => setMode("public")} className={cn("h-8 px-4 text-xs font-semibold", mode === "public" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Промежуточный</button>
          <button
            type="button"
            disabled={lockedPrivate}
            onClick={() => setMode("private")}
            className={cn("flex h-8 items-center gap-1.5 px-4 text-xs font-semibold", mode === "private" ? "bg-primary text-primary-foreground" : "text-muted-foreground", lockedPrivate && "opacity-50")}
          >
            {lockedPrivate && <Lock size={12} />}
            Итоговый
          </button>
        </div>
      </div>

      {lockedPrivate && (
        <div className="mt-5 flex gap-3 border border-primary/20 bg-primary/5 p-4">
          <Lock className="mt-0.5 shrink-0 text-primary" size={17} />
          <p className="text-xs leading-5 text-muted-foreground">Итоговая оценка скрыта до завершения. Места определяются после пересчёта на закрытой выборке.</p>
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
            <Avatar name="Ты" src={currentUser.user_avatar} size={32} />
            <div><p className="text-sm font-semibold">Ты</p><p className="text-xs text-muted-foreground">Закреплённая позиция</p></div>
          </div>
          <span className="font-heading font-bold text-primary">{safeScore(currentUser.score, competition.metric)}</span>
        </div>
      )}

      <div className="mt-4 overflow-x-auto border-y border-border">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[60px_minmax(220px,1fr)_120px_90px_120px] border-b border-border py-3 text-xs text-muted-foreground">
            <span>Место</span><span>Участник</span><span>Оценка</span><span>Решения</span><span>Лучшее решение</span>
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
        ? <CompetitionContent className="mt-5 border-t border-border pt-6">{competition.rules}</CompetitionContent>
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
  const access = competition.access || competition.access_type;
  const restricted = competition.is_private || access === "invite_only" || access === "application";
  const joinLabel = access === "application" ? "Подать заявку" : restricted ? "Доступ по приглашению" : "Присоединиться";

  return (
    <aside className="competition-participation">
      <h2 className="font-heading text-lg font-bold">Моё участие</h2>
      <div className={cn("competition-participation-state", joined && "competition-participation-state--joined")}>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-md", joined ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground")}>
          {joined ? <Check size={19} /> : <Trophy size={19} />}
        </div>
        <div>
          <p className="text-sm font-semibold">{status === "finished" ? "Соревнование завершено" : joined ? (bestScore != null ? "Есть проверенное решение" : "Вы участвуете") : "Вы ещё не участвуете"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{status === "active" ? getDeadlineLabel(competition) : "Статус результатов доступен"}</p>
        </div>
      </div>

      <div className="mt-5 divide-y divide-border border-y border-border">
        <div className="competition-participation-stat"><span>Лучшая открытая оценка</span><span>{safeScore(bestScore == null ? null : Number(bestScore), competition.metric)}</span></div>
        <div className="competition-participation-stat"><span>Место</span><span>{rank ? `#${rank}` : "—"}</span></div>
        <div className="competition-participation-stat"><span>Попыток осталось</span><span>{status === "active" ? (attemptsLeft ?? "—") : "Закрыто"}</span></div>
      </div>

      {!joined && status === "active" ? (
        <Button className="mt-5 w-full" onClick={onJoin}>
          {restricted ? <Lock size={15} /> : <Trophy size={15} />}
          {joinLabel}
        </Button>
      ) : status === "active" ? (
        <div className="mt-5 space-y-2"><Button className="w-full" onClick={onSubmit}><Upload size={15} /> Загрузить CSV</Button><Button className="competition-leave-button w-full" variant="ghost" onClick={onLeave} disabled={leaving}>{leaving ? <Loader2 size={15} className="animate-spin" /> : null}Выйти из соревнования</Button></div>
      ) : status === "upcoming" ? (
        <Button className="mt-5 w-full" disabled><Clock3 size={15} /> Ещё не началось</Button>
      ) : (
        <Button asChild className="mt-5 w-full"><Link to={`/competitions/${competition.id}/leaderboard`}><Trophy size={15} /> Смотреть результаты</Link></Button>
      )}
      {isCommunity && <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Результат сохранится в истории сообщества без сезонных очков.</p>}
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
  const [exportingPdf, setExportingPdf] = useState(false);
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
  const submissionsPayload = submissionsQuery.data?.data ?? submissionsQuery.data;
  const submissions = Array.isArray(submissionsPayload) ? submissionsPayload : submissionsPayload?.items || [];
  const resultCardQuery = useQuery({
    queryKey: ["competition-result-card", id],
    queryFn: () => api.competitions.resultCard(id),
    enabled: Boolean(id && competition && ["completed", "finished", "archived"].includes(competition.status)),
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
      if (!rules.version) throw new Error("Не удалось получить актуальные правила");
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
    toast.success(`Результат: ${safeScore(score, competition.metric)}`);
  };

  const exportResult = async () => {
    if (!competition || !resultCardQuery.data || exportingPdf || !["completed", "finished", "archived"].includes(competition.status)) return;
    setExportingPdf(true);
    try {
      const result = resultCardQuery.data;
      const numericScore = Number(result.score ?? result.final_score);
      await downloadCompetitionPdf({ competition, result, score: Number.isFinite(numericScore) ? safeScore(numericScore, competition.metric) : "—", metric: METRIC_LABELS[competition.metric] || competition.metric || "—", url: `${window.location.origin}/competitions/${competition.id}` });
    } catch {
      toast.error("Не удалось скачать PDF-карточку результата");
    } finally {
      setExportingPdf(false);
    }
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
  const access = competition.access || competition.access_type;
  const restricted = competition.is_private || access === "invite_only" || access === "application";
  const locked = ["upcoming", "finished", "finalizing"].includes(status) || (restricted && !joined);
  const statusLabel = { active: "Активно", upcoming: "Скоро", finalizing: "Финализация", finished: "Завершено" }[status];
  const participationPanel = <ParticipationPanel competition={competition} participation={participation} status={status} joined={joined} onJoin={join} onLeave={leave} leaving={leaving} onSubmit={() => navigate(`/competitions/${id}/submit`)} />;

  return (
    <div className="competition-detail-page">
      <Link to="/competitions" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft size={16} />
        Все соревнования
      </Link>

      {status === "finalizing" && (
        <div className="mt-5 flex gap-3 border border-primary/25 bg-primary/5 p-4">
          <Loader2 className="mt-0.5 shrink-0 animate-spin text-primary" size={17} />
          <div><p className="text-sm font-semibold">Идёт итоговый пересчёт</p><p className="mt-1 text-xs text-muted-foreground">Места могут измениться до публикации итоговых результатов.</p></div>
        </div>
      )}

      {isCommunity && (
        <div className="mt-5 flex gap-3 border border-violet-500/25 bg-violet-500/5 p-4">
          <CircleUserRound className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" size={18} />
          <div><p className="text-sm font-semibold">Соревнование сообщества</p><p className="mt-1 text-xs leading-5 text-muted-foreground">ML-Арена проверяет формат CSV и считает результат, но не проверяет код решения. Результат не влияет на сезонный рейтинг и хранится отдельно в ML-паспорте.</p></div>
        </div>
      )}

      {resultCardQuery.data && (
        <div className="mt-5">
          <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
            {[["Итоговое место", resultCardQuery.data.rank ? `#${resultCardQuery.data.rank}` : "—"], ["Итоговый результат", safeScore(resultCardQuery.data.score ?? resultCardQuery.data.final_score, competition.metric)], ["Статус проверки", resultCardQuery.data.verification_status || resultCardQuery.data.status || "—"]].map(([label, value]) => <div key={label} className="bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-heading text-lg font-bold">{value}</p></div>)}
          </div>
          <Button type="button" variant="outline" className="mt-3" onClick={exportResult} disabled={exportingPdf}>{exportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Скачать итоговую карточку PDF</Button>
        </div>
      )}

      <header className="competition-detail-header">
        <div className="competition-detail-header-main">
          <div className="competition-detail-cover" aria-hidden="true"><img src="/competition-cubes.png" alt="" /></div>
          <div className="competition-detail-title">
            <h1>{competition.title}</h1>
            <div className="competition-detail-badges">
              <span className="competition-origin">{isCommunity ? <CircleUserRound size={13} /> : <ShieldCheck size={13} />}{isCommunity ? "Сообщество" : competition.origin === "official_partner" ? "Партнёрское" : "Официальное"}</span>
              <span className={cn("competition-status", status === "active" && "competition-status--active")}><i aria-hidden="true" />{statusLabel}</span>
              <span>{TASK_TYPE_LABELS[competition.task_type] || competition.task_type}</span>
              <span>{competition.difficulty || "Не указана"}</span>
              {restricted && <span><Lock size={12} />{access === "application" ? "По заявке" : "По приглашению"}</span>}
            </div>
            <CompetitionSummary competition={competition} className="competition-detail-description" />
            <div className="competition-detail-meta">
              <span><Users size={15} />{competition.participants_count ?? 0} {pluralize(competition.participants_count ?? 0, "участник", "участника", "участников")}</span>
              <span><CalendarClock size={15} />{status === "active" ? getDeadlineLabel(competition) : statusLabel}</span>
              <span><Award size={15} />{prize || (competition.rated ? "Очки сезонного рейтинга" : "Без денежного фонда")}</span>
            </div>
          </div>
        </div>
        <div className="competition-header-facts">
          {[
            [Target, "Метрика", competition.metric_name || METRIC_LABELS[competition.metric] || competition.metric || "Не указана"],
            [Trophy, "Призовой фонд", prize || "Без приза"],
            [Clock3, "Дедлайн", status === "active" ? getDeadlineLabel(competition).split(" · ")[0] : statusLabel],
            [Flag, "Итоговый результат", status === "finished" ? "Результаты опубликованы" : "После финальной проверки"],
          ].map(([Icon, label, value], index) => <div key={label} className={cn("competition-header-fact", index === 2 && "competition-header-fact--deadline")}>
            <Icon size={22} /><div><span>{label}</span><strong>{value}</strong>{index === 2 && status === "active" && <small>{getDeadlineLabel(competition).split(" · ")[1]}</small>}</div>
          </div>)}
        </div>
      </header>

      <div className="competition-detail-tabs"><CompetitionTabs competitionId={id} activeTab={activeTab} /></div>

      {activeTab === "overview" ? <OverviewTab competition={competition} participationPanel={participationPanel} /> : <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="min-w-0">
          {activeTab === "data" && <DataTab competition={competition} locked={status === "upcoming"} />}
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

        {participationPanel}
      </div>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden">
        {!joined && status === "active" ? (
          <Button className="w-full" onClick={join}>
            {restricted ? <Lock size={15} /> : <Trophy size={15} />}
            {access === "application" ? "Подать заявку" : restricted ? "Доступ по приглашению" : "Присоединиться"}
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
