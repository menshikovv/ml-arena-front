import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "ml-arena-cookie-consent";
const CONSENT_VERSION = 2;

function hasCurrentConsent() {
  const saved = localStorage.getItem(CONSENT_KEY);
  if (!saved) return false;
  try {
    const consent = JSON.parse(saved);
    return consent.version === CONSENT_VERSION && ["all", "essential", "rejected"].includes(consent.choice);
  } catch {
    return false;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!hasCurrentConsent());
    } catch {
      setVisible(true);
    }
  }, []);

  const saveConsent = (value) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice: value, version: CONSENT_VERSION, updatedAt: new Date().toISOString() }));
    } catch {}
    setVisible(false);
    window.dispatchEvent(new CustomEvent("ml-arena:cookie-consent", { detail: value }));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-xl">
      <div className="relative overflow-hidden rounded-lg border border-border bg-card/95 p-4 shadow-2xl shadow-foreground/10 backdrop-blur-xl sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Cookie size={19} /></span>
          <div>
            <h2 className="font-heading text-base font-extrabold">Cookie на ML-Арене</h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Мы используем необходимые cookie для работы аккаунта и, с вашего согласия, дополнительные cookie для улучшения сайта.</p>
            <Link to="/privacy" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Подробнее в политике обработки данных</Link>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Button type="button" variant="outline" size="sm" onClick={() => saveConsent("rejected")}>Отклонить</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => saveConsent("essential")}>Принять необходимое</Button>
          <Button type="button" size="sm" onClick={() => saveConsent("all")}>Принять всё</Button>
        </div>
      </div>
    </div>
  );
}
