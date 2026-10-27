import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ExternalLink, EyeOff, Globe2, Loader2, Pencil, Plus, Save, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { api, uploadAchievementEvidence } from "@/api/mlArenaApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ACHIEVEMENT_STATUSES, ACHIEVEMENT_TYPES, achievementError, achievementForm, achievementPayload, safeAchievementUrl, validateAchievementEvidence } from "@/lib/profileAchievements";

export async function downloadAchievementEvidence(id, admin = false) {
  const data = await (admin ? api.admin.profileAchievementEvidence(id) : api.profiles.achievementEvidence(id));
  const url = safeAchievementUrl(data?.url);
  if (!url) throw new Error("Сервер не вернул корректную ссылку на подтверждение.");
  window.location.assign(url);
}

export function AchievementCard({ achievement: item, owner = false, children }) {
  const status = item.verification_status || item.status;
  const verified = status === "verified" || item.verified === true;
  const url = safeAchievementUrl(item.achievement_url || item.source_url || item.url);
  const date = item.achieved_at && Number.isFinite(Date.parse(item.achieved_at)) ? new Date(`${item.achieved_at.slice(0, 10)}T12:00:00`).toLocaleDateString("ru-RU") : null;
  return <article className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Globe2 size={16} />{ACHIEVEMENT_TYPES[item.achievement_type] || item.source || item.platform || "Внешнее достижение"}</span>{owner && item.is_public === false && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><EyeOff size={13} />Приватное</span>}</div>
    <h3 className="mt-4 break-words font-heading text-xl font-extrabold [overflow-wrap:anywhere]">{item.title || item.name || "Достижение"}</h3>
    <span className={cn("mt-3 inline-flex w-fit items-center gap-1.5 border px-2 py-1 text-xs font-semibold", verified ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : status === "rejected" ? "border-red-500/25 bg-red-500/5 text-red-700 dark:text-red-300" : "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300")}>{verified && <ShieldCheck size={14} />}{ACHIEVEMENT_STATUSES[status] || (verified ? "Подтверждено" : "Не подтверждено")}</span>
    {item.result && <p className="mt-4 break-words text-sm font-semibold [overflow-wrap:anywhere]">{item.result}</p>}
    {item.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">{item.description}</p>}
    {owner && item.review_note && <p className="mt-4 break-words border-l-2 border-red-400 pl-3 text-sm leading-6 text-muted-foreground"><strong className="block text-foreground">Комментарий модератора</strong>{item.review_note}</p>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">{date ? <time dateTime={item.achieved_at}>{date}</time> : <span>Дата не указана</span>}{url && <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Источник<ExternalLink size={13} /></a>}</div>
    {children && <div className="mt-4">{children}</div>}
  </article>;
}

export function AchievementEditor({ item = null, onClose, onSaved }) {
  const [form, setForm] = useState(() => achievementForm(item || {}));
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const [discard, setDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const input = useRef(null);
  const types = useQuery({ queryKey: ["achievement-types"], queryFn: api.profiles.achievementTypes, staleTime: 3600000 });
  const options = Array.isArray(types.data) ? types.data : Object.entries(ACHIEVEMENT_TYPES).map(([value, label]) => ({ value, label }));
  const dirty = file || JSON.stringify(form) !== JSON.stringify(achievementForm(item || {}));
  const close = () => { if (!lock.current) { if (dirty) setDiscard(true); else onClose(); } };
  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setError(""); };
  const choose = (selected) => {
    if (!selected) return;
    try { validateAchievementEvidence(selected); setFile(selected); setError(""); }
    catch (failure) { setError(achievementError(failure)); setFile(null); }
    if (input.current) input.current.value = "";
  };
  const save = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setSaving(true); setError("");
    try {
      const body = achievementPayload(form, item);
      if (!item && !file) throw new Error("Прикрепите обязательное подтверждение.");
      if (file) body.evidence_upload_id = await uploadAchievementEvidence(file, { onStage: setStage });
      if (!Object.keys(body).length) { onClose(); return; }
      setStage("saving");
      if (item) await api.profiles.updateAchievement(item.id, body);
      else await api.profiles.createAchievement(body);
      await onSaved();
    } catch (failure) { setError(achievementError(failure)); }
    finally { lock.current = false; setSaving(false); setStage(""); }
  };
  const stageLabel = { hashing: "Подготовка файла…", creating_intent: "Получение ссылки…", uploading: "Загрузка подтверждения…", completing: "Проверка загрузки…", saving: "Сохранение…" }[stage];
  return <Dialog.Root open onOpenChange={(open) => { if (!open) close(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[111] flex max-h-[92dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-xl">
    <div className="flex items-start justify-between gap-3 border-b border-border p-5"><div><Dialog.Title className="font-heading text-xl font-extrabold">{item ? "Изменить достижение" : "Добавить достижение"}</Dialog.Title><Dialog.Description className="mt-2 text-sm text-muted-foreground">{item ? "Изменения результата или подтверждения отправят достижение на повторную проверку." : "Подтверждение доступно только вам и модераторам."}</Dialog.Description></div><Button type="button" variant="ghost" size="icon" aria-label="Закрыть" disabled={saving} onClick={close}><X size={18} /></Button></div>
    <form onSubmit={save} className="min-h-0 overflow-y-auto p-5">
      <fieldset disabled={saving} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="min-w-0 text-sm font-semibold">Тип<select aria-label="Тип достижения" className="mt-2 h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 font-normal" value={form.achievement_type} onChange={(event) => update("achievement_type", event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="min-w-0 text-sm font-semibold">Дата получения<Input className="mt-2 min-w-0 font-normal" type="date" value={form.achieved_at} onChange={(event) => update("achieved_at", event.target.value)} /></label>
        <label className="min-w-0 text-sm font-semibold sm:col-span-2">Название<Input className="mt-2 font-normal" required minLength={2} maxLength={200} value={form.title} onChange={(event) => update("title", event.target.value)} /></label>
        <label className="min-w-0 text-sm font-semibold sm:col-span-2">Результат<Input className="mt-2 font-normal" required maxLength={300} value={form.result} onChange={(event) => update("result", event.target.value)} /></label>
        <label className="min-w-0 text-sm font-semibold sm:col-span-2">Описание<Textarea className="mt-2 min-h-28 font-normal" maxLength={4000} value={form.description} onChange={(event) => update("description", event.target.value)} /></label>
        <label className="min-w-0 text-sm font-semibold sm:col-span-2">Ссылка на результат<Input className="mt-2 font-normal" type="url" value={form.achievement_url} onChange={(event) => update("achievement_url", event.target.value)} placeholder="https://" /></label>
        <div className="min-w-0 sm:col-span-2"><p className="text-sm font-semibold">Подтверждение{!item && " *"}</p><p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, WebP или PDF · до 10 МиБ</p><input ref={input} type="file" aria-label="Файл подтверждения" accept=".png,.jpg,.jpeg,.webp,.pdf" className="sr-only" onChange={(event) => choose(event.target.files?.[0])} /><Button type="button" variant="outline" className="mt-3 max-w-full justify-start text-foreground hover:bg-secondary hover:text-foreground" onClick={() => input.current?.click()}><Upload size={16} className="shrink-0" /><span className="truncate">{file?.name || (item ? "Заменить подтверждение" : "Прикрепить подтверждение")}</span></Button>{item && !file && <p className="mt-2 text-xs text-muted-foreground">Текущее подтверждение сохранится.</p>}</div>
        <label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" className="h-4 w-4 shrink-0 accent-primary" checked={form.is_public} onChange={(event) => update("is_public", event.target.checked)} />Показывать достижение в публичном профиле</label>
      </fieldset>
      {error && <p role="alert" className="mt-4 break-words text-sm text-red-700 dark:text-red-300">{error}</p>}
      {discard ? <div role="alert" className="mt-5 border-t border-border pt-4"><p className="text-sm font-semibold">Закрыть без сохранения?</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setDiscard(false)}>Продолжить редактирование</Button><Button type="button" variant="destructive" onClick={onClose}>Не сохранять</Button></div></div> : <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" disabled={saving} onClick={close}>Отмена</Button><Button type="submit" disabled={saving || !dirty}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{stageLabel || "Сохранить"}</Button></div>}
    </form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export default function ProfileAchievements({ isOwner, ownerId = "me", achievements = [] }) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["profile-achievements", ownerId], queryFn: api.profiles.myAchievements, enabled: isOwner, refetchOnWindowFocus: "always" });
  const items = isOwner ? Array.isArray(query.data) ? query.data : [] : achievements;
  const [editor, setEditor] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");
  const invalidate = async () => { await client.invalidateQueries({ queryKey: ["profile-achievements"] }); await client.invalidateQueries({ queryKey: ["profile"] }); await client.invalidateQueries({ queryKey: ["admin", "profile-achievements"] }); };
  const remove = useMutation({ mutationFn: api.profiles.deleteAchievement, onSuccess: async () => { setDeleting(null); await invalidate(); }, onError: (failure) => setError(achievementError(failure)) });
  const download = async (id) => { if (downloading) return; setDownloading(id); setError(""); try { await downloadAchievementEvidence(id); } catch (failure) { setError(achievementError(failure)); } finally { setDownloading(null); } };
  return <section className="min-w-0">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-heading text-2xl font-extrabold">Внешние достижения</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Результаты вне ML-Арены не меняют внутренний рейтинг.</p></div>{isOwner && <Button onClick={() => { setEditor(null); setError(""); }}><Plus size={16} />Добавить достижение</Button>}</div>
    {error && <p role="alert" className="mb-4 break-words text-sm text-red-700 dark:text-red-300">{error}</p>}
    {isOwner && query.isPending ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Загрузка достижений…</p> : isOwner && query.isError ? <div role="alert"><p className="text-sm text-red-700 dark:text-red-300">{achievementError(query.error)}</p><Button variant="outline" className="mt-3" onClick={() => query.refetch()}>Повторить</Button></div> : items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <AchievementCard key={item.id} achievement={item} owner={isOwner}>{isOwner && <>
      <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setEditor(item)}><Pencil size={14} />Изменить</Button>{item.evidence_attached && <Button size="sm" variant="outline" disabled={Boolean(downloading)} onClick={() => download(item.id)}>{downloading === item.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}Подтверждение</Button>}<Button size="icon" variant="ghost" aria-label={`Удалить достижение: ${item.title}`} onClick={() => { setDeleting(item.id); setError(""); }}><Trash2 size={16} /></Button></div>
      {deleting === item.id && <div className="mt-3 border-t border-border pt-3"><p className="text-sm">Удалить достижение и его подтверждение?</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={remove.isPending} onClick={() => setDeleting(null)}>Отмена</Button><Button size="sm" variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(item.id)}><Trash2 size={14} />Удалить</Button></div></div>}
    </>}</AchievementCard>)}</div> : <p className="border-y border-border py-10 text-center text-sm text-muted-foreground">Внешних достижений пока нет.</p>}
    {editor !== undefined && <AchievementEditor key={editor?.id || "new"} item={editor} onClose={() => setEditor(undefined)} onSaved={async () => { await invalidate(); setEditor(undefined); }} />}
  </section>;
}
