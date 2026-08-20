import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity, Archive, ArrowUpRight, BadgeCheck, Ban, Building2, CheckCircle2, CircleAlert,
  ClipboardCheck, Database, FileClock, FileText, Gauge, History, LayoutDashboard, Loader2,
  ImageIcon, LockKeyhole, Newspaper, Pause, Pencil, Play, RefreshCw, Save, Search, Send,
  ShieldAlert, ShieldCheck, SlidersHorizontal, Trophy, Upload, UserCheck, Users, X,
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
  { id: "submissions", label: "Отправки", icon: FileClock, permission: "submissions.read" },
  { id: "moderation", label: "Модерация", icon: ShieldAlert, permission: "moderation.read" },
  { id: "content", label: "Блог", icon: Newspaper, permission: "content.read" },
  { id: "resources", label: "Ресурсы", icon: Database, any: ["datasets.read", "settings.manage", "subscriptions.read"] },
  { id: "audit", label: "Журнал действий", icon: History, permission: "audit.read" },
];

function listRows(response) {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.data) ? response.data : [];
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

function displayName(item) {
  return item.user_name || item.username || item.full_name || item.name || item.title || item.email_masked || item.email || item.id;
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

function UsersSection({ permissions, requestAction }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({ queryKey: ["admin", "users", deferredSearch, status, role], queryFn: () => api.admin.users({ q: deferredSearch, status, role, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  return <><SectionHeading title="Пользователи" description="Аккаунты, статусы проверки и санкции. Email скрыт сервером без отдельного разрешения PII." count={listTotal(query.data)} /><div className="mb-4 flex flex-col gap-2 lg:flex-row"><SearchField value={search} onChange={setSearch} placeholder="Email, ник или имя" /><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["active", "Активные"], ["pending_email", "Без подтверждения"], ["banned", "Заблокированные"], ["deleted", "Удалённые"]]} /><FilterSelect value={role} onChange={setRole} label="Все роли" options={[["user", "Участники"], ["organization", "Организации"], ["admin", "Администраторы"]]} /></div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Пользователь</th><th className="px-4 py-3">Роль</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Рейтинг</th><th className="px-4 py-3">Создан</th><th className="px-5 py-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-border">{rows.map((user) => <tr key={user.id} className="transition-colors hover:bg-secondary/35"><td className="px-5 py-4"><p className="font-semibold">{displayName(user)}</p><p className="mt-1 text-xs text-muted-foreground">{user.email_masked || user.email || user.id}</p></td><td className="px-4 py-4">{user.role}</td><td className="px-4 py-4"><Status value={user.status} /></td><td className="px-4 py-4 font-semibold">{user.rating ?? "—"}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(user.created_at)}</td><td className="px-5 py-4"><ActionMenu>{can(permissions, "users.ban") && !user.admin_verified && <ActionButton tone="primary" onClick={() => requestAction({ title: "Подтвердить пользователя", description: `${displayName(user)} получит отметку ручной проверки. Email при этом не подтверждается.`, confirm: "Подтвердить", reason: false, run: () => api.admin.verifyUser(user.id), invalidate: ["admin", "users"] })}><UserCheck size={13} /> Проверить</ActionButton>}{can(permissions, "users.ban") && user.status === "banned" && <ActionButton onClick={() => requestAction({ title: "Снять блокировку", description: `Вернуть доступ пользователю ${displayName(user)}?`, confirm: "Разблокировать", reason: false, run: () => api.admin.unbanUser(user.id), invalidate: ["admin", "users"] })}><CheckCircle2 size={13} /> Разблокировать</ActionButton>}{can(permissions, "users.ban") && !["banned", "deleted"].includes(user.status) && user.role !== "organization" && <ActionButton tone="danger" onClick={() => requestAction({ title: "Заблокировать пользователя", description: `Все refresh-сессии ${displayName(user)} будут отозваны.`, confirm: "Заблокировать", danger: true, run: (reason) => api.admin.banUser(user.id, { reason }), invalidate: ["admin", "users"] })}><Ban size={13} /> Заблокировать</ActionButton>}</ActionMenu></td></tr>)}</tbody></table></TableShell></>;
}

function OrganizationsSection({ permissions, requestAction }) {
  const query = useQuery({ queryKey: ["admin", "organizations"], queryFn: () => api.admin.organizations({ limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  const writable = can(permissions, "settings.manage") || can(permissions, "competitions.write");
  const action = (organization, type, title, description, options = {}) => requestAction({ title, description, confirm: options.confirm || title, danger: options.danger, reason: options.reason, run: (reason) => api.admin.organizationAction(organization.id, type, options.reason === false ? undefined : { reason }), invalidate: ["admin", "organizations"] });
  return <><SectionHeading title="Организации" description="Верификация партнёров и управление доступом корпоративных аккаунтов." count={listTotal(query.data)} /><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Организация</th><th className="px-4 py-3">Сайт</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Создана</th><th className="px-5 py-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-border">{rows.map((organization) => <tr key={organization.id} className="hover:bg-secondary/35"><td className="px-5 py-4"><p className="font-semibold">{displayName(organization)}</p><p className="mt-1 text-xs text-muted-foreground">{organization.slug || organization.id}</p></td><td className="px-4 py-4">{organization.website ? <a href={organization.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Открыть <ArrowUpRight size={13} /></a> : "—"}</td><td className="px-4 py-4"><Status value={organization.status} /></td><td className="px-4 py-4 text-muted-foreground">{formatDate(organization.created_at)}</td><td className="px-5 py-4"><ActionMenu>{writable && organization.status === "pending" && <ActionButton tone="primary" onClick={() => action(organization, "verify", "Подтвердить организацию", "Аккаунт организации станет активным.", { reason: false })}><BadgeCheck size={13} /> Подтвердить</ActionButton>}{writable && organization.status === "suspended" && <ActionButton onClick={() => action(organization, "restore", "Восстановить организацию", "Корпоративный аккаунт снова станет активным. Соревнования останутся на паузе.", { reason: false })}><Play size={13} /> Восстановить</ActionButton>}{writable && !["suspended", "archived"].includes(organization.status) && <ActionButton tone="danger" onClick={() => action(organization, "suspend", "Приостановить организацию", "Аккаунт будет заблокирован, а текущие соревнования поставлены на паузу.", { danger: true })}><Pause size={13} /> Приостановить</ActionButton>}{writable && organization.status !== "archived" && <ActionButton tone="danger" onClick={() => action(organization, "archive", "Архивировать организацию", "Это логически удалит связанный аккаунт и отзовёт его сессии.", { danger: true })}><Archive size={13} /> В архив</ActionButton>}</ActionMenu></td></tr>)}</tbody></table></TableShell></>;
}

function CompetitionsSection({ permissions, requestAction }) {
  const [status, setStatus] = useState("all");
  const query = useQuery({ queryKey: ["admin", "competitions", status], queryFn: () => api.admin.competitions({ status, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  const execute = (competition, type, title, description, options = {}) => requestAction({ title, description, confirm: title, danger: options.danger, reason: options.reason ?? false, run: (reason) => api.admin.competitionAction(competition.id, type, options.reason ? { reason } : undefined), invalidate: ["admin", "competitions"] });
  return <><SectionHeading title="Соревнования" description="Публикация, пауза и жизненный цикл событий. Backend повторно проверяет готовность перед запуском." count={listTotal(query.data)} /><div className="mb-4 flex justify-end"><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["draft", "Черновики"], ["moderation", "На модерации"], ["scheduled", "Запланированные"], ["active", "Активные"], ["paused", "На паузе"], ["completed", "Завершённые"]]} /></div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Соревнование</th><th className="px-4 py-3">Организатор</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Дедлайн</th><th className="px-4 py-3">Участники</th><th className="px-5 py-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-border">{rows.map((competition) => <tr key={competition.id} className="hover:bg-secondary/35"><td className="px-5 py-4"><p className="font-semibold">{displayName(competition)}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{competition.slug || competition.id}</p></td><td className="px-4 py-4">{competition.organization_name || competition.company_name || "ML-Арена"}</td><td className="px-4 py-4"><Status value={competition.status} /></td><td className="px-4 py-4 text-muted-foreground">{formatDate(competition.deadline)}</td><td className="px-4 py-4 font-semibold">{competition.participants_count ?? 0}</td><td className="px-5 py-4"><ActionMenu>{["draft", "moderation", "scheduled"].includes(competition.status) && can(permissions, "competitions.publish") && <ActionButton tone="primary" onClick={() => execute(competition, "publish", "Опубликовать соревнование", "Сервер проверит датасет, метрику, правила и дедлайн.")}><Play size={13} /> Опубликовать</ActionButton>}{competition.status === "active" && can(permissions, "competitions.pause") && <ActionButton onClick={() => execute(competition, "pause", "Поставить на паузу", "Приём новых решений будет временно остановлен.", { reason: true })}><Pause size={13} /> Пауза</ActionButton>}{competition.status === "paused" && can(permissions, "competitions.pause") && <ActionButton tone="primary" onClick={() => execute(competition, "resume", "Возобновить соревнование", "Проверьте дедлайн перед возобновлением.")}><Play size={13} /> Возобновить</ActionButton>}{competition.status !== "archived" && can(permissions, "competitions.archive") && <ActionButton tone="danger" onClick={() => execute(competition, "archive", "Архивировать соревнование", "Событие исчезнет из активных списков.", { reason: true, danger: true })}><Archive size={13} /></ActionButton>}</ActionMenu></td></tr>)}</tbody></table></TableShell></>;
}

function SubmissionsSection({ permissions, requestAction }) {
  const [status, setStatus] = useState("all");
  const query = useQuery({ queryKey: ["admin", "submissions", status], queryFn: () => api.admin.submissions({ status, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  const execute = (submission, type, title, danger = false) => requestAction({ title, description: `Отправка ${submission.id}. Действие и причина сохранятся в истории.`, confirm: title, danger, run: (reason) => api.admin.submissionAction(submission.id, type, reason), invalidate: ["admin", "submissions"] });
  return <><SectionHeading title="Отправки решений" description="Очередь проверки, повторные запуски и дисквалификации без физического удаления результатов." count={listTotal(query.data)} /><div className="mb-4 flex justify-end"><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["queued", "В очереди"], ["validating", "Проверяются"], ["scored", "Оценены"], ["failed", "С ошибкой"], ["rejected", "Отклонены"], ["disqualified", "Дисквалифицированы"]]} /></div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">ID / участник</th><th className="px-4 py-3">Соревнование</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Результат</th><th className="px-4 py-3">Время</th><th className="px-5 py-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-border">{rows.map((submission) => <tr key={submission.id} className="hover:bg-secondary/35"><td className="px-5 py-4"><p className="font-semibold">{submission.username || submission.user_name || submission.user_id || "Участник"}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{submission.id}</p></td><td className="px-4 py-4">{submission.competition_title || submission.competition_id || "—"}</td><td className="px-4 py-4"><Status value={submission.status} /></td><td className="px-4 py-4 font-semibold">{submission.public_score ?? submission.score ?? "—"}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(submission.created_at)}</td><td className="px-5 py-4"><ActionMenu>{["failed", "rejected", "cancelled"].includes(submission.status) && can(permissions, "submissions.retry") && <ActionButton tone="primary" onClick={() => execute(submission, "retry", "Повторить проверку")}><RefreshCw size={13} /> Повторить</ActionButton>}{["uploaded", "validating", "queued", "pending"].includes(submission.status) && can(permissions, "submissions.retry") && <ActionButton onClick={() => execute(submission, "cancel", "Отменить отправку")}><X size={13} /> Отменить</ActionButton>}{submission.status !== "disqualified" && can(permissions, "submissions.disqualify") && <ActionButton tone="danger" onClick={() => execute(submission, "disqualify", "Дисквалифицировать", true)}><Ban size={13} /> Исключить</ActionButton>}</ActionMenu></td></tr>)}</tbody></table></TableShell></>;
}

function ModerationSection({ permissions, requestAction }) {
  const [status, setStatus] = useState("new");
  const query = useQuery({ queryKey: ["admin", "moderation", status], queryFn: () => api.admin.moderationReports({ status, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  const decide = (report, action, title, danger = false) => requestAction({ title, description: `Жалоба на ${report.object_type || "объект"}. Решение нельзя незаметно изменить: оно попадёт в аудит.`, confirm: title, danger, run: (reason) => api.admin.decideModerationReport(report.id, { action, reason }), invalidate: ["admin", "moderation"] });
  return <><SectionHeading title="Очередь модерации" description="Жалобы пользователей и решения с неизменяемым следом в журнале." count={listTotal(query.data)} /><div className="mb-4 flex justify-end"><FilterSelect value={status} onChange={setStatus} label="Все статусы" options={[["new", "Новые"], ["escalated", "Переданные выше"], ["resolved", "Решённые"], ["rejected", "Отклонённые"]]} /></div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><div className="divide-y divide-border">{rows.map((report) => <article key={report.id} className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><Status value={report.status} /><span className="text-xs font-semibold uppercase text-muted-foreground">{report.object_type}</span><span className="text-xs text-muted-foreground">важность {report.severity ?? "—"}</span></div><h3 className="mt-3 font-semibold">{report.reason}</h3>{report.text && <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{report.text}</p>}<p className="mt-3 font-mono text-xs text-muted-foreground">{report.object_id} · {formatDate(report.created_at)}</p></div>{can(permissions, "moderation.resolve") && ["new", "escalated"].includes(report.status) && <ActionMenu><ActionButton onClick={() => decide(report, "dismiss", "Отклонить жалобу")}><X size={13} /> Отклонить</ActionButton><ActionButton onClick={() => decide(report, "escalate", "Передать выше")}><ArrowUpRight size={13} /> Передать</ActionButton><ActionButton tone="danger" onClick={() => decide(report, "hide_content", "Скрыть содержимое", true)}><ShieldAlert size={13} /> Скрыть</ActionButton></ActionMenu>}</article>)}</div></TableShell></>;
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
                {form.cta_type !== "none" && <div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">Текст кнопки</span><Input value={form.cta_label} onChange={(event) => update("cta_label", event.target.value)} className="rounded-none" /></label><label><span className="mb-2 block text-sm font-semibold">Ссылка</span><Input value={form.cta_url} onChange={(event) => update("cta_url", event.target.value)} placeholder="/register" className="rounded-none" /></label></div>}
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

function ContentSection({ permissions, requestAction }) {
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

const RESOURCE_TYPES = {
  datasets: { label: "Датасеты", icon: Database, query: api.admin.datasets, permission: "datasets.read" },
  metrics: { label: "Метрики", icon: Gauge, query: api.admin.metrics, permission: "datasets.read" },
  tasks: { label: "Задачи", icon: ClipboardCheck, query: api.admin.tasks, permission: "datasets.read" },
  badges: { label: "Бейджи", icon: BadgeCheck, query: api.admin.badges, permission: "settings.manage" },
  plans: { label: "Тарифы", icon: SlidersHorizontal, query: api.admin.billingPlans, permission: "settings.manage" },
  subscriptions: { label: "Подписки", icon: FileText, query: api.admin.subscriptions, permission: "subscriptions.read" },
};

function ResourcesSection({ permissions }) {
  const available = Object.entries(RESOURCE_TYPES).filter(([, resource]) => can(permissions, resource.permission));
  const [active, setActive] = useState(available[0]?.[0] || "datasets");
  const current = RESOURCE_TYPES[active];
  const query = useQuery({ queryKey: ["admin", "resources", active], queryFn: () => current.query({ limit: 50, offset: 0 }), enabled: Boolean(current), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  return <><SectionHeading title="Ресурсы платформы" description="Технические сущности, от которых зависят задачи, проверка и коммерческие планы." count={listTotal(query.data)} /><div className="mb-4 flex flex-wrap gap-2">{available.map(([id, resource]) => { const Icon = resource.icon; return <button key={id} type="button" onClick={() => setActive(id)} className={`inline-flex h-10 items-center gap-2 border px-3 text-sm font-semibold ${active === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-primary"}`}><Icon size={15} />{resource.label}</button>; })}</div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><div className="divide-y divide-border">{rows.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_180px_160px] sm:items-center"><div><p className="font-semibold">{displayName(item)}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{item.code || item.slug || item.id}</p></div><Status value={item.status} /><p className="text-sm text-muted-foreground sm:text-right">{formatDate(item.updated_at || item.created_at)}</p></div>)}</div></TableShell></>;
}

function AuditSection() {
  const [action, setAction] = useState("");
  const deferredAction = useDeferredValue(action);
  const query = useQuery({ queryKey: ["admin", "audit", deferredAction], queryFn: () => api.admin.auditLogs({ action: deferredAction, limit: 50, offset: 0 }), placeholderData: keepPreviousData });
  const rows = listRows(query.data);
  return <><SectionHeading title="Журнал действий" description="Неизменяемая история административных операций. Используйте ID запроса для сопоставления с логами backend." count={listTotal(query.data)} /><div className="mb-4"><SearchField value={action} onChange={setAction} placeholder="Точное имя события, например moderation.hide_content" /></div><TableShell loading={query.isLoading} error={query.error} empty={!rows.length}><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-border bg-secondary/70 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Действие</th><th className="px-4 py-3">Сотрудник</th><th className="px-4 py-3">Объект</th><th className="px-4 py-3">IP / роль</th><th className="px-5 py-3">Время</th></tr></thead><tbody className="divide-y divide-border">{rows.map((event) => <tr key={event.id} className="hover:bg-secondary/35"><td className="px-5 py-4"><p className="font-semibold">{event.action}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{event.request_id || event.id}</p></td><td className="px-4 py-4 font-mono text-xs">{event.actor_user_id || "system"}</td><td className="px-4 py-4"><p>{event.target_type || "—"}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{event.target_id || "—"}</p></td><td className="px-4 py-4"><p>{event.ip_address || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{event.actor_role || "—"}</p></td><td className="px-5 py-4 text-muted-foreground">{formatDate(event.created_at)}</td></tr>)}</tbody></table></TableShell></>;
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
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary"><ShieldCheck size={15} /> Защищённая зона</div>
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
            <div className="mt-4 hidden shrink-0 border-t border-border bg-card/70 px-1 pt-4 text-xs leading-5 text-muted-foreground lg:block">
              <LockKeyhole size={16} className="mb-2 text-primary" />
              Все изменения повторно проверяются сервером и фиксируются в аудите.
            </div>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10">
          {active === "dashboard" && <DashboardSection />}
          {active === "users" && <UsersSection {...shared} />}
          {active === "organizations" && <OrganizationsSection {...shared} />}
          {active === "competitions" && <CompetitionsSection {...shared} />}
          {active === "submissions" && <SubmissionsSection {...shared} />}
          {active === "moderation" && <ModerationSection {...shared} />}
          {active === "content" && <ContentSection {...shared} />}
          {active === "resources" && <ResourcesSection permissions={permissions} />}
          {active === "audit" && <AuditSection />}
        </main>
      </div>
      <ConfirmDialog action={pendingAction} pending={action.isPending} onClose={() => setPendingAction(null)} onConfirm={(reason) => action.mutate({ config: pendingAction, reason })} />
    </div>
  );
}
