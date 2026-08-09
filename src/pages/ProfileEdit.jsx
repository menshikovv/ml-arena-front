import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Camera, GraduationCap, Link2, Loader2, MapPin, Save, ShieldCheck, UserRound, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/ml/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";

export default function ProfileEdit() {
  const { user, updateProfile, updateAvatar, deleteAvatar } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const initial = useMemo(() => ({
    nickname: user?.nickname || "",
    full_name: user?.full_name || "",
    city: user?.city || "",
    education_status: user?.education_status || "",
    organization: user?.organization || "",
    github_url: user?.github_url || "",
    kaggle_url: user?.kaggle_url || "",
    bio: user?.bio || "",
    visible_to_employers: Boolean(user?.visible_to_employers),
    public_profile: user?.public_profile ?? true,
  }), [user]);
  const [form, setForm] = useState(initial);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || Boolean(avatarFile) || removeAvatar;

  useEffect(() => {
    setForm(initial);
    setAvatarPreview(user?.avatar_url || "");
  }, [initial, user?.avatar_url]);

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
  const handleAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Аватар: JPG, PNG или WebP размером до 5 МБ.");
      return;
    }
    setError("");
    setAvatarFile(file);
    setRemoveAvatar(false);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result));
    reader.readAsDataURL(file);
  };
  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    setRemoveAvatar(Boolean(user?.avatar_url));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!/^[\p{L}\d_.-]{3,30}$/u.test(form.nickname)) {
      setError("Никнейм: 3–30 символов, буквы, цифры, точка, дефис или подчёркивание.");
      return;
    }
    setLoading(true);
    try {
      await updateProfile(form);
      if (avatarFile) await updateAvatar(avatarFile);
      else if (removeAvatar) await deleteAvatar();
      toast({ title: "Профиль сохранён" });
      navigate("/profile");
    } catch (submitError) {
      setError(submitError.code === "RESOURCE_CONFLICT" ? "Этот никнейм уже занят." : submitError.message || "Не удалось сохранить профиль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-7">
      <form onSubmit={handleSubmit}>
        <button type="button" onClick={goBack} className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"><ArrowLeft size={15} /> Вернуться в профиль</button>

        <div className="grid items-start gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="border-y border-border bg-card lg:sticky lg:top-0">
            <div className="flex flex-col items-center px-6 py-7 text-center">
              <div className="relative">
                <div className="rounded-full ring-4 ring-primary/10 ring-offset-4 ring-offset-card"><Avatar name={form.full_name || form.nickname} src={avatarPreview} size={112} /></div>
                <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105" title="Выбрать аватар"><Camera size={17} /></button>
              </div>
              <h2 className="mt-6 max-w-full truncate font-heading text-xl font-bold">{form.nickname || "Новый участник"}</h2>
              <p className="mt-1 max-w-full truncate text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-6 flex w-full gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}><Camera size={15} /> Заменить</Button>
                {avatarPreview && <Button type="button" variant="ghost" size="icon" onClick={clearAvatar} className="shrink-0 text-muted-foreground hover:text-destructive" title="Удалить аватар"><X size={16} /></Button>}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">JPG, PNG или WebP до 5 МБ</p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} className="hidden" />
            </div>
          </aside>

          <div className="space-y-6">
            <FormSection icon={UserRound} title="Основная информация" description="Имя, никнейм и короткое описание вашего опыта.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Никнейм" required><Input value={form.nickname} onChange={(event) => update("nickname", event.target.value)} maxLength={30} required /></Field>
                <Field label="Имя и фамилия"><Input value={form.full_name} onChange={(event) => update("full_name", event.target.value)} maxLength={120} /></Field>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between gap-3"><Label htmlFor="bio">О себе</Label><span className="text-xs tabular-nums text-muted-foreground">{form.bio.length}/1000</span></div>
                  <Textarea id="bio" value={form.bio} onChange={(event) => update("bio", event.target.value)} maxLength={1000} rows={5} placeholder="Расскажите о своём опыте, интересах и задачах, которые хотите решать" className="resize-none" />
                </div>
              </div>
            </FormSection>

            <FormSection icon={MapPin} title="Учёба и работа" description="Контекст, который помогает компаниям лучше понять ваш опыт.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Город" icon={MapPin}><Input value={form.city} onChange={(event) => update("city", event.target.value)} maxLength={100} placeholder="Москва" /></Field>
                <Field label="Университет" icon={GraduationCap}><Input value={form.education_status} onChange={(event) => update("education_status", event.target.value)} maxLength={200} placeholder="Название университета" /></Field>
                <Field label="Компания" icon={BriefcaseBusiness} className="sm:col-span-2"><Input value={form.organization} onChange={(event) => update("organization", event.target.value)} maxLength={200} placeholder="Текущее место работы" /></Field>
              </div>
            </FormSection>

            <FormSection icon={Link2} title="Профессиональные ссылки" description="Добавьте профили с кодом, соревнованиями и проектами.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="GitHub"><Input type="url" value={form.github_url} onChange={(event) => update("github_url", event.target.value)} placeholder="https://github.com/username" /></Field>
                <Field label="Kaggle"><Input type="url" value={form.kaggle_url} onChange={(event) => update("kaggle_url", event.target.value)} placeholder="https://kaggle.com/username" /></Field>
              </div>
            </FormSection>

            <FormSection icon={ShieldCheck} title="Видимость профиля" description="Выберите, кто сможет открыть профиль и найти вас на платформе.">
              <div className="divide-y divide-border border-y border-border">
                <Toggle checked={form.public_profile} onChange={(value) => update("public_profile", value)} title="Публичный профиль" text="Профиль можно открыть по прямой ссылке и найти в поиске." />
                <Toggle checked={form.visible_to_employers} onChange={(value) => update("visible_to_employers", value)} title="Виден работодателям" text="Организации смогут находить профиль при поиске специалистов." />
              </div>
            </FormSection>
          </div>
        </div>

        {error && <p className="mt-6 border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
        <div className="sticky bottom-0 z-20 mt-6 flex flex-col justify-between gap-3 border-y border-border bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center md:px-6">
          <p className="text-xs text-muted-foreground">{dirty ? "Изменения ещё не сохранены" : "Все изменения сохранены"}</p>
          <div className="flex gap-3"><Button type="button" variant="outline" onClick={goBack} className="flex-1 sm:flex-none">Отмена</Button><Button type="submit" disabled={loading || !dirty} className="min-w-36 flex-1 sm:flex-none">{loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Сохранить</Button></div>
        </div>
      </form>
    </div>
  );
}

function FormSection({ icon: Icon, title, description, children }) {
  return (
    <section className="border-y border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border px-5 py-4 md:px-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon size={18} /></span>
        <div><h2 className="font-heading text-lg font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function Field({ label, icon: Icon, required = false, className = "", children }) {
  return <div className={`space-y-2 ${className}`}><Label className="flex items-center gap-1.5">{Icon && <Icon size={13} className="text-muted-foreground" />}{label}{required && <span className="text-destructive"> *</span>}</Label>{children}</div>;
}

function Toggle({ checked, onChange, title, text }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
      <span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span></span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </label>
  );
}
