import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
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
  Target,
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
import "./ProfileEdit.css";

const ML_INTERESTS = [
  ["classification", "Классификация"], ["regression", "Регрессия"], ["nlp", "NLP"],
  ["computer_vision", "Компьютерное зрение"], ["time_series", "Временные ряды"],
  ["ranking", "Ранжирование"], ["clustering", "Кластеризация"], ["recsys", "RecSys"],
];

export default function ProfileEdit() {
  const { user, updateProfile, updateAvatar, deleteAvatar } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const initial = useMemo(() => ({
    nickname: user?.nickname || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    age: user?.age ?? "",
    gender: user?.gender || "",
    interests: Array.isArray(user?.interests) ? user.interests : [],
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
  const [draggingAvatar, setDraggingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || Boolean(avatarFile) || removeAvatar;
  const displayName = [form.first_name, form.last_name].filter(Boolean).join(" ") || form.nickname || "Новый участник";
  const registeredAt = user?.registered_at ? new Date(user.registered_at) : null;
  const joinedYear = registeredAt && !Number.isNaN(registeredAt.getTime()) ? registeredAt.getFullYear() : null;

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
  const toggleInterest = (interest) => setForm((current) => ({
    ...current,
    interests: current.interests.includes(interest)
      ? current.interests.filter((item) => item !== interest)
      : [...current.interests, interest].slice(0, 8),
  }));
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

  return <div className="profile-edit-page"><div className="profile-edit-frame">
    <button type="button" onClick={goBack} className="profile-edit-back"><ArrowLeft size={16} />Вернуться в профиль</button>
    <form onSubmit={handleSubmit}>
      <header className="profile-edit-top">
        <div className="profile-edit-top__copy"><h1>Редактирование профиля</h1><p>Актуальная информация о вас помогает другим участникам узнать вас лучше.</p></div>
        <div className="profile-edit-top__actions">
          <div className="profile-edit-top__buttons">
            <Button type="button" variant="outline" onClick={goBack}>Отмена</Button>
            <Button type="submit" disabled={loading || !dirty} className="profile-edit-save">{loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Сохранить изменения</Button>
          </div>
          <span className={dirty ? "profile-edit-top__status is-dirty" : "profile-edit-top__status"}>{dirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}</span>
        </div>
      </header>

      <div className={`profile-edit-hero ${draggingAvatar ? "is-dragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDraggingAvatar(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDraggingAvatar(false)} onDrop={handleAvatarDrop}>
        <div className="profile-edit-hero__art" aria-hidden="true"><span /><span /><span /></div>
        <p className="profile-edit-hero__motto" aria-hidden="true">Больше,<br />чем ML</p>
        <div className="profile-edit-hero__avatar">
          <button type="button" onClick={() => fileRef.current?.click()} title="Изменить фото (JPG, PNG или WebP до 5 МБ)" aria-label="Изменить фото" className="profile-edit-hero__avatar-button">
            <Avatar name={displayName} src={avatarPreview} size={132} />
            <span className="profile-edit-hero__camera"><Camera size={17} aria-hidden="true" /></span>
          </button>
          {avatarPreview && <button type="button" onClick={clearAvatar} title="Удалить фото" aria-label="Удалить фото" className="profile-edit-hero__remove"><Trash2 size={15} aria-hidden="true" /></button>}
        </div>
        <div className="profile-edit-hero__identity">
          <h2>{displayName}</h2>
          <p className="profile-edit-hero__handle">@{form.nickname || "nickname"}</p>
          <p className="profile-edit-hero__bio">{form.bio || "Описание профиля пока не заполнено."}</p>
          <div className="profile-edit-hero__meta">
            {joinedYear && <span><CalendarDays size={13} />ML-Арена с {joinedYear}</span>}
            {form.city && <span><MapPin size={13} />{form.city}</span>}
            {form.education_status && <span><GraduationCap size={13} />{form.education_status}</span>}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} className="sr-only" tabIndex={-1} />
      </div>

      <div className="profile-edit-grid">
        <FormCard id="profile-main" icon={UserRound} title="Основная информация" description="Расскажите о себе — это будет видно другим участникам." className="profile-edit-card--main">
          <div className="profile-edit-fields profile-edit-fields--three">
            <Field label="Никнейм" htmlFor="profile-nickname" required><Input id="profile-nickname" value={form.nickname} onChange={(event) => update("nickname", event.target.value)} autoComplete="username" maxLength={30} className="profile-edit-input" required /></Field>
            <Field label="Имя" htmlFor="profile-first-name"><Input id="profile-first-name" value={form.first_name} onChange={(event) => update("first_name", event.target.value)} autoComplete="given-name" maxLength={60} className="profile-edit-input" /></Field>
            <Field label="Фамилия" htmlFor="profile-last-name"><Input id="profile-last-name" value={form.last_name} onChange={(event) => update("last_name", event.target.value)} autoComplete="family-name" maxLength={60} className="profile-edit-input" /></Field>
          </div>
          <Field label="О себе" htmlFor="profile-bio" className="profile-edit-field--bio"><Textarea id="profile-bio" value={form.bio} onChange={(event) => update("bio", event.target.value)} maxLength={1000} rows={4} placeholder="Расскажите о своём опыте и интересах" className="profile-edit-textarea" /><span className="profile-edit-field__counter">{form.bio.length}/1000</span></Field>
        </FormCard>

        <FormCard id="profile-contacts" icon={Mail} title="Контакты" description="Ваши публичные контакты для связи и сотрудничества." className="profile-edit-card--contacts">
          <div className="profile-edit-fields">
            <Field label="Email" htmlFor="profile-email" icon={Mail}><Input id="profile-email" type="email" value={user?.email || ""} readOnly disabled className="profile-edit-input" /></Field>
            <Field label="GitHub" htmlFor="profile-github" icon={Link2}><Input id="profile-github" type="url" value={form.github_url} onChange={(event) => update("github_url", event.target.value)} autoComplete="url" placeholder="https://github.com/username" className="profile-edit-input" /></Field>
            <Field label="Kaggle" htmlFor="profile-kaggle" icon={Link2}><Input id="profile-kaggle" type="url" value={form.kaggle_url} onChange={(event) => update("kaggle_url", event.target.value)} autoComplete="url" placeholder="https://kaggle.com/username" className="profile-edit-input" /></Field>
          </div>
        </FormCard>

        <FormCard id="profile-location" icon={MapPin} title="Личные данные" description="Эта информация может отображаться в вашем публичном профиле." className="profile-edit-card--location">
          <div className="profile-edit-fields profile-edit-fields--three">
            <Field label="Город" htmlFor="profile-city" icon={MapPin}><Input id="profile-city" value={form.city} onChange={(event) => update("city", event.target.value)} autoComplete="address-level2" maxLength={100} placeholder="Ваш город" className="profile-edit-input" /></Field>
            <Field label="Возраст" htmlFor="profile-age" icon={CalendarDays}><Input id="profile-age" type="number" min="0" max="120" inputMode="numeric" value={form.age} onChange={(event) => update("age", event.target.value)} placeholder="24" className="profile-edit-input" /></Field>
            <Field label="Пол" htmlFor="profile-gender" icon={UserRound}><select id="profile-gender" value={form.gender} onChange={(event) => update("gender", event.target.value)} className="profile-edit-input"><option value="">Не указан</option><option value="male">Мужской</option><option value="female">Женский</option></select></Field>
          </div>
        </FormCard>

        <FormCard id="profile-education" icon={GraduationCap} title="Образование" description="Укажите ваш университет." className="profile-edit-card--education">
          <Field label="Университет" htmlFor="profile-university" icon={GraduationCap}><Input id="profile-university" value={form.education_status} onChange={(event) => update("education_status", event.target.value)} maxLength={200} placeholder="Название университета" className="profile-edit-input" /></Field>
        </FormCard>

        <FormCard id="profile-work" icon={BriefcaseBusiness} title="Работа" description="Укажите текущую компанию, если применимо." className="profile-edit-card--work">
          <Field label="Компания" htmlFor="profile-company" icon={BriefcaseBusiness}><Input id="profile-company" value={form.organization} onChange={(event) => update("organization", event.target.value)} autoComplete="organization" maxLength={200} placeholder="Компания" className="profile-edit-input" /></Field>
        </FormCard>

        <FormCard id="profile-interests" icon={Target} title="ML-интересы" description="Выберите направления, которыми занимаетесь или хотите заниматься." className="profile-edit-card--interests">
          <div className="profile-edit-interests" role="group" aria-label="ML-интересы">{ML_INTERESTS.map(([value, label]) => { const selected = form.interests.includes(value); return <button key={value} type="button" aria-pressed={selected} onClick={() => toggleInterest(value)} className={`profile-edit-interests__option ${selected ? "is-selected" : ""}`}>{selected && <Check size={13} aria-hidden="true" />}{label}</button>; })}</div>
        </FormCard>

        <FormCard id="profile-visibility" icon={ShieldCheck} title="Видимость" description="Настройте, какая информация будет отображаться в вашем публичном профиле." className="profile-edit-card--visibility">
          <div className="profile-edit-visibility">
            <Toggle icon={Globe2} checked={form.public_profile} onChange={(value) => update("public_profile", value)} title="Публичный профиль" text="Профиль доступен по ссылке и отображается в поиске." />
            <Toggle icon={BriefcaseBusiness} checked={form.visible_to_employers} onChange={(value) => update("visible_to_employers", value)} title="Показывать компаниям" text="Компании смогут находить ваш профиль среди участников." />
            <Toggle icon={UserRound} checked={form.show_real_name} onChange={(value) => update("show_real_name", value)} title="Показывать имя и фамилию" text="Имя и фамилия видны посетителям публичного профиля." />
            <Toggle icon={BriefcaseBusiness} checked={form.show_career_details} onChange={(value) => update("show_career_details", value)} title="Показывать карьерные данные" text="Город, университет, компания и внешние профили видны посетителям." />
          </div>
        </FormCard>
      </div>

      {error && <div className="profile-edit-error" role="alert"><CircleAlert size={18} aria-hidden="true" /><span>{error}</span></div>}
      <div className="profile-edit-mobile-actions"><Button type="button" variant="outline" onClick={goBack}>Отмена</Button><Button type="submit" disabled={loading || !dirty} className="profile-edit-save">{loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Сохранить</Button></div>
    </form>
  </div></div>;
}

function FormCard({ id, icon: Icon, title, description, className = "", children }) {
  return <section id={id} className={`profile-edit-card ${className}`}>
    <div className="profile-edit-card__heading"><span className="profile-edit-card__icon"><Icon size={20} strokeWidth={2} aria-hidden="true" /></span><div><h2>{title}</h2><p>{description}</p></div></div>
    <div className="profile-edit-card__content">{children}</div>
  </section>;
}

function Field({ label, htmlFor, icon: Icon, required = false, className = "", children }) {
  return <div className={`profile-edit-field ${className}`}>
    <Label htmlFor={htmlFor}>{label}{required && <span className="profile-edit-field__required"> *</span>}</Label>
    <div className={`profile-edit-field__control ${Icon ? "has-icon" : ""}`}>{Icon && <Icon size={15} aria-hidden="true" />}{children}</div>
  </div>;
}

function Toggle({ icon: Icon, checked, onChange, title, text }) {
  return <label className="profile-edit-toggle">
    <span className="profile-edit-toggle__icon"><Icon size={19} aria-hidden="true" /></span>
    <span className="profile-edit-toggle__copy"><strong>{title}</strong><small>{text}</small></span>
    <span className={`profile-edit-toggle__switch ${checked ? "is-checked" : ""}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" /><span /></span>
  </label>;
}
