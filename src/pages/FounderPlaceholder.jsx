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
    <div className="min-h-full px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="arena-chamfer-panel relative overflow-hidden border border-border bg-card shadow-[0_24px_70px_rgba(30,64,175,0.09)]">
          <div className="flex min-h-14 items-center justify-between gap-5 border-b border-border px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 bg-primary" />
              <span className="font-heading text-sm font-extrabold">ML-Арена Founder Season</span>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">Раздел готовится к запуску</span>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(310px,0.62fr)]">
            <div className="min-w-0 px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-20 xl:px-16">
              <h1 className="max-w-4xl break-words font-heading text-4xl font-extrabold leading-[1.04] sm:text-5xl 2xl:text-6xl">{content.title}</h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">{content.description}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                {!isAuthenticated ? (
                  <Button asChild size="lg" className="rounded-none"><Link to="/register">Зарегистрироваться <ArrowRight size={16} /></Link></Button>
                ) : (
                  <Button asChild size="lg" variant="outline" className="rounded-none"><Link to="/profile">Открыть профиль <ArrowRight size={16} /></Link></Button>
                )}
              </div>
              {isAuthenticated && (
                <div className={`mt-10 flex max-w-2xl items-start gap-3 border-l-2 px-5 py-4 text-sm leading-6 ${confirmed ? "border-emerald-500 bg-emerald-500/[0.06] text-emerald-950 dark:text-emerald-200" : "border-amber-500 bg-amber-500/[0.07] text-amber-950 dark:text-amber-200"}`}>
                  <MailCheck className="mt-0.5 shrink-0" size={17} />
                  <span>{confirmed ? "Предрегистрация подтверждена. Доступ появится после запуска раздела." : "Предрегистрация создана. Подтвердите email, чтобы завершить её."}</span>
                </div>
              )}
            </div>

            <div className="relative flex flex-col overflow-hidden border-t border-primary/20 bg-primary px-7 py-10 text-primary-foreground sm:px-10 lg:border-l lg:border-t-0 lg:px-9 lg:py-14">
              <div className="absolute -right-7 -top-9 font-display text-[11rem] font-black leading-none text-primary-foreground/[0.055]">ML</div>
              <div className="relative flex h-16 w-16 items-center justify-center border border-primary-foreground/20 bg-primary-foreground/10">
                <Icon size={30} strokeWidth={1.8} />
              </div>
              <h2 className="relative mt-9 font-heading text-3xl font-extrabold">В разработке</h2>
              <p className="relative mt-4 text-[15px] leading-7 text-primary-foreground/75">
                Раздел пока недоступен. О его открытии мы сообщим участникам Founder Season отдельно.
              </p>
              <div className="relative mt-auto pt-10">
                <div className="border-t border-primary-foreground/20 pt-6">
                  <p className="text-sm font-bold">Следите за обновлениями</p>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/70">Анонсы и текущие активности публикуются в Telegram ML Арены.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="mt-7"><FounderSeasonTelegramCard /></div>
      </div>
    </div>
  );
}
