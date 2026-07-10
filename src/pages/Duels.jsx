import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import { Swords, Loader2, Zap, Search, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

const OPPONENTS = [
  { name: "ml_ninja", rating: 1180, avatar: null },
  { name: "datawizard", rating: 1050, avatar: null },
  { name: "ai_glider", rating: 1320, avatar: null },
  { name: "neuralfox", rating: 990, avatar: null },
  { name: "tensorlord", rating: 1450, avatar: null },
];

export default function Duels() {
  const [searchNick, setSearchNick] = useState("");
  const queryClient = useQueryClient();

  const { data: duels, isLoading } = useQuery({
    queryKey: ["duels"],
    queryFn: () => base44.entities.Duel.list("-created_date", 20),
  });

  const createDuelMutation = useMutation({
    mutationFn: async (opponent) => {
      const tasks = [
        { title: "Предсказание цен недвижимости", desc: "Регрессия: предскажи цены на дома по 12 признакам. Метрика — RMSE.", metric: "rmse", task_type: "regression" },
        { title: "Классификация отзывов", desc: "NLP: определи тональность отзывов (позитив/негатив). Метрика — Accuracy.", metric: "accuracy", task_type: "nlp" },
        { title: "Детекция мошенничества", desc: "Бинарная классификация транзакций. Метрика — ROC-AUC.", metric: "roc_auc", task_type: "classification" },
      ];
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      return base44.entities.Duel.create({
        ...task,
        player1_name: "Ты",
        player1_rating: 1000,
        player2_name: opponent.name,
        player2_rating: opponent.rating,
        player2_avatar: opponent.avatar,
        status: "active",
        started_at: new Date().toISOString(),
        duration_minutes: 60,
        dataset_url: "#",
      });
    },
    onSuccess: (duel) => {
      toast.success("Дуэль создана!");
      queryClient.invalidateQueries({ queryKey: ["duels"] });
      window.location.href = `/duels/${duel.id}`;
    },
    onError: (err) => toast.error("Ошибка: " + (err.message || "неизвестная")),
  });

  const matchedOpponent = useMemo(() => {
    if (!searchNick) return null;
    return OPPONENTS.find((o) => o.name.toLowerCase().includes(searchNick.toLowerCase()));
  }, [searchNick]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Дуэли 1×1</h1>
        <p className="text-muted-foreground text-sm mt-1">Вызови соперника или найди случайный матч</p>
      </div>

      {/* Find opponent */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="p-5 bg-card/40 border-border">
          <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <Search size={18} /> Поиск по нику
          </h3>
          <Input
            placeholder="Введите ник соперника..."
            value={searchNick}
            onChange={(e) => setSearchNick(e.target.value)}
            className="mb-3"
          />
          {matchedOpponent && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 mb-3">
              <Avatar name={matchedOpponent.name} size={36} />
              <div className="flex-1">
                <p className="text-sm font-medium">{matchedOpponent.name}</p>
                <LeagueBadge rating={matchedOpponent.rating} size="sm" />
              </div>
              <Button size="sm" onClick={() => createDuelMutation.mutate(matchedOpponent)}>
                <Swords size={14} className="mr-1" /> Вызов
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-5 bg-card/40 border-border flex flex-col">
          <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <Zap size={18} /> Случайный матч
          </h3>
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            Система подберёт соперника с близким рейтингом (разница ≤ 200 очков).
          </p>
          <Button onClick={() => createDuelMutation.mutate(OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)])}>
            <Zap size={16} className="mr-1.5" /> Найти соперника
          </Button>
        </Card>
      </div>

      {/* Available opponents */}
      <h3 className="font-heading font-semibold mb-3">Доступные соперники</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {OPPONENTS.map((o) => (
          <Card key={o.name} className="p-4 bg-card/40 border-border hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={o.name} src={o.avatar} size={40} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{o.name}</p>
                <LeagueBadge rating={o.rating} size="sm" />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span>Рейтинг: <span className="font-bold text-foreground">{o.rating}</span></span>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={() => createDuelMutation.mutate(o)}>
              <Swords size={14} className="mr-1.5" /> Вызвать на дуэль
            </Button>
          </Card>
        ))}
      </div>

      {/* History */}
      <h3 className="font-heading font-semibold mb-3">История дуэлей</h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : duels?.length === 0 ? (
        <Card className="p-8 text-center bg-card/40 border-border">
          <Swords className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">У тебя пока нет дуэлей</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {duels?.map((d) => (
            <Link key={d.id} to={`/duels/${d.id}`}>
              <Card className="p-4 bg-card/40 border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar name={d.player1_name} size={32} />
                  <span className="text-sm font-medium w-20 truncate">{d.player1_name}</span>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <Avatar name={d.player2_name} size={32} />
                  <span className="text-sm font-medium w-20 truncate">{d.player2_name}</span>
                  <div className="flex-1" />
                  {d.status === "completed" && d.winner_name && (
                    <span className="text-xs text-emerald-400 font-medium">
                      Победа: {d.winner_name === "Ты" ? "Ты" : d.winner_name}
                    </span>
                  )}
                  <ArrowRight size={14} className="text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}