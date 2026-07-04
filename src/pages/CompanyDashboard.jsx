import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import StatCard from "@/components/ml/StatCard";
import { Trophy, Users, Send, Plus, Eye,
  Filter, Briefcase
} from "lucide-react";
import { TASK_TYPE_LABELS, METRIC_LABELS } from "@/lib/ml-arena";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";

export default function CompanyDashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", task_type: "classification", metric: "accuracy",
    prize_fund: 0, deadline: "", rules: "",
  });
  const [skillFilter, setSkillFilter] = useState("all");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [inviteModal, setInviteModal] = useState(null);
  const [inviteMsg, setInviteMsg] = useState("");
  const queryClient = useQueryClient();

  const { data: competitions } = useQuery({
    queryKey: ["company-competitions"],
    queryFn: () => base44.entities.Competition.filter({ company_name: "Моя компания" }, "-created_date", 20),
  });

  const { data: profiles } = useQuery({
    queryKey: ["visible-profiles"],
    queryFn: () => base44.entities.MLProfile.filter({ visible_to_employers: true }, "-rating", 50),
  });

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter((p) => {
      if (leagueFilter !== "all") {
        if (leagueFilter === "bronze" && p.rating >= 1100) return false;
        if (leagueFilter === "silver" && (p.rating < 1100 || p.rating >= 1300)) return false;
        if (leagueFilter === "gold" && (p.rating < 1300 || p.rating >= 1500)) return false;
        if (leagueFilter === "platinum" && p.rating < 1500) return false;
      }
      if (skillFilter !== "all") {
        const skillMap = { nlp: "skill_nlp", cv: "skill_cv", tabular: "skill_tabular" };
        if ((p[skillMap[skillFilter]] || 0) < 30) return false;
      }
      return true;
    });
  }, [profiles, skillFilter, leagueFilter]);

  const handleCreate = async () => {
    if (!form.title || !form.description) {
      toast.error("Заполните название и описание");
      return;
    }
    try {
      await base44.entities.Competition.create({
        ...form,
        status: "active",
        company_name: "Моя компания",
        max_submits_free: 5,
        max_submits_pro: 15,
        prize_fund: Number(form.prize_fund) || 0,
        participants_count: 0,
        banner_color: "#7C3AED",
      });
      toast.success("Соревнование создано!");
      setShowCreate(false);
      setForm({ title: "", description: "", task_type: "classification", metric: "accuracy", prize_fund: 0, deadline: "", rules: "" });
      queryClient.invalidateQueries({ queryKey: ["company-competitions"] });
    } catch (err) {
      toast.error("Ошибка: " + (err.message || "неизвестная"));
    }
  };

  const handleSendInvite = async () => {
    if (!inviteMsg) return;
    try {
      await base44.entities.JobInvite.create({
        company_name: "Моя компания",
        candidate_name: inviteModal.user_name,
        candidate_email: inviteModal.user_name + "@example.com",
        message: inviteMsg,
        position: "ML Engineer",
        status: "pending",
      });
      await base44.integrations.Core.SendEmail({
        to: inviteModal.user_name + "@example.com",
        subject: "Приглашение на собеседование от Моя компания",
        body: `Здравствуйте, ${inviteModal.user_name}!\n\n${inviteMsg}\n\nС уважением,\nкоманда Моя компания`,
      });
      toast.success("Приглашение отправлено!");
      setInviteModal(null);
      setInviteMsg("");
    } catch (err) {
      toast.error("Ошибка: " + (err.message || "неизвестная"));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Кабинет компании</h1>
          <p className="text-muted-foreground text-sm mt-1">Управляй соревнованиями и находи таланты</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus size={16} className="mr-1.5" /> Создать соревнование
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard icon={Trophy} label="Соревнования" value={competitions?.length || 0} color="#7C3AED" />
        <StatCard icon={Users} label="Кандидатов видно" value={profiles?.length || 0} color="#06B6D4" />
        <StatCard icon={Briefcase} label="Приглашений отправлено" value={0} color="#F59E0B" />
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="p-5 bg-card/60 border-primary/30 mb-6">
          <h3 className="font-heading font-semibold mb-4">Новое соревнование</h3>
          <div className="space-y-3">
            <Input placeholder="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Описание задачи" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })} className="px-3 py-2 rounded-lg bg-card border border-border text-sm">
                {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className="px-3 py-2 rounded-lg bg-card border border-border text-sm">
                {Object.entries(METRIC_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
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
      )}

      {/* My competitions */}
      <h3 className="font-heading font-semibold mb-3">Мои соревнования</h3>
      {competitions?.length === 0 ? (
        <Card className="p-6 text-center bg-card/40 border-border mb-6">
          <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Пока нет соревнований</p>
        </Card>
      ) : (
        <div className="space-y-2 mb-8">
          {competitions?.map((c) => (
            <Link key={c.id} to={`/competitions/${c.id}`}>
              <Card className="p-4 bg-card/40 border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{TASK_TYPE_LABELS[c.task_type]} · {c.participants_count || 0} участников</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${c.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                    {c.status === "active" ? "Активно" : c.status}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* HR candidates */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-heading font-semibold">HR-воронка · Кандидаты</h3>
        <div className="flex gap-2">
          <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs">
            <option value="all">Все навыки</option>
            <option value="nlp">NLP</option>
            <option value="cv">CV</option>
            <option value="tabular">Табличные</option>
          </select>
          <select value={leagueFilter} onChange={(e) => setLeagueFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs">
            <option value="all">Все лиги</option>
            <option value="bronze">Бронза</option>
            <option value="silver">Серебро</option>
            <option value="gold">Золото</option>
            <option value="platinum">Платина</option>
          </select>
        </div>
      </div>

      {filteredProfiles.length === 0 ? (
        <Card className="p-6 text-center bg-card/40 border-border">
          <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Кандидаты не найдены</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProfiles.map((p) => (
            <Card key={p.id} className="p-4 bg-card/40 border-border hover:border-primary/30 transition-colors">
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
          ))}
        </div>
      )}

      {/* Invite modal */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setInviteModal(null)}>
          <Card className="p-5 bg-card border-border max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-semibold mb-1">Приглашение для {inviteModal.user_name}</h3>
            <p className="text-xs text-muted-foreground mb-4">Сообщение будет отправлено на email и в платформу</p>
            <Textarea
              placeholder="Текст приглашения..."
              rows={4}
              value={inviteMsg}
              onChange={(e) => setInviteMsg(e.target.value)}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button onClick={handleSendInvite} disabled={!inviteMsg}><Send size={14} className="mr-1.5" /> Отправить</Button>
              <Button variant="outline" onClick={() => setInviteModal(null)}>Отмена</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}