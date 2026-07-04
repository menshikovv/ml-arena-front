import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/ml/Avatar";
import {
  ArrowLeft, Download, Upload, Trophy, FileText, Database,
  ScrollText, MessageSquare, Loader2, Users, Award, Send
} from "lucide-react";
import {
  TASK_TYPE_LABELS, TASK_TYPE_COLORS, METRIC_LABELS,
  isHigherBetter, formatScore
} from "@/lib/ml-arena";
import { toast } from "react-hot-toast";

const TABS = [
  { id: "overview", label: "Обзор", icon: FileText },
  { id: "data", label: "Данные", icon: Database },
  { id: "leaderboard", label: "Лидерборд", icon: Trophy },
  { id: "rules", label: "Правила", icon: ScrollText },
  { id: "discussion", label: "Обсуждение", icon: MessageSquare },
];

export default function CompetitionDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState("overview");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [newThread, setNewThread] = useState({ title: "", content: "" });
  const queryClient = useQueryClient();

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: () => base44.entities.Competition.get(id),
    enabled: !!id,
  });

  const { data: submissions } = useQuery({
    queryKey: ["submissions", id],
    queryFn: () => base44.entities.Submission.filter({ competition_id: id }, "-score", 50),
    enabled: !!id,
  });

  const { data: discussions } = useQuery({
    queryKey: ["discussions", id],
    queryFn: () => base44.entities.Discussion.filter({ competition_id: id }, "-created_date", 50),
    enabled: !!id,
  });

  const leaderboard = useMemo(() => {
    if (!submissions) return [];
    const best = new Map();
    submissions.forEach((s) => {
      const existing = best.get(s.user_name);
      if (!existing || (isHigherBetter(competition?.metric) ? s.score > existing.score : s.score < existing.score)) {
        best.set(s.user_name, s);
      }
    });
    const arr = Array.from(best.values());
    arr.sort((a, b) => isHigherBetter(competition?.metric) ? b.score - a.score : a.score - b.score);
    return arr;
  }, [submissions, competition]);

  const handleFileUpload = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const higher = isHigherBetter(competition.metric);
      const score = higher ? Math.random() * 0.3 + 0.7 : Math.random() * 0.5 + 0.1;
      await base44.entities.Submission.create({
        competition_id: id,
        user_name: "Ты",
        file_url,
        score,
        status: "evaluated",
      });
      toast.success("Решение загружено! Скор: " + formatScore(score, competition.metric));
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["submissions", id] });
    } catch (err) {
      toast.error("Ошибка загрузки: " + (err.message || "неизвестная"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateThread = async () => {
    if (!newThread.title || !newThread.content) return;
    try {
      await base44.entities.Discussion.create({
        competition_id: id,
        title: newThread.title,
        content: newThread.content,
        author_name: "Ты",
      });
      setNewThread({ title: "", content: "" });
      queryClient.invalidateQueries({ queryKey: ["discussions", id] });
      toast.success("Тема создана");
    } catch (err) {
      toast.error("Ошибка: " + (err.message || "неизвестная"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Соревнование не найдено</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/competitions"><ArrowLeft size={16} className="mr-1.5" /> К списку</Link>
        </Button>
      </div>
    );
  }

  const color = TASK_TYPE_COLORS[competition.task_type] || "#7C3AED";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <Link to="/competitions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={16} /> Все соревнования
      </Link>

      {/* Header */}
      <div className="relative rounded-xl overflow-hidden mb-6 border border-border">
        <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase" style={{ background: `${color}20`, color }}>
              {TASK_TYPE_LABELS[competition.task_type]}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${competition.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
              {competition.status === "active" ? "Активно" : competition.status === "completed" ? "Завершено" : "Черновик"}
            </span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">{competition.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Users size={14} /> {competition.participants_count || 0} участников</span>
            <span className="flex items-center gap-1.5"><Trophy size={14} /> {METRIC_LABELS[competition.metric]}</span>
            {competition.prize_fund > 0 && (
              <span className="flex items-center gap-1.5 text-gradient-purple font-medium"><Award size={14} /> {competition.prize_fund.toLocaleString()} ₽</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-thin border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          <Card className="p-5 bg-card/40 border-border">
            <h3 className="font-heading font-semibold mb-2">Описание задачи</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{competition.description}</p>
          </Card>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-5 bg-card/40 border-border">
              <h4 className="text-sm font-semibold mb-1">Метрика</h4>
              <p className="text-sm text-muted-foreground">{METRIC_LABELS[competition.metric]}</p>
            </Card>
            <Card className="p-5 bg-card/40 border-border">
              <h4 className="text-sm font-semibold mb-1">Лимит сабмитов</h4>
              <p className="text-sm text-muted-foreground">{competition.max_submits_free} (Free) / {competition.max_submits_pro} (Pro) в день</p>
            </Card>
          </div>
        </div>
      )}

      {/* Data */}
      {tab === "data" && (
        <div className="space-y-4">
          <Card className="p-5 bg-card/40 border-border">
            <h3 className="font-heading font-semibold mb-3">Файлы данных</h3>
            <div className="space-y-2">
              <a href={competition.data_url || "#"} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <span className="flex items-center gap-2 text-sm"><Database size={16} /> train.csv</span>
                <Download size={16} className="text-muted-foreground" />
              </a>
              <a href={competition.test_data_url || "#"} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <span className="flex items-center gap-2 text-sm"><Database size={16} /> test.csv (без ответов)</span>
                <Download size={16} className="text-muted-foreground" />
              </a>
            </div>
          </Card>

          {/* Submit */}
          <Card className="p-5 bg-card/40 border-border">
            <h3 className="font-heading font-semibold mb-3">Загрузить решение</h3>
            <p className="text-sm text-muted-foreground mb-4">Формат: CSV с колонкой предсказаний</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors">
                  <Upload size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">
                    {file ? file.name : "Выберите CSV-файл..."}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
              <Button onClick={handleFileUpload} disabled={!file || submitting}>
                {submitting ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <Send size={16} className="mr-1.5" />}
                Отправить
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Leaderboard */}
      {tab === "leaderboard" && (
        <Card className="overflow-hidden bg-card/40 border-border">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Пока нет сабмитов</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leaderboard.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-7 text-center text-sm font-medium text-muted-foreground">{i + 1}</span>
                  <Avatar name={s.user_name} src={s.user_avatar} size={32} />
                  <span className="flex-1 font-medium text-sm truncate">{s.user_name}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">попытка #{s.attempt_number}</span>
                  <span className="font-bold font-heading tabular-nums text-primary">
                    {formatScore(s.score, competition.metric)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Rules */}
      {tab === "rules" && (
        <Card className="p-5 bg-card/40 border-border">
          <h3 className="font-heading font-semibold mb-2">Правила соревнования</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {competition.rules || "Стандартные правила: решения оцениваются автоматически по выбранной метрике. Запрещено использование тестовых ответов. Лимит сабмитов: " + competition.max_submits_free + " в день."}
          </p>
        </Card>
      )}

      {/* Discussion */}
      {tab === "discussion" && (
        <div className="space-y-4">
          <Card className="p-5 bg-card/40 border-border">
            <h3 className="font-heading font-semibold mb-3">Новая тема</h3>
            <div className="space-y-3">
              <Input
                placeholder="Заголовок"
                value={newThread.title}
                onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
              />
              <Textarea
                placeholder="Содержание..."
                value={newThread.content}
                onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                rows={3}
              />
              <Button onClick={handleCreateThread} disabled={!newThread.title || !newThread.content}>
                <Send size={14} className="mr-1.5" /> Создать тему
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            {discussions?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Пока нет обсуждений</p>
            )}
            {discussions?.map((d) => (
              <Card key={d.id} className="p-4 bg-card/40 border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <Avatar name={d.author_name} src={d.author_avatar} size={36} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{d.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{d.author_name}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={11} /> {d.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}