import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, Loader2, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/api/mlArenaApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AchievementCard, downloadAchievementEvidence } from "./ProfileAchievements";
import { ACHIEVEMENT_STATUSES, ACHIEVEMENT_TYPES, achievementError } from "@/lib/profileAchievements";

export default function ProfileAchievementModeration({ permissions }) {
  const readable = permissions.has("*") || permissions.has("moderation.read");
  const writable = permissions.has("*") || permissions.has("moderation.resolve");
  const [status, setStatus] = useState("pending_review");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState("");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "profile-achievements", status, offset], queryFn: () => api.admin.profileAchievements({ status, limit: 20, offset }), enabled: readable, refetchOnWindowFocus: "always" });
  const rows = Array.isArray(query.data?.data) ? query.data.data : [];
  const total = query.data?.meta?.total;
  const hasMore = query.data?.meta?.has_more === true || Number.isFinite(total) && offset + rows.length < total;
  const mutation = useMutation({ mutationFn: async (action) => {
    if (!writable || !selected) throw new Error("Недостаточно прав.");
    if (action === "reject" && (reason.trim().length < 3 || reason.trim().length > 1000)) throw new Error("Укажите причину от 3 до 1000 символов.");
    return action === "verify" ? api.admin.verifyProfileAchievement(selected.id) : api.admin.rejectProfileAchievement(selected.id, reason.trim());
  }, onSuccess: async () => {
    setSelected(null); setDecision(""); setReason("");
    await client.invalidateQueries({ queryKey: ["admin", "profile-achievements"] });
    await client.invalidateQueries({ queryKey: ["profile-achievements"] });
    await client.invalidateQueries({ queryKey: ["profile"] });
  }, onError: (failure) => setError(achievementError(failure)) });
  const open = (item) => { setSelected(item); setReason(""); setDecision(""); setError(""); };
  const download = async () => { if (downloading) return; setDownloading(true); setError(""); try { await downloadAchievementEvidence(selected.id, true); } catch (failure) { setError(achievementError(failure)); } finally { setDownloading(false); } };
  if (!readable) return null;
  return <section className="mb-10 min-w-0 border-b border-border pb-8">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4"><h2 className="font-heading text-xl font-extrabold">Достижения участников</h2><label className="text-sm"><span className="sr-only">Статус достижения</span><select className="h-10 max-w-full rounded border border-input bg-background px-3" value={status} onChange={(event) => { setStatus(event.target.value); setOffset(0); }}><option value="all">Все статусы</option>{Object.entries(ACHIEVEMENT_STATUSES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
    {query.isPending ? <p role="status" className="flex items-center gap-2 py-5 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Загрузка достижений…</p> : query.isError ? <div role="alert"><p className="text-sm text-red-700 dark:text-red-300">{achievementError(query.error)}</p><Button variant="outline" className="mt-3" onClick={() => query.refetch()}>Повторить</Button></div> : <>
      <div className="divide-y divide-border border-y border-border">{rows.map((item) => <article key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-4 py-4"><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{ACHIEVEMENT_TYPES[item.achievement_type] || item.achievement_type} · {item.user_name || item.user_id}</p><h3 className="mt-2 break-words font-heading font-bold [overflow-wrap:anywhere]">{item.title}</h3><p className="mt-1 break-words text-sm text-muted-foreground">{item.result}</p><p className="mt-2 text-xs font-semibold">{ACHIEVEMENT_STATUSES[item.verification_status] || item.verification_status}</p></div><Button variant="outline" onClick={() => open(item)}><ShieldCheck size={15} />Рассмотреть</Button></article>)}{!rows.length && <p className="py-8 text-sm text-muted-foreground">Достижений с этим статусом нет.</p>}</div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span>{Number.isFinite(total) ? `Всего: ${total}` : `Показано: ${rows.length}`}</span><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Предыдущая страница достижений" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}><ChevronLeft size={17} /></Button><span>{Math.floor(offset / 20) + 1}</span><Button variant="outline" size="icon" aria-label="Следующая страница достижений" disabled={!hasMore} onClick={() => setOffset(offset + 20)}><ChevronRight size={17} /></Button></div></div>
    </>}
    {selected && <Dialog.Root open onOpenChange={(open) => { if (!open && !mutation.isPending && !downloading) setSelected(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[111] max-h-[92dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-card p-5 text-foreground shadow-xl">
      <div className="mb-5 flex justify-between gap-3"><div><Dialog.Title className="font-heading text-xl font-extrabold">Проверка достижения</Dialog.Title><Dialog.Description className="mt-2 text-sm text-muted-foreground">{selected.user_name || selected.user_id}</Dialog.Description><Link to={`/profile/${selected.user_id}`} className="mt-2 inline-block text-xs font-semibold text-primary">Открыть профиль</Link></div><Button size="icon" variant="ghost" aria-label="Закрыть проверку" disabled={mutation.isPending || downloading} onClick={() => setSelected(null)}><X size={18} /></Button></div>
      <AchievementCard achievement={selected} owner />
      <Button variant="outline" className="mt-4" disabled={downloading || mutation.isPending} onClick={download}>{downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}Скачать подтверждение</Button>
      {writable && <div className="mt-5 border-t border-border pt-5">{decision ? <><p className="text-sm font-semibold">{decision === "verify" ? "Подтвердить это достижение?" : "Причина отклонения"}</p>{decision === "reject" && <Textarea aria-label="Причина отклонения достижения" className="mt-3" maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} />}<div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" disabled={mutation.isPending} onClick={() => setDecision("")}>Отмена</Button><Button variant={decision === "reject" ? "destructive" : "default"} disabled={mutation.isPending || decision === "reject" && reason.trim().length < 3} onClick={() => { setError(""); mutation.mutate(decision); }}>{mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}{decision === "verify" ? "Подтвердить" : "Отклонить"}</Button></div></> : <div className="flex flex-wrap gap-2"><Button onClick={() => { setDecision("verify"); setError(""); }}><CheckCircle2 size={15} />Подтвердить</Button><Button variant="outline" onClick={() => { setDecision("reject"); setError(""); }}><X size={15} />Отклонить</Button></div>}</div>}
      {error && <p role="alert" className="mt-4 break-words text-sm text-red-700 dark:text-red-300">{error}</p>}
    </Dialog.Content></Dialog.Portal></Dialog.Root>}
  </section>;
}
