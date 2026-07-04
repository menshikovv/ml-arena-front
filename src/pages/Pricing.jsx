import React from "react";
import { Link } from "react-router-dom";
import { Check, X, Crown, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PLANS = [
  {
    name: "Free",
    price: "0",
    period: "навсегда",
    icon: Shield,
    color: "#64748B",
    features: [
      { text: "Базовое участие в соревнованиях", included: true },
      { text: "5 сабмитов в день", included: true },
      { text: "Доступ к публичным дуэлям", included: true },
      { text: "Базовый ML-паспорт", included: true },
      { text: "Закрытые турниры", included: false },
      { text: "Полные разборы решений", included: false },
    ],
  },
  {
    name: "Pro",
    price: "990",
    period: "в месяц",
    icon: Zap,
    color: "#7C3AED",
    popular: true,
    features: [
      { text: "Всё из Free", included: true },
      { text: "15 сабмитов в день", included: true },
      { text: "Закрытые турниры", included: true },
      { text: "Полные разборы решений", included: true },
      { text: "Типовые задачи с собеседований", included: true },
      { text: "Приоритет в дуэлях", included: true },
    ],
  },
  {
    name: "Premium",
    price: "2 490",
    period: "в месяц",
    icon: Crown,
    color: "#06B6D4",
    features: [
      { text: "Всё из Pro", included: true },
      { text: "Менторское сопровождение проектов", included: true },
      { text: "Приоритет в HR-воронке", included: true },
      { text: "Ежемесячные вебинары", included: true },
      { text: "Скидка 20% на менторские сессии", included: true },
      { text: "Эксклюзивные соревнования", included: true },
    ],
  },
];

export default function Pricing() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Подписки</h1>
        <p className="text-muted-foreground">Выбери план, чтобы раскрыть весь потенциал арены</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`relative p-6 bg-card/60 border-border ${
              plan.popular ? "border-primary glow-purple" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                Популярный
              </div>
            )}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: `${plan.color}20`, color: plan.color }}
            >
              <plan.icon size={20} />
            </div>
            <h3 className="font-heading text-xl font-bold mb-1">{plan.name}</h3>
            <div className="mb-5">
              <span className="text-3xl font-bold font-heading">{plan.price}</span>
              <span className="text-muted-foreground ml-1">₽ / {plan.period}</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {plan.features.map((f, i) => (
                <li key={i} className={`flex items-start gap-2 text-sm ${f.included ? "" : "text-muted-foreground"}`}>
                  {f.included ? (
                    <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <X size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  {f.text}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              variant={plan.popular ? "default" : "outline"}
              disabled={plan.name === "Free"}
            >
              {plan.name === "Free" ? "Текущий план" : "Оформить"}
            </Button>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Нужно особое условие для команды?{" "}
        <Link to="#" className="text-primary hover:underline">Свяжитесь с нами</Link>
      </p>
    </div>
  );
}