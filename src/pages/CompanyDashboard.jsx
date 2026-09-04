import React, { useState, useMemo } from "react";
import { api } from "@/api/mlArenaApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import StatCard from "@/components/ml/StatCard";
import { Trophy, Users, Send, Plus, Eye, Filter } from "lucide-react";
import { TASK_TYPE_LABELS } from "@/lib/ml-arena";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";

export default function CompanyDashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    task_version_id: "", title: "", description: "",
    prize_fund: 0, deadline: "", rules: "",
  });
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
        prize_amount: Math.round((Number(form.prize_fund) || 0) * 100),
        rules: form.rules.trim() || null,
      });
      toast.success("Соревнование создано!");
      setShowCreate(false);
      setForm({ task_version_id: "", title: "", description: "", prize_fund: 0, deadline: "", rules: "" });
      queryClient.invalidateQueries({ queryKey: ["company-competitions"] });
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
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus size={16} className="mr-1.5" /> Создать соревнование
        </Button>
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
              <Input type="number" placeholder="Призовой фонд (₽)" value={form.prize_fund} onChange={(e) => setForm({ ...form, prize_fund: e.target.value })} />
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <Textarea placeholder="Правила (опционально)" rows={2} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={handleCreate}>Создать</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
            </div>
            </div>
          </Card>
        </Reveal>
      )}

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
                  <Link to={`/profile/${p.id}`} className="font-medium text-sm truncate block hover:text-primary">{p.user_name}</Link>
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
                  <Link to={`/profile/${p.id}`}><Eye size={12} className="mr-1" /> Профиль</Link>
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
