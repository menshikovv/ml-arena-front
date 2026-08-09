import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/ml/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { ML_INTERESTS } from "@/lib/founder-season";

export default function ProfileEdit() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const initial = useMemo(() => ({
    avatar_url: user?.avatar_url || "", nickname: user?.nickname || "", full_name: user?.full_name || "", city: user?.city || "",
    education_status: user?.education_status || "", organization: user?.organization || "", ml_level: user?.ml_level || "beginner",
    ml_interests: user?.ml_interests || [], github_url: user?.github_url || "", telegram_username: user?.telegram_username || "", bio: user?.bio || "",
  }), [user]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    const preventClose = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventClose);
    return () => window.removeEventListener("beforeunload", preventClose);
  }, [dirty]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const goBack = () => {
    if (!dirty || window.confirm("Уйти без сохранения изменений?")) navigate("/profile");
  };
  const toggleInterest = (interest) => {
    setError("");
    if (form.ml_interests.includes(interest)) return update("ml_interests", form.ml_interests.filter((item) => item !== interest));
    if (form.ml_interests.length >= 5) return setError("Можно выбрать не больше пяти направлений.");
    update("ml_interests", [...form.ml_interests, interest]);
  };
  const handleAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Аватар: JPG, PNG или WebP размером до 5 МБ.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("avatar_url", String(reader.result));
    reader.readAsDataURL(file);
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!/^[\p{L}\d_.-]{3,30}$/u.test(form.nickname)) return setError("Никнейм: 3–30 символов, буквы, цифры, точка, дефис или подчёркивание.");
    if (form.github_url && !/^https:\/\/(www\.)?github\.com\/[\w.-]+\/?$/i.test(form.github_url)) return setError("Укажите корректную ссылку на профиль GitHub.");
    setLoading(true);
    try {
      await updateProfile({ ...form, telegram_username: form.telegram_username.replace(/^@/, "") });
      toast({ title: "Профиль сохранён" });
      navigate("/profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-secondary/25 px-4 py-8 sm:px-7 lg:px-10">
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-center">
          <div><button type="button" onClick={goBack} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={15} /> Назад</button><h1 className="font-heading text-3xl font-bold">Редактирование профиля</h1><p className="mt-2 text-sm text-muted-foreground">Подготовьте профиль к запуску ML-паспорта.</p></div>
          <Button type="submit" disabled={loading || !dirty}>{loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Сохранить</Button>
        </div>

        <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative"><Avatar name={form.full_name || form.nickname} src={form.avatar_url} size={96} /><button type="button" onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm" title="Выбрать аватар"><Camera size={16} /></button></div>
          <div><p className="font-semibold">Аватар</p><p className="mt-1 text-sm text-muted-foreground">JPG, PNG или WebP до 5 МБ. Изображение показывается в квадратном кадре.</p>{form.avatar_url && <button type="button" onClick={() => update("avatar_url", "")} className="mt-2 flex items-center gap-1 text-xs text-destructive"><X size={13} /> Удалить</button>}</div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} className="hidden" />
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="Никнейм" required><Input value={form.nickname} onChange={(event) => update("nickname", event.target.value)} maxLength={30} required /></Field>
          <Field label="Имя и фамилия"><Input value={form.full_name} onChange={(event) => update("full_name", event.target.value)} maxLength={100} /></Field>
          <Field label="Город"><Input value={form.city} onChange={(event) => update("city", event.target.value)} maxLength={100} /></Field>
          <Field label="Учёба"><Input value={form.education_status} onChange={(event) => update("education_status", event.target.value)} maxLength={120} placeholder="Вуз, курс или статус" /></Field>
          <Field label="Компания или организация"><Input value={form.organization} onChange={(event) => update("organization", event.target.value)} maxLength={120} /></Field>
          <Field label="Уровень в ML">
            <select value={form.ml_level} onChange={(event) => update("ml_level", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="beginner">Начинающий</option><option value="junior">Junior</option><option value="middle">Middle</option><option value="senior">Senior</option><option value="researcher">Исследователь</option>
            </select>
          </Field>
          <Field label="GitHub"><Input type="url" value={form.github_url} onChange={(event) => update("github_url", event.target.value)} placeholder="https://github.com/username" /></Field>
          <Field label="Telegram"><Input value={form.telegram_username} onChange={(event) => update("telegram_username", event.target.value)} maxLength={33} placeholder="username" /></Field>
        </div>

        <div className="mt-7"><Label>Интересы в ML <span className="font-normal text-muted-foreground">(до 5)</span></Label><div className="mt-3 flex flex-wrap gap-2">{ML_INTERESTS.map((interest) => <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`rounded-full border px-3 py-2 text-sm transition-colors ${form.ml_interests.includes(interest) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"}`}>{interest}</button>)}</div></div>
        <div className="mt-7 space-y-2"><Label htmlFor="bio">О себе</Label><Textarea id="bio" value={form.bio} onChange={(event) => update("bio", event.target.value)} maxLength={500} rows={5} placeholder="Опыт, задачи и направления, которые вам интересны" /><p className="text-right text-xs text-muted-foreground">{form.bio.length}/500</p></div>
        {error && <p className="mt-5 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-border pt-6"><Button type="button" variant="outline" onClick={goBack}>Отмена</Button><Button type="submit" disabled={loading || !dirty}>{loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Сохранить</Button></div>
      </form>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return <div className="space-y-2"><Label>{label}{required && <span className="text-destructive"> *</span>}</Label>{children}</div>;
}
