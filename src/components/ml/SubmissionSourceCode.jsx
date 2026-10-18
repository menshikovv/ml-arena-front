import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Download, FileCode2, Loader2, Lock, RefreshCw, Upload } from "lucide-react";
import { api, uploadSubmissionSourceCode } from "@/api/mlArenaApi";
import { Button } from "@/components/ui/button";
import { canShowPrivateScore, formatScore, getSubmissionScore } from "@/lib/ml-arena";
import { canReplaceSourceCode, findBestSourceSubmission, getSourceCodeErrorMessage, isEvaluatedSubmission, isSourceCodeWindowClosedError, validateSourceCodeFile } from "@/lib/submissionSourceCode";

const STAGES = {
  hashing: "Подготовка файла",
  creating_intent: "Получение ссылки загрузки",
  uploading: "Загрузка файла",
  completing: "Подтверждение загрузки",
  attaching: "Прикрепление к решению",
};

function dateLabel(value) {
  return value ? new Date(value).toLocaleString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
}

function sizeLabel(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} МиБ` : `${Math.ceil(bytes / 1024)} КиБ`;
}

function SourceCodeAttachment({ submissionId, onBusyChange }) {
  const queryClient = useQueryClient();
  const input = useRef(null);
  const inFlight = useRef(false);
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [windowClosed, setWindowClosed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [now, setNow] = useState(Date.now);
  const queryKey = ["submission-source-code", submissionId];
  const sourceQuery = useQuery({
    queryKey,
    queryFn: async () => {
      try { return await api.submissions.sourceCode(submissionId); }
      catch (queryError) { if (queryError.status === 404) return null; throw queryError; }
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const source = sourceQuery.data;
  const pending = Boolean(stage);
  const rejectedAsClosed = windowClosed || isSourceCodeWindowClosedError(sourceQuery.error);
  const canUpload = !rejectedAsClosed && sourceQuery.isSuccess && (!source || canReplaceSourceCode(source, now));

  useEffect(() => {
    setNow(Date.now());
    if (!source?.replace_until) return;
    const deadline = Date.parse(source.replace_until);
    if (!Number.isFinite(deadline) || deadline <= Date.now()) return;
    let timer;
    const expire = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) setNow(Date.now());
      else timer = window.setTimeout(expire, Math.min(remaining + 50, 2147483647));
    };
    expire();
    return () => window.clearTimeout(timer);
  }, [source]);

  const chooseFile = (selected) => {
    setError(""); setSaved(false); setFile(null);
    if (!selected) return;
    try { validateSourceCodeFile(selected); setFile(selected); }
    catch (fileError) { setError(fileError.message); }
  };

  const attach = async () => {
    if (!file || !canUpload || inFlight.current) return;
    inFlight.current = true;
    onBusyChange(true);
    setError(""); setSaved(false); setStage("hashing");
    try {
      const fresh = await sourceQuery.refetch();
      if (fresh.error) throw fresh.error;
      if (fresh.data && !canReplaceSourceCode(fresh.data)) throw new Error("Окно замены итогового кода закрыто.");
      const result = await uploadSubmissionSourceCode(submissionId, file, { onStage: setStage });
      queryClient.setQueryData(queryKey, result);
      setFile(null);
      if (input.current) input.current.value = "";
      setSaved(true);
    } catch (uploadError) {
      if (isSourceCodeWindowClosedError(uploadError)) {
        setWindowClosed(true);
        setFile(null);
        if (input.current) input.current.value = "";
      } else setError(getSourceCodeErrorMessage(uploadError));
      await sourceQuery.refetch();
    } finally {
      inFlight.current = false;
      setStage("");
      onBusyChange(false);
    }
  };

  const download = async () => {
    if (downloading || pending) return;
    setDownloading(true); setError(""); onBusyChange(true);
    try {
      const fresh = await api.submissions.sourceCode(submissionId);
      queryClient.setQueryData(queryKey, fresh);
      if (!fresh?.download_url) throw new Error("Сервер не вернул ссылку скачивания.");
      const url = new URL(fresh.download_url, window.location.origin);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Сервер вернул некорректную ссылку скачивания.");
      window.location.assign(url.href);
    } catch (downloadError) { setError(getSourceCodeErrorMessage(downloadError, "Не удалось скачать итоговый код.")); }
    finally { setDownloading(false); onBusyChange(false); }
  };

  return <div className="mt-4 space-y-4">
    {sourceQuery.isPending && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Загружаем данные файла</p>}
    {sourceQuery.isError && !rejectedAsClosed && <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-destructive"><p>{getSourceCodeErrorMessage(sourceQuery.error, "Не удалось получить итоговый код.")}</p><Button variant="outline" size="sm" onClick={() => sourceQuery.refetch()}><RefreshCw size={14} /> Повторить</Button></div>}
    {source?.file && <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
      <div className="flex min-w-0 flex-1 items-start gap-3"><FileCode2 size={22} className="mt-1 shrink-0 text-primary" /><div className="min-w-0">
        <p className="break-all text-sm font-semibold">{source.file.original_filename}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{sizeLabel(source.file.size_bytes)} · Версия {source.version}{source.uploaded_at ? ` · ${dateLabel(source.uploaded_at)}` : ""}</p>
      </div></div>
      <Button type="button" variant="outline" size="sm" onClick={download} disabled={pending || downloading}>{downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Скачать</Button>
    </div>}
    {sourceQuery.isSuccess && !source?.file && <p className="text-sm text-muted-foreground">Итоговый код ещё не прикреплён.</p>}
    {(source || rejectedAsClosed) && <p role="status" className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">{canUpload ? <RefreshCw size={14} className="mt-0.5 shrink-0" /> : <Lock size={14} className="mt-0.5 shrink-0" />}<span>{rejectedAsClosed ? "Срок загрузки и замены итогового кода истёк. Прикрепить файл больше нельзя." : canUpload ? source.replace_until ? `Замена доступна до ${dateLabel(source.replace_until)}` : "Замена файла разрешена" : source.file ? "Замена файла закрыта" : "Прикрепление кода закрыто"}</span></p>}
    {canUpload && <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input ref={input} id={`source-code-file-${submissionId}`} type="file" accept=".py,.ipynb,.zip" disabled={pending || downloading} className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
      <Button type="button" variant="outline" className="min-h-11 min-w-0 flex-1 justify-start text-left" onClick={() => input.current?.click()} disabled={pending || downloading}><FileCode2 size={17} className="shrink-0" /><span className="truncate">{file ? file.name : source ? "Выбрать новый файл" : "Выбрать файл кода"}</span></Button>
      <Button type="button" className="min-h-11 shrink-0" onClick={attach} disabled={!file || pending || downloading}>{pending ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}{pending ? "Загрузка…" : source ? "Заменить файл" : "Прикрепить код"}</Button>
    </div>}
    {pending && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{STAGES[stage]}</p>}
    {saved && <p role="status" className="flex items-center gap-2 text-sm text-accent"><CheckCircle2 size={17} />Итоговый код прикреплён к решению.</p>}
    {error && <p role="alert" className="flex items-start gap-2 border border-destructive/20 bg-destructive/5 p-3 text-sm leading-6 text-destructive"><AlertCircle size={17} className="mt-1 shrink-0" /><span className="min-w-0 break-words">{error}</span></p>}
  </div>;
}

export default function SubmissionSourceCode({ competition, participation, submissions }) {
  const eligible = submissions.filter(isEvaluatedSubmission);
  const best = findBestSourceSubmission(eligible, competition, participation);
  const [chosenId, setChosenId] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedId = eligible.some((item) => item.id === chosenId) ? chosenId : best?.id || eligible[0]?.id || "";
  const selected = eligible.find((item) => item.id === selectedId);
  const privateVisible = selected && canShowPrivateScore(competition, selected) && getSubmissionScore(selected, "private") != null;
  return <section className="mt-8 min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-heading text-lg font-bold">Итоговый код решения</h3><span className="text-xs text-muted-foreground">.py · .ipynb · .zip · до 100 МиБ</span></div>
    {!eligible.length ? <p className="mt-4 text-sm text-muted-foreground">Пока нет оценённых решений для прикрепления кода.</p> : <>
      <label htmlFor="source-code-submission" className="mt-4 block text-xs font-semibold text-muted-foreground">Оценённое решение</label>
      <select id="source-code-submission" value={selectedId} disabled={busy} onChange={(event) => setChosenId(event.target.value)} className="mt-2 h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground">
        {eligible.map((submission) => {
          const privateScore = canShowPrivateScore(competition, submission) ? getSubmissionScore(submission, "private") : null;
          const score = privateScore ?? getSubmissionScore(submission);
          const number = submission.attempt_number || submissions.length - submissions.findIndex((item) => item.id === submission.id);
          return <option key={submission.id} value={submission.id}>№{number} · {score == null ? "Без оценки" : formatScore(score, competition.metric)}{submission.id === best?.id ? " · Лучшая" : ""}</option>;
        })}
      </select>
      <p className="mt-2 text-xs text-muted-foreground">{privateVisible ? "Итоговая оценка" : "Открытая оценка"}</p>
      <SourceCodeAttachment key={selectedId} submissionId={selectedId} onBusyChange={setBusy} />
    </>}
  </section>;
}
