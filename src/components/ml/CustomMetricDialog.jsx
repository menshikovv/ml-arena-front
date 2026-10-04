import { useEffect, useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, CircleAlert, Download, Loader2, Plus, Save, Send, X } from "lucide-react";
import { api, uploadFile } from "@/api/mlArenaApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadMetricImplementation } from "@/lib/downloadMetricImplementation";

const TASK_TYPES = [
  ["classification", "Классификация"], ["regression", "Регрессия"], ["nlp", "NLP"],
  ["cv", "Компьютерное зрение"], ["time_series", "Временные ряды"], ["ranking", "Ранжирование"],
  ["clustering", "Кластеризация"], ["recsys", "RecSys"], ["tabular", "Табличные данные"],
];
const USAGE_SCOPES = [["official_competition", "Официальные соревнования"], ["community_competition", "Соревнования сообщества"], ["duel", "Дуэли"]];
const FILE_FIELDS = [
  { key: "source", field: "source_upload_id", label: "Исходник метрики", purpose: "metric_source", extension: ".py", type: "text/x-python", limit: 128 * 1024, hint: "metric.py · до 128 КБ" },
  { key: "solution", field: "validation_solution_upload_id", label: "Эталонные значения", purpose: "metric_validation_solution", extension: ".csv", type: "text/csv", limit: 10 * 1024 * 1024, hint: "validation_solution.csv · до 10 МиБ" },
  { key: "submission", field: "validation_submission_upload_id", label: "Тестовые предсказания", purpose: "metric_validation_submission", extension: ".csv", type: "text/csv", limit: 10 * 1024 * 1024, hint: "validation_submission.csv · до 10 МиБ" },
];
const ERROR_MESSAGES = {
  PERMISSION_DENIED: "Нет прав на это действие или организация не активна.",
  RESOURCE_NOT_FOUND: "Файл загрузки или родительская версия метрики не найдены.",
  RESOURCE_CONFLICT: "Код метрики уже занят.",
  UPLOAD_NOT_READY: "Один из файлов ещё не готов к использованию.",
  METRIC_VERSION_STATE_INVALID: "Текущую версию нельзя повторно отправить. Обновите её статус или создайте новую версию.",
  FILE_TOO_LARGE: "Файл превышает допустимый размер.",
  VALIDATION_ERROR: "Проверьте поля формы и формат файлов.",
  METRIC_SOURCE_SYNTAX: "В Python-исходнике есть синтаксическая ошибка.",
  METRIC_SCORE_SIGNATURE: "Неверная сигнатура функции score().",
  METRIC_IMPORT_FORBIDDEN: "В исходнике использован запрещённый import.",
};

function rows(response) {
  const items = Array.isArray(response) ? response : response?.items || response?.data?.items || response?.data || [];
  return Array.isArray(items) ? items : [];
}

function Field({ label, children, wide = false }) {
  return <label className={`block min-w-0 space-y-2 ${wide ? "sm:col-span-2" : ""}`}><span className="block text-sm font-semibold">{label}</span>{children}</label>;
}

export default function CustomMetricDialog({ organizationId = null, metric = null, onClose, onSaved }) {
  const platform = !organizationId;
  const id = useId();
  const busy = useRef(false);
  const feedback = useRef(null);
  const readyUploads = useRef({});
  const [versionTarget, setVersionTarget] = useState(metric);
  const [form, setForm] = useState({
    code: metric?.code || "", name: metric?.name || "", description: metric?.description || "",
    direction: metric?.current_version?.direction || "maximize", display_format: metric?.current_version?.display_format || "0.0000",
    allowed_task_types: metric?.current_version?.allowed_task_types || ["classification"],
    forked_from_metric_version_id: metric?.current_version?.forked_from_metric_version_id || "",
    visibility: metric?.visibility || (platform ? "public" : "owner_only"),
    usage_scopes: metric?.usage_scopes || USAGE_SCOPES.map(([value]) => value),
  });
  const [files, setFiles] = useState({ source: null, solution: null, submission: null });
  const [fileKey, setFileKey] = useState(0);
  const [phase, setPhase] = useState("");
  const [saved, setSaved] = useState(null);
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState(null);
  const [sourceDownloading, setSourceDownloading] = useState(false);
  const [sourceDownloadError, setSourceDownloadError] = useState("");
  useEffect(() => {
    if (phase || saved || validation || error) feedback.current?.scrollIntoView({ block: "nearest" });
  }, [phase, saved, validation, error]);
  const catalog = useQuery({ queryKey: ["custom-metric-builtin-options", platform], queryFn: () => platform ? api.admin.metrics({ limit: 100, offset: 0 }) : api.catalogs.metrics() });
  const builtins = rows(catalog.data).filter((item) => (item.current_version?.implementation_type || item.implementation_type) === "builtin" && item.current_version?.id);
  const selectedBuiltin = builtins.find((item) => item.current_version.id === form.forked_from_metric_version_id);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const downloadBuiltin = async () => {
    if (!selectedBuiltin) return;
    setSourceDownloading(true);
    setSourceDownloadError("");
    try {
      await downloadMetricImplementation(selectedBuiltin);
    } catch (downloadError) {
      setSourceDownloadError(downloadError.message || "Не удалось скачать реализацию.");
    } finally {
      setSourceDownloading(false);
    }
  };
  const toggle = (key, value) => update(key, form[key].includes(value) ? form[key].filter((item) => item !== value) : [...form[key], value]);
  const locked = Boolean(phase || saved);
  const submitSaved = async (record) => {
    if (!record.metric.id || !record.versionId) throw new Error("Метрика сохранена, но сервер не вернул ID версии. Обновите список метрик перед отправкой.");
    setPhase("Запуск автоматической проверки...");
    const response = platform
      ? await api.admin.submitMetricVersion(record.metric.id, record.versionId)
      : await api.organizations.submitMetricVersion(organizationId, record.metric.id, record.versionId);
    setSaved({ ...record, metric: { ...record.metric, ...response?.metric, current_version: { ...record.metric.current_version, ...response?.metric?.current_version } } });
    setValidation(response?.validation || { status: "unknown", error_message: "Сервер не вернул результат проверки. Обновите статус версии перед повторной отправкой." });
    onSaved?.();
  };
  const submit = async (sendForReview) => {
    if (busy.current) return;
    setError(null);
    if (!saved) {
      if (!versionTarget && (!/^[a-z][a-z0-9_]*$/.test(form.code.trim()) || !form.name.trim())) return setError({ message: "Укажите название и код: a-z, цифры и подчёркивание, начиная с буквы." });
      if (!form.allowed_task_types.length || !form.display_format.trim()) return setError({ message: "Укажите формат результата и хотя бы один тип задачи." });
      if (platform && !versionTarget && !form.usage_scopes.length) return setError({ message: "Выберите хотя бы одну область использования." });
      for (const entry of FILE_FIELDS) {
        const file = files[entry.key];
        if (!file || !file.name.toLowerCase().endsWith(entry.extension) || file.size <= 0 || file.size > entry.limit) return setError({ message: `${entry.label}: выберите непустой файл ${entry.extension} допустимого размера.` });
      }
    }
    busy.current = true;
    let record = saved;
    try {
      if (!record) {
        const uploads = {};
        for (const entry of FILE_FIELDS) {
          const cached = readyUploads.current[entry.key];
          if (cached?.file === files[entry.key]) {
            uploads[entry.field] = cached.id;
            continue;
          }
          setPhase(`Загрузка: ${entry.label.toLowerCase()}...`);
          const upload = await uploadFile(files[entry.key], entry.purpose, {}, { contentType: entry.type });
          if (!upload?.id || upload.status !== "ready") throw new Error(`${entry.label}: загрузка не перешла в статус ready.`);
          readyUploads.current[entry.key] = { file: files[entry.key], id: upload.id };
          uploads[entry.field] = upload.id;
        }
        const versionBody = { ...uploads, direction: form.direction, display_format: form.display_format.trim(), allowed_task_types: form.allowed_task_types, forked_from_metric_version_id: form.forked_from_metric_version_id || null };
        setPhase(versionTarget ? "Создание новой версии..." : "Сохранение черновика...");
        let created;
        if (versionTarget) {
          const version = platform ? await api.admin.createCustomMetricVersion(versionTarget.id, versionBody) : await api.organizations.createMetricVersion(organizationId, versionTarget.id, versionBody);
          created = { ...versionTarget, current_version: version, current_version_id: version.id };
        } else {
          const body = { ...versionBody, code: form.code.trim(), name: form.name.trim(), description: form.description.trim() || null, visibility: form.visibility, ...(platform ? { usage_scopes: form.usage_scopes } : {}) };
          created = platform ? await api.admin.createCustomMetric(body) : await api.organizations.createMetric(organizationId, body);
        }
        record = { metric: created, versionId: created.current_version?.id || created.current_version_id };
        setSaved(record);
        onSaved?.();
      }
      if (sendForReview) await submitSaved(record);
    } catch (requestError) {
      if (record && ["METRIC_SOURCE_SYNTAX", "METRIC_SCORE_SIGNATURE", "METRIC_IMPORT_FORBIDDEN"].includes(requestError.code)) {
        setValidation({ status: "failed", error_code: requestError.code, error_message: requestError.message });
        onSaved?.();
      }
      setError({ message: ERROR_MESSAGES[requestError.code] || requestError.message || "Не удалось выполнить действие.", detail: ERROR_MESSAGES[requestError.code] ? requestError.message : null, code: requestError.code, fields: requestError.fieldErrors, requestId: requestError.requestId });
    } finally {
      busy.current = false;
      setPhase("");
    }
  };
  const newVersion = () => {
    readyUploads.current = {};
    setVersionTarget(saved.metric);
    setSaved(null);
    setValidation(null);
    setError(null);
    setFiles({ source: null, solution: null, submission: null });
    setFileKey((value) => value + 1);
  };

  return <Dialog.Root open onOpenChange={(open) => !open && !busy.current && onClose()}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[92dvh] w-[calc(100%_-_2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl focus:outline-none">
      <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:px-7">
        <div className="min-w-0"><Dialog.Title className="font-heading text-xl font-extrabold sm:text-2xl">{versionTarget ? "Новая версия custom-метрики" : "Новая custom-метрика"}</Dialog.Title><Dialog.Description className="mt-2 text-sm text-muted-foreground">{versionTarget ? `${versionTarget.name} · ${versionTarget.code}` : platform ? "Платформенная метрика" : "Метрика организации"}</Dialog.Description></div>
        <button type="button" onClick={onClose} disabled={Boolean(phase)} aria-label="Закрыть окно" className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border disabled:opacity-50"><X size={17} /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
        <fieldset disabled={locked} className="grid min-w-0 gap-5 sm:grid-cols-2 disabled:opacity-70">
          {!versionTarget && <><Field label="Код *"><Input value={form.code} onChange={(event) => update("code", event.target.value.toLowerCase())} placeholder="business_cost" /></Field><Field label="Название *"><Input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Business cost" /></Field><Field label="Описание" wide><Textarea maxLength={5000} rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} /></Field></>}
          <Field label="Направление"><select value={form.direction} onChange={(event) => update("direction", event.target.value)} className="h-10 w-full rounded border border-input bg-background px-3 text-sm"><option value="maximize">Больше — лучше</option><option value="minimize">Меньше — лучше</option></select></Field>
          <Field label="Формат результата *"><Input value={form.display_format} onChange={(event) => update("display_format", event.target.value)} placeholder="0.0000" /></Field>
          <div className="min-w-0 space-y-2 sm:col-span-2"><div className="flex flex-wrap items-center justify-between gap-2"><span id={`${id}-base-version-label`} className="block text-sm font-semibold">На основе встроенной версии</span>{selectedBuiltin && <button type="button" onClick={downloadBuiltin} disabled={sourceDownloading} className="inline-flex min-h-8 items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:opacity-50">{sourceDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Скачать реализацию</button>}</div>
            <Select.Root value={form.forked_from_metric_version_id || "none"} onValueChange={(value) => { update("forked_from_metric_version_id", value === "none" ? "" : value); setSourceDownloadError(""); }}>
              <Select.Trigger aria-labelledby={`${id}-base-version-label`} className="flex h-10 w-full items-center justify-between gap-2 rounded border border-input bg-background px-3 text-left font-body text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><Select.Value /><Select.Icon><ChevronDown size={16} /></Select.Icon></Select.Trigger>
              <Select.Portal><Select.Content position="popper" sideOffset={4} className="z-[110] max-h-[min(320px,50vh)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded border border-border bg-popover font-body text-popover-foreground shadow-xl"><Select.Viewport className="max-h-[min(318px,50vh)] overflow-y-auto p-1">
                <Select.Item value="none" className="relative flex min-h-9 cursor-pointer items-center rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"><Select.ItemText>С нуля, без родительской версии</Select.ItemText></Select.Item>
                {form.forked_from_metric_version_id && !builtins.some((item) => item.current_version.id === form.forked_from_metric_version_id) && <Select.Item value={form.forked_from_metric_version_id} className="relative flex min-h-9 cursor-pointer items-center rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"><Select.ItemText>{form.forked_from_metric_version_id}</Select.ItemText></Select.Item>}
                {builtins.map((item) => <Select.Item key={item.current_version.id} value={item.current_version.id} className="relative flex min-h-9 cursor-pointer items-center rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"><Select.ItemText>{item.name || item.code} · v{item.current_version.version}</Select.ItemText></Select.Item>)}
              </Select.Viewport></Select.Content></Select.Portal>
            </Select.Root>
            {sourceDownloadError && <span role="alert" className="block text-sm text-destructive">{sourceDownloadError}</span>}
            {catalog.isLoading && <span className="block text-xs text-muted-foreground">Загрузка встроенных метрик...</span>}{catalog.error && <span className="block text-xs text-destructive">Не удалось загрузить встроенные метрики.</span>}
          </div>
          {FILE_FIELDS.map((entry) => <Field key={entry.key} label={`${entry.label} *`} wide><Input key={`${entry.key}-${fileKey}`} type="file" accept={entry.extension} onChange={(event) => setFiles((current) => ({ ...current, [entry.key]: event.target.files?.[0] || null }))} className="h-auto min-h-11 min-w-0 py-2 text-sm" /><span className="block text-xs text-muted-foreground">{entry.hint}</span></Field>)}
          <div className="border-l-2 border-primary bg-primary/5 p-3 text-xs leading-5 text-muted-foreground sm:col-span-2">CSV: UTF-8, запятая, заголовок и хотя бы одна строка. В обоих файлах нужна колонка id с одинаковым набором уникальных непустых значений. Названия остальных колонок определяет исходник метрики.</div>
          <fieldset className="min-w-0 sm:col-span-2"><legend className="mb-3 text-sm font-semibold">Совместимые типы задач *</legend><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{TASK_TYPES.map(([value, label]) => <label key={value} className="flex min-w-0 items-start gap-2 text-sm"><input type="checkbox" checked={form.allowed_task_types.includes(value)} onChange={() => toggle("allowed_task_types", value)} className="mt-1 accent-primary" /><span>{label}</span></label>)}</div></fieldset>
          {!versionTarget && <Field label="Видимость"><select value={form.visibility} onChange={(event) => update("visibility", event.target.value)} className="h-10 w-full rounded border border-input bg-background px-3 text-sm"><option value="owner_only">Только владельцу</option><option value="public">Публичная</option></select></Field>}
          {platform && !versionTarget && <fieldset className="min-w-0 sm:col-span-2"><legend className="mb-3 text-sm font-semibold">Области использования *</legend><div className="grid gap-3 sm:grid-cols-2">{USAGE_SCOPES.map(([value, label]) => <label key={value} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.usage_scopes.includes(value)} onChange={() => toggle("usage_scopes", value)} className="mt-1 accent-primary" /><span>{label}</span></label>)}</div></fieldset>}
        </fieldset>
        <div ref={feedback} id={`${id}-status`} role="status" aria-live="polite" className="mt-5 space-y-3">
          {phase && <p className="flex items-center gap-2 text-sm"><Loader2 size={17} className="shrink-0 animate-spin text-primary" />{phase}</p>}
          {saved && <div className="rounded border border-primary/25 bg-primary/5 p-4 text-sm"><p className="font-semibold">{validation?.status === "passed" ? "Тесты пройдены. Метрика ожидает ручной модерации." : validation?.status === "failed" ? "Метрика создана, но тесты не пройдены." : "Черновик сохранён. Метрика ещё не опубликована."}</p><p className="mt-2 break-all font-mono text-xs text-muted-foreground">ID: {saved.metric.id} · версия: {saved.versionId || "не указана"}</p></div>}
          {validation && <div className={`rounded border p-4 text-sm ${validation.status === "passed" ? "border-border" : "border-destructive/25 bg-destructive/5"}`}>
            {validation.error_message && <p className="whitespace-pre-wrap break-words text-destructive [overflow-wrap:anywhere]">{validation.error_message}</p>}
            {validation.error_code && <p className="mt-2 font-mono text-xs text-destructive">{validation.error_code}</p>}
            {(validation.checks || []).map((check, index) => <div key={`${check.name}-${index}`} className="mt-2 flex items-start gap-2">{check.passed ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" /> : <CircleAlert size={16} className="mt-0.5 shrink-0 text-destructive" />}<span className="min-w-0 break-words">{check.name}{check.score != null ? ` · результат: ${check.score}` : ""}</span></div>)}
          </div>}
          {error && <div role="alert" className="mt-4 rounded border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"><p>{error.message}</p>{error.detail && error.detail !== error.message && <p className="mt-2 break-words [overflow-wrap:anywhere]">{error.detail}</p>}{Object.entries(error.fields || {}).map(([field, messages]) => <p key={field} className="mt-2 break-words">{field}: {typeof messages === "string" ? messages : JSON.stringify(messages)}</p>)}{error.requestId && <p className="mt-2 break-all font-mono text-xs">ID запроса: {error.requestId}</p>}</div>}
        </div>
      </div>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-border p-4 sm:px-7">
        <Button variant="outline" onClick={onClose} disabled={Boolean(phase)}>{saved ? "Готово" : "Отмена"}</Button>
        {!saved && <Button variant="outline" onClick={() => submit(false)} disabled={Boolean(phase)} className="h-auto min-h-10 whitespace-normal"><Save size={16} className="shrink-0" />Сохранить черновик</Button>}
        {(!saved || !validation) && <Button onClick={() => submit(true)} disabled={Boolean(phase) || error?.code === "METRIC_VERSION_STATE_INVALID"} aria-describedby={`${id}-status`} className="h-auto min-h-10 whitespace-normal">{phase ? <Loader2 size={16} className="shrink-0 animate-spin" /> : <Send size={16} className="shrink-0" />}{saved ? "Отправить на проверку" : "Создать и отправить на проверку"}</Button>}
        {validation?.status === "failed" && <Button onClick={newVersion} disabled={Boolean(phase)} className="h-auto min-h-10 whitespace-normal"><Plus size={16} className="shrink-0" />Создать исправленную версию</Button>}
      </footer>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
