import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Avatar from "@/components/ml/Avatar";
import LeagueBadge from "@/components/ml/LeagueBadge";
import CountdownTimer from "@/components/ml/CountdownTimer";
import {
  ArrowLeft, Swords, Upload, Send, MessageSquare, Clock,
  Download, Trophy, Share2, Loader2, FileText
} from "lucide-react";
import { TASK_TYPE_LABELS, formatScore } from "@/lib/ml-arena";
import { toast } from "react-hot-toast";

export default function DuelLobby() {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const queryClient = useQueryClient();

  const { data: duel, isLoading } = useQuery({
    queryKey: ["duel", id],
    queryFn: () => base44.entities.Duel.get(id),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const endTime = useMemo(() => {
    if (!duel?.started_at) return null;
    return new Date(new Date(duel.started_at).getTime() + (duel.duration_minutes || 60) * 60000).toISOString();
  }, [duel]);

  const handleUpload = async () => {
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const score = Math.random() * 0.3 + 0.7;
      const isPlayer1 = duel.player1_name === "Ты";
      const updates = {
        player1_file_url: isPlayer1 ? file_url : duel.player1_file_url,
        player1_score: isPlayer1 ? score : duel.player1_score,
        player1_submitted_at: isPlayer1 ? new Date().toISOString() : duel.player1_submitted_at,
        player2_file_url: !isPlayer1 ? file_url : duel.player2_file_url,
        player2_score: !isPlayer1 ? score : duel.player2_score,
        player2_submitted_at: !isPlayer1 ? new Date().toISOString() : duel.player2_submitted_at,
      };
      await base44.entities.Duel.update(id, updates);
      toast.success("Решение загружено! Скор: " + formatScore(score, duel.metric));
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["duel", id] });
    } catch (err) {
      toast.error("Ошибка: " + (err.message || "неизвестная"));
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, { author: "Ты", text: chatInput, time: new Date() }]);
    setChatInput("");
    setTimeout(() => {
      setMessages((prev) => [...prev, { author: duel.player2_name, text: "Принято! Удачи 🤝", time: new Date() }]);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!duel) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Дуэль не найдена</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/duels"><ArrowLeft size={16} className="mr-1.5" /> К дуэлям</Link>
        </Button>
      </div>
    );
  }

  const isCompleted = duel.status === "completed";
  const bothSubmitted = duel.player1_file_url && duel.player2_file_url;
  const winner = duel.winner_name;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <Link to="/duels" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={16} /> К дуэлям
      </Link>

      {/* Players vs header */}
      <div className="flex items-center justify-center gap-4 md:gap-8 mb-6">
        <div className="text-center">
          <Avatar name={duel.player1_name} src={duel.player1_avatar} size={56} />
          <p className="font-medium text-sm mt-2 max-w-[100px] truncate">{duel.player1_name}</p>
          <div className="mt-1"><LeagueBadge rating={duel.player1_rating} size="sm" /></div>
        </div>

        <div className="text-center">
          <Swords size={32} className="text-primary mx-auto animate-pulse" />
          <p className="text-xs text-muted-foreground mt-1">VS</p>
        </div>

        <div className="text-center">
          <Avatar name={duel.player2_name} src={duel.player2_avatar} size={56} />
          <p className="font-medium text-sm mt-2 max-w-[100px] truncate">{duel.player2_name}</p>
          <div className="mt-1"><LeagueBadge rating={duel.player2_rating} size="sm" /></div>
        </div>
      </div>

      {/* Timer */}
      {!isCompleted && (
        <Card className="p-6 bg-card/60 border-border mb-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock size={16} /> Времени осталось
          </div>
          <CountdownTimer endTime={endTime} size="lg" />
        </Card>
      )}

      {/* Result */}
      {isCompleted && winner && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-6 bg-card/60 border-primary border-2 mb-6 text-center glow-purple">
            <Trophy size={40} className="mx-auto text-primary mb-2" />
            <h2 className="font-heading text-2xl font-bold">
              Победитель: {winner}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Изменение рейтинга: <span className="text-emerald-400 font-medium">+{duel.rating_change || 0}</span>
            </p>
            <Button variant="outline" size="sm" className="mt-4">
              <Share2 size={14} className="mr-1.5" /> Поделиться результатом
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Task */}
      <Card className="p-5 bg-card/40 border-border mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-primary/20 text-primary mb-2">
              {TASK_TYPE_LABELS[duel.task_type]}
            </span>
            <h3 className="font-heading font-semibold text-lg">{duel.task_title}</h3>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={duel.dataset_url || "#"}>
              <Download size={14} className="mr-1.5" /> Датасет
            </a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{duel.task_description}</p>
      </Card>

      {/* Submit solution */}
      {!isCompleted && (
        <Card className="p-5 bg-card/40 border-border mb-6">
          <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <Upload size={18} /> Загрузить решение
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors">
                <FileText size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">
                  {file ? file.name : "Выберите CSV-файл..."}
                </span>
              </div>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
            <Button onClick={handleUpload} disabled={!file}>
              <Send size={14} className="mr-1.5" /> Отправить
            </Button>
          </div>
          {duel.player1_file_url && <p className="text-xs text-emerald-400 mt-2">✓ Решение загружено</p>}
        </Card>
      )}

      {/* Solutions (after completion) */}
      {(isCompleted || bothSubmitted) && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {[
            { name: duel.player1_name, score: duel.player1_score, file: duel.player1_file_url },
            { name: duel.player2_name, score: duel.player2_score, file: duel.player2_file_url },
          ].map((s, i) => (
            <Card key={i} className="p-4 bg-card/40 border-border">
              <div className="flex items-center gap-2 mb-2">
                <Avatar name={s.name} size={28} />
                <span className="font-medium text-sm flex-1 truncate">{s.name}</span>
                {winner === s.name && <Trophy size={14} className="text-primary" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Скор:</span>
                <span className="font-bold font-heading text-primary">{formatScore(s.score, duel.metric)}</span>
              </div>
              {s.file && (
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <a href={s.file}><Download size={12} className="mr-1" /> Решение</a>
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Chat toggle */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setChatOpen(!chatOpen)}
      >
        <MessageSquare size={16} className="mr-1.5" />
        {chatOpen ? "Скрыть чат" : "Открыть чат"}
      </Button>

      {chatOpen && (
        <Card className="mt-3 bg-card/40 border-border overflow-hidden">
          <div className="h-48 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Сообщений пока нет</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.author === "Ты" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-3 py-1.5 rounded-lg text-sm ${m.author === "Ты" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-2 border-t border-border">
            <Input
              placeholder="Сообщение..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
            />
            <Button size="icon" onClick={sendChat}><Send size={14} /></Button>
          </div>
        </Card>
      )}
    </div>
  );
}