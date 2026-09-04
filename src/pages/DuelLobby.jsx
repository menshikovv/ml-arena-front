import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDot,
  Download,
  FileCheck2,
  Gauge,
  Loader2,
  Lock,
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
import { api, uploadFile } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
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

function adaptDuel(duel, currentUserId) {
  if (!duel) return duel;
  const first = duel.player1 || {};
  const second = duel.player2 || {};
  const currentIsSecond = second.user_id === currentUserId;
  const me = currentIsSecond ? second : first;
  const opponent = currentIsSecond ? first : second;
  const ratingChange = duel.rating_change && currentUserId ? duel.rating_change[currentUserId] : null;
  return {
    ...duel,
    player1_name: me.user_name,
    player1_rating: me.rating,
    player1_avatar: me.avatar_url,
    player1_score: me.score,
    player1_file_url: me.file_url,
    player1_submitted_at: me.submitted_at,
    player1_ready: me.ready,
    player2_name: opponent.user_name,
    player2_rating: opponent.rating,
    player2_avatar: opponent.avatar_url,
    player2_score: opponent.score,
    player2_file_url: opponent.file_url,
    player2_submitted_at: opponent.submitted_at,
    player2_ready: opponent.ready,
    winner_name: duel.winner_id ? (duel.winner_id === currentUserId ? "Ты" : opponent.user_name) : null,
    current_user_rating_change: ratingChange == null ? null : Number(ratingChange),
  };
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

function RulesDialog({ open, onClose, rules }) {
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
              <p className="whitespace-pre-wrap py-4 text-sm leading-6 text-muted-foreground">{rules}</p>
            </div>
            <Button className="mt-5 w-full" onClick={onClose}><Check size={16} /> Понятно</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LobbyView({ duel, onStart, onLeave, starting, leaving }) {
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
          {duel.player1_ready ? "Готовность подтверждена. Ожидаем соперника." : "Подтверди готовность к началу матча."}
        </p>
        <div className="my-8"><DuelPlayers duel={duel} /></div>

        <div className="grid border-y border-border sm:grid-cols-4">
          {[
            [duel.duration_minutes != null ? `${duel.duration_minutes} минут` : "—", "основное время"],
            ["CSV", "формат решения"],
            [METRIC_LABELS[duel.metric] || duel.metric, "метрика"],
            [duel.mode === "rated" ? "Рейтинговая" : "Нерейтинговая", "режим"],
          ].map(([value, label], index) => (
            <div key={label} className={cn("p-4 text-center", index > 0 && "border-t border-border sm:border-l sm:border-t-0")}>
              <p className="text-sm font-semibold">{value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="mx-auto mt-4 flex" onClick={onLeave} disabled={leaving}>{leaving ? <Loader2 size={15} className="animate-spin" /> : null}Покинуть лобби</Button>

        <div className="mt-7 flex flex-col items-center">
          <Button
            size="lg"
            className="mt-4 min-w-48"
            onClick={onStart}
            disabled={duel.player1_ready || starting}
          >
            {starting ? <Loader2 className="animate-spin" /> : duel.player1_ready ? <CheckCircle2 /> : <ShieldCheck />}
            {duel.player1_ready ? "Готовность подтверждена" : "Я готов"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">Старт и таймер синхронизируются сервером.</p>
        </div>
      </div>
    </motion.div>
  );
}

function SubmissionUploader({ duel, currentUserId, locked, onFinished }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [state, setState] = useState(duel.player1_file_url ? "scored" : "empty");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [score, setScore] = useState(duel.player1_score);

  const chooseFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setState("invalid");
      setError("Нужен CSV-файл. Скачай sample_submission и проверь расширение.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setState("invalid");
      setError("Файл больше 10 МБ. Уменьши размер и попробуй снова.");
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
      setProgress(67);
      const upload = await uploadFile(file, "duel_submission", { duel_id: duel.id });
      setProgress(100);
      setState("validating");
      setState("scoring");
      const checked = adaptDuel(await api.duels.submit(duel.id, upload.id), currentUserId);
      const userScore = Number(checked.player1_score);
      if (!Number.isFinite(userScore)) throw new Error("Проверка завершилась без результата");

      setScore(userScore);
      setState("scored");
      setFile(null);
      toast.success(`Решение проверено: ${safeScore(userScore, duel.metric)}`);
      await onFinished(checked.status === "completed");
    } catch (uploadError) {
      setState("failed");
      setError(uploadError.message || "Проверка временно недоступна. Попробуй отправить файл ещё раз.");
    }
  };

  const statusContent = {
    uploading: ["Загружаем файл", `${progress}%`],
    validating: ["Проверяем формат CSV", "Структура из sample_submission"],
    scoring: ["Считаем результат", "скрытый тест"],
    scored: ["Лучший результат", safeScore(score, duel.metric)],
    invalid: ["CSV не принят", error],
    failed: ["Техническая ошибка", error],
  };

  return (
    <section className="border-t border-border pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold">Загрузить решение</h2>
        </div>
        <span className="text-xs text-muted-foreground">CSV · до 10 МБ</span>
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
              {file ? `${(file.size / 1024).toFixed(1)} КБ · готов к проверке` : "Структура из sample_submission в ZIP"}
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

      <p className="mt-5 border-y border-border py-4 text-xs text-muted-foreground">В дуэли сервер принимает одну финальную отправку от каждого участника.</p>
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
            <span className="text-xs text-muted-foreground">{duel.player2_rating} очков</span>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Статус соперника</p>
          <p className="mt-1 text-sm font-semibold">{opponentSubmitted ? "Есть валидная отправка" : "Работает над задачей"}</p>
        </div>
        {opponentSubmitted ? <FileCheck2 className="text-accent" size={20} /> : <CircleDot className="text-primary" size={20} />}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Точный результат соперника откроется после завершения матча.</p>
    </div>
  );
}

function LiveView({ duel, currentUserId, onFinished }) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const remaining = useRemainingSeconds(duel.ends_at);
  const warning = remaining !== null && remaining > 0 && remaining <= 10 * 60;
  const critical = remaining !== null && remaining > 0 && remaining <= 3 * 60;

  return (
    <>
      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} rules={duel.rules} />
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
              {critical ? "Последние минуты" : warning ? "Меньше 10 минут" : "Осталось"}
            </p>
            <TimerDisplay seconds={remaining} compact />
          </div>
          <div className="flex items-center justify-between gap-3 md:justify-end">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-accent"><Wifi size={14} /> На связи</span>
            {duel.rules && <Button variant="outline" size="sm" onClick={() => setRulesOpen(true)}><ShieldCheck size={14} /> Правила</Button>}
          </div>
        </div>
      </div>

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
              <p className="text-xs font-semibold">Данные задачи</p>
              {duel.dataset_bundle_url
                ? <Button asChild variant="outline" size="sm" className="mt-3"><a href={duel.dataset_bundle_url}><Download size={14} /> Скачать ZIP</a></Button>
                : <p className="mt-2 text-xs text-muted-foreground">Сервер не вернул доступный ZIP для этой дуэли.</p>}
            </div>
          </section>

          <SubmissionUploader
            duel={duel}
            currentUserId={currentUserId}
            locked={remaining !== null && remaining === 0}
            onFinished={onFinished}
          />
          <div className="mt-6 flex items-start gap-3 rounded-md border border-border bg-secondary/35 p-4 text-xs leading-5 text-muted-foreground">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-primary" />
            Во время рейтинговой дуэли свободный чат отключён. Оба участника решают задачу независимо и видят результат соперника только после завершения.
          </div>
        </main>

        <aside className="min-w-0 space-y-4">
          <OpponentPanel duel={duel} />
          <div className="border-y border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Твой лучший результат</p>
                <p className="mt-2 font-heading text-3xl font-bold">{safeScore(duel.player1_score, duel.metric)}</p>
              </div>
              <Gauge className="text-primary" size={26} />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs">
              <span className="text-muted-foreground">Статус проверки</span>
              <span className={cn("font-semibold", duel.player1_file_url ? "text-accent" : "text-muted-foreground")}>
                {duel.player1_file_url ? "Отправка принята" : "Нет попыток"}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function ResultView({ duel }) {
  const resultRef = useRef(null);
  const navigate = useNavigate();
  const userWon = duel.winner_name === "Ты";
  const isDraw = Boolean(duel.is_draw);
  const ratingDelta = duel.current_user_rating_change;

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
          {isDraw ? "Результаты равны" : userWon ? "Ты выиграл дуэль" : "Дуэль окончена поражением"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          {isDraw
            ? "Сервер зафиксировал ничью."
            : userWon
              ? "Твой лучший результат оказался выше результата соперника."
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
                {player.time ? `Отправлено в ${new Date(player.time).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Нет отправок"}
              </p>
            </div>
          </React.Fragment>
        ))}
      </section>

      <section className="grid gap-8 border-b border-border py-8 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <h2 className="font-heading text-xl font-bold">Изменение рейтинга</h2>
          <div className="mt-3 flex items-end gap-3">
            <span className={cn("font-heading text-5xl font-bold", ratingDelta > 0 ? "text-accent" : ratingDelta < 0 ? "text-destructive" : "text-foreground")}>
              {ratingDelta == null ? "—" : `${ratingDelta > 0 ? "+" : ""}${ratingDelta}`}
            </span>
            <span className="mb-1 text-sm text-muted-foreground">очков</span>
          </div>
        </div>
        <div className="border-l-0 border-border lg:border-l lg:pl-8">
          <h2 className="font-heading text-xl font-bold">
            {isDraw ? "Ничья" : "Победитель определён сервером"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Метрика матча: {METRIC_LABELS[duel.metric] || duel.metric}. Оба решения прошли проверку формата и оценку на одной скрытой выборке.
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
            <Button asChild variant="ghost" className="w-full"><Link to="/rating?tab=duels"><Share2 size={15} /> В рейтинг дуэлей</Link></Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

export default function DuelLobby() {
  const { id } = useParams();
  const { user } = useAuth();
  const canPlay = ["user", "admin"].includes(user?.role);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const { data: duel, isLoading, isError, refetch } = useQuery({
    queryKey: ["duel", id, user?.id],
    queryFn: () => api.duels.get(id),
    select: (data) => adaptDuel(data, user?.id),
    enabled: canPlay && Boolean(id),
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
  const resultQuery = useQuery({
    queryKey: ["duel-result", id, user?.id],
    queryFn: () => api.duels.result(id),
    select: (data) => adaptDuel(data, user?.id),
    enabled: canPlay && Boolean(id && stage === "result"),
    retry: false,
  });

  const startDuel = useCallback(async () => {
    if (!canPlay) return;
    if (!duel || starting) return;
    setStarting(true);
    try {
      const updated = await api.duels.ready(duel.id, true);
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
  }, [canPlay, duel, navigate, queryClient, starting]);

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

  const leaveDuel = async () => {
    if (!canPlay) return;
    if (leaving) return;
    setLeaving(true);
    try {
      await api.duels.leave(id);
      toast.success("Вы покинули лобби");
      navigate("/duels", { replace: true });
    } catch (error) {
      toast.error(error.message || "Не удалось покинуть лобби");
      setLeaving(false);
    }
  };

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
    <div className="mx-auto w-full max-w-[1380px] px-4 py-6 md:px-6 lg:px-8 lg:py-10">
      {stage === "lobby" && <LobbyView duel={duel} onStart={startDuel} onLeave={leaveDuel} starting={starting} leaving={leaving} />}
      {stage === "live" && <LiveView duel={duel} currentUserId={user?.id} onFinished={finishScoring} />}
      {stage === "overtime" && <LiveView duel={duel} currentUserId={user?.id} onFinished={finishScoring} />}
      {stage === "result" && <ResultView duel={{ ...duel, ...(resultQuery.data || {}) }} />}
    </div>
  );
}
