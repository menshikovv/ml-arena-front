import React, { useState, useMemo } from "react";
import { api, uploadFile } from "@/api/mlArenaApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import StatCard from "@/components/ml/StatCard";
import { Trophy, Users, Send, Plus, Eye, Filter, Gauge, Upload, Loader2, Play, FileCode2 } from "lucide-react";
import { TASK_TYPE_LABELS } from "@/lib/ml-arena";
import { toast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";

export default function CompanyDashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    task_version_id: "", title: "", description: "",
    prize_type: "none", cash_prize_amount_rub: 0, prize_description: "", deadline: "", rules: "",
  });
  const [showMetricCreate, setShowMetricCreate] = useState(false);
  const [metricVersionTarget, setMetricVersionTarget] = useState(null);
  const [metricHistoryTarget, setMetricHistoryTarget] = useState(null);
  const [metricPending, setMetricPending] = useState(false);
  const [metricFile, setMetricFile] = useState(null);
  const [metricForm, setMetricForm] = useState({ code: "", name: "", description: "", direction: "maximize", display_format: "0.0000", input_contract: "tabular_v1", allowed_task_types: "classification", visibility: "owner_only" });
  const [skillFilter, setSkillFilter] = useState("all");
  const [inviteModal, setInviteModal] = useState(null);
  const [inviteMsg, setInviteMsg] = useState("");
  const queryClient = useQueryClient();

  const organizationQuery = useQuery({ queryKey: ["organization-me"], queryFn: api.organizations.me });
  const organization = organizationQuery.data;
  const competitionsQuery = useQuery({
    queryKey: ["company-competitions", organization?.id],
    queryFn: () => api.organizations.competitions(organization.id, { limit: 100, offset: 0 }),
    enabled: Boolean(organization?.id),
  });
  const competitions = competitionsQuery.data?.data || competitionsQuery.data?.items || [];
  const metricsQuery = useQuery({
    queryKey: ["company-metrics", organization?.id],
    queryFn: () => api.organizations.metrics(organization.id),
    enabled: Boolean(organization?.id),
  });
  const metrics = Array.isArray(metricsQuery.data) ? metricsQuery.data : metricsQuery.data?.items || metricsQuery.data?.data || [];
  const metricHistoryQuery = useQuery({
    queryKey: ["company-metric-versions", organization?.id, metricHistoryTarget?.id],
    queryFn: () => api.organizations.metricVersions(organization.id, metricHistoryTarget.id),
    enabled: Boolean(organization?.id && metricHistoryTarget?.id),
  });
  const metricHistory = Array.isArray(metricHistoryQuery.data) ? metricHistoryQuery.data : metricHistoryQuery.data?.items || metricHistoryQuery.data?.data || [];

  const profilesQuery = useQuery({
    queryKey: ["visible-profiles"],
    queryFn: () => api.profiles.search({ limit: 50, offset: 0, sort: "-rating" }),
  });
  const profiles = profilesQuery.data?.data || profilesQuery.data?.items || [];

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter((p) => {
      if (skillFilter !== "all") {
        if (!(Number(p.skills?.[skillFilter]) > 0)) return false;
      }
      return true;
    });
  }, [profiles, skillFilter]);

  const handleCreate = async () => {
    if (!form.task_version_id || !form.title || !form.description || !form.deadline) {
      toast.error("Заполните версию задачи, название, описание и дедлайн");
      return;
    }
    try {
      await api.organizations.createCompetition(organization.id, {
        task_version_id: form.task_version_id.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        submission_deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        prize_type: form.prize_type,
        cash_prize_amount_rub: form.prize_type === "cash" ? Math.round(Number(form.cash_prize_amount_rub) || 0) : null,
        prize_description: form.prize_type === "non_cash" ? form.prize_description.trim() : null,
        rules: form.rules.trim() || null,
      });
      toast.success("Соревнование создано!");
      setShowCreate(false);
      setForm({ task_version_id: "", title: "", description: "", prize_type: "none", cash_prize_amount_rub: 0, prize_description: "", deadline: "", rules: "" });
      queryClient.invalidateQueries({ queryKey: ["company-competitions"] });
    } catch (err) {
      toast.error("Ошибка: " + (err.message || "неизвестная"));
    }
  };

  const handleCreateMetric = async () => {
    if (!metricFile || (!metricVersionTarget && (!metricForm.code.trim() || !metricForm.name.trim()))) {
      toast.error(metricVersionTarget ? "Выберите новый Python-файл метрики" : "Укажите код, название и Python-файл метрики");
      return;
    }
    if (!metricFile.name.toLowerCase().endsWith(".py") || metricFile.size > 128 * 1024) {
      toast.error("Нужен файл .py размером не больше 128 КБ");
      return;
    }
    setMetricPending(true);
    try {
      const upload = await uploadFile(metricFile, "metric_source", { organization_id: organization.id });
      const versionBody = { direction: metricForm.direction, display_format: metricForm.display_format, source_upload_id: upload.id, input_contract: metricForm.input_contract, allowed_task_types: metricForm.allowed_task_types.split(",").map((value) => value.trim()).filter(Boolean) };
      const metric = metricVersionTarget
        ? metricVersionTarget
        : await api.organizations.createMetric(organization.id, { ...versionBody, code: metricForm.code.trim().toLowerCase(), name: metricForm.name.trim(), description: metricForm.description.trim() || null, visibility: metricForm.visibility });
      const version = metricVersionTarget ? await api.organizations.createMetricVersion(organization.id, metric.id, versionBody) : metric.current_version;
      const versionId = version?.id || metric.current_version_id;
      if (versionId) await api.organizations.submitMetricVersion(organization.id, metric.id, versionId);
      toast.success(versionId ? "Метрика отправлена на проверку" : "Метрика создана");
      setShowMetricCreate(false);
      setMetricVersionTarget(null);
      setMetricFile(null);
      setMetricForm({ code: "", name: "", description: "", direction: "maximize", display_format: "0.0000", input_contract: "tabular_v1", allowed_task_types: "classification", visibility: "owner_only" });
      queryClient.invalidateQueries({ queryKey: ["company-metrics"] });
    } catch (err) {
      toast.error("Ошибка: " + (err.message || "неизвестная"));
    } finally {
      setMetricPending(false);
    }
  };

  const submitMetric = async (metric) => {
    const versions = await api.organizations.metricVersions(organization.id, metric.id);
    const rows = Array.isArray(versions) ? versions : versions?.items || versions?.data || [];
    const candidate = rows.find((version) => ["draft", "changes_requested", "tests_failed"].includes(version.moderation_status));
    if (!candidate) return toast.error("Нет версии, которую можно отправить на проверку");
    try {
      await api.organizations.submitMetricVersion(organization.id, metric.id, candidate.id);
      toast.success("Версия отправлена на проверку");
      queryClient.invalidateQueries({ queryKey: ["company-metrics"] });
    } catch (err) {
      toast.error("Ошибка: " + (err.message || "неизвестная"));
    }
  };

  const handleSendInvite = async () => {
    if (!inviteMsg) return;
    try {
      await navigator.clipboard.writeText(inviteMsg);
      toast.success("Текст приглашения скопирован. Отправьте его кандидату через указанные им публичные контакты.");
      setInviteModal(null);
      setInviteMsg("");
    } catch (err) {
      toast.error("Ошибка: " + (err.message || "неизвестная"));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <Reveal className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Кабинет компании</h1>
          <p className="text-muted-foreground text-sm mt-1">Управляй соревнованиями и находи таланты</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { setMetricVersionTarget(null); setShowMetricCreate(true); }}>
            <Gauge size={16} className="mr-1.5" /> Создать метрику
          </Button>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus size={16} className="mr-1.5" /> Создать соревнование
          </Button>
        </div>
      </Reveal>

      {/* Stats */}
      <Stagger className="grid grid-cols-2 gap-3 mb-6">
        <StaggerItem><StatCard icon={Trophy} label="Соревнования" value={competitionsQuery.data?.meta?.total ?? "—"} color="#7C3AED" /></StaggerItem>
        <StaggerItem><StatCard icon={Users} label="Публичных профилей" value={profilesQuery.data?.meta?.total ?? "—"} color="#06B6D4" /></StaggerItem>
      </Stagger>

      {/* Create form */}
      {showCreate && (
        <Reveal className="mb-6">
          <Card className="p-5 bg-card/60 border-primary/30">
            <h3 className="font-heading font-semibold mb-4">Новое соревнование</h3>
            <div className="space-y-3">
            <Input placeholder="ID приватной версии задачи" value={form.task_version_id} onChange={(e) => setForm({ ...form, task_version_id: e.target.value })} />
            <Input placeholder="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Описание задачи" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={form.prize_type} onChange={(e) => setForm({ ...form, prize_type: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="none">Без призов</option>
                <option value="cash">Денежный приз</option>
                <option value="non_cash">Неденежные призы</option>
              </select>
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            {form.prize_type === "cash" && <Input type="number" min="1" step="1" placeholder="Общий призовой фонд, ₽" value={form.cash_prize_amount_rub} onChange={(e) => setForm({ ...form, cash_prize_amount_rub: e.target.value })} />}
            {form.prize_type === "non_cash" && <Textarea maxLength={500} placeholder="Опишите призы: техника, стажировка, менторство и другое" rows={2} value={form.prize_description} onChange={(e) => setForm({ ...form, prize_description: e.target.value })} />}
            <Textarea placeholder="Правила (опционально)" rows={2} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={handleCreate}>Создать</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
            </div>
            </div>
          </Card>
        </Reveal>
      )}

      <Reveal className="mb-3 flex items-center justify-between gap-3" delay={0.1}>
        <div><h3 className="font-heading font-semibold">Метрики организации</h3><p className="mt-1 text-xs text-muted-foreground">Собственные Python-метрики для задач вашей организации.</p></div>
        <Button variant="outline" size="sm" onClick={() => { setMetricVersionTarget(null); setShowMetricCreate((value) => !value); }}><Gauge size={14} className="mr-1.5" /> Новая метрика</Button>
      </Reveal>
      {showMetricCreate && <Card className="mb-4 border-primary/30 bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {metricVersionTarget ? <div className="border-l-2 border-primary bg-primary/5 p-3 text-sm sm:col-span-2"><span className="font-semibold">Новая версия: {metricVersionTarget.name}</span><span className="ml-2 font-mono text-xs text-muted-foreground">{metricVersionTarget.code}</span></div> : <><Input placeholder="Код, например business_cost" value={metricForm.code} onChange={(e) => setMetricForm({ ...metricForm, code: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") })} /><Input placeholder="Название" value={metricForm.name} onChange={(e) => setMetricForm({ ...metricForm, name: e.target.value })} /><Textarea className="sm:col-span-2" rows={2} placeholder="Что измеряет метрика" value={metricForm.description} onChange={(e) => setMetricForm({ ...metricForm, description: e.target.value })} /></>}
          <select value={metricForm.direction} onChange={(e) => setMetricForm({ ...metricForm, direction: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="maximize">Максимизировать</option><option value="minimize">Минимизировать</option></select>
          <select value={metricForm.input_contract} onChange={(e) => setMetricForm({ ...metricForm, input_contract: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="tabular_v1">Табличные данные</option><option value="ranking_v1">Ранжирование</option></select>
          <Input placeholder="Формат результата, например 0.0000" value={metricForm.display_format} onChange={(e) => setMetricForm({ ...metricForm, display_format: e.target.value })} />
          <Input placeholder="Типы задач через запятую" value={metricForm.allowed_task_types} onChange={(e) => setMetricForm({ ...metricForm, allowed_task_types: e.target.value })} />
          {!metricVersionTarget && <select value={metricForm.visibility} onChange={(e) => setMetricForm({ ...metricForm, visibility: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="owner_only">Только организации</option><option value="public">Публичная после одобрения</option></select>}
          <label className="flex min-h-20 cursor-pointer items-center gap-3 border border-dashed border-border px-4 text-sm sm:col-span-2 hover:border-primary/40"><Upload size={18} className="text-primary" /><span className="min-w-0"><span className="block font-semibold">{metricFile?.name || "Выберите metric.py"}</span><span className="mt-1 block text-xs text-muted-foreground">Python 3.12, до 128 КБ</span></span><input type="file" accept=".py,text/x-python,text/plain" className="sr-only" onChange={(e) => setMetricFile(e.target.files?.[0] || null)} /></label>
        </div>
        <div className="mt-4 flex gap-2"><Button onClick={handleCreateMetric} disabled={metricPending}>{metricPending ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <FileCode2 size={15} className="mr-1.5" />} Загрузить и отправить</Button><Button variant="outline" onClick={() => { setShowMetricCreate(false); setMetricVersionTarget(null); }} disabled={metricPending}>Отмена</Button></div>
      </Card>}
      <div className="mb-8 grid gap-2 sm:grid-cols-2">{metrics.map((metric) => {
        const version = metric.current_version;
        const moderation = version?.moderation_status || (metric.status === "active" ? "approved" : "draft");
        return <Card key={metric.id} className="border-border bg-card/50 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{metric.name}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{metric.code} · v{version?.version || 1}</p></div><span className="shrink-0 border border-border px-2 py-1 text-[10px] font-semibold">{{ approved: "Одобрена", pending_review: "На модерации", pending_tests: "Тестируется", tests_failed: "Тесты не пройдены", changes_requested: "Нужны изменения", rejected: "Отклонена", disabled: "Отключена", draft: "Черновик" }[moderation] || moderation}</span></div>{version?.rejection_reason && <p className="mt-3 text-xs text-destructive">{version.rejection_reason}</p>}<div className="mt-3 flex flex-wrap gap-2">{["draft", "changes_requested", "tests_failed"].includes(moderation) && <Button variant="outline" size="sm" onClick={() => submitMetric(metric)}><Play size={13} className="mr-1.5" /> Отправить версию</Button>}<Button variant="outline" size="sm" onClick={() => setMetricHistoryTarget(metric)}><Eye size={13} className="mr-1.5" /> История</Button><Button variant="outline" size="sm" onClick={() => { setMetricVersionTarget(metric); setMetricForm((current) => ({ ...current, direction: version?.direction || "maximize", display_format: version?.display_format || "0.0000", input_contract: version?.input_contract || "tabular_v1", allowed_task_types: (version?.allowed_task_types || []).join(", ") })); setShowMetricCreate(true); }}><Plus size={13} className="mr-1.5" /> Новая версия</Button></div></Card>;
      })}{!metricsQuery.isLoading && metrics.length === 0 && <Card className="p-5 text-sm text-muted-foreground sm:col-span-2">Собственных метрик пока нет.</Card>}</div>
      {metricHistoryTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setMetricHistoryTarget(null)}><Card className="max-h-[80vh] w-full max-w-xl overflow-y-auto border-border bg-card p-5" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-3"><div><h3 className="font-heading text-lg font-semibold">История версий</h3><p className="mt-1 text-xs text-muted-foreground">{metricHistoryTarget.name} · {metricHistoryTarget.code}</p></div><Button variant="outline" size="sm" onClick={() => setMetricHistoryTarget(null)}>Закрыть</Button></div><div className="mt-4 divide-y divide-border border border-border">{metricHistoryQuery.isLoading ? <p className="p-4 text-sm text-muted-foreground">Загружаем версии...</p> : metricHistory.map((version) => <div key={version.id} className="p-4"><div className="flex items-center justify-between gap-3"><span className="font-semibold">Версия {version.version}</span><span className="border border-border px-2 py-1 text-[10px] font-semibold">{version.moderation_status}</span></div><p className="mt-2 text-xs text-muted-foreground">{version.input_contract} · {version.direction === "minimize" ? "меньше — лучше" : "больше — лучше"} · {version.source_checksum_sha256?.slice(0, 12) || "checksum недоступен"}</p>{version.rejection_reason && <p className="mt-2 text-xs text-destructive">{version.rejection_reason}</p>}</div>)}{!metricHistoryQuery.isLoading && metricHistory.length === 0 && <p className="p-4 text-sm text-muted-foreground">Версий пока нет.</p>}</div></Card></div>}

      {/* My competitions */}
      <Reveal delay={0.14}>
        <h3 className="font-heading font-semibold mb-3">Мои соревнования</h3>
      </Reveal>
      {competitions?.length === 0 ? (
        <Card className="p-6 text-center bg-card/40 border-border mb-6">
          <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Пока нет соревнований</p>
        </Card>
      ) : (
        <Stagger className="space-y-2 mb-8" delay={0.16}>
          {competitions?.map((c) => (
            <StaggerItem key={c.id}>
              <Link to={`/competitions/${c.id}`}>
                <Card className="p-4 bg-card/40 border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{TASK_TYPE_LABELS[c.task_type] || c.task_type} · {c.participants_count ?? "—"} участников</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${c.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                    {c.status === "active" ? "Активно" : c.status}
                  </span>
                </div>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* HR candidates */}
      <Reveal className="flex items-center justify-between gap-3 mb-3" delay={0.2}>
        <h3 className="font-heading font-semibold">HR-воронка · Кандидаты</h3>
        <div className="flex gap-2">
          <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs">
            <option value="all">Все навыки</option>
            <option value="nlp">NLP</option>
            <option value="cv">CV</option>
            <option value="tabular">Табличные</option>
          </select>
        </div>
      </Reveal>

      {filteredProfiles.length === 0 ? (
        <Card className="p-6 text-center bg-card/40 border-border">
          <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Кандидаты не найдены</p>
        </Card>
      ) : (
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" delay={0.22}>
          {filteredProfiles.map((p) => (
            <StaggerItem key={p.id}>
              <Card className="p-4 bg-card/40 border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={p.user_name} src={p.avatar_url} size={40} />
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${p.user_id || p.id}`} className="font-medium text-sm truncate block hover:text-primary">{p.user_name}</Link>
                  <LeagueBadge rating={p.rating} size="sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs text-center mb-3">
                <div><div className="font-bold">{p.rating}</div><div className="text-muted-foreground">рейтинг</div></div>
                <div><div className="font-bold">{p.duels_won}</div><div className="text-muted-foreground">дуэлей</div></div>
                <div><div className="font-bold">{p.competitions_won}</div><div className="text-muted-foreground">побед</div></div>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/profile/${p.user_id || p.id}`}><Eye size={12} className="mr-1" /> Профиль</Link>
                </Button>
                <Button size="sm" className="flex-1" onClick={() => setInviteModal(p)}>
                  <Send size={12} className="mr-1" /> Пригласить
                </Button>
              </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* Invite modal */}
      {inviteModal && (
        <Reveal
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          y={8}
          onClick={() => setInviteModal(null)}
        >
          <Card className="p-5 bg-card border-border max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-semibold mb-1">Приглашение для {inviteModal.user_name}</h3>
            <p className="text-xs text-muted-foreground mb-4">Подготовьте текст и скопируйте его для отправки через публичные контакты кандидата.</p>
            <Textarea
              placeholder="Текст приглашения..."
              rows={4}
              value={inviteMsg}
              onChange={(e) => setInviteMsg(e.target.value)}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button onClick={handleSendInvite} disabled={!inviteMsg}><Send size={14} className="mr-1.5" /> Скопировать</Button>
              <Button variant="outline" onClick={() => setInviteModal(null)}>Отмена</Button>
            </div>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
