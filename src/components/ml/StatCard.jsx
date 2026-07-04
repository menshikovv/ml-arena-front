import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ icon: Icon, label, value, sublabel, trend, color = "#7C3AED" }) {
  return (
    <Card className="relative overflow-hidden p-4 bg-card/60 border-border">
      <div
        className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ background: color }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1 font-heading">{value}</p>
          {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20`, color }}
        >
          <Icon size={18} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`relative mt-2 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend >= 0 ? "+" : ""}{trend}
        </div>
      )}
    </Card>
  );
}