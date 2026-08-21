import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "ml-arena-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!localStorage.getItem(CONSENT_KEY));
    } catch {
      setVisible(true);
    }
  }, []);

  const saveConsent = (value) => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {}
    setVisible(false);
    window.dispatchEvent(new CustomEvent("ml-arena:cookie-consent", { detail: value }));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[100] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-xl">
      <div className="relative max-h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] overflow-y-auto rounded-lg border border-border bg-card/95 p-4 shadow-2xl shadow-foreground/10 backdrop-blur-xl sm:max-h-none sm:overflow-visible sm:p-5">
        <button type="button" onClick={() => saveConsent("essential")} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Закрыть уведомление" title="Только необходимые cookie"><X size={15} /></button>
        <div className="flex items-start gap-3 pr-7">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Cookie size={19} /></span>
          <div>
            <h2 className="font-heading text-base font-extrabold">Cookie на ML-Арене</h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Мы используем необходимые cookie для работы аккаунта и, с вашего согласия, дополнительные cookie для улучшения сайта.</p>
            <Link to="/privacy" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Подробнее в политике обработки данных</Link>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:flex sm:justify-end">
          <Button type="button" size="sm" onClick={() => saveConsent("all")} className="sm:order-3">Принять</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => saveConsent("essential")} className="sm:order-2">Только необходимые</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => saveConsent("rejected")} className="sm:order-1">Отклонить</Button>
        </div>
      </div>
    </div>
  );
}
