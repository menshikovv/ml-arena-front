import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";

export default function LegalNotice({ type }) {
  const privacy = type === "privacy";
  return (
    <AuthLayout wide icon={FileText} title={privacy ? "Политика обработки данных" : "Пользовательское соглашение"} subtitle="Документы Founder Season">
      <div className="space-y-4 text-sm leading-7 text-muted-foreground">
        <p>Сейчас интерфейс работает как локальный прототип: введённые данные сохраняются только в браузере и не передаются на сервер.</p>
        <p>{privacy ? "Перед подключением реальной регистрации здесь будет опубликована полная политика обработки и хранения персональных данных." : "Перед подключением реальной регистрации здесь будет опубликована полная версия правил участия и использования ML Арены."}</p>
      </div>
      <Button asChild variant="outline" className="mt-6"><Link to="/register"><ArrowLeft size={15} /> Вернуться к регистрации</Link></Button>
    </AuthLayout>
  );
}
