import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ml/Avatar";
import StatCard from "@/components/ml/StatCard";
import { Users, Trophy, Building2, Database, ScrollText, Loader2, Trash2, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Admin() {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: competitions } = useQuery({
    queryKey: ["admin-competitions"],
    queryFn: () => base44.entities.Competition.list("-created_date", 20),
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: () => base44.entities.MLProfile.list("-created_date", 20),
  });

  const { data: duels } = useQuery({
    queryKey: ["admin-duels"],
    queryFn: () => base44.entities.Duel.list("-created_date", 10),
  });

  const handleDeleteCompetition = async (id) => {
    try {
      await base44.entities.Competition.delete(id);
      toast.success("Соревнование удалено");
      queryClient.invalidateQueries({ queryKey: ["admin-competitions"] });
    } catch (err) {
      toast.error("Ошибка: " + (err.message || "неизвестная"));
    }
  };

  const handleGenerateDataset = async () => {
    setGenerating(true);
    try {
      const generators = [
        { title: "Регрессия: цены квартир", desc: "Синтетический датасет с 8 признаками и целевой переменной — цена. Метрика RMSE.", metric: "rmse", task_type: "regression" },
        { title: "Классификация: отток клиентов", desc: "Синтетические данные клиентов телекома. 10 признаков, бинарный таргет. Метрика ROC-AUC.", metric: "roc_auc", task_type: "classification" },
        { title: "NLP: тональность отзывов", desc: "5000 синтетических отзывов с метками тональности. Метрика Accuracy.", metric: "accuracy", task_type: "nlp" },
      ];
      const gen = generators[Math.floor(Math.random() * generators.length)];
      const seed = Math.floor(Math.random() * 1000000);
      await base44.entities.Competition.create({
        ...gen,
        status: "active",
        company_name: "ML Арена (синтетический)",
        max_submits_free: 5,
        max_submits_pro: 15,
        participants_count: 0,
        banner_color: "#10B981",
        data_url: `#synthetic-${seed}-train`,
        test_data_url: `#synthetic-${seed}-test`,
        rules: `Сгенерировано с seed=${seed}. Стандартные правила применяются.`,
      });
      toast.success(`Датасет сгенерирован (seed: ${seed})`);
      queryClient.invalidateQueries({ queryKey: ["admin-competitions"] });
    } catch (err) {
      toast.error("Ошибка: " + (err.message || "неизвестная"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Админ-панель</h1>
        <p className="text-muted-foreground text-sm mt-1">Управление платформой</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="Пользователи" value={profiles?.length || 0} color="#7C3AED" />
        <StatCard icon={Trophy} label="Соревнования" value={competitions?.length || 0} color="#06B6D4" />
        <StatCard icon={Building2} label="Дуэли" value={duels?.length || 0} color="#EC4899" />
        <StatCard icon={Database} label="Сущностей" value={8} color="#F59E0B" />
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <Card className="p-5 bg-card/40 border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold">Генерация синтетических данных</h3>
              <p className="text-sm text-muted-foreground mt-0.5 mb-3">Создать соревнование со случайным датасетом</p>
              <Button onClick={handleGenerateDataset} disabled={generating} className="w-full">
                {generating ? <Loader2 size={16} className="mr-1.5 animate-spin" /> : <Database size={16} className="mr-1.5" />}
                {generating ? "Генерация..." : "Сгенерировать"}
              </Button>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-card/40 border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <ScrollText size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold">Модерация контента</h3>
              <p className="text-sm text-muted-foreground mt-0.5 mb-3">Проверка описаний и обсуждений</p>
              <Button variant="outline" className="w-full">Открыть очередь</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Competitions table */}
      <h3 className="font-heading font-semibold mb-3">Управление соревнованиями</h3>
      {competitions?.length === 0 ? (
        <Card className="p-6 text-center bg-card/40 border-border">
          <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Соревнований нет</p>
        </Card>
      ) : (
        <Card className="overflow-hidden bg-card/40 border-border">
          <div className="divide-y divide-border">
            {competitions?.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.company_name} · {c.participants_count || 0} участников</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${c.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                  {c.status}
                </span>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCompetition(c.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent duels */}
      <h3 className="font-heading font-semibold mt-6 mb-3">Последние дуэли</h3>
      <Card className="overflow-hidden bg-card/40 border-border">
        <div className="divide-y divide-border">
          {duels?.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Дуэлей нет</p>}
          {duels?.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={d.player1_name} size={28} />
              <span className="text-xs text-muted-foreground">vs</span>
              <Avatar name={d.player2_name} size={28} />
              <span className="text-sm flex-1 truncate">{d.task_title}</span>
              {d.winner_name && <span className="text-xs text-emerald-400">Победа: {d.winner_name}</span>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}