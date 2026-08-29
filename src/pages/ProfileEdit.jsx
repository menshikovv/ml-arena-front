import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Check,
  CircleAlert,
  Globe2,
  GraduationCap,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
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

const INPUT_CLASS = "h-10 rounded-md bg-secondary/20 px-3.5 shadow-none transition-[background-color,border-color,box-shadow] hover:border-primary/25 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/15";

const SECTIONS = [
  { id: "profile-main", label: "Профиль", icon: UserRound },
  { id: "profile-contacts", label: "Контакты", icon: Mail },
  { id: "profile-location", label: "Личные данные", icon: MapPin },
  { id: "profile-education", label: "Образование", icon: GraduationCap },
  { id: "profile-work", label: "Работа", icon: BriefcaseBusiness },
  { id: "profile-experience", label: "Опыт в ML", icon: BrainCircuit },
  { id: "profile-interests", label: "Интересы", icon: Sparkles },
  { id: "profile-visibility", label: "Видимость", icon: ShieldCheck },
];

const ML_INTERESTS = [
  ["classification", "Классификация"],
  ["regression", "Регрессия"],
  ["nlp", "NLP"],
  ["cv", "Компьютерное зрение"],
  ["time_series", "Временные ряды"],
  ["ranking", "Ранжирование"],
  ["clustering", "Кластеризация"],
  ["recsys", "RecSys"],
];

const splitFullName = (fullName = "") => {
  const [firstName = "", ...lastNameParts] = fullName.trim().split(/\s+/).filter(Boolean);
  return { first_name: firstName, last_name: lastNameParts.join(" ") };
};

export default function ProfileEdit() {
  const { user, updateProfile, updateAvatar, deleteAvatar } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const initial = useMemo(() => {
    const fallbackName = splitFullName(user?.full_name);
    return {
      nickname: user?.nickname || "",
      first_name: user?.first_name ?? fallbackName.first_name,
      last_name: user?.last_name ?? fallbackName.last_name,
      city: user?.city || "",
      birth_date: user?.birth_date || "",
      education_status: user?.education_status || "",
      organization: user?.organization || "",
      ml_experience_years: user?.ml_experience_years ?? "",
      ml_experience: user?.ml_experience || "",
      ml_interests: Array.isArray(user?.ml_interests) ? user.ml_interests : [],
      github_url: user?.github_url || "",
      kaggle_url: user?.kaggle_url || "",
      bio: user?.bio || "",
      visible_to_employers: Boolean(user?.visible_to_employers),
      public_profile: user?.public_profile ?? true,
    };
  }, [user]);
  const [form, setForm] = useState(initial);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [draggingAvatar, setDraggingAvatar] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || Boolean(avatarFile) || removeAvatar;
  const completionFields = [form.first_name, form.last_name, form.city, form.birth_date, form.education_status, form.organization, form.ml_experience, form.github_url, form.bio, form.ml_interests.length];
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

  useEffect(() => {
    const sections = SECTIONS.map(({ id }) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: "-18% 0px -62%", threshold: [0.05, 0.35, 0.7] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleInterest = (interest) => setForm((current) => ({
    ...current,
    ml_interests: current.ml_interests.includes(interest)
      ? current.ml_interests.filter((item) => item !== interest)
      : [...current.ml_interests, interest],
  }));
  const goBack = () => {
    if (!dirty || window.confirm("Уйти без сохранения изменений?")) navigate("/profile");
  };
  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      await updateProfile({ ...form, full_name: [form.first_name, form.last_name].filter(Boolean).join(" ") });
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
    <div className="min-h-full bg-secondary/15">
      <div className="mx-auto w-full max-w-[1380px] px-4 py-6 md:px-6 lg:px-8 lg:py-10">
        <button type="button" onClick={goBack} className="mb-4 inline-flex h-9 items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft size={16} /> Вернуться в профиль
        </button>

        <form onSubmit={handleSubmit} className="overflow-hidden border border-border bg-card shadow-[0_18px_60px_hsl(var(--foreground)/0.06)]">
          <div className="grid lg:grid-cols-[230px_minmax(0,1fr)]">
            <aside className="border-b border-border bg-secondary/20 lg:border-b-0 lg:border-r">
              <nav className="flex gap-1 overflow-x-auto p-2 lg:sticky lg:top-4 lg:block lg:space-y-1 lg:overflow-visible lg:p-3" aria-label="Разделы профиля">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className={`flex h-11 shrink-0 items-center gap-3 px-3 text-sm font-semibold transition-colors lg:w-full ${activeSection === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-card hover:text-foreground"}`}
                  >
                    <Icon size={17} /> {label}
                  </button>
                ))}
              </nav>

              <div className="hidden border-t border-border p-5 lg:block">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Профиль заполнен</span>
                  <span className="tabular-nums">{completion}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden bg-border">
                  <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${completion}%` }} />
                </div>
              </div>
            </aside>

            <main className="min-w-0">
              <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-4 border-b border-border bg-card/95 px-5 py-4 backdrop-blur md:px-8">
                <div className="min-w-0">
                  <h1 className="truncate font-heading text-xl font-extrabold sm:text-2xl">Ваш профиль</h1>
                  <p className={`mt-1 flex items-center gap-1.5 text-xs ${dirty ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>
                    {dirty ? <CircleAlert size={13} /> : <Check size={13} className="text-emerald-600" />}
                    {dirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}
                  </p>
                </div>
                <div className="hidden shrink-0 gap-2 sm:flex">
                  <Button type="button" variant="outline" onClick={goBack}>Отмена</Button>
                  <Button type="submit" disabled={loading || !dirty} className="min-w-32">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Сохранить
                  </Button>
                </div>
              </header>

              <div className="mx-auto max-w-[980px] px-5 md:px-8">
                <FormSection id="profile-main" icon={UserRound} title="Профиль">
                  <div
                    className={`flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-center ${draggingAvatar ? "bg-primary/[0.035]" : ""}`}
                    onDragEnter={(event) => { event.preventDefault(); setDraggingAvatar(true); }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={() => setDraggingAvatar(false)}
                    onDrop={handleAvatarDrop}
                  >
                    <button type="button" onClick={() => fileRef.current?.click()} className="group relative w-fit rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4" title="Изменить фото">
                      <Avatar name={[form.first_name, form.last_name].filter(Boolean).join(" ") || form.nickname} src={avatarPreview} size={100} className="ring-4 ring-secondary/60 shadow-lg" />
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/60 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Camera size={23} /></span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-xl font-bold">{[form.first_name, form.last_name].filter(Boolean).join(" ") || form.nickname || "Новый участник"}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">@{form.nickname || "nickname"}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Camera size={15} /> Изменить фото</Button>
                        {avatarPreview && <Button type="button" variant="ghost" size="sm" onClick={clearAvatar} className="text-destructive hover:text-destructive"><Trash2 size={15} /> Удалить</Button>}
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">JPG, PNG или WebP · до 5 МБ</p>
                    </div>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} className="hidden" />
                  </div>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <Field label="Никнейм" required>
                      <Input value={form.nickname} onChange={(event) => update("nickname", event.target.value)} autoComplete="username" maxLength={30} className={INPUT_CLASS} required />
                    </Field>
                    <Field label="Имя">
                      <Input value={form.first_name} onChange={(event) => update("first_name", event.target.value)} autoComplete="given-name" maxLength={60} className={INPUT_CLASS} />
                    </Field>
                    <Field label="Фамилия">
                      <Input value={form.last_name} onChange={(event) => update("last_name", event.target.value)} autoComplete="family-name" maxLength={60} className={INPUT_CLASS} />
                    </Field>
                    <div className="space-y-2 sm:col-span-2 xl:col-span-3">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="bio">О себе</Label>
                        <span className="text-[11px] tabular-nums text-muted-foreground">{form.bio.length}/1000</span>
                      </div>
                      <Textarea id="bio" value={form.bio} onChange={(event) => update("bio", event.target.value)} maxLength={1000} rows={4} placeholder="Расскажите о своём опыте и интересах" className="resize-none rounded-md bg-secondary/20 px-3.5 py-3 shadow-none transition-[background-color,border-color,box-shadow] hover:border-primary/25 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/15" />
                    </div>
                  </div>
                </FormSection>

                <FormSection id="profile-contacts" icon={Mail} title="Контакты">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Email" icon={Mail} className="sm:col-span-2">
                      <Input type="email" value={user?.email || ""} readOnly disabled className={`${INPUT_CLASS} cursor-not-allowed opacity-70`} />
                    </Field>
                    <Field label="GitHub" icon={Link2}>
                      <Input type="url" value={form.github_url} onChange={(event) => update("github_url", event.target.value)} autoComplete="url" placeholder="https://github.com/username" className={INPUT_CLASS} />
                    </Field>
                    <Field label="Kaggle" icon={Link2}>
                      <Input type="url" value={form.kaggle_url} onChange={(event) => update("kaggle_url", event.target.value)} autoComplete="url" placeholder="https://kaggle.com/username" className={INPUT_CLASS} />
                    </Field>
                  </div>
                </FormSection>

                <FormSection id="profile-location" icon={MapPin} title="Личные данные">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Город" icon={MapPin}>
                      <Input value={form.city} onChange={(event) => update("city", event.target.value)} autoComplete="address-level2" maxLength={100} placeholder="Москва" className={INPUT_CLASS} />
                    </Field>
                    <Field label="Дата рождения" icon={CalendarDays}>
                      <Input type="date" value={form.birth_date} onChange={(event) => update("birth_date", event.target.value)} autoComplete="bday" max={new Date().toISOString().slice(0, 10)} className={INPUT_CLASS} />
                    </Field>
                  </div>
                </FormSection>

                <FormSection id="profile-education" icon={GraduationCap} title="Образование">
                  <Field label="Университет" icon={GraduationCap}>
                    <Input value={form.education_status} onChange={(event) => update("education_status", event.target.value)} maxLength={200} placeholder="Название университета" className={INPUT_CLASS} />
                  </Field>
                </FormSection>

                <FormSection id="profile-work" icon={BriefcaseBusiness} title="Работа">
                  <Field label="Компания" icon={BriefcaseBusiness}>
                    <Input value={form.organization} onChange={(event) => update("organization", event.target.value)} autoComplete="organization" maxLength={200} placeholder="Текущее место работы" className={INPUT_CLASS} />
                  </Field>
                </FormSection>

                <FormSection id="profile-experience" icon={BrainCircuit} title="Опыт в ML">
                  <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
                    <Field label="Лет опыта">
                      <Input type="number" min="0" max="60" step="0.5" value={form.ml_experience_years} onChange={(event) => update("ml_experience_years", event.target.value)} inputMode="decimal" placeholder="Например, 2" className={INPUT_CLASS} />
                    </Field>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="ml-experience">Практический опыт</Label>
                        <span className="text-[11px] tabular-nums text-muted-foreground">{form.ml_experience.length}/1000</span>
                      </div>
                      <Textarea id="ml-experience" value={form.ml_experience} onChange={(event) => update("ml_experience", event.target.value)} maxLength={1000} rows={4} placeholder="Проекты, специализация, технологии и задачи, с которыми вы работали" className="resize-none rounded-md bg-secondary/20 px-3.5 py-3 shadow-none transition-[background-color,border-color,box-shadow] hover:border-primary/25 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/15" />
                    </div>
                  </div>
                </FormSection>

                <FormSection id="profile-interests" icon={Sparkles} title="Интересы в ML">
                  <div className="flex flex-wrap gap-2">
                    {ML_INTERESTS.map(([value, label]) => {
                      const selected = form.ml_interests.includes(value);
                      return (
                        <button key={value} type="button" onClick={() => toggleInterest(value)} aria-pressed={selected} className={`min-h-10 border px-3.5 py-2 text-sm font-semibold transition-[border-color,background-color,color,transform] hover:-translate-y-0.5 ${selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>
                          {selected && <Check size={14} className="mr-1.5 inline" />}{label}
                        </button>
                      );
                    })}
                  </div>
                </FormSection>

                <FormSection id="profile-visibility" icon={ShieldCheck} title="Видимость">
                  <div className="divide-y divide-border border-y border-border">
                    <Toggle icon={Globe2} checked={form.public_profile} onChange={(value) => update("public_profile", value)} title="Публичный профиль" text="Профиль доступен по ссылке и отображается в поиске." />
                    <Toggle icon={BriefcaseBusiness} checked={form.visible_to_employers} onChange={(value) => update("visible_to_employers", value)} title="Показывать компаниям" text="Компании смогут находить ваш профиль среди участников." />
                  </div>
                </FormSection>

                {error && (
                  <div className="mb-6 flex items-start gap-3 border border-destructive/20 bg-destructive/5 p-3.5 text-sm text-destructive">
                    <CircleAlert className="mt-0.5 shrink-0" size={17} /><span>{error}</span>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 z-30 flex gap-2 border-t border-border bg-card/95 p-4 backdrop-blur sm:hidden">
                <Button type="button" variant="outline" onClick={goBack} className="flex-1">Отмена</Button>
                <Button type="submit" disabled={loading || !dirty} className="flex-1">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Сохранить
                </Button>
              </div>
            </main>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormSection({ id, icon: Icon, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-border py-8 last:border-b-0 md:py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary/10 text-primary"><Icon size={17} /></span>
        <h2 className="font-heading text-lg font-extrabold">{title}</h2>
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
    <label className="group flex min-h-20 cursor-pointer items-center gap-3 py-4 transition-colors hover:bg-secondary/20 sm:px-2">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center transition-colors ${checked ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}><Icon size={17} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </label>
  );
}
