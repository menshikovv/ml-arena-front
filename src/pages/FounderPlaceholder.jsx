import { ArrowRight, ChartNoAxesColumnIncreasing, MailCheck, Swords, Trophy, UserRoundCheck } from "lucide-react";
import { Link } from "react-router-dom";
import FounderSeasonTelegramCard from "@/components/ml/FounderSeasonTelegramCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { FOUNDER_SECTIONS } from "@/lib/founder-season";

const SECTION_ICONS = {
  competitions: Trophy,
  duels: Swords,
  rating: ChartNoAxesColumnIncreasing,
  passport: UserRoundCheck,
};

export default function FounderPlaceholder({ section }) {
  const { isAuthenticated, user } = useAuth();
  const content = FOUNDER_SECTIONS[section];
  const Icon = SECTION_ICONS[section];
  const confirmed = user?.preregistration_status === "confirmed";

  return (
    <div className="min-h-full bg-secondary/25 px-4 py-10 sm:px-7 lg:px-10 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-violet-500" />
          <div className="grid lg:grid-cols-[1.4fr_0.75fr]">
            <div className="px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
              <h1 className="max-w-3xl font-heading text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{content.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{content.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {!isAuthenticated ? (
                  <Button asChild size="lg"><Link to="/register">Зарегистрироваться <ArrowRight size={16} /></Link></Button>
                ) : (
                  <Button asChild size="lg" variant="outline"><Link to="/profile">Открыть профиль <ArrowRight size={16} /></Link></Button>
                )}
              </div>
              {isAuthenticated && (
                <div className={`mt-9 flex max-w-xl items-start gap-3 rounded-md border p-4 text-sm ${confirmed ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                  <MailCheck className="mt-0.5 shrink-0" size={17} />
                  <span>{confirmed ? "Предрегистрация подтверждена. Доступ появится после запуска раздела." : "Предрегистрация создана. Подтвердите email, чтобы завершить её."}</span>
                </div>
              )}
            </div>

            <div className="border-t border-border bg-secondary/45 px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-9 lg:py-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-primary/15 bg-card text-primary shadow-sm">
                <Icon size={27} strokeWidth={1.8} />
              </div>
              <h2 className="mt-7 font-heading text-2xl font-bold">В разработке</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Раздел пока недоступен. О его открытии мы сообщим участникам Founder Season отдельно.
              </p>
              <div className="mt-8 border-t border-border pt-6">
                <p className="text-sm font-semibold">Следите за обновлениями</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Анонсы и текущие активности публикуются в Telegram ML Арены.</p>
              </div>
            </div>
          </div>
        </section>
        <div className="mt-8"><FounderSeasonTelegramCard /></div>
      </div>
    </div>
  );
}
