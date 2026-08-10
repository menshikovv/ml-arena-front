import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  Check,
  CircleAlert,
  Globe2,
  GraduationCap,
  Link2,
  Loader2,
  MapPin,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/ml/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";

const INPUT_CLASS = "h-11 bg-secondary/25 px-3.5 shadow-none transition-[background-color,border-color,box-shadow] hover:border-foreground/20 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/15";

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
  const [draggingAvatar, setDraggingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || Boolean(avatarFile) || removeAvatar;
  const completionFields = [form.full_name, form.city, form.education_status, form.organization, form.github_url, form.bio];
  const completion = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

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
  const selectAvatar = (file) => {
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
  const handleAvatar = (event) => {
    selectAvatar(event.target.files?.[0]);
    event.target.value = "";
  };
  const handleAvatarDrop = (event) => {
    event.preventDefault();
    setDraggingAvatar(false);
    selectAvatar(event.dataTransfer.files?.[0]);
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
      setError("Никнейм: 3-30 символов, буквы, цифры, точка, дефис или подчёркивание.");
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
    <div className="min-h-full bg-secondary/20">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 md:py-7">
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex min-h-9 items-center justify-between gap-4">
            <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              <ArrowLeft size={16} /> Вернуться в профиль
            </button>
            <span className={`hidden items-center gap-1.5 text-xs font-medium sm:inline-flex ${dirty ? "text-amber-700" : "text-muted-foreground"}`}>
              {dirty ? <CircleAlert size={14} /> : <Check size={14} />}
              {dirty ? "Есть несохранённые изменения" : "Изменений нет"}
            </span>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-lg border border-border bg-card shadow-sm lg:sticky lg:top-5">
              <div className="p-5">
                <div
                  className={`relative mx-auto flex h-40 w-full items-center justify-center rounded-lg border border-dashed transition-[border-color,background-color] ${draggingAvatar ? "border-primary bg-primary/5" : "border-border bg-secondary/35"}`}
                  onDragEnter={(event) => { event.preventDefault(); setDraggingAvatar(true); }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setDraggingAvatar(false)}
                  onDrop={handleAvatarDrop}
                >
                  <button type="button" onClick={() => fileRef.current?.click()} className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4" title="Выбрать аватар">
                    <Avatar name={form.full_name || form.nickname} src={avatarPreview} size={104} className="ring-4 ring-card shadow-lg" />
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      <Camera size={22} />
                    </span>
                  </button>
                </div>

                <div className="mt-4 min-w-0 text-center">
                  <h2 className="truncate font-heading text-lg font-bold">{form.nickname || "Новый участник"}</h2>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Camera size={15} /> Заменить</Button>
                  {avatarPreview && <Button type="button" variant="ghost" size="icon" onClick={clearAvatar} className="text-muted-foreground hover:text-destructive" title="Удалить аватар"><Trash2 size={16} /></Button>}
                </div>
                <p className="mt-2 text-center text-[11px] leading-5 text-muted-foreground">Можно перетащить сюда JPG, PNG или WebP до 5 МБ</p>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} className="hidden" />
              </div>

              <div className="border-t border-border bg-secondary/25 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-muted-foreground">Заполненность</p>
                  <p className="font-heading text-lg font-bold tabular-nums">{completion}%</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${completion}%` }} />
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">Заполненный профиль лучше представляет ваш опыт в ML-Арене.</p>
              </div>
            </aside>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <FormSection icon={UserRound} title="Основная информация" description="Как вас увидят другие участники платформы.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Никнейм" required>
                    <Input value={form.nickname} onChange={(event) => update("nickname", event.target.value)} autoComplete="username" maxLength={30} className={INPUT_CLASS} required />
                  </Field>
                  <Field label="Имя и фамилия">
                    <Input value={form.full_name} onChange={(event) => update("full_name", event.target.value)} autoComplete="name" maxLength={120} className={INPUT_CLASS} />
                  </Field>
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="bio">О себе</Label>
                      <span className="text-[11px] tabular-nums text-muted-foreground">{form.bio.length}/1000</span>
                    </div>
                    <Textarea id="bio" value={form.bio} onChange={(event) => update("bio", event.target.value)} maxLength={1000} rows={4} placeholder="Опыт, интересы и задачи, которые вы хотите решать" className="resize-none bg-secondary/25 px-3.5 py-3 shadow-none transition-[background-color,border-color,box-shadow] hover:border-foreground/20 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/15" />
                  </div>
                </div>
              </FormSection>

              <FormSection icon={BriefcaseBusiness} title="Учёба и работа" description="Профессиональный контекст вашего профиля.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Город" icon={MapPin}>
                    <Input value={form.city} onChange={(event) => update("city", event.target.value)} autoComplete="address-level2" maxLength={100} placeholder="Москва" className={INPUT_CLASS} />
                  </Field>
                  <Field label="Университет" icon={GraduationCap}>
                    <Input value={form.education_status} onChange={(event) => update("education_status", event.target.value)} maxLength={200} placeholder="Название университета" className={INPUT_CLASS} />
                  </Field>
                  <Field label="Компания" icon={BriefcaseBusiness} className="sm:col-span-2">
                    <Input value={form.organization} onChange={(event) => update("organization", event.target.value)} autoComplete="organization" maxLength={200} placeholder="Текущее место работы" className={INPUT_CLASS} />
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={Link2} title="Профессиональные ссылки" description="Профили с кодом, проектами и результатами.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="GitHub">
                    <Input type="url" value={form.github_url} onChange={(event) => update("github_url", event.target.value)} autoComplete="url" placeholder="https://github.com/username" className={INPUT_CLASS} />
                  </Field>
                  <Field label="Kaggle">
                    <Input type="url" value={form.kaggle_url} onChange={(event) => update("kaggle_url", event.target.value)} autoComplete="url" placeholder="https://kaggle.com/username" className={INPUT_CLASS} />
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={ShieldCheck} title="Видимость" description="Управляйте доступом к профилю.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Toggle icon={Globe2} checked={form.public_profile} onChange={(value) => update("public_profile", value)} title="Публичный профиль" text="Профиль доступен по ссылке и отображается в поиске." />
                  <Toggle icon={BriefcaseBusiness} checked={form.visible_to_employers} onChange={(value) => update("visible_to_employers", value)} title="Виден компаниям" text="Компании смогут находить вас среди участников." />
                </div>
              </FormSection>

              {error && (
                <div className="mx-5 mb-4 flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3.5 text-sm text-destructive md:mx-6">
                  <CircleAlert className="mt-0.5 shrink-0" size={17} />
                  <span>{error}</span>
                </div>
              )}

              <div className="sticky bottom-0 z-20 flex flex-col justify-between gap-3 border-t border-border bg-card/95 px-5 py-3.5 backdrop-blur sm:flex-row sm:items-center md:px-6">
                <p className="text-xs text-muted-foreground">{dirty ? "Проверьте изменения перед сохранением" : "Все данные сохранены"}</p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={goBack} className="flex-1 sm:flex-none">Отмена</Button>
                  <Button type="submit" disabled={loading || !dirty} className="min-w-36 flex-1 sm:flex-none">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Сохранить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormSection({ icon: Icon, title, description, children }) {
  return (
    <section className="grid gap-5 border-b border-border p-5 last:border-b-0 md:grid-cols-[190px_minmax(0,1fr)] md:p-6 lg:grid-cols-[210px_minmax(0,1fr)]">
      <div className="flex items-start gap-3 md:block">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon size={18} /></span>
        <div className="md:mt-3">
          <h2 className="font-heading text-base font-bold">{title}</h2>
          <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Field({ label, icon: Icon, required = false, className = "", children }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-muted-foreground" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Toggle({ icon: Icon, checked, onChange, title, text }) {
  return (
    <label className="group flex min-h-24 cursor-pointer items-start gap-3 rounded-md border border-border bg-secondary/25 p-4 transition-[background-color,border-color] hover:border-primary/25 hover:bg-primary/[0.03]">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors ${checked ? "bg-primary/10 text-primary" : "bg-card text-muted-foreground"}`}><Icon size={17} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span>
      </span>
      <span className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </label>
  );
}
