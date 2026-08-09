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
    show_real_name: user?.show_real_name ?? true,
    show_career_details: user?.show_career_details ?? true,
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
    <div className="min-h-full bg-secondary/25 px-4 py-8 sm:px-7 lg:px-10">
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-center">
          <div>
            <button type="button" onClick={goBack} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={15} /> Назад</button>
            <h1 className="font-heading text-3xl font-bold">Редактирование профиля</h1>
            <p className="mt-2 text-sm text-muted-foreground">Эти данные используются в публичном профиле и ML-паспорте.</p>
          </div>
          <Button type="submit" disabled={loading || !dirty}>{loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Сохранить</Button>
        </div>

        <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar name={form.full_name || form.nickname} src={avatarPreview} size={96} />
            <button type="button" onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm" title="Выбрать аватар"><Camera size={16} /></button>
          </div>
          <div>
            <p className="font-semibold">Аватар</p>
            <p className="mt-1 text-sm text-muted-foreground">JPG, PNG или WebP до 5 МБ. Файл загружается напрямую в защищённое хранилище.</p>
            {avatarPreview && <button type="button" onClick={clearAvatar} className="mt-2 flex items-center gap-1 text-xs text-destructive"><X size={13} /> Удалить</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} className="hidden" />
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="Никнейм" required><Input value={form.nickname} onChange={(event) => update("nickname", event.target.value)} maxLength={30} required /></Field>
          <Field label="Имя и фамилия"><Input value={form.full_name} onChange={(event) => update("full_name", event.target.value)} maxLength={120} /></Field>
          <Field label="Город"><Input value={form.city} onChange={(event) => update("city", event.target.value)} maxLength={100} /></Field>
          <Field label="Университет"><Input value={form.education_status} onChange={(event) => update("education_status", event.target.value)} maxLength={200} /></Field>
          <Field label="Компания"><Input value={form.organization} onChange={(event) => update("organization", event.target.value)} maxLength={200} /></Field>
          <Field label="GitHub"><Input type="url" value={form.github_url} onChange={(event) => update("github_url", event.target.value)} placeholder="https://github.com/username" /></Field>
          <Field label="Kaggle"><Input type="url" value={form.kaggle_url} onChange={(event) => update("kaggle_url", event.target.value)} placeholder="https://kaggle.com/username" /></Field>
        </div>

        <div className="mt-7 space-y-2">
          <Label htmlFor="bio">О себе</Label>
          <Textarea id="bio" value={form.bio} onChange={(event) => update("bio", event.target.value)} maxLength={1000} rows={5} placeholder="Опыт, задачи и направления, которые вам интересны" />
          <p className="text-right text-xs text-muted-foreground">{form.bio.length}/1000</p>
        </div>

        <section className="mt-8 border-t border-border pt-7">
          <h2 className="font-heading text-xl font-bold">Видимость профиля</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Toggle checked={form.public_profile} onChange={(value) => update("public_profile", value)} title="Публичный профиль" text="Профиль можно открыть по прямой ссылке и найти в поиске." />
            <Toggle checked={form.visible_to_employers} onChange={(value) => update("visible_to_employers", value)} title="Виден работодателям" text="Организации смогут находить профиль при поиске специалистов." />
            <Toggle checked={form.show_real_name} onChange={(value) => update("show_real_name", value)} title="Показывать настоящее имя" text="Имя и фамилия будут видны в публичном профиле." />
            <Toggle checked={form.show_career_details} onChange={(value) => update("show_career_details", value)} title="Показывать карьерные данные" text="Город, университет, компания и внешние профили будут публичными." />
          </div>
        </section>

        {error && <p className="mt-5 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-border pt-6">
          <Button type="button" variant="outline" onClick={goBack}>Отмена</Button>
          <Button type="submit" disabled={loading || !dirty}>{loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Сохранить</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return <div className="space-y-2"><Label>{label}{required && <span className="text-destructive"> *</span>}</Label>{children}</div>;
}

function Toggle({ checked, onChange, title, text }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
      <span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span></span>
    </label>
  );
}
