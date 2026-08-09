import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Download,
  FileCheck2,
  FileText,
  Flag,
  Gauge,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Send,
  Share2,
  ShieldCheck,
  Swords,
  Trophy,
  Upload,
  Wifi,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { base44 } from "@/api/base44Client";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { METRIC_LABELS, TASK_TYPE_LABELS, formatScore } from "@/lib/ml-arena";
import { cn } from "@/lib/utils";

const sleep = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function safeScore(score, metric) {
  return typeof score === "number" ? formatScore(score, metric) : "—";
}

function useRemainingSeconds(endTime) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!endTime) {
      setRemaining(null);
      return undefined;
    }
    const update = () => setRemaining(Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [endTime]);

  return remaining;
}

function TimerDisplay({ seconds, compact = false }) {
  const safeSeconds = seconds ?? 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  const value = [hours, minutes, rest]
    .filter((part, index) => index > 0 || part > 0)
    .map((part) => String(part).padStart(2, "0"))
    .join(":");

  return (
    <span className={cn("font-mono font-bold tabular-nums", compact ? "text-xl" : "text-3xl md:text-4xl")}>
      {value || "00:00"}
    </span>
  );
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

function DuelPlayers({ duel, compact = false }) {
  const players = [
    { name: duel.player1_name, rating: duel.player1_rating, avatar: duel.player1_avatar },
    { name: duel.player2_name, rating: duel.player2_rating, avatar: duel.player2_avatar },
  ];

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      {players.map((player, index) => (
        <React.Fragment key={player.name}>
          {index === 1 && (
            <div className="text-center">
              <Swords size={compact ? 22 : 28} className="mx-auto text-primary" />
              <span className="mt-1 block text-[10px] font-semibold text-muted-foreground">VS</span>
            </div>
          )}
          <div className="min-w-0 text-center">
            <Avatar name={player.name} src={player.avatar} size={compact ? 40 : 54} />
            <p className="mt-2 max-w-28 truncate text-sm font-semibold">{player.name}</p>
            {!compact && <div className="mt-1"><LeagueBadge rating={player.rating} size="sm" /></div>}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function RulesDialog({ open, onClose }) {
  const rules = [
    "Основное время — 60 минут для обоих участников.",
    "Разрешён CSV с колонками id и prediction, размером до 5 МБ.",
    "Победитель определяется по лучшему score на скрытом тесте.",
    "При равном score побеждает более ранний валидный submit.",
    "После основного времени есть 3 минуты только на дозагрузку файла.",
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="duel-rules-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="w-full max-w-lg border border-border bg-card p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="duel-rules-title" className="font-heading text-xl font-bold">Правила матча</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть правила"><X /></Button>
            </div>
            <div className="mt-5 divide-y divide-border border-y border-border">
              {rules.map((rule, index) => (
                <div key={rule} className="grid grid-cols-[28px_1fr] gap-3 py-3 text-sm">
                  <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <p className="leading-5 text-muted-foreground">{rule}</p>
                </div>
              ))}
            </div>
            <Button className="mt-5 w-full" onClick={onClose}><Check size={16} /> Понятно</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LobbyView({ duel, onStart, starting }) {
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!ready || countdown <= 0) return undefined;
    const interval = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [ready, countdown]);

  useEffect(() => {
    if (ready && countdown === 0) onStart();
  }, [countdown, onStart, ready]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-4xl">
      <Link to="/duels" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft size={16} />
        К дуэлям
      </Link>
      <div className="mt-6 border-y border-border bg-card px-5 py-8 md:px-10 md:py-10">
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-accent">
          <Wifi size={14} />
          Соединение установлено
        </div>
        <h1 className="mt-3 text-center font-heading text-2xl font-bold md:text-3xl">Дуэль принята. Приготовься.</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {ready ? `Задача откроется через ${countdown} секунд` : "Подтверди готовность, чтобы запустить обратный отсчёт."}
        </p>
        <div className="my-8"><DuelPlayers duel={duel} /></div>

        <div className="grid border-y border-border sm:grid-cols-4">
          {[
            ["60 минут", "основное время"],
            ["CSV", "формат submit"],
            [METRIC_LABELS[duel.metric] || duel.metric, "метрика"],
            ["По времени", "tie-break"],
          ].map(([value, label], index) => (
            <div key={label} className={cn("p-4 text-center", index > 0 && "border-t border-border sm:border-l sm:border-t-0")}>
              <p className="text-sm font-semibold">{value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col items-center">
          {ready && <TimerDisplay seconds={countdown} />}
          <Button
            size="lg"
            className="mt-4 min-w-48"
            onClick={() => setReady(true)}
            disabled={ready || starting}
          >
            {starting ? <Loader2 className="animate-spin" /> : ready ? <CheckCircle2 /> : <ShieldCheck />}
            {ready ? "Готовность подтверждена" : "Я готов"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">Таймер матча синхронизируется после старта.</p>
        </div>
      </div>
    </motion.div>
  );
}

function SubmissionUploader({ duel, locked, overtime, onFinished }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [state, setState] = useState(duel.player1_file_url ? "scored" : "empty");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [score, setScore] = useState(duel.player1_score);
  const [submissions, setSubmissions] = useState(() => duel.player1_file_url ? [{
    id: "initial",
    time: duel.player1_submitted_at,
    status: "scored",
    score: duel.player1_score,
    best: true,
  }] : []);

  const chooseFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setState("invalid");
      setError("Нужен CSV-файл. Скачай sample_submission и проверь расширение.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      setState("invalid");
      setError("Файл больше 5 МБ. Уменьши размер и попробуй снова.");
      return;
    }
    setFile(selectedFile);
    setState("empty");
    setError("");
  };

  const submit = async () => {
    if (!file || locked) return;
    try {
      setState("uploading");
      setProgress(22);
      await sleep(220);
      setProgress(67);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProgress(100);
      setState("validating");
      await sleep(500);
      setState("scoring");
      await sleep(700);

      const submittedAt = new Date().toISOString();
      const updatedDuel = await base44.entities.Duel.update(duel.id, {
        player1_file_url: file_url,
        player1_submitted_at: submittedAt,
      });
      const userScore = Number(updatedDuel.player1_score);
      if (!Number.isFinite(userScore)) throw new Error("Проверка завершилась без результата");

      setScore(userScore);
      setSubmissions((items) => [
        {
          id: `${Date.now()}`,
          time: submittedAt,
          status: "scored",
          score: userScore,
          best: true,
        },
        ...items.map((item) => ({ ...item, best: false })),
      ].slice(0, 5));
      setState("scored");
      setFile(null);
      toast.success(`Решение проверено: ${safeScore(userScore, duel.metric)}`);
      await onFinished(updatedDuel.status === "completed");
    } catch (uploadError) {
      setState("failed");
      setError(uploadError.message || "Scoring временно недоступен. Попробуй отправить файл ещё раз.");
    }
  };

  const statusContent = {
    uploading: ["Загружаем файл", `${progress}%`],
    validating: ["Проверяем формат CSV", "id и prediction"],
    scoring: ["Считаем score", "скрытый тест"],
    scored: ["Лучший submit", safeScore(score, duel.metric)],
    invalid: ["CSV не принят", error],
    failed: ["Техническая ошибка", error],
  };

  return (
    <section className="border-t border-border pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold">{overtime ? "Дозагрузить решение" : "Загрузить решение"}</h2>
        </div>
        <span className="text-xs text-muted-foreground">CSV · до 5 МБ</span>
      </div>

      {locked ? (
        <div className="mt-4 flex min-h-28 items-center justify-center border border-dashed border-border text-center">
          <div>
            <Lock className="mx-auto text-muted-foreground" size={20} />
            <p className="mt-2 text-sm font-medium">Загрузка закрыта</p>
            <p className="mt-1 text-xs text-muted-foreground">Время отправки решений истекло.</p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="mt-4 flex min-h-32 w-full items-center justify-center border border-dashed border-border bg-secondary/20 p-5 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            chooseFile(event.dataTransfer.files[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => chooseFile(event.target.files[0])}
          />
          <div>
            <Upload className="mx-auto text-primary" size={24} />
            <p className="mt-3 text-sm font-semibold">{file ? file.name : "Перетащи CSV сюда или выбери файл"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {file ? `${(file.size / 1024).toFixed(1)} КБ · готов к проверке` : "Структура: id, prediction"}
            </p>
          </div>
        </button>
      )}

      {file && state === "empty" && (
        <Button className="mt-3 w-full" onClick={submit}><Send size={15} /> Отправить на проверку</Button>
      )}

      {statusContent[state] && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 border border-border p-4">
          <div className="flex items-center gap-3">
            {["uploading", "validating", "scoring"].includes(state)
              ? <Loader2 className="animate-spin text-primary" size={18} />
              : state === "scored"
                ? <CheckCircle2 className="text-accent" size={18} />
                : <AlertCircle className="text-destructive" size={18} />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{statusContent[state][0]}</p>
              <p className="truncate text-xs text-muted-foreground">{statusContent[state][1]}</p>
            </div>
          </div>
          {state === "uploading" && (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
              <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} />
            </div>
          )}
        </motion.div>
      )}

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Последние попытки</h3>
          <span className="text-xs text-muted-foreground">{submissions.length}/5</span>
        </div>
        {submissions.length ? (
          <div className="divide-y divide-border border-y border-border">
            {submissions.map((submission, index) => (
              <div key={submission.id} className="grid grid-cols-[28px_1fr_auto_auto] items-center gap-3 py-3 text-xs">
                <span className="font-mono text-muted-foreground">#{submissions.length - index}</span>
                <span className="text-muted-foreground">
                  {new Date(submission.time).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="font-semibold">{safeScore(submission.score, duel.metric)}</span>
                {submission.best && <span className="text-[10px] font-medium text-accent">Лучший</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="border-y border-dashed border-border py-5 text-center text-xs text-muted-foreground">
            Здесь появятся принятые и отклонённые submit-ы.
          </p>
        )}
      </div>
    </section>
  );
}

function OpponentPanel({ duel }) {
  const opponentSubmitted = Boolean(duel.player2_file_url);
  return (
    <div className="border-y border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar name={duel.player2_name} src={duel.player2_avatar} size={44} />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{duel.player2_name}</p>
          <div className="mt-1 flex items-center gap-2">
            <LeagueBadge rating={duel.player2_rating} size="sm" />
            <span className="text-xs text-muted-foreground">{duel.player2_rating} Elo</span>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Статус соперника</p>
          <p className="mt-1 text-sm font-semibold">{opponentSubmitted ? "Submit принят" : "Работает над задачей"}</p>
        </div>
        {opponentSubmitted ? <FileCheck2 className="text-accent" size={20} /> : <CircleDot className="text-primary" size={20} />}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Score соперника откроется после завершения матча.</p>
    </div>
  );
}

function DuelChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: "system", author: "Система", text: "Чат открыт. Не отправляйте решения и ссылки.", time: new Date() },
  ]);

  const send = () => {
    const value = input.trim();
    if (!value) return;
    if (/https?:\/\/|www\./i.test(value)) {
      toast.error("Ссылки в чате дуэли отключены");
      return;
    }
    setMessages((items) => [...items, { id: `${Date.now()}`, author: "Ты", text: value.slice(0, 280), time: new Date() }]);
    setInput("");
  };

  return (
    <div className="mt-6 border-y border-border">
      <button
        type="button"
        className="flex h-14 w-full items-center gap-3 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <MessageSquare size={18} className="text-primary" />
        <span className="flex-1 text-sm font-semibold">Чат дуэли</span>
        <span className="text-xs text-muted-foreground">{messages.length - 1} сообщений</span>
        <ChevronDown size={17} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              <div className="max-h-56 space-y-3 overflow-y-auto p-4">
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.author === "Ты" && "justify-end")}>
                    <div className={cn("max-w-[85%] border px-3 py-2 text-sm", message.author === "Ты" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/50")}>
                      <p>{message.text}</p>
                      <p className={cn("mt-1 text-[10px]", message.author === "Ты" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {message.author} · {message.time.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-border p-3">
                <Input
                  value={input}
                  maxLength={280}
                  placeholder="Сообщение сопернику"
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && send()}
                />
                <Button size="icon" onClick={send} aria-label="Отправить сообщение"><Send /></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LiveView({ duel, overtime, onFinished }) {
  const navigate = useNavigate();
  const [rulesOpen, setRulesOpen] = useState(false);
  const overtimeEndRef = useRef(Date.now() + 3 * 60 * 1000);
  const startTime = duel.started_at ? new Date(duel.started_at).getTime() : Date.now();
  const endTime = useMemo(
    () => new Date(overtime ? overtimeEndRef.current : startTime + (duel.duration_minutes || 60) * 60 * 1000).toISOString(),
    [duel.duration_minutes, overtime, startTime],
  );
  const remaining = useRemainingSeconds(endTime);
  const warning = !overtime && remaining !== null && remaining > 0 && remaining <= 10 * 60;
  const critical = !overtime && remaining !== null && remaining > 0 && remaining <= 3 * 60;

  useEffect(() => {
    if (!overtime && remaining !== null && remaining === 0 && duel.status === "active") {
      navigate(`/duels/${duel.id}/overtime`, { replace: true });
    }
  }, [duel.id, duel.status, navigate, overtime, remaining]);

  return (
    <>
      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <div className="border-y border-border bg-card">
        <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto_1fr] md:items-center md:px-6">
          <div className="min-w-0">
            <Link to="/duels" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
              <ArrowLeft size={13} />
              Все дуэли
            </Link>
            <h1 className="mt-1 truncate font-heading text-lg font-bold">{duel.task_title}</h1>
          </div>
          <div className={cn("text-center", warning && "text-destructive")}>
            <p className="mb-1 text-[10px] font-medium uppercase">
              {overtime ? "Окно дозагрузки" : critical ? "Последние минуты" : warning ? "Меньше 10 минут" : "Осталось"}
            </p>
            <TimerDisplay seconds={remaining} compact />
          </div>
          <div className="flex items-center justify-between gap-3 md:justify-end">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-accent"><Wifi size={14} /> Online</span>
            <Button variant="outline" size="sm" onClick={() => setRulesOpen(true)}><ShieldCheck size={14} /> Правила</Button>
          </div>
        </div>
      </div>

      {overtime && (
        <div className="mt-4 border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-destructive" size={19} />
            <div>
              <p className="text-sm font-semibold">Основное время завершено. Осталось 3 минуты на дозагрузку решения.</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Задача доступна только для чтения. Можно отправить уже подготовленный CSV.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0">
          <section>
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-border px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
                {TASK_TYPE_LABELS[duel.task_type] || duel.task_type}
              </span>
              <span className="border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                {METRIC_LABELS[duel.metric] || duel.metric}
              </span>
            </div>
            <h2 className="mt-4 font-heading text-2xl font-bold">{duel.task_title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{duel.task_description}</p>
            <div className="mt-5 border-y border-border py-4">
              <p className="text-xs font-semibold">Формат submit</p>
              <div className="mt-2 overflow-x-auto bg-secondary/40 px-3 py-2 font-mono text-xs text-muted-foreground">
                id,prediction<br />10001,0.7342<br />10002,0.1258
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadTextFile("train.csv", "id,feature_1,feature_2,target\n1,0.41,12.8,1\n2,0.19,9.4,0")}>
                <Download size={14} /> train.csv
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTextFile("test.csv", "id,feature_1,feature_2\n10001,0.52,11.1\n10002,0.24,8.9")}>
                <Download size={14} /> test.csv
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTextFile("sample_submission.csv", "id,prediction\n10001,0.5\n10002,0.5")}>
                <FileText size={14} /> sample_submission
              </Button>
            </div>
          </section>

          <SubmissionUploader
            duel={duel}
            overtime={overtime}
            locked={remaining !== null && remaining === 0}
            onFinished={onFinished}
          />
          <DuelChat />
        </main>

        <aside className="min-w-0 space-y-4">
          <OpponentPanel duel={duel} />
          <div className="border-y border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Твой лучший score</p>
                <p className="mt-2 font-heading text-3xl font-bold">{safeScore(duel.player1_score, duel.metric)}</p>
              </div>
              <Gauge className="text-primary" size={26} />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs">
              <span className="text-muted-foreground">Статус проверки</span>
              <span className={cn("font-semibold", duel.player1_file_url ? "text-accent" : "text-muted-foreground")}>
                {duel.player1_file_url ? "Submit принят" : "Нет попыток"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast.success("Жалоба отправлена модераторам")}
            className="flex w-full items-center gap-2 px-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
          >
            <Flag size={14} />
            Пожаловаться на дуэль
          </button>
        </aside>
      </div>
    </>
  );
}

function ResultView({ duel }) {
  const resultRef = useRef(null);
  const navigate = useNavigate();
  const userWon = duel.winner_name === "Ты";
  const isDraw = duel.player1_score === duel.player2_score;
  const ratingDelta = duel.rating_change || 0;

  const exportCard = async () => {
    if (!resultRef.current) return;
    try {
      const canvas = await html2canvas(resultRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const anchor = document.createElement("a");
      anchor.download = `ml-arena-duel-${duel.id}.png`;
      anchor.href = canvas.toDataURL("image/png");
      anchor.click();
    } catch {
      toast.error("Не удалось скачать карточку");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/duels" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft size={16} />
        К дуэлям
      </Link>
      <section className="mt-5 border-y border-border bg-card py-8 text-center md:py-11">
        <Trophy className={cn("mx-auto", userWon ? "text-accent" : "text-primary")} size={36} />
        <h1 className="mt-5 font-heading text-3xl font-bold md:text-5xl">
          {isDraw ? "Равный score" : userWon ? "Ты выиграл дуэль" : "Дуэль окончена поражением"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          {isDraw
            ? "Score одинаковый. Победитель определён по более раннему времени загрузки."
            : userWon
              ? "Твой лучший score оказался выше результата соперника."
              : "Посмотри итоговое сравнение и попробуй ещё раз."}
        </p>
      </section>

      <section className="grid border-b border-border md:grid-cols-[1fr_auto_1fr]">
        {[
          {
            name: duel.player1_name,
            rating: duel.player1_rating,
            score: duel.player1_score,
            time: duel.player1_submitted_at,
            winner: duel.winner_name === duel.player1_name,
          },
          {
            name: duel.player2_name,
            rating: duel.player2_rating,
            score: duel.player2_score,
            time: duel.player2_submitted_at,
            winner: duel.winner_name === duel.player2_name,
          },
        ].map((player, index) => (
          <React.Fragment key={player.name}>
            {index === 1 && (
              <div className="flex items-center justify-center border-y border-border px-5 py-3 md:border-x md:border-y-0">
                <Swords className="text-primary" size={24} />
              </div>
            )}
            <div className={cn("p-6 text-center md:p-8", player.winner && "bg-primary/5")}>
              <div className="relative mx-auto w-fit">
                <Avatar name={player.name} size={54} />
                {player.winner && <span className="absolute -right-2 -top-2 rounded-full bg-primary p-1 text-primary-foreground"><Trophy size={13} /></span>}
              </div>
              <p className="mt-3 font-semibold">{player.name}</p>
              <div className="mt-2"><LeagueBadge rating={player.rating} size="sm" /></div>
              <p className="mt-5 font-heading text-3xl font-bold">{safeScore(player.score, duel.metric)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {player.time ? `Submit ${new Date(player.time).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Нет submit"}
              </p>
            </div>
          </React.Fragment>
        ))}
      </section>

      <section className="grid gap-8 border-b border-border py-8 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <h2 className="font-heading text-xl font-bold">Изменение рейтинга</h2>
          <div className="mt-3 flex items-end gap-3">
            <span className={cn("font-heading text-5xl font-bold", userWon ? "text-accent" : "text-destructive")}>
              {userWon ? "+" : "−"}{ratingDelta}
            </span>
            <span className="mb-1 text-sm text-muted-foreground">Elo</span>
          </div>
          <div className="mt-5 h-1.5 max-w-sm overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[76%] rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{userWon ? "До следующей лиги осталось 36 Elo" : "Позиция в текущей лиге сохранена"}</p>
        </div>
        <div className="border-l-0 border-border lg:border-l lg:pl-8">
          <h2 className="font-heading text-xl font-bold">
            {isDraw ? "Решило время загрузки" : "Победитель определён по лучшему score"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Метрика матча: {METRIC_LABELS[duel.metric] || duel.metric}. Оба решения прошли проверку формата и scoring на одной скрытой выборке.
          </p>
        </div>
      </section>

      <section className="grid gap-7 py-8 lg:grid-cols-[1fr_360px]">
        <div ref={resultRef} className="border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-heading text-lg font-bold">ML-Арена</p>
              <p className="text-xs text-muted-foreground">Результат дуэли 1×1</p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div>
              <p className="text-sm font-semibold">{duel.player1_name}</p>
              <p className="mt-1 font-heading text-2xl font-bold">{safeScore(duel.player1_score, duel.metric)}</p>
            </div>
            <Swords className="text-primary" />
            <div className="text-right">
              <p className="text-sm font-semibold">{duel.player2_name}</p>
              <p className="mt-1 font-heading text-2xl font-bold">{safeScore(duel.player2_score, duel.metric)}</p>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">{TASK_TYPE_LABELS[duel.task_type]}</span>
          </div>
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold">Продолжить серию</h2>
          <div className="mt-5 space-y-2">
            <Button className="w-full" onClick={() => navigate("/duels/matchmaking")}><RefreshCw size={15} /> Сыграть ещё</Button>
            <Button variant="outline" className="w-full" onClick={exportCard}><Download size={15} /> Скачать карточку</Button>
            <Button asChild variant="outline" className="w-full"><Link to="/profile/me">Открыть ML-паспорт <ArrowRight size={15} /></Link></Button>
            <Button asChild variant="ghost" className="w-full"><Link to="/duels/rating"><Share2 size={15} /> В рейтинг дуэлей</Link></Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

export default function DuelLobby() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [starting, setStarting] = useState(false);

  const { data: duel, isLoading, isError, refetch } = useQuery({
    queryKey: ["duel", id],
    queryFn: () => base44.entities.Duel.get(id),
    enabled: Boolean(id),
    refetchInterval: 5000,
    retry: false,
  });

  const pathStage = location.pathname.split("/").filter(Boolean).at(-1);
  const stage = ["lobby", "live", "overtime", "result"].includes(pathStage)
    ? pathStage
    : duel?.status === "completed"
      ? "result"
      : duel?.status === "lobby"
        ? "lobby"
        : "live";

  const startDuel = useCallback(async () => {
    if (!duel || starting) return;
    setStarting(true);
    try {
      const updated = await base44.entities.Duel.update(duel.id, {
        status: "active",
        started_at: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({ queryKey: ["duel", duel.id] });
      if (["live", "active"].includes(updated.status)) {
        toast.success("Дуэль началась");
        navigate(`/duels/${duel.id}/live`, { replace: true });
      } else {
        toast.success("Готовность подтверждена. Ждём соперника");
      }
    } catch (error) {
      toast.error(error.message || "Не удалось начать дуэль");
      setStarting(false);
    }
  }, [duel, navigate, queryClient, starting]);

  const finishScoring = useCallback(async (completed = false) => {
    await queryClient.invalidateQueries({ queryKey: ["duel", id] });
    await refetch();
    if (completed) {
      toast.success("Оба результата готовы");
      navigate(`/duels/${id}/result`, { replace: true });
    } else {
      toast.success("Результат сохранён. Ждём решение соперника");
    }
  }, [id, navigate, queryClient, refetch]);

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  }

  if (isError || !duel) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto text-destructive" size={28} />
        <h1 className="mt-4 font-heading text-2xl font-bold">Дуэль не найдена</h1>
        <p className="mt-2 text-sm text-muted-foreground">Вызов мог истечь или быть отменён соперником.</p>
        <Button asChild variant="outline" className="mt-5"><Link to="/duels"><ArrowLeft /> К дуэлям</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-7">
      {stage === "lobby" && <LobbyView duel={duel} onStart={startDuel} starting={starting} />}
      {stage === "live" && <LiveView duel={duel} overtime={false} onFinished={finishScoring} />}
      {stage === "overtime" && <LiveView duel={duel} overtime onFinished={finishScoring} />}
      {stage === "result" && <ResultView duel={duel} />}
    </div>
  );
}
