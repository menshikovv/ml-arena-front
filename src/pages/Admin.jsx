import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity, Archive, ArrowUpRight, BadgeCheck, Ban, Building2, CalendarClock, CheckCircle2, CircleAlert,
  ClipboardCheck, Database, FileClock, FileText, Gauge, History, LayoutDashboard, Loader2,
  Award, Copy, ImageIcon, LockKeyhole, Newspaper, Pause, Pencil, Play, Plus, RefreshCw,
  Save, Search, Send, Settings2, ShieldAlert, SlidersHorizontal, Trash2,
  Trophy, Undo2, Upload, UserCheck, Users, X,
} from "lucide-react";
import { api, uploadFile } from "@/api/mlArenaApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const STATUS_LABELS = {
  active: "Активен", pending: "Ожидает", pending_email: "Не подтверждён", banned: "Заблокирован",
  deleted: "Удалён", suspended: "Приостановлена", archived: "В архиве", draft: "Черновик",
  moderation: "На модерации", scheduled: "Запланировано", paused: "На паузе", finalizing: "Финализация",
  completed: "Завершено", published: "Опубликовано", review: "На проверке", new: "Новая",
  escalated: "Передана выше", resolved: "Решена", rejected: "Отклонена", failed: "Ошибка",
  disqualified: "Дисквалифицирована", scored: "Оценена", queued: "В очереди", validating: "Проверяется",
};

const SECTIONS = [
  { id: "dashboard", label: "Обзор", icon: LayoutDashboard, permission: "admin.dashboard.read" },
  { id: "users", label: "Пользователи", icon: Users, permission: "users.read" },
  { id: "organizations", label: "Организации", icon: Building2, any: ["settings.manage", "competitions.read"] },
  { id: "competitions", label: "Соревнования", icon: Trophy, permission: "competitions.read" },
  { id: "rating", label: "Сезоны рейтинга", icon: Award, permission: "settings.manage" },
  { id: "submissions", label: "Отправки", icon: FileClock, permission: "submissions.read" },
  { id: "moderation", label: "Модерация", icon: ShieldAlert, permission: "moderation.read" },
  { id: "content", label: "Блог", icon: Newspaper, permission: "content.read" },
  { id: "resources", label: "Ресурсы", icon: Database, any: ["datasets.read", "settings.manage", "subscriptions.read"] },
  { id: "audit", label: "Журнал действий", icon: History, permission: "audit.read" },
];

function listRows(response) {
  const items = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : response?.items || response?.data?.items || [];
  return Array.isArray(items) ? items.filter((item) => item && typeof item === "object") : [];
}

function listTotal(response) {
  return response?.meta?.total ?? listRows(response).length;
}

function can(permissions, permission) {
  return permissions.has(permission) || permissions.has("*");
}

function canOpen(permissions, section) {
  if (section.permission) return can(permissions, section.permission);
  return section.any?.some((permission) => can(permissions, permission));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function apiErrorMessage(error) {
  const validationErrors = Array.isArray(error?.details?.errors) ? error.details.errors : [];
  if (!validationErrors.length) return error?.message || "Не удалось сохранить данные";
  return validationErrors.map((item) => {
    const field = Array.isArray(item.loc) ? item.loc.filter((part) => part !== "body").join(".") : "";
    return `${field ? `${field}: ` : ""}${item.msg || "Некорректное значение"}`;
  }).join("; ");
}

function normalizeWebsite(value) {
  const website = value.trim();
  if (!website) return null;
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function displayName(item) {
  if (!item || typeof item !== "object") return "Запись без данных";
  return item.user_name || item.username || item.full_name || item.name || item.title || item.email_masked || item.email || item.id || "Запись без имени";
}

function submissionParticipant(submission) {
  if (!submission || typeof submission !== "object") return "Участник";
  const user = submission.user && typeof submission.user === "object" ? submission.user : null;
  return submission.username || submission.user_name || user?.username || user?.name || user?.full_name || submission.user_id || "Участник";
}

function Status({ value }) {
  const critical = ["banned", "failed", "rejected", "disqualified", "suspended"].includes(value);
  const positive = ["active", "published", "completed", "scored", "resolved"].includes(value);
  return <span className={`inline-flex min-h-6 items-center border px-2 py-1 text-[11px] font-semibold ${critical ? "border-destructive/25 bg-destructive/10 text-destructive" : positive ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "border-border bg-secondary text-muted-foreground"}`}>{STATUS_LABELS[value] || value || "—"}</span>;
}

function ErrorState({ error, compact = false }) {
  return <div className={`border border-destructive/25 bg-destructive/5 ${compact ? "p-4" : "p-8"}`}><div className="flex items-start gap-3"><CircleAlert className="mt-0.5 shrink-0 text-destructive" size={20} /><div><p className="font-semibold">Не удалось получить данные</p><p className="mt-1 text-sm text-muted-foreground">{error?.message || "Проверьте соединение и права доступа."}</p>{error?.requestId && <p className="mt-2 font-mono text-xs text-muted-foreground">ID запроса: {error.requestId}</p>}</div></div></div>;
}

function LoadingRows() {
  return <div className="space-y-2 p-5">{[0, 1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse bg-secondary" />)}</div>;
}

function EmptyState({ icon: Icon = Database, title = "Ничего не найдено", text = "Измените фильтры или попробуйте позже." }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center border border-border bg-secondary text-muted-foreground"><Icon size={22} /></span><p className="mt-4 font-semibold">{title}</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p></div>;
}

function SectionHeading({ title, description, count, action }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-3"><h2 className="font-heading text-2xl font-extrabold sm:text-3xl">{title}</h2>{Number.isFinite(count) && <span className="border border-border bg-secondary px-2 py-1 text-xs font-bold text-muted-foreground">{count}</span>}</div><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action}</div>;
}

function FilterSelect({ value, onChange, label, options }) {
  return <label className="relative"><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 min-w-40 appearance-none border border-border bg-card px-3 pr-9 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"><option value="all">{label}</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><SlidersHorizontal size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /></label>;
}

function SearchField({ value, onChange, placeholder }) {
  return <label className="relative block min-w-0 flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 rounded-none bg-card pl-10" /></label>;
}

function TableShell({ children, loading, error, empty, emptyText }) {
  if (error) return <ErrorState error={error} />;
  return <div className="overflow-hidden border border-border bg-card shadow-sm">{loading ? <LoadingRows /> : empty ? <EmptyState text={emptyText} /> : <div className="overflow-x-auto">{children}</div>}</div>;
}

function ActionMenu({ children }) {
  return <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>;
}

function ActionButton({ children, onClick, tone = "default", disabled = false, title }) {
  return <button type="button" onClick={onClick} disabled={disabled} title={title} className={`inline-flex h-8 items-center gap-1.5 border px-2.5 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-45 ${tone === "danger" ? "border-destructive/25 text-destructive hover:bg-destructive/10" : tone === "primary" ? "border-primary/25 text-primary hover:bg-primary/10" : "border-border text-muted-foreground hover:border-primary/25 hover:text-primary"}`}>{children}</button>;
}

function ConfirmDialog({ action, onClose, onConfirm, pending }) {
  const [reason, setReason] = useState("");
  const needsReason = action?.reason !== false;
  const valid = !needsReason || reason.trim().length >= 3;
  return <Dialog.Root open={Boolean(action)} onOpenChange={(open) => !open && !pending && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 border border-border bg-card p-6 shadow-2xl focus:outline-none"><div className="flex items-start justify-between gap-5"><div><Dialog.Title className="font-heading text-xl font-extrabold">{action?.title}</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">{action?.description}</Dialog.Description></div><button type="button" onClick={onClose} disabled={pending} className="flex h-9 w-9 shrink-0 items-center justify-center border border-border text-muted-foreground hover:text-foreground" aria-label="Закрыть"><X size={17} /></button></div>{needsReason && <label className="mt-6 block"><span className="mb-2 block text-sm font-semibold">Причина действия</span><Textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Минимум 3 символа. Причина попадёт в журнал аудита." className="min-h-28 rounded-none" /></label>}<div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={pending}>Отмена</Button><Button type="button" variant={action?.danger ? "destructive" : "default"} disabled={!valid || pending} onClick={() => onConfirm(reason.trim())}>{pending && <Loader2 size={16} className="animate-spin" />}{action?.confirm || "Подтвердить"}</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

const DashboardSection = memo(function DashboardSection() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: api.admin.dashboard, staleTime: 30000 });
  const stats = [["Пользователей", data?.users_total, Users], ["Активны за 30 дней", data?.users_active_30d, Activity], ["Активных соревнований", data?.competitions_active, Trophy], ["Отправок за сутки", data?.submissions_24h, Send], ["Ошибок проверки", data?.failed_submissions_24h, CircleAlert], ["Открытых жалоб", data?.open_reports, ShieldAlert], ["Статей запланировано", data?.scheduled_posts, Newspaper]];
  return <><SectionHeading title="Состояние платформы" description="Операционные показатели и последние административные события." action={<Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw size={16} className={isFetching ? "animate-spin" : ""} /> Обновить</Button>} />{error ? <ErrorState error={error} /> : <><div className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, Icon]) => <div key={label} className="min-h-36 bg-card p-5"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary"><Icon size={19} /></span><span className="text-[10px] font-bold uppercase text-muted-foreground">сейчас</span></div><p className="mt-5 font-heading text-3xl font-extrabold">{isLoading ? "—" : (value ?? 0).toLocaleString("ru-RU")}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>)}</div><div className="mt-6 border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><h3 className="font-heading font-bold">Последние действия</h3><History size={17} className="text-muted-foreground" /></div>{data?.recent_audit_events?.length ? <div className="divide-y divide-border">{data.recent_audit_events.slice(0, 8).map((event) => <div key={event.id} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_180px]"><div><p className="font-semibold">{event.action}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{event.target_type} · {event.target_id}</p></div><p className="text-muted-foreground sm:text-right">{formatDate(event.created_at)}</p></div>)}</div> : <EmptyState icon={History} title="Событий пока нет" text="Новые административные действия появятся здесь." />}</div></>}</>;
});

function UserManageDialog({ userId, permissions, onClose, onChanged }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [planCode, setPlanCode] = useState("");
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState("");
  const detail = useQuery({ queryKey: ["admin", "user", userId], queryFn: () => api.admin.user(userId, { reveal_pii: can(permissions, "users.pii.read") }), enabled: Boolean(userId) });
  const notes = useQuery({ queryKey: ["admin", "user", userId, "notes"], queryFn: () => api.admin.userNotes(userId), enabled: Boolean(userId) });
  const badges = useQuery({ queryKey: ["admin", "badges", "catalog"], queryFn: () => api.admin.badges({ limit: 50, offset: 0 }), enabled: Boolean(userId) });
  const grants = useQuery({ queryKey: ["admin", "user", userId, "badges"], queryFn: () => api.profiles.badges(userId), enabled: Boolean(userId) });
  const roles = useQuery({ queryKey: ["admin", "roles"], queryFn: api.admin.roles, enabled: Boolean(userId) && can(permissions, "settings.manage") });
  const mutation = useMutation({
    mutationFn: async ({ type, value }) => {
      if (type === "note") return api.admin.addUserNote(userId, value);
      if (type === "grant") return api.admin.grantBadge(userId, value);
      if (type === "revoke") return api.admin.revokeBadge(userId, value, revokeReason.trim());
      if (type === "roles") return api.admin.setStaffRoles(userId, value);
      if (type === "subscription") return api.admin.createSubscription(userId, value);
      return null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
      if (["grant", "revoke"].includes(variables.type)) queryClient.invalidateQueries({ queryKey: ["admin", "user", userId, "badges"] });
      if (variables.type === "note") { setNote(""); queryClient.invalidateQueries({ queryKey: ["admin", "user", userId, "notes"] }); }
      toast({ title: "Изменения сохранены" });
      onChanged();
    },
    onError: (error) => toast({ title: "Операция отклонена", description: error.message, variant: "destructive" }),
  });
  useEffect(() => {
    const userRoles = detail.data?.roles || detail.data?.staff_roles || [];
    if (Array.isArray(userRoles)) setSelectedRoles(userRoles);
  }, [detail.data]);
  if (!userId) return null;
  const user = detail.data;
  const badgeRows = listRows(badges.data).filter((badge) => badge.status === "active");
  const grantRows = listRows(grants.data);
  const roleRows = listRows(roles.data);
  return <Dialog.Root open onOpenChange={(open) => !open && !mutation.isPending && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[94vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-border bg-card shadow-2xl focus:outline-none"><div className="flex items-start justify-between border-b border-border p-5 md:px-6"><div><Dialog.Title className="font-heading text-2xl font-extrabold">{displayName(user || { id: userId })}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">{user?.email || user?.email_masked || userId}</Dialog.Description></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border"><X size={17} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">{detail.isLoading ? <LoadingRows /> : detail.error ? <ErrorState error={detail.error} /> : <div className="space-y-8">
    <section><h3 className="font-heading text-lg font-bold">Аккаунт</h3><div className="mt-4 grid gap-px bg-border sm:grid-cols-3">{[["Статус", user.status], ["Рейтинг", user.rating ?? "—"], ["Последний вход", formatDate(user.last_login_at)], ["Соревнований", user.competitions_count ?? 0], ["Отправок", user.submissions_count ?? 0], ["Дуэлей", user.duels_count ?? 0]].map(([label, value]) => <div key={label} className="bg-background p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-semibold">{value}</p></div>)}</div></section>
    <section><div className="flex items-center justify-between"><h3 className="font-heading text-lg font-bold">Внутренние заметки</h3><span className="text-xs text-muted-foreground">Пользователь их не видит</span></div><div className="mt-4 divide-y divide-border border border-border">{listRows(notes.data).length ? listRows(notes.data).map((entry) => <div key={entry.id} className="p-4"><p className="text-sm leading-6">{entry.note}</p><p className="mt-2 text-xs text-muted-foreground">{formatDate(entry.created_at)}</p></div>) : <p className="p-4 text-sm text-muted-foreground">Заметок пока нет.</p>}</div>{can(permissions, "users.ban") && <div className="mt-3 flex gap-2"><Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Добавить внутреннюю заметку" className="rounded-none" /><Button onClick={() => mutation.mutate({ type: "note", value: note.trim() })} disabled={note.trim().length < 3 || mutation.isPending}>Добавить</Button></div>}</section>
    <section><h3 className="font-heading text-lg font-bold">Бейджи</h3><div className="mt-4 divide-y divide-border border border-border">{grantRows.length ? grantRows.map((grant) => <div key={grant.id || grant.badge?.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold">{grant.badge?.name || grant.name}</p><p className="mt-1 text-xs text-muted-foreground">{grant.badge?.code || grant.code}</p></div><div className="flex items-center gap-2"><Status value={grant.status || "active"} />{can(permissions, "settings.manage") && (grant.status || "active") === "active" && <ActionButton tone="danger" disabled={revokeReason.trim().length < 3} title="Сначала укажите причину ниже" onClick={() => mutation.mutate({ type: "revoke", value: grant.badge?.id || grant.id })}>Отозвать</ActionButton>}</div></div>) : <p className="p-4 text-sm text-muted-foreground">Активных бейджей нет.</p>}</div>{can(permissions, "settings.manage") && <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><select value={selectedBadge} onChange={(event) => setSelectedBadge(event.target.value)} className="h-10 border border-border bg-background px-3 text-sm"><option value="">Выберите бейдж</option>{badgeRows.map((badge) => <option key={badge.id} value={badge.id}>{badge.name}</option>)}</select><Input value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} placeholder="Причина отзыва бейджа" className="rounded-none" /><Button onClick={() => mutation.mutate({ type: "grant", value: selectedBadge })} disabled={!selectedBadge || mutation.isPending}><Award size={15} /> Выдать</Button></div>}</section>
    {can(permissions, "settings.manage") && <section><h3 className="font-heading text-lg font-bold">Роли сотрудника</h3><div className="mt-4 flex flex-wrap gap-2">{roleRows.map((role) => { const checked = selectedRoles.includes(role.code); return <button key={role.code} type="button" onClick={() => setSelectedRoles(checked ? selectedRoles.filter((item) => item !== role.code) : [...selectedRoles, role.code])} className={cn("border px-3 py-2 text-sm font-semibold", checked ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>{role.name || role.code}</button>; })}</div><Button className="mt-3" onClick={() => mutation.mutate({ type: "roles", value: selectedRoles })} disabled={!selectedRoles.length || mutation.isPending}><Save size={15} /> Сохранить роли</Button></section>}
    {can(permissions, "subscriptions.write") && <section><h3 className="font-heading text-lg font-bold">Назначить подписку</h3><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Input value={planCode} onChange={(event) => setPlanCode(event.target.value)} placeholder="Код активного тарифа" className="rounded-none" /><Input type="datetime-local" value={subscriptionEndsAt} onChange={(event) => setSubscriptionEndsAt(event.target.value)} className="rounded-none" /><Button onClick={() => mutation.mutate({ type: "subscription", value: { plan_code: planCode, starts_at: null, ends_at: subscriptionEndsAt ? new Date(subscriptionEndsAt).toISOString() : null } })} disabled={!planCode || mutation.isPending}><Plus size={15} /> Назначить</Button></div></section>}
  </div>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function UsersSection({ permissions, requestAction }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const queryClient = useQueryClient();
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({ queryKey: ["admin", "users", deferredSearch, status, role], queryFn: () => api.admin.users({ q: deferredSearch, status, role, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  return <><SectionHeading title="Пользователи" description="Аккаунты, статусы проверки, заметки, роли, подписки и ручные достижения." count={listTotal(query.data)} /><div className="mb-4 flex flex-col gap-2 lg:flex-row"><SearchField value={search} onChange={setSearch} placeholder="Email, ник или имя" /><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["active", "Активные"], ["pending_email", "Без подтверждения"], ["banned", "Заблокированные"], ["deleted", "Удалённые"]]} /><FilterSelect value={role} onChange={setRole} label="Все роли" options={[["user", "Участники"], ["organization", "Организации"], ["admin", "Администраторы"]]} /></div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Пользователь</th><th className="px-4 py-3">Роль</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Рейтинг</th><th className="px-4 py-3">Создан</th><th className="px-5 py-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-border">{rows.map((user) => <tr key={user.id} className="transition-colors hover:bg-secondary/35"><td className="px-5 py-4"><button type="button" onClick={() => setSelectedUserId(user.id)} className="text-left hover:text-primary"><span className="block font-semibold">{displayName(user)}</span><span className="mt-1 block text-xs text-muted-foreground">{user.email_masked || user.email || user.id}</span></button></td><td className="px-4 py-4">{user.role}</td><td className="px-4 py-4"><Status value={user.status} /></td><td className="px-4 py-4 font-semibold">{user.rating ?? "—"}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(user.created_at)}</td><td className="px-5 py-4"><ActionMenu><ActionButton onClick={() => setSelectedUserId(user.id)}><Settings2 size={13} /> Управлять</ActionButton>{can(permissions, "users.ban") && !user.admin_verified && <ActionButton tone="primary" onClick={() => requestAction({ title: "Подтвердить пользователя", description: `${displayName(user)} получит отметку ручной проверки. Email при этом не подтверждается.`, confirm: "Подтвердить", reason: false, run: () => api.admin.verifyUser(user.id), invalidate: ["admin", "users"] })}><UserCheck size={13} /> Проверить</ActionButton>}{can(permissions, "users.ban") && user.status === "banned" && <ActionButton onClick={() => requestAction({ title: "Снять блокировку", description: `Вернуть доступ пользователю ${displayName(user)}?`, confirm: "Разблокировать", reason: false, run: () => api.admin.unbanUser(user.id), invalidate: ["admin", "users"] })}><CheckCircle2 size={13} /> Разблокировать</ActionButton>}{can(permissions, "users.ban") && !["banned", "deleted"].includes(user.status) && user.role !== "organization" && <ActionButton tone="danger" onClick={() => requestAction({ title: "Заблокировать пользователя", description: `Все refresh-сессии ${displayName(user)} будут отозваны.`, confirm: "Заблокировать", danger: true, run: (reason) => api.admin.banUser(user.id, { reason }), invalidate: ["admin", "users"] })}><Ban size={13} /> Заблокировать</ActionButton>}</ActionMenu></td></tr>)}</tbody></table></TableShell><UserManageDialog userId={selectedUserId} permissions={permissions} onClose={() => setSelectedUserId(null)} onChanged={() => queryClient.invalidateQueries({ queryKey: ["admin", "users"] })} /></>;
}

function OrganizationEditorDialog({ item, onClose, onSaved }) {
  const creating = !item;
  const [form, setForm] = useState({ email: "", password: "", username: "", name: item?.name || "", slug: item?.slug || "", description: item?.description || "", website: item?.website || "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setPending(true); setError("");
    try {
      const website = normalizeWebsite(form.website);
      const body = creating ? { ...form, website, description: form.description || null } : { name: form.name, description: form.description || null, website };
      await (creating ? api.admin.createOrganization(body) : api.admin.updateOrganization(item.id, body));
      onSaved();
    } catch (saveError) { setError(apiErrorMessage(saveError)); } finally { setPending(false); }
  };
  return <Dialog.Root open onOpenChange={(open) => !open && !pending && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-card p-6 shadow-2xl focus:outline-none"><div className="flex items-start justify-between"><div><Dialog.Title className="font-heading text-2xl font-extrabold">{creating ? "Создать организацию" : "Редактировать организацию"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">{creating ? "Будет создан связанный аккаунт организации." : "Доступны публичные данные организации."}</Dialog.Description></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border"><X size={17} /></button></div><div className="mt-6 grid gap-5 sm:grid-cols-2">{creating && <><AdminField label="Email"><Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="rounded-none" /></AdminField><AdminField label="Пароль"><Input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} className="rounded-none" /></AdminField><AdminField label="Никнейм аккаунта"><Input value={form.username} onChange={(event) => update("username", event.target.value)} className="rounded-none" /></AdminField><AdminField label="Slug"><Input value={form.slug} onChange={(event) => update("slug", event.target.value.toLowerCase())} className="rounded-none" /></AdminField></>}<AdminField label="Название" wide><Input value={form.name} onChange={(event) => update("name", event.target.value)} className="rounded-none" /></AdminField><AdminField label="Сайт" wide><Input type="url" value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="https://company.ru" className="rounded-none" /></AdminField><AdminField label="Описание" wide><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-28 rounded-none" /></AdminField></div>{error && <div className="mt-5 border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}<div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Отмена</Button><Button onClick={save} disabled={pending}>{pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Сохранить</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function OrganizationsSection({ permissions, requestAction }) {
  const [editor, setEditor] = useState(undefined);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["admin", "organizations"], queryFn: () => api.admin.organizations({ limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  const writable = can(permissions, "settings.manage") || can(permissions, "competitions.write");
  const action = (organization, type, title, description, options = {}) => requestAction({ title, description, confirm: options.confirm || title, danger: options.danger, reason: options.reason, run: (reason) => api.admin.organizationAction(organization.id, type, options.reason === false ? undefined : { reason }), invalidate: ["admin", "organizations"] });
  const saved = () => { queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] }); setEditor(undefined); toast({ title: "Организация сохранена" }); };
  return <><SectionHeading title="Организации" description="Создание партнёров, верификация и управление доступом корпоративных аккаунтов." count={listTotal(query.data)} action={writable ? <Button onClick={() => setEditor(null)}><Plus size={16} /> Создать организацию</Button> : null} /><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[920px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Организация</th><th className="px-4 py-3">Сайт</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Создана</th><th className="px-5 py-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-border">{rows.map((organization) => <tr key={organization.id} className="hover:bg-secondary/35"><td className="px-5 py-4"><p className="font-semibold">{displayName(organization)}</p><p className="mt-1 text-xs text-muted-foreground">{organization.slug || organization.id}</p></td><td className="px-4 py-4">{organization.website ? <a href={organization.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Открыть <ArrowUpRight size={13} /></a> : "—"}</td><td className="px-4 py-4"><Status value={organization.status} /></td><td className="px-4 py-4 text-muted-foreground">{formatDate(organization.created_at)}</td><td className="px-5 py-4"><ActionMenu>{writable && <ActionButton onClick={() => setEditor(organization)}><Pencil size={13} /> Изменить</ActionButton>}{writable && organization.status === "pending" && <ActionButton tone="primary" onClick={() => action(organization, "verify", "Подтвердить организацию", "Аккаунт организации станет активным.", { reason: false })}><BadgeCheck size={13} /> Подтвердить</ActionButton>}{writable && organization.status === "suspended" && <ActionButton onClick={() => action(organization, "restore", "Восстановить организацию", "Корпоративный аккаунт снова станет активным. Соревнования останутся на паузе.", { reason: false })}><Play size={13} /> Восстановить</ActionButton>}{writable && !["suspended", "archived"].includes(organization.status) && <ActionButton tone="danger" onClick={() => action(organization, "suspend", "Приостановить организацию", "Аккаунт будет заблокирован, а текущие соревнования поставлены на паузу.", { danger: true })}><Pause size={13} /> Приостановить</ActionButton>}{writable && organization.status !== "archived" && <ActionButton tone="danger" onClick={() => action(organization, "archive", "Архивировать организацию", "Это логически удалит связанный аккаунт и отзовёт его сессии.", { danger: true })}><Archive size={13} /> В архив</ActionButton>}</ActionMenu></td></tr>)}</tbody></table></TableShell>{editor !== undefined && <OrganizationEditorDialog item={editor} onClose={() => setEditor(undefined)} onSaved={saved} />}</>;
}

function dateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function competitionForm(item = {}) {
  return {
    organization_id: item.organization_id || "",
    task_version_id: item.task_version_id || "",
    dataset_version_id: item.current_dataset_version_id || item.dataset_version_id || "",
    metric_version_id: item.metric_version_id || "",
    title: item.title || "",
    short_description: item.short_description || "",
    description: item.description || "",
    task_type: item.task_type || "classification",
    metric_code: item.metric_code || item.metric || "accuracy",
    domain: item.domain || "",
    difficulty: item.difficulty || "",
    access: item.access || "open",
    starts_at: dateTimeInput(item.starts_at),
    submission_deadline: dateTimeInput(item.submission_deadline || item.deadline),
    final_results_at: dateTimeInput(item.final_results_at),
    daily_submission_limit: String(item.daily_submission_limit ?? 5),
    public_split_percent: String(item.public_split_percent ?? 30),
    prize_amount: String(item.prize_amount ?? 0),
    prize_currency: item.prize_currency || "RUB",
    rules: item.rules || "",
    rules_version: item.rules_version || "v1",
    banner_color: item.banner_color || "#2563EB",
    external_data_policy: item.external_data_policy || "",
    ai_tools_policy: item.ai_tools_policy || "",
  };
}

function nullable(value) {
  return value === "" ? null : value;
}

function competitionPayload(form, creating) {
  const common = {
    task_version_id: nullable(form.task_version_id),
    metric_version_id: nullable(form.metric_version_id),
    title: form.title.trim(),
    short_description: nullable(form.short_description.trim()),
    description: form.description.trim(),
    domain: nullable(form.domain.trim()),
    difficulty: nullable(form.difficulty.trim()),
    starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
    submission_deadline: form.submission_deadline ? new Date(form.submission_deadline).toISOString() : null,
    final_results_at: form.final_results_at ? new Date(form.final_results_at).toISOString() : null,
    daily_submission_limit: Number(form.daily_submission_limit),
    prize_amount: Number(form.prize_amount),
    rules: nullable(form.rules.trim()),
    rules_version: form.rules_version.trim(),
    banner_color: form.banner_color,
    external_data_policy: nullable(form.external_data_policy.trim()),
    ai_tools_policy: nullable(form.ai_tools_policy.trim()),
  };
  if (!creating) return { ...common, current_dataset_version_id: nullable(form.dataset_version_id) };
  return {
    ...common,
    organization_id: nullable(form.organization_id),
    dataset_version_id: nullable(form.dataset_version_id),
    task_type: form.task_type,
    metric_code: form.metric_code.trim(),
    access: form.access,
    public_split_percent: Number(form.public_split_percent),
    prize_currency: form.prize_currency.trim().toUpperCase(),
  };
}

function CompetitionEditorDialog({ competitionId, creating, onClose, onSaved }) {
  const detail = useQuery({ queryKey: ["admin", "competition", competitionId], queryFn: () => api.admin.competition(competitionId), enabled: Boolean(competitionId) });
  const organizationsQuery = useQuery({ queryKey: ["admin", "competition-organization-options"], queryFn: () => api.admin.organizations({ limit: 50, offset: 0 }) });
  const tasksQuery = useQuery({ queryKey: ["admin", "competition-task-options"], queryFn: () => api.admin.tasks({ limit: 50, offset: 0 }) });
  const datasetsQuery = useQuery({ queryKey: ["admin", "competition-dataset-options"], queryFn: () => api.admin.datasets({ limit: 50, offset: 0 }) });
  const metricsQuery = useQuery({ queryKey: ["admin", "competition-metric-options"], queryFn: () => api.admin.metrics({ limit: 50, offset: 0 }) });
  const [form, setForm] = useState(() => competitionForm());
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: (body) => creating ? api.admin.createCompetition(body) : api.admin.updateCompetition(competitionId, body),
    onSuccess: onSaved,
    onError: (mutationError) => setError(apiErrorMessage(mutationError)),
  });
  useEffect(() => { if (detail.data) setForm(competitionForm(detail.data)); }, [detail.data]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const organizations = listRows(organizationsQuery.data);
  const taskOptions = listRows(tasksQuery.data).filter((item) => item.current_version?.id);
  const datasetOptions = listRows(datasetsQuery.data).filter((item) => item.current_version?.id);
  const metricOptions = listRows(metricsQuery.data).filter((item) => item.current_version?.id);
  const selectMetric = (value) => {
    const metric = metricOptions.find((item) => item.current_version.id === value);
    setForm((current) => ({ ...current, metric_version_id: value, metric_code: metric?.code || current.metric_code }));
  };
  const requiredReady = form.title.trim().length >= 3 && form.description.trim() && form.metric_code.trim() && form.submission_deadline;
  const submit = () => { setError(""); mutation.mutate(competitionPayload(form, creating)); };
  return <Dialog.Root open onOpenChange={(open) => !open && !mutation.isPending && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[94vh] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-border bg-card shadow-2xl focus:outline-none"><div className="flex items-start justify-between border-b border-border p-5 md:px-7"><div><Dialog.Title className="font-heading text-2xl font-extrabold">{creating ? "Новое соревнование" : "Редактирование соревнования"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Содержимое, ресурсы, сроки и правила события.</Dialog.Description></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border"><X size={17} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-7">{detail.isLoading && !creating ? <LoadingRows /> : detail.error ? <ErrorState error={detail.error} /> : <div className="space-y-8">
    <section><h3 className="font-heading text-lg font-bold">Основное</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><AdminField label="Название" wide><Input value={form.title} onChange={(event) => update("title", event.target.value)} className="rounded-none" /></AdminField><AdminField label="Краткое описание" wide><Textarea value={form.short_description} onChange={(event) => update("short_description", event.target.value)} className="min-h-20 rounded-none" /></AdminField><AdminField label="Полное описание" wide><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-36 rounded-none" /></AdminField><AdminField label="Направление"><Input value={form.domain} onChange={(event) => update("domain", event.target.value)} className="rounded-none" /></AdminField><AdminField label="Сложность"><Input value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)} className="rounded-none" /></AdminField></div></section>
    <section><h3 className="font-heading text-lg font-bold">Ресурсы и проверка</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><AdminField label="Организация"><select value={form.organization_id} onChange={(event) => update("organization_id", event.target.value)} disabled={!creating} className="h-10 w-full border border-border bg-background px-3 text-sm disabled:opacity-60"><option value="">ML-Арена</option>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name || item.slug}</option>)}</select></AdminField><AdminField label="Версия задачи"><select value={form.task_version_id} onChange={(event) => update("task_version_id", event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm"><option value="">Без связанной задачи</option>{taskOptions.map((item) => <option key={item.current_version.id} value={item.current_version.id}>{item.current_version.title || item.slug} · версия {item.current_version.version}</option>)}</select></AdminField><AdminField label="Версия датасета"><select value={form.dataset_version_id} onChange={(event) => update("dataset_version_id", event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm"><option value="">Без связанного датасета</option>{datasetOptions.map((item) => <option key={item.current_version.id} value={item.current_version.id}>{item.name} · версия {item.current_version.version}</option>)}</select></AdminField><AdminField label="Версия метрики"><select value={form.metric_version_id} onChange={(event) => selectMetric(event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm"><option value="">Использовать только код метрики</option>{metricOptions.map((item) => <option key={item.current_version.id} value={item.current_version.id}>{item.name || item.code} · версия {item.current_version.version}</option>)}</select></AdminField>{creating && <><AdminSelect label="Тип задачи" value={form.task_type} onChange={(value) => update("task_type", value)} options={TASK_TYPE_OPTIONS} /><AdminField label="Код метрики"><Input value={form.metric_code} onChange={(event) => update("metric_code", event.target.value)} className="rounded-none" /></AdminField><AdminSelect label="Доступ" value={form.access} onChange={(value) => update("access", value)} options={[["open", "Открытое"], ["invite_only", "По приглашению"], ["partner", "Партнёрское"], ["premium", "Premium"]]} /></>}</div></section>
    <section><h3 className="font-heading text-lg font-bold">Сроки и лимиты</h3><div className="mt-4 grid gap-4 md:grid-cols-3"><AdminField label="Начало"><Input type="datetime-local" value={form.starts_at} onChange={(event) => update("starts_at", event.target.value)} className="rounded-none" /></AdminField><AdminField label="Дедлайн отправок"><Input type="datetime-local" value={form.submission_deadline} onChange={(event) => update("submission_deadline", event.target.value)} className="rounded-none" /></AdminField><AdminField label="Финальные результаты"><Input type="datetime-local" value={form.final_results_at} onChange={(event) => update("final_results_at", event.target.value)} className="rounded-none" /></AdminField><AdminField label="Отправок в день"><Input type="number" min="0" value={form.daily_submission_limit} onChange={(event) => update("daily_submission_limit", event.target.value)} className="rounded-none" /></AdminField>{creating && <AdminField label="Публичная выборка, %"><Input type="number" min="1" max="99" value={form.public_split_percent} onChange={(event) => update("public_split_percent", event.target.value)} className="rounded-none" /></AdminField>}<AdminField label="Приз в минимальных единицах"><Input type="number" min="0" value={form.prize_amount} onChange={(event) => update("prize_amount", event.target.value)} className="rounded-none" /></AdminField>{creating && <AdminField label="Валюта"><Input maxLength={3} value={form.prize_currency} onChange={(event) => update("prize_currency", event.target.value)} className="rounded-none uppercase" /></AdminField>}</div></section>
    <section><h3 className="font-heading text-lg font-bold">Правила</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><AdminField label="Правила" wide><Textarea value={form.rules} onChange={(event) => update("rules", event.target.value)} className="min-h-36 rounded-none" /></AdminField><AdminField label="Версия правил"><Input value={form.rules_version} onChange={(event) => update("rules_version", event.target.value)} className="rounded-none" /></AdminField><AdminField label="Цвет баннера"><Input type="color" value={form.banner_color} onChange={(event) => update("banner_color", event.target.value)} className="rounded-none p-1" /></AdminField><AdminField label="Политика внешних данных"><Textarea value={form.external_data_policy} onChange={(event) => update("external_data_policy", event.target.value)} className="min-h-28 rounded-none" /></AdminField><AdminField label="Политика AI-инструментов"><Textarea value={form.ai_tools_policy} onChange={(event) => update("ai_tools_policy", event.target.value)} className="min-h-28 rounded-none" /></AdminField></div></section>
    {error && <div className="border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
  </div>}</div><div className="flex justify-end gap-2 border-t border-border p-5 md:px-7"><Button variant="outline" onClick={onClose}>Отмена</Button><Button onClick={submit} disabled={!requiredReady || mutation.isPending}>{mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Сохранить</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function CompetitionOperationsDialog({ competition, permissions, onClose, onChanged }) {
  const [reason, setReason] = useState("");
  const [scope, setScope] = useState("competition");
  const [userId, setUserId] = useState("");
  const [datasetVersionId, setDatasetVersionId] = useState("");
  const [metricVersionId, setMetricVersionId] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const readiness = useQuery({ queryKey: ["admin", "competition", competition.id, "readiness"], queryFn: () => api.admin.competitionReadiness(competition.id) });
  const snapshots = useQuery({ queryKey: ["admin", "competition", competition.id, "snapshots"], queryFn: () => api.admin.leaderboardSnapshots(competition.id), enabled: can(permissions, "leaderboards.read") });
  const recalculations = useQuery({ queryKey: ["admin", "competition", competition.id, "recalculations"], queryFn: () => api.admin.leaderboardRecalculations(competition.id), enabled: can(permissions, "leaderboards.read") });
  const mutation = useMutation({ mutationFn: async ({ type, kind }) => {
    if (type === "snapshot") return api.admin.createLeaderboardSnapshot(competition.id, kind);
    if (type === "recalculate") return api.admin.recalculateLeaderboard(competition.id, { scope, user_id: scope === "user" ? userId : null, reason });
    if (type === "reveal") return api.admin.revealPrivateLeaderboard(competition.id);
    return api.admin.updateScoringConfig(competition.id, { dataset_version_id: datasetVersionId || null, metric_version_id: metricVersionId || null, reason });
  }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "competition", competition.id] }); onChanged(); toast({ title: "Операция выполнена" }); }, onError: (error) => toast({ title: "Операция отклонена", description: error.message, variant: "destructive" }) });
  const checks = readiness.data?.checks || [];
  return <Dialog.Root open onOpenChange={(open) => !open && !mutation.isPending && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[94vh] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-border bg-card shadow-2xl focus:outline-none"><div className="flex items-start justify-between border-b border-border p-5 md:px-7"><div><Dialog.Title className="font-heading text-2xl font-extrabold">Готовность и рейтинг</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">{displayName(competition)}</Dialog.Description></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border"><X size={17} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-7"><div className="space-y-8">
    <section><div className="flex items-center justify-between"><h3 className="font-heading text-lg font-bold">Проверка перед запуском</h3>{readiness.data && <Status value={readiness.data.ready ? "active" : "failed"} />}</div>{readiness.isLoading ? <LoadingRows /> : readiness.error ? <ErrorState error={readiness.error} compact /> : <div className="mt-4 grid gap-px bg-border md:grid-cols-2">{checks.map((check) => <div key={check.code} className="flex gap-3 bg-background p-4">{check.passed ? <CheckCircle2 className="shrink-0 text-emerald-500" size={18} /> : <CircleAlert className="shrink-0 text-destructive" size={18} />}<div><p className="font-semibold">{check.code}</p><p className="mt-1 text-sm text-muted-foreground">{check.message}</p></div></div>)}</div>}</section>
    {can(permissions, "leaderboards.read") && <section><h3 className="font-heading text-lg font-bold">Снимки рейтинга</h3><div className="mt-4 flex flex-wrap gap-2">{can(permissions, "leaderboards.recalculate") && <Button variant="outline" onClick={() => mutation.mutate({ type: "snapshot", kind: "public" })}><Copy size={15} /> Публичный снимок</Button>}{can(permissions, "leaderboards.private.read") && <Button variant="outline" onClick={() => mutation.mutate({ type: "snapshot", kind: "private" })}><LockKeyhole size={15} /> Приватный снимок</Button>}</div><div className="mt-4 divide-y divide-border border border-border">{listRows(snapshots.data).slice(0, 8).map((snapshot) => <div key={snapshot.id} className="flex items-center justify-between gap-3 p-3 text-sm"><div><span className="font-semibold">{snapshot.kind}</span><span className="ml-2 text-muted-foreground">{snapshot.entries_count ?? snapshot.rows_count ?? "—"} записей</span></div><span className="text-xs text-muted-foreground">{formatDate(snapshot.created_at)}</span></div>)}{!listRows(snapshots.data).length && <p className="p-4 text-sm text-muted-foreground">Снимков пока нет.</p>}</div></section>}
    {can(permissions, "leaderboards.recalculate") && <section><h3 className="font-heading text-lg font-bold">Пересчёт рейтинга</h3><div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_1fr_auto]"><select value={scope} onChange={(event) => setScope(event.target.value)} className="h-10 border border-border bg-background px-3 text-sm"><option value="competition">Всё соревнование</option><option value="user">Один участник</option></select>{scope === "user" ? <Input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="ID участника" className="rounded-none" /> : <div />}<Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Причина пересчёта" className="rounded-none" /><Button onClick={() => mutation.mutate({ type: "recalculate" })} disabled={reason.trim().length < 3 || (scope === "user" && !userId)}><RefreshCw size={15} /> Пересчитать</Button></div><div className="mt-4 divide-y divide-border border border-border">{listRows(recalculations.data).slice(0, 6).map((job) => <div key={job.id} className="flex items-center justify-between gap-3 p-3 text-sm"><div><Status value={job.status} /><span className="ml-2">{job.reason}</span></div><span className="text-xs text-muted-foreground">{formatDate(job.created_at)}</span></div>)}</div></section>}
    {can(permissions, "leaderboards.recalculate") && <section><h3 className="font-heading text-lg font-bold">Аварийная замена scoring</h3><p className="mt-1 text-sm text-muted-foreground">Доступна сервером только на паузе или при финализации. После замены рейтинг пересчитывается автоматически.</p><div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"><Input value={datasetVersionId} onChange={(event) => setDatasetVersionId(event.target.value)} placeholder="Новая версия датасета" className="rounded-none" /><Input value={metricVersionId} onChange={(event) => setMetricVersionId(event.target.value)} placeholder="Новая версия метрики, необязательно" className="rounded-none" /><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Причина замены" className="rounded-none" /><Button variant="outline" onClick={() => mutation.mutate({ type: "scoring" })} disabled={!datasetVersionId || reason.trim().length < 3}><Settings2 size={15} /> Заменить</Button></div></section>}
    {can(permissions, "leaderboards.reveal") && ["finalizing", "completed"].includes(competition.status) && <section className="border border-primary/25 bg-primary/5 p-5"><h3 className="font-heading text-lg font-bold">Финальные результаты</h3><p className="mt-2 text-sm text-muted-foreground">Открытие приватного рейтинга завершает соревнование. Это действие фиксируется в журнале.</p><Button className="mt-4" onClick={() => mutation.mutate({ type: "reveal" })}><Trophy size={15} /> Открыть приватный рейтинг</Button></section>}
  </div></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function CompetitionsSectionLegacy({ permissions, requestAction }) {
  const [status, setStatus] = useState("all");
  const query = useQuery({ queryKey: ["admin", "competitions", status], queryFn: () => api.admin.competitions({ status, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  const execute = (competition, type, title, description, options = {}) => requestAction({ title, description, confirm: title, danger: options.danger, reason: options.reason ?? false, run: (reason) => api.admin.competitionAction(competition.id, type, options.reason ? { reason } : undefined), invalidate: ["admin", "competitions"] });
  return <><SectionHeading title="Соревнования" description="Публикация, пауза и жизненный цикл событий. Backend повторно проверяет готовность перед запуском." count={listTotal(query.data)} /><div className="mb-4 flex justify-end"><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["draft", "Черновики"], ["moderation", "На модерации"], ["scheduled", "Запланированные"], ["active", "Активные"], ["paused", "На паузе"], ["completed", "Завершённые"]]} /></div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Соревнование</th><th className="px-4 py-3">Организатор</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Дедлайн</th><th className="px-4 py-3">Участники</th><th className="px-5 py-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-border">{rows.map((competition) => <tr key={competition.id} className="hover:bg-secondary/35"><td className="px-5 py-4"><p className="font-semibold">{displayName(competition)}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{competition.slug || competition.id}</p></td><td className="px-4 py-4">{competition.organization_name || competition.company_name || "ML-Арена"}</td><td className="px-4 py-4"><Status value={competition.status} /></td><td className="px-4 py-4 text-muted-foreground">{formatDate(competition.deadline)}</td><td className="px-4 py-4 font-semibold">{competition.participants_count ?? 0}</td><td className="px-5 py-4"><ActionMenu>{["draft", "moderation", "scheduled"].includes(competition.status) && can(permissions, "competitions.publish") && <ActionButton tone="primary" onClick={() => execute(competition, "publish", "Опубликовать соревнование", "Сервер проверит датасет, метрику, правила и дедлайн.")}><Play size={13} /> Опубликовать</ActionButton>}{competition.status === "active" && can(permissions, "competitions.pause") && <ActionButton onClick={() => execute(competition, "pause", "Поставить на паузу", "Приём новых решений будет временно остановлен.", { reason: true })}><Pause size={13} /> Пауза</ActionButton>}{competition.status === "paused" && can(permissions, "competitions.pause") && <ActionButton tone="primary" onClick={() => execute(competition, "resume", "Возобновить соревнование", "Проверьте дедлайн перед возобновлением.")}><Play size={13} /> Возобновить</ActionButton>}{competition.status !== "archived" && can(permissions, "competitions.archive") && <ActionButton tone="danger" onClick={() => execute(competition, "archive", "Архивировать соревнование", "Событие исчезнет из активных списков.", { reason: true, danger: true })}><Archive size={13} /></ActionButton>}</ActionMenu></td></tr>)}</tbody></table></TableShell></>;
}

function CompetitionsSection({ permissions, requestAction }) {
  const [status, setStatus] = useState("all");
  const [editor, setEditor] = useState(null);
  const [operations, setOperations] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["admin", "competitions", status], queryFn: () => api.admin.competitions({ status, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "competitions"] });
  const execute = (competition, type, title, description, options = {}) => requestAction({
    title,
    description,
    confirm: title,
    danger: options.danger,
    reason: options.reason ?? false,
    run: (reason) => type === "archive" ? api.admin.archiveCompetition(competition.id) : api.admin.competitionAction(competition.id, type, options.reason ? { reason } : undefined),
    invalidate: ["admin", "competitions"],
  });
  const duplicate = useMutation({
    mutationFn: (id) => api.admin.duplicateCompetition(id),
    onSuccess: () => { invalidate(); toast({ title: "Создана копия-черновик", description: "Обязательно проверьте даты перед публикацией." }); },
    onError: (error) => toast({ title: "Не удалось создать копию", description: error.message, variant: "destructive" }),
  });
  const closeEditor = () => setEditor(null);
  const saved = () => { invalidate(); closeEditor(); toast({ title: "Соревнование сохранено" }); };
  return <>
    <SectionHeading title="Соревнования" description="Полный цикл события: черновик, ресурсы, проверка готовности, публикация и финальный рейтинг." count={listTotal(query.data)} action={can(permissions, "competitions.write") ? <Button onClick={() => setEditor({ creating: true })}><Plus size={16} /> Создать соревнование</Button> : null} />
    <div className="mb-4 flex justify-end"><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["draft", "Черновики"], ["moderation", "На модерации"], ["scheduled", "Запланированные"], ["active", "Активные"], ["paused", "На паузе"], ["finalizing", "Финализация"], ["completed", "Завершённые"], ["archived", "Архив"]]} /></div>
    <TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[1080px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Соревнование</th><th className="px-4 py-3">Организатор</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Дедлайн</th><th className="px-4 py-3">Участники</th><th className="px-5 py-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-border">{rows.map((competition) => <tr key={competition.id} className="hover:bg-secondary/35"><td className="px-5 py-4"><p className="font-semibold">{displayName(competition)}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{competition.slug || competition.id}</p></td><td className="px-4 py-4">{competition.organization_name || competition.company_name || "ML-Арена"}</td><td className="px-4 py-4"><Status value={competition.status} /></td><td className="px-4 py-4 text-muted-foreground">{formatDate(competition.submission_deadline || competition.deadline)}</td><td className="px-4 py-4 font-semibold">{competition.participants_count ?? 0}</td><td className="px-5 py-4"><ActionMenu>
      {can(permissions, "competitions.read") && <ActionButton onClick={() => setOperations(competition)}><Gauge size={13} /> Готовность и рейтинг</ActionButton>}
      {can(permissions, "competitions.write") && <ActionButton onClick={() => setEditor({ creating: false, id: competition.id })}><Pencil size={13} /> Изменить</ActionButton>}
      {can(permissions, "competitions.write") && <ActionButton onClick={() => duplicate.mutate(competition.id)} disabled={duplicate.isPending}><Copy size={13} /> Создать копию</ActionButton>}
      {competition.origin === "community" && ["submitted_for_review", "moderation"].includes(competition.status) && can(permissions, "competitions.publish") && <ActionButton tone="primary" onClick={() => requestAction({ title: "Одобрить соревнование сообщества", description: "Сервер повторно проверит датасет, скрытые ответы и ограничения community-контура.", confirm: "Одобрить", reason: true, run: (reason) => api.admin.moderateCommunityCompetition(competition.id, { decision: "approve", reason }), invalidate: ["admin", "competitions"] })}><CheckCircle2 size={13} /> Одобрить community</ActionButton>}
      {competition.origin === "community" && ["submitted_for_review", "moderation"].includes(competition.status) && can(permissions, "competitions.publish") && <ActionButton onClick={() => requestAction({ title: "Вернуть на доработку", description: "Автор увидит причину и сможет изменить черновик.", confirm: "Вернуть", reason: true, run: (reason) => api.admin.moderateCommunityCompetition(competition.id, { decision: "request_changes", reason }), invalidate: ["admin", "competitions"] })}><Undo2 size={13} /> На доработку</ActionButton>}
      {competition.origin === "community" && ["submitted_for_review", "moderation"].includes(competition.status) && can(permissions, "competitions.publish") && <ActionButton tone="danger" onClick={() => requestAction({ title: "Отклонить соревнование сообщества", description: "Заявка будет отклонена с обязательной причиной.", confirm: "Отклонить", danger: true, reason: true, run: (reason) => api.admin.moderateCommunityCompetition(competition.id, { decision: "reject", reason }), invalidate: ["admin", "competitions"] })}><Ban size={13} /> Отклонить</ActionButton>}
      {["draft", "moderation", "scheduled"].includes(competition.status) && can(permissions, "competitions.publish") && <ActionButton tone="primary" onClick={() => execute(competition, "publish", "Опубликовать соревнование", "Сервер проверит датасет, метрику, правила, политики и дедлайн.")}><Play size={13} /> Опубликовать</ActionButton>}
      {["moderation", "scheduled", "active", "finalizing"].includes(competition.status) && can(permissions, "competitions.pause") && <ActionButton onClick={() => execute(competition, "pause", "Поставить на паузу", "Приём новых решений будет временно остановлен.", { reason: true })}><Pause size={13} /> Пауза</ActionButton>}
      {competition.status === "paused" && can(permissions, "competitions.pause") && <ActionButton tone="primary" onClick={() => execute(competition, "resume", "Возобновить соревнование", "Сервер повторно проверит дедлайн и состояние организатора.")}><Play size={13} /> Возобновить</ActionButton>}
      {competition.status !== "archived" && can(permissions, "competitions.archive") && <ActionButton tone="danger" onClick={() => execute(competition, "archive", "Архивировать соревнование", "Событие исчезнет из активных списков, но данные и рейтинг сохранятся.", { danger: true })}><Archive size={13} /> В архив</ActionButton>}
    </ActionMenu></td></tr>)}</tbody></table></TableShell>
    {editor && <CompetitionEditorDialog creating={editor.creating} competitionId={editor.id} onClose={closeEditor} onSaved={saved} />}
    {operations && <CompetitionOperationsDialog competition={operations} permissions={permissions} onClose={() => setOperations(null)} onChanged={invalidate} />}
  </>;
}

function SubmissionDetailDialog({ submissionId, onClose }) {
  const query = useQuery({ queryKey: ["admin", "submission", submissionId], queryFn: () => api.admin.submission(submissionId), enabled: Boolean(submissionId) });
  const submission = query.data && typeof query.data === "object" ? query.data : {};
  return <Dialog.Root open={Boolean(submissionId)} onOpenChange={(open) => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-card p-6 shadow-2xl focus:outline-none"><div className="flex items-start justify-between"><div><Dialog.Title className="font-heading text-2xl font-extrabold">История отправки</Dialog.Title><Dialog.Description className="mt-1 font-mono text-xs text-muted-foreground">{submissionId}</Dialog.Description></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border"><X size={17} /></button></div>{query.isLoading ? <LoadingRows /> : query.error ? <div className="mt-5"><ErrorState error={query.error} /></div> : <div className="mt-6 space-y-7"><div className="grid gap-px bg-border sm:grid-cols-3">{[["Участник", submissionParticipant(submission)], ["Соревнование", submission.competition_title || submission.competition_id], ["Статус", STATUS_LABELS[submission.status] || submission.status], ["Публичный результат", submission.public_score ?? "—"], ["Приватный результат", submission.private_score ?? "—"], ["Создана", formatDate(submission.created_at)]].map(([label, value]) => <div key={label} className="bg-background p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 break-words font-semibold">{value || "—"}</p></div>)}</div><section><h3 className="font-heading text-lg font-bold">Переходы статуса</h3><div className="mt-4 divide-y divide-border border border-border">{(submission.history || []).map((event, index) => <div key={event.id || index} className="grid gap-2 p-4 sm:grid-cols-[150px_1fr_auto]"><p className="font-semibold">{STATUS_LABELS[event.from_status] || event.from_status || "Создана"} → {STATUS_LABELS[event.to_status] || event.to_status}</p><div><p className="text-sm">{event.reason || "Без комментария"}</p>{event.error_code && <p className="mt-1 font-mono text-xs text-destructive">{event.error_code}</p>}</div><p className="text-xs text-muted-foreground">{event.actor_type} · {formatDate(event.created_at)}</p></div>)}{!(submission.history || []).length && <p className="p-4 text-sm text-muted-foreground">История пуста.</p>}</div></section></div>}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function SubmissionsSectionLegacy({ permissions, requestAction }) {
  const [status, setStatus] = useState("all");
  const query = useQuery({ queryKey: ["admin", "submissions", status], queryFn: () => api.admin.submissions({ status, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  const execute = (submission, type, title, danger = false) => requestAction({ title, description: `Отправка ${submission.id}. Действие и причина сохранятся в истории.`, confirm: title, danger, run: (reason) => api.admin.submissionAction(submission.id, type, reason), invalidate: ["admin", "submissions"] });
  return <><SectionHeading title="Отправки решений" description="Очередь проверки, повторные запуски и дисквалификации без физического удаления результатов." count={listTotal(query.data)} /><div className="mb-4 flex justify-end"><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["queued", "В очереди"], ["validating", "Проверяются"], ["scored", "Оценены"], ["failed", "С ошибкой"], ["rejected", "Отклонены"], ["disqualified", "Дисквалифицированы"]]} /></div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">ID / участник</th><th className="px-4 py-3">Соревнование</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Результат</th><th className="px-4 py-3">Время</th><th className="px-5 py-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-border">{rows.map((submission) => <tr key={submission.id} className="hover:bg-secondary/35"><td className="px-5 py-4"><p className="font-semibold">{submissionParticipant(submission)}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{submission.id}</p></td><td className="px-4 py-4">{submission.competition_title || submission.competition_id || "—"}</td><td className="px-4 py-4"><Status value={submission.status} /></td><td className="px-4 py-4 font-semibold">{submission.public_score ?? submission.score ?? "—"}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(submission.created_at)}</td><td className="px-5 py-4"><ActionMenu>{["failed", "rejected", "cancelled"].includes(submission.status) && can(permissions, "submissions.retry") && <ActionButton tone="primary" onClick={() => execute(submission, "retry", "Повторить проверку")}><RefreshCw size={13} /> Повторить</ActionButton>}{["uploaded", "validating", "queued", "pending"].includes(submission.status) && can(permissions, "submissions.retry") && <ActionButton onClick={() => execute(submission, "cancel", "Отменить отправку")}><X size={13} /> Отменить</ActionButton>}{submission.status !== "disqualified" && can(permissions, "submissions.disqualify") && <ActionButton tone="danger" onClick={() => execute(submission, "disqualify", "Дисквалифицировать", true)}><Ban size={13} /> Исключить</ActionButton>}</ActionMenu></td></tr>)}</tbody></table></TableShell></>;
}

function SubmissionsSection({ permissions, requestAction }) {
  const [status, setStatus] = useState("all");
  const [competitionId, setCompetitionId] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const deferredCompetition = useDeferredValue(competitionId);
  const deferredUser = useDeferredValue(userId);
  const query = useQuery({ queryKey: ["admin", "submissions", status, deferredCompetition, deferredUser], queryFn: () => api.admin.submissions({ status, competition_id: deferredCompetition, user_id: deferredUser, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  const execute = (submission, type, title, danger = false) => requestAction({ title, description: `Отправка ${submission.id}. Действие и причина сохранятся в истории.`, confirm: title, danger, run: (reason) => api.admin.submissionAction(submission.id, type, reason), invalidate: ["admin", "submissions"] });
  return <><SectionHeading title="Отправки решений" description="Фильтрация, полная история обработки, повторные запуски и дисквалификации." count={listTotal(query.data)} /><div className="mb-4 grid gap-2 lg:grid-cols-[1fr_1fr_auto]"><SearchField value={competitionId} onChange={setCompetitionId} placeholder="ID соревнования" /><SearchField value={userId} onChange={setUserId} placeholder="ID участника" /><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["queued", "В очереди"], ["validating", "Проверяются"], ["scored", "Оценены"], ["failed", "С ошибкой"], ["rejected", "Отклонены"], ["cancelled", "Отменены"], ["disqualified", "Дисквалифицированы"]]} /></div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">ID / участник</th><th className="px-4 py-3">Соревнование</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Результат</th><th className="px-4 py-3">Время</th><th className="px-5 py-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-border">{rows.map((submission) => <tr key={submission.id} className="hover:bg-secondary/35"><td className="px-5 py-4"><button type="button" onClick={() => setSelectedId(submission.id)} className="text-left hover:text-primary"><span className="block font-semibold">{submissionParticipant(submission)}</span><span className="mt-1 block font-mono text-xs text-muted-foreground">{submission.id}</span></button></td><td className="px-4 py-4">{submission.competition_title || submission.competition_id || "—"}</td><td className="px-4 py-4"><Status value={submission.status} /></td><td className="px-4 py-4 font-semibold">{submission.public_score ?? submission.score ?? "—"}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(submission.created_at)}</td><td className="px-5 py-4"><ActionMenu><ActionButton onClick={() => setSelectedId(submission.id)}><History size={13} /> История</ActionButton>{["failed", "rejected", "cancelled"].includes(submission.status) && can(permissions, "submissions.retry") && <ActionButton tone="primary" onClick={() => execute(submission, "retry", "Повторить проверку")}><RefreshCw size={13} /> Повторить</ActionButton>}{["uploaded", "validating", "queued", "pending"].includes(submission.status) && can(permissions, "submissions.retry") && <ActionButton onClick={() => execute(submission, "cancel", "Отменить отправку")}><X size={13} /> Отменить</ActionButton>}{submission.status !== "disqualified" && can(permissions, "submissions.disqualify") && <ActionButton tone="danger" onClick={() => execute(submission, "disqualify", "Дисквалифицировать", true)}><Ban size={13} /> Исключить</ActionButton>}</ActionMenu></td></tr>)}</tbody></table></TableShell><SubmissionDetailDialog submissionId={selectedId} onClose={() => setSelectedId(null)} /></>;
}

function ModerationSection({ permissions, requestAction }) {
  const [status, setStatus] = useState("new");
  const query = useQuery({ queryKey: ["admin", "moderation", status], queryFn: () => api.admin.moderationReports({ status, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  const decide = (report, action, title, danger = false) => requestAction({ title, description: `Жалоба на ${report.object_type || "объект"}. Решение нельзя незаметно изменить: оно попадёт в аудит.`, confirm: title, danger, run: (reason) => api.admin.decideModerationReport(report.id, { action, reason }), invalidate: ["admin", "moderation"] });
  return <><SectionHeading title="Очередь модерации" description="Жалобы пользователей и полный набор решений с неизменяемым следом в журнале." count={listTotal(query.data)} /><div className="mb-4 flex justify-end"><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["new", "Новые"], ["escalated", "Переданные выше"], ["resolved", "Решённые"], ["rejected", "Отклонённые"]]} /></div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><div className="divide-y divide-border">{rows.map((report) => <article key={report.id} className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><Status value={report.status} /><span className="text-xs font-semibold uppercase text-muted-foreground">{report.object_type}</span><span className="text-xs text-muted-foreground">важность {report.severity ?? "—"}</span></div><h3 className="mt-3 font-semibold">{report.reason}</h3>{report.text && <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{report.text}</p>}<p className="mt-3 font-mono text-xs text-muted-foreground">{report.object_id} · {formatDate(report.created_at)}</p></div>{can(permissions, "moderation.resolve") && ["new", "escalated"].includes(report.status) && <ActionMenu><ActionButton onClick={() => decide(report, "dismiss", "Отклонить жалобу")}><X size={13} /> Отклонить</ActionButton><ActionButton onClick={() => decide(report, "escalate", "Передать выше")}><ArrowUpRight size={13} /> Передать</ActionButton><ActionButton onClick={() => decide(report, "warn_user", "Предупредить пользователя")}><CircleAlert size={13} /> Предупредить</ActionButton><ActionButton onClick={() => decide(report, "restore_content", "Восстановить содержимое")}><RefreshCw size={13} /> Восстановить</ActionButton><ActionButton tone="danger" onClick={() => decide(report, "hide_content", "Скрыть содержимое", true)}><ShieldAlert size={13} /> Скрыть</ActionButton><ActionButton tone="danger" onClick={() => decide(report, "block_user", "Заблокировать пользователя", true)}><Ban size={13} /> Заблокировать</ActionButton></ActionMenu>}</article>)}</div></TableShell></>;
}

function blogValidationIssues(form, requireCover = false, coverHasAlt = true) {
  const issues = [];
  if (form.title.trim().length < 5) issues.push("Заголовок — минимум 5 символов");
  if (form.slug.trim().length < 3) issues.push("Slug — минимум 3 латинских символа");
  if (form.excerpt.trim().length < 50) issues.push("Краткое описание — минимум 50 символов");
  if (form.excerpt.length > 300) issues.push("Краткое описание — максимум 300 символов");
  if (!form.body_markdown.trim()) issues.push("Добавьте текст статьи");
  if (!form.author_name.trim()) issues.push("Укажите автора");
  if (!form.primary_category_id) issues.push("Выберите основную категорию");
  if (requireCover && !form.cover_media_id) issues.push("Выберите или загрузите обложку");
  if (requireCover && form.cover_media_id && !coverHasAlt) issues.push("У обложки должен быть alt-текст");
  if (form.cta_type !== "none" && !form.cta_label.trim()) issues.push("Укажите текст кнопки CTA");
  if (form.cta_type !== "none" && !form.cta_url.trim()) issues.push("Укажите ссылку CTA");
  return issues;
}

function ValidationNotice({ issues }) {
  if (!issues.length) return null;
  return (
    <div className="border border-destructive/25 bg-destructive/5 p-4">
      <div className="flex gap-3">
        <CircleAlert className="mt-0.5 shrink-0 text-destructive" size={18} />
        <div>
          <p className="text-sm font-semibold">Проверьте обязательные поля</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {issues.map((issue) => <li key={issue}>• {issue}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function BlogCreateDialog({ open, onClose, categories, onSubmit, pending }) {
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", body_markdown: "", author_name: "Редакция ML-Арены", primary_category_id: "", internal_goal: "other", cta_type: "none", tag_ids: [] });
  const [attempted, setAttempted] = useState(false);
  const categoryRows = listRows(categories);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const issues = blogValidationIssues(form);
  const submit = () => {
    if (issues.length) {
      setAttempted(true);
      return;
    }
    onSubmit(form);
  };

  useEffect(() => {
    if (!open) setAttempted(false);
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && !pending && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-4 right-4 z-[101] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto border border-border bg-card p-6 shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <div><Dialog.Title className="font-heading text-2xl font-extrabold">Новый материал</Dialog.Title><Dialog.Description className="mt-2 text-sm text-muted-foreground">Сначала создайте основу статьи. Обложку, теги и CTA можно добавить в редакторе черновика.</Dialog.Description></div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border" aria-label="Закрыть"><X size={17} /></button>
          </div>
          <div className="mt-7 grid gap-5">
            {attempted && <ValidationNotice issues={issues} />}
            <label><span className="mb-2 block text-sm font-semibold">Заголовок</span><Input value={form.title} onChange={(event) => update("title", event.target.value)} className="rounded-none" /><span className="mt-1 block text-xs text-muted-foreground">От 5 до 140 символов</span></label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">Slug</span><Input value={form.slug} onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="nazvanie-stati" className="rounded-none font-mono" /><span className="mt-1 block text-xs text-muted-foreground">Латиница, цифры и дефисы</span></label>
              <label><span className="mb-2 block text-sm font-semibold">Основная категория</span><select value={form.primary_category_id} onChange={(event) => update("primary_category_id", event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm"><option value="">Выберите категорию</option>{categoryRows.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            </div>
            <label><span className="mb-2 block text-sm font-semibold">Краткое описание</span><Textarea value={form.excerpt} maxLength={300} onChange={(event) => update("excerpt", event.target.value)} className="min-h-24 rounded-none" /><span className={cn("mt-1 block text-right text-xs", form.excerpt.length > 0 && form.excerpt.trim().length < 50 ? "text-destructive" : "text-muted-foreground")}>{form.excerpt.length}/300 · минимум 50</span></label>
            <label><span className="mb-2 block text-sm font-semibold">Текст Markdown</span><Textarea value={form.body_markdown} onChange={(event) => update("body_markdown", event.target.value)} className="min-h-80 rounded-none font-mono text-sm" /></label>
            <label><span className="mb-2 block text-sm font-semibold">Автор</span><Input value={form.author_name} onChange={(event) => update("author_name", event.target.value)} className="rounded-none" /></label>
          </div>
          <div className="mt-7 flex justify-end gap-2"><Button variant="outline" onClick={onClose} disabled={pending}>Отмена</Button><Button onClick={submit} disabled={pending}>{pending && <Loader2 size={16} className="animate-spin" />} Создать черновик</Button></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function BlogEditDialog({ postId, onClose, categories, tags, onSaved }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const postQuery = useQuery({ queryKey: ["admin", "blog-post", postId], queryFn: () => api.admin.blogPost(postId), enabled: Boolean(postId) });
  const mediaQuery = useQuery({ queryKey: ["admin", "blog-media"], queryFn: () => api.admin.blogMedia({ limit: 50, offset: 0 }), enabled: Boolean(postId) });
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", body_markdown: "", author_name: "", primary_category_id: "", internal_goal: "other", cta_type: "none", cta_label: "", cta_url: "", tag_ids: [], cover_media_id: "" });
  const [attempted, setAttempted] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverAlt, setCoverAlt] = useState("");
  const categoryRows = listRows(categories);
  const tagRows = listRows(tags);
  const mediaRows = listRows(mediaQuery.data);
  const selectedMedia = mediaRows.find((media) => String(media.id) === String(form.cover_media_id)) || postQuery.data?.cover;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const issues = blogValidationIssues(form, true, Boolean(selectedMedia?.alt?.trim()));

  useEffect(() => {
    const post = postQuery.data;
    if (!post) return;
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      body_markdown: post.body_markdown || "",
      author_name: post.author_name || "Редакция ML-Арены",
      primary_category_id: post.primary_category_id || post.primary_category?.id || "",
      internal_goal: post.internal_goal || "other",
      cta_type: post.cta_type || "none",
      cta_label: post.cta_label || "",
      cta_url: post.cta_url || "",
      tag_ids: post.tag_ids || post.tags?.map((tag) => tag.id) || [],
      cover_media_id: post.cover_media_id || post.cover?.id || "",
    });
    setAttempted(false);
  }, [postQuery.data]);

  const save = useMutation({
    mutationFn: (body) => api.admin.updateBlogPost(postId, body),
    onSuccess: (post) => {
      queryClient.setQueryData(["admin", "blog-post", postId], post);
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast({ title: "Черновик сохранён" });
      onSaved?.();
    },
    onError: (error) => toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" }),
  });

  const mediaUpload = useMutation({
    mutationFn: async () => {
      const upload = await uploadFile(coverFile, "blog_media");
      return api.admin.attachBlogMedia({ upload_id: upload.id, alt: coverAlt.trim() });
    },
    onSuccess: (media) => {
      update("cover_media_id", media.id);
      setCoverFile(null);
      setCoverAlt("");
      queryClient.invalidateQueries({ queryKey: ["admin", "blog-media"] });
      toast({ title: "Обложка загружена" });
    },
    onError: (error) => toast({ title: "Не удалось загрузить обложку", description: error.message, variant: "destructive" }),
  });

  const submit = () => {
    if (issues.length) {
      setAttempted(true);
      return;
    }
    const body = {
      expected_version: postQuery.data.version,
      ...form,
      cta_label: form.cta_type === "none" ? null : form.cta_label.trim(),
      cta_url: form.cta_type === "none" ? null : form.cta_url.trim(),
    };
    save.mutate(body);
  };

  return (
    <Dialog.Root open={Boolean(postId)} onOpenChange={(open) => !open && !save.isPending && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-3 right-3 z-[101] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto border border-border bg-card shadow-2xl focus:outline-none">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card/95 p-5 backdrop-blur md:p-6">
            <div><Dialog.Title className="font-heading text-2xl font-extrabold">Редактирование материала</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Версия {postQuery.data?.version ?? "—"}. Сохранение создаёт новую версию черновика.</Dialog.Description></div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center border border-border" aria-label="Закрыть"><X size={17} /></button>
          </div>

          {postQuery.isLoading ? <LoadingRows /> : postQuery.error ? <div className="p-6"><ErrorState error={postQuery.error} /></div> : (
            <div className="space-y-7 p-5 md:p-6">
              {attempted && <ValidationNotice issues={issues} />}
              <section className="grid gap-5">
                <h3 className="font-heading text-lg font-bold">Содержание</h3>
                <label><span className="mb-2 block text-sm font-semibold">Заголовок</span><Input value={form.title} onChange={(event) => update("title", event.target.value)} className="rounded-none" /></label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label><span className="mb-2 block text-sm font-semibold">Slug</span><Input value={form.slug} onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className="rounded-none font-mono" /></label>
                  <label><span className="mb-2 block text-sm font-semibold">Основная категория</span><select value={form.primary_category_id} onChange={(event) => update("primary_category_id", event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm"><option value="">Выберите категорию</option>{categoryRows.filter((item) => item.is_active !== false).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                </div>
                <label><span className="mb-2 block text-sm font-semibold">Краткое описание</span><Textarea value={form.excerpt} maxLength={300} onChange={(event) => update("excerpt", event.target.value)} className="min-h-24 rounded-none" /><span className="mt-1 block text-right text-xs text-muted-foreground">{form.excerpt.length}/300 · минимум 50</span></label>
                <label><span className="mb-2 block text-sm font-semibold">Текст Markdown</span><Textarea value={form.body_markdown} onChange={(event) => update("body_markdown", event.target.value)} className="min-h-[360px] rounded-none font-mono text-sm" /></label>
              </section>

              <section className="border-t border-border pt-7">
                <div className="flex items-center gap-3"><ImageIcon className="text-primary" size={20} /><h3 className="font-heading text-lg font-bold">Обложка</h3></div>
                {selectedMedia?.url && <img src={selectedMedia.url} alt={selectedMedia.alt || ""} className="mt-4 aspect-[16/7] w-full border border-border object-cover" />}
                <label className="mt-4 block"><span className="mb-2 block text-sm font-semibold">Выбрать из медиатеки</span><select value={form.cover_media_id} onChange={(event) => update("cover_media_id", event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm"><option value="">Обложка не выбрана</option>{mediaRows.map((media) => <option key={media.id} value={media.id}>{media.alt || `Медиа ${media.id}`}</option>)}</select></label>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <label><span className="mb-2 block text-sm font-semibold">Новый файл</span><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} className="rounded-none" /></label>
                  <label><span className="mb-2 block text-sm font-semibold">Alt-текст</span><Input value={coverAlt} onChange={(event) => setCoverAlt(event.target.value)} placeholder="Что изображено на обложке" className="rounded-none" /></label>
                  <Button type="button" variant="outline" onClick={() => mediaUpload.mutate()} disabled={!coverFile || !coverAlt.trim() || mediaUpload.isPending}>{mediaUpload.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Загрузить</Button>
                </div>
              </section>

              <section className="grid gap-5 border-t border-border pt-7">
                <h3 className="font-heading text-lg font-bold">Публикация и действие</h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label><span className="mb-2 block text-sm font-semibold">Цель материала</span><select value={form.internal_goal} onChange={(event) => update("internal_goal", event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm"><option value="seo">Поиск</option><option value="registration">Регистрация</option><option value="activation">Активация</option><option value="retention">Удержание</option><option value="b2b_brand">Компании</option><option value="other">Другое</option></select></label>
                  <label><span className="mb-2 block text-sm font-semibold">Кнопка в статье</span><select value={form.cta_type} onChange={(event) => update("cta_type", event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm"><option value="none">Без кнопки</option><option value="register">Регистрация</option><option value="telegram">Telegram</option><option value="competition">Соревнование</option><option value="profile">Профиль</option><option value="ml_passport">ML-паспорт</option><option value="custom_internal">Своя страница</option></select></label>
                </div>
                {form.cta_type !== "none" && <div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">Текст кнопки</span><Input value={form.cta_label} onChange={(event) => update("cta_label", event.target.value)} className="rounded-none" /></label><label><span className="mb-2 block text-sm font-semibold">Ссылка</span><Input value={form.cta_url} onChange={(event) => update("cta_url", event.target.value)} placeholder="/login" className="rounded-none" /></label></div>}
                <label><span className="mb-2 block text-sm font-semibold">Автор</span><Input value={form.author_name} onChange={(event) => update("author_name", event.target.value)} className="rounded-none" /></label>
                {tagRows.length > 0 && <div><p className="mb-3 text-sm font-semibold">Теги</p><div className="flex flex-wrap gap-2">{tagRows.map((tag) => { const checked = form.tag_ids.includes(tag.id); return <label key={tag.id} className={cn("flex cursor-pointer items-center gap-2 border px-3 py-2 text-xs font-semibold", checked ? "border-primary bg-primary/5 text-primary" : "border-border")}><input type="checkbox" checked={checked} onChange={() => update("tag_ids", checked ? form.tag_ids.filter((id) => id !== tag.id) : [...form.tag_ids, tag.id].slice(0, 8))} className="accent-primary" />{tag.name}</label>; })}</div></div>}
              </section>
            </div>
          )}

          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-card/95 p-5 backdrop-blur sm:flex-row sm:justify-end md:px-6"><Button variant="outline" onClick={onClose} disabled={save.isPending}>Закрыть</Button><Button onClick={submit} disabled={postQuery.isLoading || save.isPending}>{save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Сохранить изменения</Button></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function BlogInsightsDialog({ post, onClose }) {
  const [preview, setPreview] = useState(null);
  const revisions = useQuery({ queryKey: ["admin", "blog", post.id, "revisions"], queryFn: () => api.admin.blogPostRevisions(post.id) });
  const metrics = useQuery({ queryKey: ["admin", "blog", post.id, "metrics"], queryFn: () => api.admin.blogPostMetrics(post.id) });
  const previewMutation = useMutation({
    mutationFn: async () => {
      const tokenData = await api.admin.blogPostPreviewToken(post.id);
      return api.admin.blogPreview(tokenData.token || tokenData.preview_token);
    },
    onSuccess: setPreview,
  });
  const metric = metrics.data || {};
  return <Dialog.Root open onOpenChange={(open) => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[94vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-card p-6 shadow-2xl focus:outline-none"><div className="flex items-start justify-between gap-4"><div><Dialog.Title className="font-heading text-2xl font-extrabold">Материал и аналитика</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">{post.title}</Dialog.Description></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border"><X size={17} /></button></div><div className="mt-7 space-y-8"><section><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-heading text-lg font-bold">Безопасный предпросмотр</h3><Button onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>{previewMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Сформировать</Button></div>{previewMutation.error && <div className="mt-4"><ErrorState error={previewMutation.error} compact /></div>}{preview && <article className="prose prose-slate mt-4 max-w-none border border-border bg-background p-5 dark:prose-invert"><h2>{preview.title}</h2><p className="lead">{preview.excerpt}</p><div dangerouslySetInnerHTML={{ __html: preview.body_html || "" }} /></article>}</section><section><h3 className="font-heading text-lg font-bold">Метрики</h3>{metrics.isLoading ? <LoadingRows /> : metrics.error ? <ErrorState error={metrics.error} compact /> : <div className="mt-4 grid gap-px bg-border sm:grid-cols-3">{[["Просмотры", metric.views ?? 0], ["Уникальные", metric.unique_views ?? 0], ["Переходы по кнопке", metric.cta_clicks ?? 0]].map(([label, value]) => <div key={label} className="bg-background p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p></div>)}</div>}</section><section><h3 className="font-heading text-lg font-bold">Ревизии</h3>{revisions.isLoading ? <LoadingRows /> : revisions.error ? <ErrorState error={revisions.error} compact /> : <div className="mt-4 divide-y divide-border border border-border">{listRows(revisions.data).map((revision) => <div key={revision.id || revision.version} className="grid gap-2 p-4 sm:grid-cols-[100px_1fr_auto]"><p className="font-semibold">Версия {revision.version}</p><p className="font-mono text-xs text-muted-foreground">{revision.content_hash || revision.hash || "—"}</p><p className="text-xs text-muted-foreground">{formatDate(revision.created_at)}</p></div>)}{!listRows(revisions.data).length && <p className="p-4 text-sm text-muted-foreground">Ревизий пока нет.</p>}</div>}</section></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function BlogTaxonomyDialog({ categories, tags, onClose }) {
  const [kind, setKind] = useState("category");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [edits, setEdits] = useState({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const rows = listRows(kind === "category" ? categories : tags);
  const mutation = useMutation({
    mutationFn: ({ action, item }) => {
      if (action === "create") return kind === "category" ? api.admin.createBlogCategory({ name, slug, description: null }) : api.admin.createBlogTag({ name, slug });
      if (action === "update") {
        const edited = edits[item.id] || {};
        return kind === "category" ? api.admin.updateBlogCategory(item.id, { name: edited.name ?? item.name, slug: edited.slug ?? item.slug, description: item.description || null, is_active: item.is_active !== false }) : api.admin.updateBlogTag(item.id, { name: edited.name ?? item.name, slug: edited.slug ?? item.slug });
      }
      return kind === "category" ? api.admin.deleteBlogCategory(item.id) : api.admin.deleteBlogTag(item.id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", kind === "category" ? "blog-categories" : "blog-tags"] }); setName(""); setSlug(""); toast({ title: "Справочник обновлён" }); },
    onError: (error) => toast({ title: "Не удалось изменить справочник", description: error.message, variant: "destructive" }),
  });
  return <Dialog.Root open onOpenChange={(open) => !open && !mutation.isPending && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-card p-6 shadow-2xl focus:outline-none"><div className="flex items-start justify-between"><div><Dialog.Title className="font-heading text-2xl font-extrabold">Рубрики блога</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Категории и теги для редакторов.</Dialog.Description></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border"><X size={17} /></button></div><div className="mt-6 flex gap-2"><Button variant={kind === "category" ? "default" : "outline"} onClick={() => setKind("category")}>Категории</Button><Button variant={kind === "tag" ? "default" : "outline"} onClick={() => setKind("tag")}>Теги</Button></div><div className="mt-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Название" className="rounded-none" /><Input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="slug" className="rounded-none font-mono" /><Button onClick={() => mutation.mutate({ action: "create" })} disabled={name.trim().length < 2 || slug.length < 2 || mutation.isPending}><Plus size={15} /> Добавить</Button></div><div className="mt-5 divide-y divide-border border border-border">{rows.map((item) => <div key={item.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center"><Input value={edits[item.id]?.name ?? item.name} onChange={(event) => setEdits((current) => ({ ...current, [item.id]: { ...current[item.id], name: event.target.value } }))} className="rounded-none" /><Input value={edits[item.id]?.slug ?? item.slug} onChange={(event) => setEdits((current) => ({ ...current, [item.id]: { ...current[item.id], slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") } }))} className="rounded-none font-mono" /><div className="flex items-center gap-2">{kind === "category" && <Status value={item.is_active === false ? "archived" : "active"} />}<Button variant="outline" size="sm" onClick={() => mutation.mutate({ action: "update", item })}><Save size={14} /></Button><Button variant="outline" size="sm" onClick={() => mutation.mutate({ action: "delete", item })}><Trash2 size={14} /></Button></div></div>)}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function BlogMediaDialog({ onClose }) {
  const [file, setFile] = useState(null);
  const [alt, setAlt] = useState("");
  const [edits, setEdits] = useState({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ["admin", "blog-media"], queryFn: () => api.admin.blogMedia({ limit: 50, offset: 0 }) });
  const mutation = useMutation({
    mutationFn: async ({ action, media }) => {
      if (action === "upload") { const upload = await uploadFile(file, "blog_media"); return api.admin.attachBlogMedia({ upload_id: upload.id, alt: alt.trim() }); }
      if (action === "update") return api.admin.updateBlogMedia(media.id, { alt: (edits[media.id] ?? media.alt).trim() });
      if (action === "download") return api.admin.blogMediaDownload(media.id);
      return api.admin.deleteBlogMedia(media.id);
    },
    onSuccess: (_, variables) => { if (variables.action !== "download") queryClient.invalidateQueries({ queryKey: ["admin", "blog-media"] }); if (variables.action === "upload") { setFile(null); setAlt(""); } toast({ title: variables.action === "download" ? "Скачивание началось" : "Медиатека обновлена" }); },
    onError: (error) => toast({ title: "Операция с файлом не выполнена", description: error.message, variant: "destructive" }),
  });
  const rows = listRows(query.data);
  return <Dialog.Root open onOpenChange={(open) => !open && !mutation.isPending && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[92vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-border bg-card shadow-2xl focus:outline-none"><div className="flex items-start justify-between border-b border-border p-5 md:px-6"><div><Dialog.Title className="font-heading text-2xl font-extrabold">Медиатека</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Обложки блога, alt-тексты и неиспользуемые файлы.</Dialog.Description></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border"><X size={17} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6"><div className="grid gap-3 border border-border bg-background p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><AdminField label="Изображение"><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="rounded-none" /></AdminField><AdminField label="Alt-текст"><Input value={alt} onChange={(event) => setAlt(event.target.value)} className="rounded-none" /></AdminField><Button onClick={() => mutation.mutate({ action: "upload" })} disabled={!file || !alt.trim() || mutation.isPending}><Upload size={15} /> Загрузить</Button></div>{query.isLoading ? <LoadingRows /> : query.error ? <div className="mt-5"><ErrorState error={query.error} /></div> : <div className="mt-5 grid gap-4 sm:grid-cols-2">{rows.map((media) => <article key={media.id} className="border border-border bg-background p-3"><img src={media.url} alt={media.alt || ""} className="aspect-[16/8] w-full border border-border object-cover" /><Input value={edits[media.id] ?? media.alt ?? ""} onChange={(event) => setEdits((current) => ({ ...current, [media.id]: event.target.value }))} className="mt-3 rounded-none" aria-label="Alt-текст" /><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => mutation.mutate({ action: "update", media })}><Save size={14} /> Alt</Button><Button size="sm" variant="outline" onClick={() => mutation.mutate({ action: "download", media })}><Upload size={14} className="rotate-180" /> Скачать</Button><Button size="sm" variant="outline" onClick={() => mutation.mutate({ action: "delete", media })} className="text-destructive"><Trash2 size={14} /> Удалить</Button></div></article>)}</div>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function ContentSectionLegacy({ permissions, requestAction }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const posts = useQuery({ queryKey: ["admin", "blog", deferredSearch, status], queryFn: () => api.admin.blogPosts({ q: deferredSearch, status, limit: 50, offset: 0, sort: "-updated_at" }), placeholderData: keepPreviousData });
  const categories = useQuery({ queryKey: ["admin", "blog-categories"], queryFn: api.admin.blogCategories, enabled: can(permissions, "content.write"), staleTime: 60000 });
  const tags = useQuery({ queryKey: ["admin", "blog-tags"], queryFn: api.admin.blogTags, enabled: can(permissions, "content.write"), staleTime: 60000 });
  const create = useMutation({ mutationFn: api.admin.createBlogPost, onSuccess: (post) => { queryClient.invalidateQueries({ queryKey: ["admin", "blog"] }); setCreating(false); setEditingId(post.id); toast({ title: "Черновик создан", description: "Добавьте обложку и подготовьте материал к проверке." }); }, onError: (error) => toast({ title: "Не удалось создать материал", description: error.message, variant: "destructive" }) });
  const rows = listRows(posts.data);
  const transition = (post, action, title, permission, options = {}) => requestAction({ title, description: `${post.title}. Сервер проверит допустимость перехода статуса и обязательные поля.`, confirm: title, danger: options.danger, reason: false, run: () => api.admin.blogPostAction(post.id, action, options.body), invalidate: ["admin", "blog"], disabled: !can(permissions, permission) });
  return (
    <>
      <SectionHeading title="Редакция блога" description="Черновики, проверка и публикация материалов с разделением редакторских прав." count={listTotal(posts.data)} action={can(permissions, "content.write") ? <Button onClick={() => setCreating(true)}><FileText size={16} /> Новый материал</Button> : null} />
      <div className="mb-4 flex flex-col gap-2 lg:flex-row"><SearchField value={search} onChange={setSearch} placeholder="Найти материал" /><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["draft", "Черновики"], ["review", "На проверке"], ["scheduled", "Запланированные"], ["published", "Опубликованные"], ["archived", "Архивные"]]} /></div>
      <TableShell loading={posts.isLoading} error={posts.error} empty={!rows.length}>
        <div className="divide-y divide-border">
          {rows.map((post) => (
            <article key={post.id} className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap gap-2"><Status value={post.status} />{post.featured && <span className="border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] font-semibold text-primary">Главная</span>}</div>
                <h3 className="mt-3 font-heading text-lg font-bold">{post.title}</h3>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{post.excerpt}</p>
                <p className="mt-3 text-xs text-muted-foreground">Версия {post.version ?? "—"} · обновлено {formatDate(post.updated_at)}</p>
              </div>
              <ActionMenu>
                {["draft", "review"].includes(post.status) && can(permissions, "content.write") && <ActionButton onClick={() => setEditingId(post.id)}><Pencil size={13} /> Редактировать</ActionButton>}
                {post.status === "draft" && can(permissions, "content.review") && <ActionButton tone="primary" onClick={() => transition(post, "review", "Отправить на проверку", "content.review")}><ClipboardCheck size={13} /> На проверку</ActionButton>}
                {post.status === "review" && can(permissions, "content.publish") && <ActionButton tone="primary" onClick={() => transition(post, "publish", "Опубликовать", "content.publish")}><Play size={13} /> Опубликовать</ActionButton>}
                {post.status === "review" && can(permissions, "content.review") && <ActionButton onClick={() => transition(post, "return-to-draft", "Вернуть в черновики", "content.review")}><RefreshCw size={13} /> Вернуть</ActionButton>}
                {["published", "scheduled"].includes(post.status) && can(permissions, "content.publish") && <ActionButton tone="danger" onClick={() => transition(post, "archive", "Архивировать материал", "content.publish", { danger: true })}><Archive size={13} /></ActionButton>}
              </ActionMenu>
            </article>
          ))}
        </div>
      </TableShell>
      <BlogCreateDialog open={creating} onClose={() => setCreating(false)} categories={categories.data || []} pending={create.isPending} onSubmit={(form) => create.mutate(form)} />
      <BlogEditDialog postId={editingId} onClose={() => setEditingId(null)} categories={categories.data || []} tags={tags.data || []} />
    </>
  );
}

function BlogScheduleDialog({ post, onClose, onScheduled }) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({ mutationFn: () => api.admin.blogPostAction(post.id, "schedule", { scheduled_at: new Date(scheduledAt).toISOString() }), onSuccess: onScheduled, onError: (mutationError) => setError(mutationError.message) });
  return <Dialog.Root open onOpenChange={(open) => !open && !mutation.isPending && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 border border-border bg-card p-6 shadow-2xl focus:outline-none"><div className="flex items-start justify-between"><div><Dialog.Title className="font-heading text-2xl font-extrabold">Запланировать публикацию</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">{post.title}</Dialog.Description></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border"><X size={17} /></button></div><label className="mt-6 block"><span className="mb-2 block text-sm font-semibold">Дата и время</span><Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} min={dateTimeInput(new Date(Date.now() + 60000))} className="rounded-none" /></label>{error && <p className="mt-3 text-sm text-destructive">{error}</p>}<div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Отмена</Button><Button onClick={() => mutation.mutate()} disabled={!scheduledAt || new Date(scheduledAt).getTime() <= Date.now() || mutation.isPending}>{mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <FileClock size={15} />} Запланировать</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function ContentSection({ permissions, requestAction }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [insightsPost, setInsightsPost] = useState(null);
  const [schedulePost, setSchedulePost] = useState(null);
  const [taxonomyOpen, setTaxonomyOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const posts = useQuery({ queryKey: ["admin", "blog", deferredSearch, status], queryFn: () => api.admin.blogPosts({ q: deferredSearch, status, limit: 50, offset: 0, sort: "-updated_at" }), placeholderData: keepPreviousData });
  const categories = useQuery({ queryKey: ["admin", "blog-categories"], queryFn: api.admin.blogCategories, enabled: can(permissions, "content.write"), staleTime: 60000 });
  const tags = useQuery({ queryKey: ["admin", "blog-tags"], queryFn: api.admin.blogTags, enabled: can(permissions, "content.write"), staleTime: 60000 });
  const create = useMutation({ mutationFn: api.admin.createBlogPost, onSuccess: (post) => { queryClient.invalidateQueries({ queryKey: ["admin", "blog"] }); setCreating(false); setEditingId(post.id); toast({ title: "Черновик создан", description: "Добавьте обложку и подготовьте материал к проверке." }); }, onError: (error) => toast({ title: "Не удалось создать материал", description: error.message, variant: "destructive" }) });
  const directAction = useMutation({ mutationFn: ({ post, action }) => action === "delete" ? api.admin.deleteBlogPost(post.id) : api.admin.blogPostAction(post.id, action), onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: ["admin", "blog"] }); toast({ title: variables.action === "duplicate" ? "Создана копия-черновик" : "Черновик удалён" }); }, onError: (error) => toast({ title: "Операция отклонена", description: error.message, variant: "destructive" }) });
  const rows = listRows(posts.data);
  const transition = (post, action, title, permission, options = {}) => requestAction({ title, description: `${post.title}. Сервер проверит допустимость перехода статуса и обязательные поля.`, confirm: title, danger: options.danger, reason: false, run: () => api.admin.blogPostAction(post.id, action, options.body), invalidate: ["admin", "blog"], disabled: !can(permissions, permission) });
  const scheduled = () => { queryClient.invalidateQueries({ queryKey: ["admin", "blog"] }); setSchedulePost(null); toast({ title: "Публикация запланирована" }); };
  return <>
    <SectionHeading title="Редакция блога" description="Полный цикл материалов: справочники, черновики, версии, предпросмотр, аналитика и публикация." count={listTotal(posts.data)} action={can(permissions, "content.write") ? <div className="flex flex-wrap gap-2">{can(permissions, "content.media") && <Button variant="outline" onClick={() => setMediaOpen(true)}><ImageIcon size={16} /> Медиатека</Button>}<Button variant="outline" onClick={() => setTaxonomyOpen(true)}><Settings2 size={16} /> Категории и теги</Button><Button onClick={() => setCreating(true)}><FileText size={16} /> Новый материал</Button></div> : null} />
    <div className="mb-4 flex flex-col gap-2 lg:flex-row"><SearchField value={search} onChange={setSearch} placeholder="Найти материал" /><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["draft", "Черновики"], ["review", "На проверке"], ["scheduled", "Запланированные"], ["published", "Опубликованные"], ["archived", "Архивные"]]} /></div>
    <TableShell loading={posts.isLoading} error={posts.error} empty={!rows.length}><div className="divide-y divide-border">{rows.map((post) => <article key={post.id} className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex flex-wrap gap-2"><Status value={post.status} />{post.featured && <span className="border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] font-semibold text-primary">Главная</span>}</div><h3 className="mt-3 font-heading text-lg font-bold">{post.title}</h3><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{post.excerpt}</p><p className="mt-3 text-xs text-muted-foreground">Версия {post.version ?? "—"} · обновлено {formatDate(post.updated_at)}</p></div><ActionMenu>
      <ActionButton onClick={() => setInsightsPost(post)}><Gauge size={13} /> Предпросмотр и метрики</ActionButton>
      {["draft", "review"].includes(post.status) && can(permissions, "content.write") && <ActionButton onClick={() => setEditingId(post.id)}><Pencil size={13} /> Редактировать</ActionButton>}
      {can(permissions, "content.write") && <ActionButton onClick={() => directAction.mutate({ post, action: "duplicate" })}><Copy size={13} /> Дублировать</ActionButton>}
      {post.status === "draft" && can(permissions, "content.review") && <ActionButton tone="primary" onClick={() => transition(post, "review", "Отправить на проверку", "content.review")}><ClipboardCheck size={13} /> На проверку</ActionButton>}
      {post.status === "review" && can(permissions, "content.publish") && <><ActionButton tone="primary" onClick={() => transition(post, "publish", "Опубликовать", "content.publish")}><Play size={13} /> Опубликовать</ActionButton><ActionButton onClick={() => setSchedulePost(post)}><FileClock size={13} /> Запланировать</ActionButton></>}
      {post.status === "review" && can(permissions, "content.review") && <ActionButton onClick={() => transition(post, "return-to-draft", "Вернуть в черновики", "content.review")}><RefreshCw size={13} /> Вернуть</ActionButton>}
      {post.status === "archived" && can(permissions, "content.publish") && <ActionButton onClick={() => transition(post, "return-to-draft", "Вернуть в черновики", "content.publish")}><RefreshCw size={13} /> Вернуть в работу</ActionButton>}
      {["published", "scheduled"].includes(post.status) && can(permissions, "content.publish") && <ActionButton tone="danger" onClick={() => transition(post, "archive", "Архивировать материал", "content.publish", { danger: true })}><Archive size={13} /> В архив</ActionButton>}
      {post.status === "draft" && can(permissions, "content.write") && <ActionButton tone="danger" onClick={() => directAction.mutate({ post, action: "delete" })}><Trash2 size={13} /> Удалить черновик</ActionButton>}
    </ActionMenu></article>)}</div></TableShell>
    <BlogCreateDialog open={creating} onClose={() => setCreating(false)} categories={categories.data || []} pending={create.isPending} onSubmit={(form) => create.mutate(form)} />
    <BlogEditDialog postId={editingId} onClose={() => setEditingId(null)} categories={categories.data || []} tags={tags.data || []} />
    {insightsPost && <BlogInsightsDialog post={insightsPost} onClose={() => setInsightsPost(null)} />}
    {schedulePost && <BlogScheduleDialog post={schedulePost} onClose={() => setSchedulePost(null)} onScheduled={scheduled} />}
    {taxonomyOpen && <BlogTaxonomyDialog categories={categories.data || []} tags={tags.data || []} onClose={() => setTaxonomyOpen(false)} />}
    {mediaOpen && <BlogMediaDialog onClose={() => setMediaOpen(false)} />}
  </>;
}

const TASK_TYPE_OPTIONS = [
  ["classification", "Классификация"], ["regression", "Регрессия"], ["nlp", "NLP"],
  ["cv", "Компьютерное зрение"], ["time_series", "Временные ряды"], ["ranking", "Ранжирование"],
  ["clustering", "Кластеризация"], ["recsys", "RecSys"],
];

function jsonValue(value, fallback) {
  if (!String(value || "").trim()) return fallback;
  return JSON.parse(value);
}

function resourceDefaults(type, item, mode) {
  const version = item?.current_version || {};
  if (type === "metrics") return {
    code: item?.code || "", name: item?.name || "", description: item?.description || "",
    direction: version.direction || "maximize", display_format: version.display_format || "0.0000",
    implementation_type: version.implementation_type || "builtin", implementation_key: version.implementation_key || "",
    formula_config: JSON.stringify(version.formula_config || {}, null, 2), allowed_task_types: (version.allowed_task_types || []).join(", "), publish: false,
  };
  if (type === "datasets") return {
    name: item?.name || "", source_type: item?.source_type || "uploaded", owner_organization_id: item?.owner_organization_id || "",
    schema_json: JSON.stringify(version.schema_json || version.schema_data || {}, null, 2), row_count: version.row_count ?? "",
    checksum_sha256: version.checksum_sha256 || "", release_notes: "",
  };
  if (type === "tasks") return {
    slug: item?.slug || "", owner_organization_id: item?.owner_organization_id || "", source_type: item?.source_type || "manual",
    title: version.title || "", short_description: version.short_description || "", description: version.description || "",
    task_type: version.task_type || "classification", difficulty: version.difficulty || "medium",
    metric_version_id: version.metric_version_id || "", submission_type: version.submission_type || "predictions_csv",
    evaluation_type: version.evaluation_type || "metric", rules: version.rules || "", dataset_version_id: version.dataset_version_id || "",
  };
  if (type === "badges") return {
    code: item?.code || "", name: item?.name || "", description: item?.description || "",
    icon_key: item?.icon_key || "award", color_token: item?.color_token || "blue-500",
  };
  if (type === "plans") return {
    code: item?.code || "", name: item?.name || "", description: item?.description || "",
    billing_period: item?.billing_period || "month", amount: item?.amount ?? 0, compare_at_amount: item?.compare_at_amount ?? "",
    currency: item?.currency || "RUB", features: (item?.features || []).join("\n"),
    entitlements: JSON.stringify(item?.entitlements || {}, null, 2), publish: false,
  };
  return { mode };
}

function resourcePayload(type, form, mode) {
  if (type === "metrics") {
    const version = {
      direction: form.direction,
      display_format: form.display_format,
      implementation_type: form.implementation_type,
      implementation_key: form.implementation_key,
      formula_config: jsonValue(form.formula_config, {}),
      allowed_task_types: form.allowed_task_types.split(",").map((value) => value.trim()).filter(Boolean),
    };
    if (mode === "edit") return { name: form.name, description: form.description || null };
    if (mode === "version") return version;
    return { code: form.code, name: form.name, description: form.description || null, version, publish: form.publish };
  }
  if (type === "datasets") {
    if (mode === "version") return {
      schema_json: jsonValue(form.schema_json, {}), row_count: form.row_count === "" ? null : Number(form.row_count),
      checksum_sha256: form.checksum_sha256 || null, release_notes: form.release_notes || null,
    };
    if (mode === "edit") return { name: form.name };
    return { name: form.name, source_type: form.source_type, owner_organization_id: form.owner_organization_id || null };
  }
  if (type === "tasks") {
    if (mode === "edit") return { slug: form.slug };
    const version = {
      title: form.title, short_description: form.short_description || null, description: form.description,
      task_type: form.task_type, difficulty: form.difficulty || null, metric_version_id: form.metric_version_id,
      submission_type: form.submission_type, evaluation_type: form.evaluation_type, rules: form.rules || null,
      dataset_version_id: form.dataset_version_id || null,
    };
    return mode === "version" ? version : {
      slug: form.slug, owner_organization_id: form.owner_organization_id || null, source_type: form.source_type, ...version,
    };
  }
  if (type === "badges") {
    const body = { name: form.name, description: form.description, icon_key: form.icon_key, color_token: form.color_token };
    return mode === "edit" ? body : { code: form.code, ...body };
  }
  if (type === "plans") {
    const body = {
      name: form.name, description: form.description || null, billing_period: form.billing_period || null,
      amount: Number(form.amount), compare_at_amount: form.compare_at_amount === "" ? null : Number(form.compare_at_amount),
      currency: form.currency.toUpperCase(), features: form.features.split("\n").map((value) => value.trim()).filter(Boolean),
      entitlements: jsonValue(form.entitlements, {}),
    };
    return mode === "edit" ? body : { code: form.code, ...body, publish: form.publish };
  }
  return form;
}

function AdminField({ label, children, wide = false }) {
  return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>;
}

function AdminSelect({ value, onChange, options }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm">{options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>;
}

function ResourceFields({ type, mode, form, update, metricOptions = [], datasetOptions = [] }) {
  const input = "h-10 rounded-none bg-background";
  if (type === "metrics") return <div className="grid gap-5 sm:grid-cols-2">
    {mode === "create" && <AdminField label="Код"><Input value={form.code} onChange={(event) => update("code", event.target.value.toLowerCase())} placeholder="custom_f1" className={input} /></AdminField>}
    {mode !== "version" && <AdminField label="Название"><Input value={form.name} onChange={(event) => update("name", event.target.value)} className={input} /></AdminField>}
    {mode !== "version" && <AdminField label="Описание" wide><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-24 rounded-none" /></AdminField>}
    {mode !== "edit" && <><AdminField label="Направление"><AdminSelect value={form.direction} onChange={(value) => update("direction", value)} options={[["maximize", "Максимизировать"], ["minimize", "Минимизировать"]]} /></AdminField><AdminField label="Формат"><Input value={form.display_format} onChange={(event) => update("display_format", event.target.value)} className={input} /></AdminField><AdminField label="Тип реализации"><AdminSelect value={form.implementation_type} onChange={(value) => update("implementation_type", value)} options={[["builtin", "Встроенная"], ["expression", "Формула"], ["plugin", "Плагин"]]} /></AdminField><AdminField label="Ключ реализации"><Input value={form.implementation_key} onChange={(event) => update("implementation_key", event.target.value)} className={input} /></AdminField><AdminField label="Типы задач через запятую" wide><Input value={form.allowed_task_types} onChange={(event) => update("allowed_task_types", event.target.value)} placeholder="classification, nlp" className={input} /></AdminField><AdminField label="Конфигурация формулы (JSON)" wide><Textarea value={form.formula_config} onChange={(event) => update("formula_config", event.target.value)} className="min-h-28 rounded-none font-mono text-xs" /></AdminField></>}
    {mode === "create" && <AdminCheckbox checked={form.publish} onChange={(value) => update("publish", value)} label="Сразу опубликовать метрику" />}
  </div>;
  if (type === "datasets") return <div className="grid gap-5 sm:grid-cols-2">
    {mode !== "version" && <AdminField label="Название" wide><Input value={form.name} onChange={(event) => update("name", event.target.value)} className={input} /></AdminField>}
    {mode === "create" && <><AdminField label="Источник"><AdminSelect value={form.source_type} onChange={(value) => update("source_type", value)} options={[["uploaded", "Загруженный"], ["synthetic", "Синтетический"]]} /></AdminField><AdminField label="ID организации"><Input value={form.owner_organization_id} onChange={(event) => update("owner_organization_id", event.target.value)} placeholder="Необязательно" className={input} /></AdminField></>}
    {mode === "version" && <><AdminField label="Количество строк"><Input type="number" min="0" value={form.row_count} onChange={(event) => update("row_count", event.target.value)} className={input} /></AdminField><AdminField label="Контрольная сумма"><Input value={form.checksum_sha256} onChange={(event) => update("checksum_sha256", event.target.value)} className={input} /></AdminField><AdminField label="Схема (JSON)" wide><Textarea value={form.schema_json} onChange={(event) => update("schema_json", event.target.value)} className="min-h-44 rounded-none font-mono text-xs" /></AdminField><AdminField label="Описание версии" wide><Textarea value={form.release_notes} onChange={(event) => update("release_notes", event.target.value)} className="min-h-20 rounded-none" /></AdminField></>}
  </div>;
  if (type === "tasks") return <div className="grid gap-5 sm:grid-cols-2">
    {mode !== "version" && <AdminField label="Slug" wide><Input value={form.slug} onChange={(event) => update("slug", event.target.value.toLowerCase())} placeholder="customer-churn" className={input} /></AdminField>}
    {mode === "create" && <><AdminField label="Источник"><AdminSelect value={form.source_type} onChange={(value) => update("source_type", value)} options={[["manual", "Ручная"], ["synthetic", "Синтетическая"], ["competition_archive", "Архив соревнования"]]} /></AdminField><AdminField label="ID организации"><Input value={form.owner_organization_id} onChange={(event) => update("owner_organization_id", event.target.value)} placeholder="Необязательно" className={input} /></AdminField></>}
    {mode !== "edit" && <><AdminField label="Название" wide><Input value={form.title} onChange={(event) => update("title", event.target.value)} className={input} /></AdminField><AdminField label="Краткое описание" wide><Input value={form.short_description} onChange={(event) => update("short_description", event.target.value)} className={input} /></AdminField><AdminField label="Постановка" wide><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-36 rounded-none" /></AdminField><AdminField label="Тип задачи"><AdminSelect value={form.task_type} onChange={(value) => update("task_type", value)} options={TASK_TYPE_OPTIONS} /></AdminField><AdminField label="Сложность"><Input value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)} className={input} /></AdminField><AdminField label="Версия метрики"><select value={form.metric_version_id} onChange={(event) => update("metric_version_id", event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm"><option value="">Выберите метрику</option>{metricOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></AdminField><AdminField label="Версия датасета"><select value={form.dataset_version_id} onChange={(event) => update("dataset_version_id", event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm"><option value="">Без датасета</option>{datasetOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></AdminField><AdminField label="Формат решения"><AdminSelect value={form.submission_type} onChange={(value) => update("submission_type", value)} options={[["predictions_csv", "CSV с предсказаниями"], ["source_code", "Исходный код"]]} /></AdminField><AdminField label="Проверка"><AdminSelect value={form.evaluation_type} onChange={(value) => update("evaluation_type", value)} options={[["metric", "Метрика"], ["test_cases", "Тесты"], ["custom", "Своя"]]} /></AdminField><AdminField label="Правила" wide><Textarea value={form.rules} onChange={(event) => update("rules", event.target.value)} className="min-h-28 rounded-none" /></AdminField></>}
  </div>;
  if (type === "badges") return <div className="grid gap-5 sm:grid-cols-2">
    {mode === "create" && <AdminField label="Код"><Input value={form.code} onChange={(event) => update("code", event.target.value.toLowerCase())} placeholder="first_duel" className={input} /></AdminField>}
    <AdminField label="Название"><Input value={form.name} onChange={(event) => update("name", event.target.value)} className={input} /></AdminField>
    <AdminField label="Описание" wide><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-24 rounded-none" /></AdminField>
    <AdminField label="Ключ иконки"><Input value={form.icon_key} onChange={(event) => update("icon_key", event.target.value)} placeholder="award" className={input} /></AdminField>
    <AdminField label="Цвет"><Input value={form.color_token} onChange={(event) => update("color_token", event.target.value)} placeholder="blue-500" className={input} /></AdminField>
  </div>;
  if (type === "plans") return <div className="grid gap-5 sm:grid-cols-2">
    {mode === "create" && <AdminField label="Код"><Input value={form.code} onChange={(event) => update("code", event.target.value.toLowerCase())} placeholder="premium_monthly" className={input} /></AdminField>}
    <AdminField label="Название"><Input value={form.name} onChange={(event) => update("name", event.target.value)} className={input} /></AdminField>
    <AdminField label="Описание" wide><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-24 rounded-none" /></AdminField>
    <AdminField label="Период"><Input value={form.billing_period} onChange={(event) => update("billing_period", event.target.value)} placeholder="month" className={input} /></AdminField>
    <AdminField label="Валюта"><Input value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} maxLength={3} className={input} /></AdminField>
    <AdminField label="Цена в копейках"><Input type="number" min="0" value={form.amount} onChange={(event) => update("amount", event.target.value)} className={input} /></AdminField>
    <AdminField label="Старая цена в копейках"><Input type="number" min="0" value={form.compare_at_amount} onChange={(event) => update("compare_at_amount", event.target.value)} className={input} /></AdminField>
    <AdminField label="Преимущества, по одному в строке" wide><Textarea value={form.features} onChange={(event) => update("features", event.target.value)} className="min-h-28 rounded-none" /></AdminField>
    <AdminField label="Возможности и лимиты (JSON)" wide><Textarea value={form.entitlements} onChange={(event) => update("entitlements", event.target.value)} className="min-h-36 rounded-none font-mono text-xs" /></AdminField>
    {mode === "create" && <AdminCheckbox checked={form.publish} onChange={(value) => update("publish", value)} label="Сразу опубликовать тариф" />}
  </div>;
  return null;
}

function AdminCheckbox({ checked, onChange, label }) {
  return <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-primary" />{label}</label>;
}

function ResourceEditorDialog({ editor, onClose, onSaved }) {
  const [form, setForm] = useState(() => resourceDefaults(editor?.type, editor?.item, editor?.mode));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const taskReferencesEnabled = editor?.type === "tasks" && editor?.mode !== "edit";
  const metricsQuery = useQuery({ queryKey: ["admin", "task-metric-options"], queryFn: () => api.admin.metrics({ limit: 50, offset: 0 }), enabled: taskReferencesEnabled });
  const datasetsQuery = useQuery({ queryKey: ["admin", "task-dataset-options"], queryFn: () => api.admin.datasets({ limit: 50, offset: 0 }), enabled: taskReferencesEnabled });
  const metricOptions = listRows(metricsQuery.data).filter((item) => item.current_version?.id).map((item) => ({ id: item.current_version.id, label: `${item.name || item.code} · версия ${item.current_version.version}` }));
  const datasetOptions = listRows(datasetsQuery.data).filter((item) => item.current_version?.id).map((item) => ({ id: item.current_version.id, label: `${item.name} · версия ${item.current_version.version}` }));
  useEffect(() => {
    setForm(resourceDefaults(editor?.type, editor?.item, editor?.mode));
    setError("");
  }, [editor]);
  if (!editor) return null;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setPending(true);
    setError("");
    try {
      if (editor.type === "tasks" && editor.mode !== "edit" && !form.metric_version_id) {
        throw new Error("Выберите версию метрики. Если список пуст, сначала создайте метрику и её версию.");
      }
      const body = resourcePayload(editor.type, form, editor.mode);
      let result;
      if (editor.type === "metrics") result = editor.mode === "create" ? await api.admin.createMetric(body) : editor.mode === "edit" ? await api.admin.updateMetric(editor.item.id, body) : await api.admin.createMetricVersion(editor.item.id, body);
      if (editor.type === "datasets") result = editor.mode === "create" ? await api.admin.createDataset(body) : editor.mode === "edit" ? await api.admin.updateDataset(editor.item.id, body) : await api.admin.createDatasetVersion(editor.item.id, body);
      if (editor.type === "tasks") result = editor.mode === "create" ? await api.admin.createTask(body) : editor.mode === "edit" ? await api.admin.updateTask(editor.item.id, body) : await api.admin.createTaskVersion(editor.item.id, body);
      if (editor.type === "badges") result = editor.mode === "create" ? await api.admin.createBadge(body) : await api.admin.updateBadge(editor.item.id, body);
      if (editor.type === "plans") result = editor.mode === "create" ? await api.admin.createBillingPlan(body) : await api.admin.updateBillingPlan(editor.item.id, body);
      onSaved(result);
    } catch (saveError) {
      setError(saveError instanceof SyntaxError ? "Проверьте корректность JSON-полей." : apiErrorMessage(saveError));
    } finally {
      setPending(false);
    }
  };
  const names = { metrics: "метрику", datasets: "датасет", tasks: "задачу", badges: "бейдж", plans: "тариф" };
  const title = editor.mode === "create" ? `Создать ${names[editor.type]}` : editor.mode === "version" ? "Создать новую версию" : `Редактировать ${names[editor.type]}`;
  return <Dialog.Root open onOpenChange={(open) => !open && !pending && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-border bg-card shadow-2xl focus:outline-none"><div className="flex items-start justify-between gap-5 border-b border-border p-5 md:px-6"><div><Dialog.Title className="font-heading text-2xl font-extrabold">{title}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Поля и переходы повторно проверяются сервером.</Dialog.Description></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border"><X size={17} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6"><ResourceFields type={editor.type} mode={editor.mode} form={form} update={update} metricOptions={metricOptions} datasetOptions={datasetOptions} />{error && <div className="mt-5 border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}</div><div className="flex justify-end gap-2 border-t border-border bg-card/95 p-4"><Button variant="outline" onClick={onClose} disabled={pending}>Отмена</Button><Button onClick={save} disabled={pending || (taskReferencesEnabled && (metricsQuery.isLoading || datasetsQuery.isLoading))}>{pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Сохранить</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function DatasetFilesDialog({ datasetId, permissions, onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [kind, setKind] = useState("train");
  const [visibility, setVisibility] = useState("participant");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const query = useQuery({ queryKey: ["admin", "dataset", datasetId], queryFn: () => api.admin.dataset(datasetId), enabled: Boolean(datasetId) });
  const version = query.data?.current_version;
  const files = version?.files || [];
  const validation = useQuery({ queryKey: ["admin", "dataset-validation", version?.id], queryFn: () => api.admin.datasetValidation(version.id), enabled: Boolean(version?.id) && showValidation, retry: false });
  const validate = useMutation({ mutationFn: () => api.admin.validateDatasetVersion(version.id), onSuccess: () => { setShowValidation(true); validation.refetch(); onSaved(); }, onError: (validationError) => setError(validationError.message) });
  if (!datasetId) return null;
  const attach = async () => {
    if (!file || !version?.id) return;
    setPending(true);
    setError("");
    try {
      const upload = await uploadFile(file, "task_dataset", { dataset_id: datasetId, dataset_version_id: version.id });
      await api.admin.attachDatasetFile(datasetId, version.id, { upload_id: upload.id, kind, visibility: kind === "private_labels" ? "evaluator_only" : kind === "duel_bundle" ? "participant" : visibility, position: files.length });
      setFile(null);
      await query.refetch();
      onSaved();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setPending(false);
    }
  };
  return <Dialog.Root open onOpenChange={(open) => !open && !pending && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-border bg-card shadow-2xl focus:outline-none"><div className="flex items-start justify-between gap-4 border-b border-border p-5"><div><Dialog.Title className="font-heading text-2xl font-extrabold">Файлы датасета</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Текущая версия {version?.version ?? "—"}</Dialog.Description></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-border"><X size={17} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="divide-y divide-border border border-border">{files.length ? files.map((entry) => <div key={entry.id} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[130px_1fr_120px_auto] sm:items-center"><span className="font-semibold">{entry.kind}</span><span className="truncate text-muted-foreground">{entry.file?.original_filename || entry.id}</span><span className="text-muted-foreground">{entry.visibility}</span>{(entry.visibility !== "evaluator_only" || can(permissions, "datasets.answers.read")) && <Button size="sm" variant="outline" onClick={() => api.admin.downloadDatasetFile(entry.id)}>Скачать</Button>}</div>) : <p className="p-5 text-sm text-muted-foreground">Файлы ещё не прикреплены.</p>}</div>{version && <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={() => setShowValidation(true)}><Search size={15} /> Последняя проверка</Button>{can(permissions, "datasets.validate") && <Button variant="outline" onClick={() => validate.mutate()} disabled={validate.isPending}>{validate.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Проверить сейчас</Button>}</div>}{showValidation && <div className="mt-4 border border-border bg-background p-4">{validation.isLoading ? <p className="text-sm text-muted-foreground">Загружаем результат…</p> : validation.error ? <p className="text-sm text-muted-foreground">Проверка ещё не запускалась.</p> : <><div className="flex items-center justify-between"><p className="font-semibold">Результат проверки</p><Status value={validation.data?.status} /></div><div className="mt-3 space-y-2">{(validation.data?.checks || []).map((check) => <div key={check.code} className="flex gap-2 text-sm">{check.passed ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" /> : <CircleAlert size={16} className="shrink-0 text-destructive" />}<span>{check.message}</span></div>)}</div></>}</div>}{version ? <div className="mt-6 grid gap-4 sm:grid-cols-2"><AdminField label="Назначение"><AdminSelect value={kind} onChange={(value) => { setKind(value); if (value === "duel_bundle") setVisibility("participant"); }} options={[["train", "Обучающая выборка"], ["test", "Тестовая выборка"], ["sample_submission", "Пример решения"], ["public_labels", "Публичные ответы"], ["private_labels", "Приватные ответы"], ["baseline", "Бейзлайн"], ["duel_bundle", "Набор для дуэлей (ZIP)"], ["statement_attachment", "Материал условия"]]} /></AdminField><AdminField label="Видимость"><AdminSelect value={kind === "private_labels" ? "evaluator_only" : kind === "duel_bundle" ? "participant" : visibility} onChange={setVisibility} options={[["participant", "Участникам"], ["public", "Публично"], ["organizer", "Организатору"], ["admin", "Администраторам"], ["evaluator_only", "Только проверяющей системе"]]} /></AdminField><AdminField label="Файл" wide><Input type="file" accept={kind === "duel_bundle" ? ".zip,application/zip" : ".csv,.json,.ipynb"} onChange={(event) => setFile(event.target.files?.[0] || null)} className="h-11 rounded-none" /></AdminField>{error && <div className="border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive sm:col-span-2">{error}</div>}<div className="flex justify-end sm:col-span-2"><Button onClick={attach} disabled={!file || pending}>{pending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Загрузить и прикрепить</Button></div></div> : <p className="mt-6 border border-amber-500/25 bg-amber-500/5 p-4 text-sm">Сначала создайте версию датасета.</p>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

const RESOURCE_TYPES = {
  datasets: { label: "Датасеты", singular: "датасет", icon: Database, query: api.admin.datasets, permission: "datasets.read", write: "datasets.write" },
  metrics: { label: "Метрики", singular: "метрику", icon: Gauge, query: api.admin.metrics, permission: "datasets.read", write: "datasets.write" },
  tasks: { label: "Задачи", singular: "задачу", icon: ClipboardCheck, query: api.admin.tasks, permission: "datasets.read", write: "datasets.write" },
  badges: { label: "Бейджи", singular: "бейдж", icon: BadgeCheck, query: api.admin.badges, permission: "settings.manage", write: "settings.manage" },
  plans: { label: "Тарифы", singular: "тариф", icon: SlidersHorizontal, query: api.admin.billingPlans, permission: "settings.manage", write: "settings.manage" },
  subscriptions: { label: "Подписки", singular: "подписку", icon: FileText, query: api.admin.subscriptions, permission: "subscriptions.read", write: "subscriptions.write" },
};

function ResourcesSection({ permissions, requestAction }) {
  const available = Object.entries(RESOURCE_TYPES).filter(([, resource]) => can(permissions, resource.permission));
  const [active, setActive] = useState(available[0]?.[0] || "datasets");
  const [editor, setEditor] = useState(null);
  const [datasetFilesId, setDatasetFilesId] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const current = RESOURCE_TYPES[active];
  const query = useQuery({ queryKey: ["admin", "resources", active], queryFn: () => current.query({ limit: 50, offset: 0 }), enabled: Boolean(current), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "resources", active] });
  const saved = () => { invalidate(); setEditor(null); toast({ title: "Ресурс сохранён" }); };
  const run = (item, title, description, action, options = {}) => requestAction({ title, description, confirm: title, danger: options.danger, reason: options.reason ?? false, run: action, invalidate: ["admin", "resources", active] });
  const actions = (item) => {
    if (!can(permissions, current.write)) return null;
    if (active === "subscriptions") return <ActionMenu>{item.status === "active" && <ActionButton onClick={() => run(item, "Приостановить подписку", `Подписка ${item.id}`, () => api.admin.subscriptionAction(item.id, "pause"))}><Pause size={13} /> Пауза</ActionButton>}{["active", "paused"].includes(item.status) && <ActionButton tone="danger" onClick={() => run(item, "Отменить подписку", `Подписка ${item.id}`, () => api.admin.subscriptionAction(item.id, "cancel"), { danger: true })}><X size={13} /> Отменить</ActionButton>}</ActionMenu>;
    return <ActionMenu>
      <ActionButton onClick={() => setEditor({ type: active, mode: "edit", item })}><Pencil size={13} /> Изменить</ActionButton>
      {["metrics", "datasets", "tasks"].includes(active) && item.status !== "archived" && <ActionButton tone="primary" onClick={() => setEditor({ type: active, mode: "version", item })}><Plus size={13} /> Версия</ActionButton>}
      {active === "datasets" && <ActionButton onClick={() => setDatasetFilesId(item.id)}><Upload size={13} /> Файлы</ActionButton>}
      {active === "datasets" && item.current_version?.id && can(permissions, "datasets.validate") && <ActionButton tone="primary" onClick={() => run(item, "Проверить датасет", "Сервер проверит структуру и приватность файлов текущей версии.", () => api.admin.validateDatasetVersion(item.current_version.id))}><CheckCircle2 size={13} /> Проверить</ActionButton>}
      {active === "metrics" && item.status !== "active" && <ActionButton tone="primary" onClick={() => run(item, "Опубликовать метрику", displayName(item), () => api.admin.metricAction(item.id, "publish"))}><Play size={13} /> Опубликовать</ActionButton>}
      {active === "tasks" && item.status !== "published" && <ActionButton tone="primary" onClick={() => run(item, "Опубликовать задачу", displayName(item), () => api.admin.taskAction(item.id, "publish"))}><Play size={13} /> Опубликовать</ActionButton>}
      {active === "tasks" && item.current_version?.id && item.current_version?.exposure_status !== "released" && <ActionButton tone="primary" onClick={() => run(item, "Открыть задачу для дуэлей и практики", "Версия станет публичной и больше не сможет использоваться как закрытая конкурсная.", () => api.admin.releaseTaskVersion(item.id, item.current_version.id, {
        duel_enabled: true,
        practice_enabled: true,
        challenge_enabled: false,
      }))}><ArrowUpRight size={13} /> Открыть</ActionButton>}
      {active === "plans" && item.status !== "active" && <ActionButton tone="primary" onClick={() => run(item, "Опубликовать тариф", displayName(item), () => api.admin.billingPlanAction(item.id, "publish"))}><Play size={13} /> Опубликовать</ActionButton>}
      {active === "metrics" && item.status !== "archived" && <ActionButton tone="danger" onClick={() => run(item, "Архивировать метрику", displayName(item), () => api.admin.metricAction(item.id, "archive"), { danger: true })}><Archive size={13} /></ActionButton>}
      {active === "datasets" && item.status !== "archived" && <ActionButton tone="danger" onClick={() => run(item, "Архивировать датасет", displayName(item), () => api.admin.archiveDataset(item.id), { danger: true })}><Archive size={13} /></ActionButton>}
      {active === "tasks" && item.status !== "archived" && <ActionButton tone="danger" onClick={() => run(item, "Архивировать задачу", displayName(item), () => api.admin.taskAction(item.id, "archive"), { danger: true })}><Archive size={13} /></ActionButton>}
      {active === "badges" && item.status !== "archived" && <ActionButton tone="danger" onClick={() => run(item, "Архивировать бейдж", displayName(item), () => api.admin.archiveBadge(item.id), { danger: true })}><Archive size={13} /></ActionButton>}
      {active === "plans" && item.status !== "archived" && <ActionButton tone="danger" onClick={() => run(item, "Архивировать тариф", displayName(item), () => api.admin.billingPlanAction(item.id, "archive"), { danger: true })}><Archive size={13} /></ActionButton>}
      {item.status === "draft" && ["metrics", "datasets", "tasks", "plans"].includes(active) && <ActionButton tone="danger" onClick={() => run(item, `Удалить ${current.singular}`, "Физическое удаление возможно только если ресурс нигде не используется.", () => active === "metrics" ? api.admin.deleteMetric(item.id) : active === "datasets" ? api.admin.deleteDataset(item.id) : active === "tasks" ? api.admin.deleteTask(item.id) : api.admin.deleteBillingPlan(item.id), { danger: true })}><Trash2 size={13} /></ActionButton>}
    </ActionMenu>;
  };
  const canCreate = active !== "subscriptions" && can(permissions, current.write);
  return <><SectionHeading title="Ресурсы платформы" description="Создание, версии, публикация и архивирование сущностей, от которых зависит работа платформы." count={listTotal(query.data)} action={canCreate ? <Button onClick={() => setEditor({ type: active, mode: "create", item: null })}><Plus size={16} /> Создать {current.singular}</Button> : null} /><div className="mb-4 flex flex-wrap gap-2">{available.map(([id, resource]) => { const Icon = resource.icon; return <button key={id} type="button" onClick={() => setActive(id)} className={`inline-flex h-10 items-center gap-2 border px-3 text-sm font-semibold ${active === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-primary"}`}><Icon size={15} />{resource.label}</button>; })}</div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><div className="divide-y divide-border">{rows.map((item) => <div key={item.id} className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(220px,1fr)_130px_150px_minmax(280px,auto)] xl:items-center"><div><p className="font-semibold">{displayName(item)}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{item.code || item.slug || item.id}</p>{item.current_version && <p className="mt-1 text-xs text-muted-foreground">Версия {item.current_version.version} · {item.current_version.exposure_status || item.current_version.direction || "текущая"}</p>}</div><Status value={item.status} /><p className="text-sm text-muted-foreground">{formatDate(item.updated_at || item.created_at)}</p><div className="xl:justify-self-end">{actions(item)}</div></div>)}</div></TableShell><ResourceEditorDialog editor={editor} onClose={() => setEditor(null)} onSaved={saved} /><DatasetFilesDialog datasetId={datasetFilesId} permissions={permissions} onClose={() => setDatasetFilesId(null)} onSaved={invalidate} /></>;
}

function RatingSeasonsSection({ requestAction }) {
  const [form, setForm] = useState({ name: "", slug: "", start_at: "", end_at: "" });
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["rating-seasons"], queryFn: api.rating.seasons });
  const rows = Array.isArray(query.data) ? query.data : query.data?.items || [];
  const create = useMutation({
    mutationFn: () => api.admin.createRatingSeason({ ...form, start_at: new Date(form.start_at).toISOString(), end_at: new Date(form.end_at).toISOString() }),
    onSuccess: () => { setForm({ name: "", slug: "", start_at: "", end_at: "" }); queryClient.invalidateQueries({ queryKey: ["rating-seasons"] }); },
  });
  const transition = (season, target) => requestAction({ title: `Перевести сезон в статус «${target}»`, description: `${season.name || season.slug}. Переход и снимки рейтинга будут зафиксированы сервером.`, confirm: "Подтвердить переход", reason: true, run: (reason) => api.admin.transitionRatingSeason(season.id, target, { reason }), invalidate: ["rating-seasons"] });
  return <><SectionHeading title="Сезоны рейтинга" description="Создание сезонов и аудируемые переходы draft → scheduled/active → frozen → archived." count={rows.length} /><div className="mb-6 grid gap-3 border border-border bg-card p-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_180px_auto]"><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Название сезона" /><Input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} placeholder="slug" /><AdminField label="Начало"><Input type="datetime-local" value={form.start_at} onChange={(event) => setForm((current) => ({ ...current, start_at: event.target.value }))} /></AdminField><AdminField label="Окончание"><Input type="datetime-local" value={form.end_at} onChange={(event) => setForm((current) => ({ ...current, end_at: event.target.value }))} /></AdminField><Button onClick={() => create.mutate()} disabled={!form.name.trim() || !form.slug.trim() || !form.start_at || !form.end_at || create.isPending}><Plus size={15} /> Создать</Button>{create.error && <p className="text-sm text-destructive md:col-span-2 xl:col-span-5">{apiErrorMessage(create.error)}</p>}</div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><div className="divide-y divide-border">{rows.map((season) => <div key={season.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p className="font-semibold">{season.name || season.slug}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(season.start_at)} — {formatDate(season.end_at)}</p></div><Status value={season.status} /><ActionMenu>{season.status === "draft" && <><ActionButton onClick={() => transition(season, "scheduled")}><CalendarClock size={13} /> Запланировать</ActionButton><ActionButton tone="primary" onClick={() => transition(season, "active")}><Play size={13} /> Активировать</ActionButton></>}{["scheduled", "active"].includes(season.status) && <ActionButton onClick={() => transition(season, "frozen")}><Pause size={13} /> Зафиксировать</ActionButton>}{season.status === "frozen" && <ActionButton tone="danger" onClick={() => transition(season, "archived")}><Archive size={13} /> В архив</ActionButton>}</ActionMenu></div>)}</div></TableShell></>;
}

function AuditSection() {
  const [filters, setFilters] = useState({ action: "", actor_user_id: "", target_type: "", target_id: "" });
  const deferredFilters = useDeferredValue(filters);
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const query = useQuery({ queryKey: ["admin", "audit", deferredFilters], queryFn: () => api.admin.auditLogs({ ...deferredFilters, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  return <><SectionHeading title="Журнал действий" description="Неизменяемая история административных операций с поиском по сотруднику, событию и объекту." count={listTotal(query.data)} /><div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4"><SearchField value={filters.action} onChange={(value) => update("action", value)} placeholder="Событие" /><SearchField value={filters.actor_user_id} onChange={(value) => update("actor_user_id", value)} placeholder="ID сотрудника" /><SearchField value={filters.target_type} onChange={(value) => update("target_type", value)} placeholder="Тип объекта" /><SearchField value={filters.target_id} onChange={(value) => update("target_id", value)} placeholder="ID объекта" /></div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Действие</th><th className="px-4 py-3">Сотрудник</th><th className="px-4 py-3">Объект</th><th className="px-4 py-3">IP / роль</th><th className="px-5 py-3">Время</th></tr></thead><tbody className="divide-y divide-border">{rows.map((event) => <tr key={event.id} className="hover:bg-secondary/35"><td className="px-5 py-4"><p className="font-semibold">{event.action}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{event.request_id || event.id}</p></td><td className="px-4 py-4 font-mono text-xs">{event.actor_user_id || "system"}</td><td className="px-4 py-4"><p>{event.target_type || "—"}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{event.target_id || "—"}</p></td><td className="px-4 py-4"><p>{event.ip_address || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{event.actor_role || "—"}</p></td><td className="px-5 py-4 text-muted-foreground">{formatDate(event.created_at)}</td></tr>)}</tbody></table></TableShell></>;
}

function AdminAccessDenied({ error }) {
  return <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12"><div className="w-full border border-destructive/25 bg-card p-8 text-center shadow-xl"><span className="mx-auto flex h-14 w-14 items-center justify-center bg-destructive/10 text-destructive"><LockKeyhole size={26} /></span><h1 className="mt-6 font-heading text-2xl font-extrabold">Доступ к панели закрыт</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Сервер не подтвердил административную роль или разрешение на обзор панели. Вход по прямой ссылке не открывает данные.</p>{error?.requestId && <p className="mt-4 font-mono text-xs text-muted-foreground">ID запроса: {error.requestId}</p>}<Button asChild className="mt-7"><a href="/">Вернуться на главную</a></Button></div></div>;
}

export default function Admin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const access = useQuery({ queryKey: ["admin", "me"], queryFn: api.admin.me, retry: false, staleTime: 60000 });
  const permissions = useMemo(() => new Set(access.data?.permissions || []), [access.data?.permissions]);
  const sections = useMemo(() => SECTIONS.filter((section) => canOpen(permissions, section)), [permissions]);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [pendingAction, setPendingAction] = useState(null);
  const action = useMutation({ mutationFn: ({ config, reason }) => config.run(reason), onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: variables.config.invalidate || ["admin"] }); queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }); toast({ title: "Действие выполнено" }); setPendingAction(null); }, onError: (error) => toast({ title: "Операция отклонена", description: error.requestId ? `${error.message} · ID ${error.requestId}` : error.message, variant: "destructive" }) });
  if (access.isLoading) return <div className="flex min-h-[70vh] items-center justify-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-primary" size={28} /><p className="mt-3 text-sm text-muted-foreground">Проверяем административные права…</p></div></div>;
  if (access.error) return <AdminAccessDenied error={access.error} />;
  const active = sections.some((section) => section.id === activeSection) ? activeSection : sections[0]?.id;
  const shared = { permissions, requestAction: setPendingAction };
  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card/70 px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-2 font-heading text-3xl font-extrabold sm:text-4xl">Управление ML-Ареной</h1>
            <p className="mt-2 text-sm text-muted-foreground">{access.data.email} · {access.data.roles?.join(", ") || "администратор"}</p>
          </div>
          <div className="flex items-center gap-3 border border-border bg-background px-4 py-3">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping bg-emerald-400 opacity-50" /><span className="relative inline-flex h-2.5 w-2.5 bg-emerald-500" /></span>
            <div><p className="text-sm font-semibold">Сессия подтверждена</p><p className="text-xs text-muted-foreground">{permissions.size} разрешений</p></div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-card/35 p-3 lg:min-h-[calc(100vh-180px)] lg:border-b-0 lg:border-r lg:p-4">
          <div className="lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100vh-2rem)] lg:min-h-0 lg:flex-col">
            <nav className="flex gap-2 overflow-x-auto lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto" aria-label="Разделы админ-панели">
              {sections.map((section) => {
                const Icon = section.icon;
                const selected = active === section.id;
                return (
                  <button key={section.id} type="button" onClick={() => setActiveSection(section.id)} className={`group flex min-w-max items-center gap-3 border px-3 py-3 text-left text-sm font-semibold transition-colors lg:w-full lg:min-w-0 lg:shrink-0 ${selected ? "border-primary bg-primary text-primary-foreground" : "border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-primary"}`}>
                    <Icon size={18} className="shrink-0" />
                    <span className="min-w-0 flex-1 whitespace-normal">{section.label}</span>
                    {selected && <ArrowUpRight size={14} className="shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10">
          {active === "dashboard" && <DashboardSection />}
          {active === "users" && <UsersSection {...shared} />}
          {active === "organizations" && <OrganizationsSection {...shared} />}
          {active === "competitions" && <CompetitionsSection {...shared} />}
          {active === "rating" && <RatingSeasonsSection {...shared} />}
          {active === "submissions" && <SubmissionsSection {...shared} />}
          {active === "moderation" && <ModerationSection {...shared} />}
          {active === "content" && <ContentSection {...shared} />}
          {active === "resources" && <ResourcesSection {...shared} />}
          {active === "audit" && <AuditSection />}
        </main>
      </div>
      <ConfirmDialog action={pendingAction} pending={action.isPending} onClose={() => setPendingAction(null)} onConfirm={(reason) => action.mutate({ config: pendingAction, reason })} />
    </div>
  );
}
