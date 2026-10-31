import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Inbox, Loader2, Mail, RefreshCw, Save, Search, X } from "lucide-react";
import { api } from "@/api/mlArenaApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { INQUIRY_CATEGORIES, INQUIRY_STATUSES, INQUIRY_TYPES, inquiryError } from "@/lib/inquiries";

const PAGE_SIZE = 20;
const selectClass = "h-11 min-w-0 rounded-md border border-input bg-card px-3 text-sm";

function date(value) {
  const parsed = new Date(value);
  return value && Number.isFinite(parsed.getTime()) ? parsed.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "—";
}

export function InquiryStatus({ status }) {
  const tone = { new: "bg-primary/10 text-primary", in_progress: "bg-secondary text-foreground", resolved: "bg-green/10 text-green", rejected: "bg-destructive/10 text-destructive" }[status] || "bg-secondary text-muted-foreground";
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${tone}`}>{INQUIRY_STATUSES[status] || status}</span>;
}

function Failure({ error, retry }) {
  const unavailable = [404, 405, 501].includes(error?.status);
  return <div role="alert" className="border border-destructive/20 bg-destructive/5 p-5 text-sm">
    <p>{unavailable ? "Раздел обращений пока недоступен на сервере." : inquiryError(error)}</p>
    {error?.requestId && <p className="mt-2 break-all text-xs text-muted-foreground">ID запроса: {error.requestId}</p>}
    <Button variant="outline" className="mt-3" onClick={retry}><RefreshCw size={15} />Повторить</Button>
  </div>;
}

export function InquiryFields({ item }) {
  const fields = [
    ["Тип обращения", INQUIRY_TYPES[item.kind] || item.kind], ["Получено", date(item.created_at)],
    ["Имя", item.name], ["Компания", item.company], ["Роль", item.role],
    ["Категория / цель", INQUIRY_CATEGORIES[item.category] || item.category || item.goal], ["Аккаунт", item.user_id],
    ["Страница отправки", item.source?.landing_path], ["Источник перехода", item.source?.referrer],
    ["UTM source", item.source?.utm_source], ["UTM medium", item.source?.utm_medium], ["UTM campaign", item.source?.utm_campaign],
  ].filter(([, value]) => value);
  return <>
    <a href={`mailto:${item.email}`} className="my-4 inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-primary"><Mail size={16} className="shrink-0" />{item.email}</a>
    <dl className="grid gap-x-6 gap-y-4 border-y border-border py-5 text-sm sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words [overflow-wrap:anywhere]">{value}</dd></div>)}</dl>
    <section className="py-5"><h3 className="text-sm font-semibold">Сообщение</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere]">{item.message || "Комментарий не указан"}</p></section>
    <p className="border-t border-border pt-4 text-xs leading-6 text-muted-foreground">Согласие на обработку данных: {item.consent_privacy ? "Получено" : "Не подтверждено"} · Версия документа: {item.consent_document_version || "Не указана"}<br />Рассылка: {item.consent_marketing ? "Согласие получено" : "Без согласия"}</p>
  </>;
}

function InquiryDetail({ id, writable, onClose }) {
  const client = useQueryClient();
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const query = useQuery({ queryKey: ["admin", "inquiries", "detail", id], queryFn: () => api.admin.inquiry(id), staleTime: 0, refetchOnWindowFocus: false, retry: false });
  const item = query.data;
  useEffect(() => {
    if (item) { setStatus(item.status); setNote(item.internal_note || ""); }
  }, [item]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!writable || !Number.isInteger(item?.version)) throw new Error("Invalid inquiry version or permissions");
      const result = await api.admin.updateInquiry(id, { status, internal_note: note.trim() || null, version: item.version });
      if (result?.id !== id || !Number.isInteger(result?.version) || result.version <= item.version) throw new Error("Invalid inquiry response");
      return result;
    },
    onSuccess: (result) => {
      client.setQueryData(["admin", "inquiries", "detail", id], result);
      client.invalidateQueries({ queryKey: ["admin", "inquiries", "list"] });
      setSaved(true);
    },
  });
  const dirty = item && (status !== item.status || note.trim() !== (item.internal_note || ""));
  const pending = mutation.isPending || query.isFetching;
  const reload = () => { mutation.reset(); setSaved(false); query.refetch(); };
  return <Dialog.Root open onOpenChange={(open) => { if (!open && !pending) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm" />
    <Dialog.Content onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }} onInteractOutside={(event) => event.preventDefault()} className="fixed left-1/2 top-1/2 z-[111] max-h-[92dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-card p-5 text-foreground shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><Dialog.Title className="break-words font-heading text-xl font-extrabold">{item?.subject || "Обращение"}</Dialog.Title><Dialog.Description className="mt-2 break-all text-xs text-muted-foreground">№ {id}</Dialog.Description></div><Button size="icon" variant="ghost" disabled={pending} aria-label="Закрыть обращение" onClick={onClose}><X size={18} /></Button></div>
      {query.isPending ? <p role="status" className="flex items-center gap-2 py-8"><Loader2 size={18} className="animate-spin" />Загрузка обращения…</p> : query.error ? <div className="mt-5"><Failure error={query.error} retry={reload} /></div> : item ? <>
        <div className="mt-4"><InquiryStatus status={item.status} /></div>
        <InquiryFields item={item} />
        {writable ? <form className="mt-5 border-t border-border pt-5" onSubmit={(event) => { event.preventDefault(); if (dirty && !pending) mutation.mutate(); }}>
          <fieldset disabled={pending} className="space-y-4">
            <label className="block space-y-2 text-sm font-semibold"><span>Статус обработки</span><select value={status} onChange={(event) => { setStatus(event.target.value); setSaved(false); mutation.reset(); }} className={`${selectClass} block w-full`}>{Object.entries(INQUIRY_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block space-y-2 text-sm font-semibold"><span>Внутренняя заметка</span><Textarea value={note} maxLength={4000} rows={4} onChange={(event) => { setNote(event.target.value); setSaved(false); mutation.reset(); }} /></label>
            <div className="flex flex-wrap gap-2"><Button type="submit" disabled={!dirty || !Number.isInteger(item.version)}>{mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Сохранить</Button><Button type="button" variant="outline" onClick={reload}><RefreshCw size={16} />Обновить данные</Button></div>
          </fieldset>
          {saved && <p role="status" className="mt-3 text-sm text-green">Изменения сохранены</p>}
          {mutation.error && <p role="alert" className="mt-3 text-sm text-destructive">{inquiryError(mutation.error)}</p>}
        </form> : <section className="mt-5 border-t border-border pt-5"><h3 className="text-sm font-semibold">Внутренняя заметка</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{item.internal_note || "Нет заметки"}</p></section>}
        {item.history?.length > 0 && <section className="mt-6 border-t border-border pt-5"><h3 className="text-sm font-semibold">История обработки</h3><ol className="mt-3 space-y-3">{item.history.map((event) => <li key={event.id} className="break-words text-xs leading-6 [overflow-wrap:anywhere]"><span className="text-muted-foreground">{date(event.created_at)} · {event.actor_name || event.actor_user_id}</span><p>{INQUIRY_STATUSES[event.from_status] || event.from_status} → {INQUIRY_STATUSES[event.to_status] || event.to_status}</p>{event.note && <p className="whitespace-pre-wrap">{event.note}</p>}</li>)}</ol></section>}
      </> : <p role="alert" className="py-5 text-sm text-destructive">Сервер не вернул данные обращения.</p>}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

export default function AdminInquiries({ permissions }) {
  const readable = permissions.has("*") || permissions.has("inquiries.read");
  const writable = permissions.has("*") || permissions.has("inquiries.manage");
  const [filters, setFilters] = useState({ q: "", kind: "all", status: "all" });
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  useEffect(() => { const timer = setTimeout(() => setSearch(filters.q.trim()), 300); return () => clearTimeout(timer); }, [filters.q]);
  const query = useQuery({ queryKey: ["admin", "inquiries", "list", search, filters.kind, filters.status, offset], queryFn: () => api.admin.inquiries({ q: search, kind: filters.kind, status: filters.status, limit: PAGE_SIZE, offset }), enabled: readable, placeholderData: keepPreviousData, retry: false });
  const rows = Array.isArray(query.data?.data) ? query.data.data : [];
  const total = query.data?.meta?.total;
  const hasMore = query.data?.meta?.has_more === true || Number.isFinite(total) && offset + rows.length < total;
  const update = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); setOffset(0); };
  if (!readable) return null;
  return <section className="min-w-0">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-heading text-2xl font-extrabold">Обращения</h2><p className="mt-2 text-sm text-muted-foreground">Поддержка, сотрудничество и проведение соревнований</p></div><Button variant="outline" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw size={16} className={query.isFetching ? "animate-spin" : ""} />Обновить</Button></header>
    <div className="mb-4 grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
      <label className="relative min-w-0"><Search size={16} className="absolute left-3 top-3.5 text-muted-foreground" /><Input aria-label="Поиск обращений" maxLength={200} placeholder="Тема, имя, компания или email" className="h-11 pl-10" value={filters.q} onChange={(event) => update("q", event.target.value)} /></label>
      <select aria-label="Тип обращения" className={selectClass} value={filters.kind} onChange={(event) => update("kind", event.target.value)}><option value="all">Все типы</option>{Object.entries(INQUIRY_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select aria-label="Статус обращения" className={selectClass} value={filters.status} onChange={(event) => update("status", event.target.value)}><option value="all">Все статусы</option>{Object.entries(INQUIRY_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    </div>
    {query.error ? <Failure error={query.error} retry={() => query.refetch()} /> : query.isPending ? <p role="status" className="flex items-center gap-2 py-8"><Loader2 size={18} className="animate-spin" />Загрузка обращений…</p> : <>
      <div className="divide-y divide-border border-y border-border" aria-busy={query.isFetching}>
        {rows.map((item) => <article key={item.id} className="flex min-w-0 flex-col gap-4 bg-card px-4 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{INQUIRY_TYPES[item.kind] || item.kind} · {date(item.created_at)}</p><h3 className="mt-2 break-words text-sm font-bold [overflow-wrap:anywhere]">{item.subject}</h3><p className="mt-1 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">{[item.name, item.company, item.email].filter(Boolean).join(" · ")}</p></div><div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start"><InquiryStatus status={item.status} /><Button variant="outline" disabled={query.isPlaceholderData} onClick={() => setSelected(item.id)}><Inbox size={15} />Открыть</Button></div></article>)}
        {!rows.length && <div className="py-12 text-center text-sm text-muted-foreground"><Inbox className="mx-auto mb-3" size={24} />Обращений не найдено</div>}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span>{Number.isFinite(total) ? `Всего: ${total}` : `Показано: ${rows.length}`}</span><div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label="Предыдущая страница обращений" disabled={offset === 0 || query.isFetching} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}><ChevronLeft size={17} /></Button><span>{Math.floor(offset / PAGE_SIZE) + 1}</span><Button size="icon" variant="outline" aria-label="Следующая страница обращений" disabled={!hasMore || query.isFetching} onClick={() => setOffset(offset + PAGE_SIZE)}><ChevronRight size={17} /></Button></div></div>
    </>}
    {selected && <InquiryDetail key={selected} id={selected} writable={writable} onClose={() => setSelected(null)} />}
  </section>;
}
