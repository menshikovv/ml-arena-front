import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileImage,
  LifeBuoy,
  Loader2,
  Mail,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/AuthContext";
import { FOUNDER_TELEGRAM_URL } from "@/lib/founder-season";

const SUPPORT_EMAIL = "support@mlarena.ru";

const TOPICS = [
  { id: "account", title: "Аккаунт и профиль", text: "Регистрация, подтверждение почты и данные профиля", icon: UserRound },
  { id: "founder", title: "Founder Season", text: "Активности, Telegram и подготовка к запуску", icon: Sparkles },
  { id: "security", title: "Правила и безопасность", text: "Данные, удаление аккаунта и безопасность", icon: ShieldCheck },
  { id: "support", title: "Связь с командой", text: "Технические вопросы и предложения", icon: MessageSquareText },
];

const FAQ_ITEMS = [
  {
    id: "register",
    category: "account",
    title: "Как зарегистрироваться на ML-Арене?",
    keywords: ["регистрация", "аккаунт", "создать профиль"],
    body: "Откройте страницу регистрации, укажите email, никнейм и пароль, а затем подтвердите почту кодом из письма.",
    action: { label: "Перейти к регистрации", to: "/register" },
  },
  {
    id: "email",
    category: "account",
    title: "Почему не приходит письмо подтверждения?",
    keywords: ["письмо", "код", "почта", "email", "спам"],
    body: "Проверьте папки «Спам» и «Промоакции», убедитесь, что адрес указан без ошибки, и запросите письмо повторно на странице подтверждения.",
  },
  {
    id: "profile",
    category: "account",
    title: "Как изменить данные профиля?",
    keywords: ["профиль", "аватар", "имя", "город", "редактировать"],
    body: "Откройте редактирование профиля. Там можно изменить никнейм, информацию о себе, аватар, место учёбы или работы и профессиональные ссылки.",
    action: { label: "Редактировать профиль", to: "/profile/edit" },
  },
  {
    id: "founder-season",
    category: "founder",
    title: "Что такое ML-Арена Founder Season?",
    keywords: ["founder season", "сезон", "предсезон", "запуск"],
    body: "Это ранний сезон для первых участников ML-Арены. До запуска соревнований в нём выходят мини-задачи, разборы, анонсы и материалы для подготовки.",
  },
  {
    id: "activities",
    category: "founder",
    title: "Где проходят активности до первого соревнования?",
    keywords: ["активности", "telegram", "телеграм", "задания", "анонсы"],
    body: "Все активности Founder Season сейчас проходят в официальном Telegram-канале ML-Арены. Персональные вопросы и данные аккаунта лучше отправлять через поддержку.",
    action: { label: "Открыть Telegram", href: FOUNDER_TELEGRAM_URL },
  },
  {
    id: "launch",
    category: "founder",
    title: "Когда появятся соревнования и дуэли?",
    keywords: ["соревнования", "дуэли", "когда", "запуск"],
    body: "В скором времени. О запуске и первых доступных форматах мы сообщим на сайте и в официальном Telegram-канале.",
  },
  {
    id: "bug",
    category: "support",
    title: "Как сообщить об ошибке на сайте?",
    keywords: ["ошибка", "баг", "не работает", "проблема", "сайт"],
    body: "Опишите, что произошло, на какой странице и после какого действия. Если возможно, приложите скриншот без паролей, cookie, токенов и других секретных данных.",
    supportAction: true,
  },
  {
    id: "data",
    category: "security",
    title: "Как удалить аккаунт или запросить свои данные?",
    keywords: ["удалить", "аккаунт", "данные", "персональные данные"],
    body: "Напишите в поддержку с адреса, связанного с аккаунтом, и выберите категорию «Данные и документы». Команда уточнит необходимые шаги подтверждения.",
    supportAction: true,
  },
  {
    id: "partnership",
    category: "support",
    title: "Как предложить партнёрство?",
    keywords: ["партнёрство", "компания", "университет", "сотрудничество"],
    body: "Расскажите о компании или университете, формате сотрудничества и оставьте контакт для ответа. Используйте форму ниже или почту поддержки.",
    supportAction: true,
  },
  {
    id: "vulnerability",
    category: "security",
    title: "Я нашёл уязвимость. Куда сообщить?",
    keywords: ["уязвимость", "безопасность", "security", "взлом"],
    body: "Сообщите о проблеме приватно через форму ниже или на support@mlarena.ru. Не публикуйте детали уязвимости в комментариях и открытых каналах.",
    supportAction: true,
  },
];

const CONTACTS = [
  { title: "Поддержка", text: "Аккаунт, сайт, результаты и технические вопросы.", action: "Написать в поддержку", href: `mailto:${SUPPORT_EMAIL}`, icon: LifeBuoy, tone: "bg-primary/10 text-primary" },
  { title: "Telegram", text: "Анонсы, материалы и активности Founder Season.", action: "Открыть Telegram", href: FOUNDER_TELEGRAM_URL, icon: Send, tone: "bg-[hsl(var(--chart-2)/0.14)] text-[hsl(var(--chart-2))]" },
  { title: "Сотрудничество", text: "Корпоративные соревнования, университеты и совместные проекты.", action: "Предложить сотрудничество", href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Сотрудничество с ML-Ареной")}`, icon: BriefcaseBusiness, tone: "bg-[hsl(var(--chart-4)/0.14)] text-[hsl(var(--chart-4))]" },
  { title: "Безопасность", text: "Сообщите об уязвимости или проблеме безопасности приватно.", action: "Сообщить об уязвимости", href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Безопасность ML-Арены")}`, icon: ShieldCheck, tone: "bg-destructive/10 text-destructive" },
];

const CATEGORY_OPTIONS = [
  ["account_profile", "Аккаунт и профиль"],
  ["technical", "Техническая проблема"],
  ["founder_season", "Founder Season"],
  ["privacy_legal", "Данные и документы"],
  ["partnership", "Сотрудничество"],
  ["security", "Безопасность"],
];

function normalizeSearch(value) {
  return value.toLowerCase().replaceAll("ё", "е").replace(/\s+/g, " ").trim();
}

export default function Help({ embedded = false }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const initialCategory = new URLSearchParams(location.search).get("category") || "all";
  const [category, setCategory] = useState(TOPICS.some((topic) => topic.id === initialCategory) ? initialCategory : "all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openItem, setOpenItem] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mailPrepared, setMailPrepared] = useState(false);
  const [form, setForm] = useState({ category: "technical", subject: "", message: "", reply_email: user?.email || "" });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 200);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (user?.email) setForm((current) => ({ ...current, reply_email: current.reply_email || user.email }));
  }, [user?.email]);

  useEffect(() => {
    if (!location.hash) return;
    window.requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [location.hash]);

  const filteredFaq = useMemo(() => {
    const query = normalizeSearch(debouncedSearch);
    const items = category === "all" ? FAQ_ITEMS : FAQ_ITEMS.filter((item) => item.category === category);
    if (query.length < 2) return items.slice(0, 8);
    return items
      .map((item) => {
        const title = normalizeSearch(item.title);
        const keywords = item.keywords.map(normalizeSearch);
        const body = normalizeSearch(item.body);
        const score = title === query || keywords.includes(query) ? 4 : title.startsWith(query) || keywords.some((keyword) => keyword.startsWith(query)) ? 3 : title.includes(query) || keywords.some((keyword) => keyword.includes(query)) ? 2 : body.includes(query) ? 1 : 0;
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ item }) => item);
  }, [category, debouncedSearch]);

  const scrollToSupport = (preferredCategory) => {
    if (preferredCategory) setForm((current) => ({ ...current, category: preferredCategory }));
    document.getElementById("support")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectTopic = (topicId) => {
    if (topicId === "support") {
      scrollToSupport();
      return;
    }
    setCategory(topicId);
    setSearch("");
    document.getElementById("faq")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const handleAttachments = (event) => {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (files.length + attachments.length > 3) {
      setAttachmentError("Можно приложить не больше трёх скриншотов.");
      return;
    }
    const invalid = files.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) {
      setAttachmentError("Скриншоты должны быть в JPG, PNG или WebP и весить до 5 МБ каждый.");
      return;
    }
    setAttachmentError("");
    setAttachments((current) => [...current, ...files]);
  };

  const prepareMail = (event) => {
    event.preventDefault();
    setSubmitting(true);
    const categoryLabel = CATEGORY_OPTIONS.find(([value]) => value === form.category)?.[1] || "Поддержка";
    const attachmentNames = attachments.length ? `\n\nСкриншоты для приложения: ${attachments.map((file) => file.name).join(", ")}` : "";
    const body = `Категория: ${categoryLabel}\nEmail для ответа: ${form.reply_email}\nСтраница: ${window.location.href}\n\n${form.message}${attachmentNames}`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[ML-Арена] ${form.subject}`)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    window.setTimeout(() => {
      setSubmitting(false);
      setMailPrepared(true);
    }, 250);
  };

  return (
    <div className="min-h-full bg-background text-foreground">
      {!embedded && <PublicHeader isAuthenticated={isAuthenticated} />}

      <main>
        <section className="border-b border-border bg-secondary/25">
          <Reveal className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 md:py-20">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/15"><LifeBuoy size={23} /></span>
            <h1 className="mt-5 font-heading text-4xl font-bold sm:text-5xl">Помощь и поддержка</h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Ответы на частые вопросы и связь с командой ML-Арены.</p>
            <div className="relative mx-auto mt-8 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={19} />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти ответ..." className="h-12 rounded-lg bg-card pl-12 pr-12 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20" />
              {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" title="Очистить поиск"><X size={16} /></button>}
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16">
          <Reveal>
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">Популярные темы</h2>
            <p className="mt-2 text-sm text-muted-foreground">Выберите направление, чтобы сразу перейти к нужным ответам.</p>
          </Reveal>
          <Stagger className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <StaggerItem key={topic.id}>
                  <button type="button" onClick={() => selectTopic(topic.id)} className="group flex h-full min-h-40 w-full flex-col border border-border bg-card p-5 text-left shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={19} /></span>
                    <span className="mt-6 font-heading text-lg font-bold group-hover:text-primary">{topic.title}</span>
                    <span className="mt-2 text-sm leading-6 text-muted-foreground">{topic.text}</span>
                  </button>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        <section id="faq" className="scroll-mt-6 border-y border-border bg-secondary/20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] md:py-16">
            <Reveal className="min-w-0">
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">Частые вопросы</h2>
              <div className="mt-6 flex gap-2 overflow-x-auto pb-1 md:flex-col">
                {[['all', 'Все вопросы'], ...TOPICS.filter((topic) => topic.id !== 'support').map((topic) => [topic.id, topic.title])].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setCategory(id)} className={`shrink-0 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${category === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground"}`}>{label}</button>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.06} className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
              {filteredFaq.length ? filteredFaq.map((item) => {
                const opened = openItem === item.id;
                return (
                  <div key={item.id} className="border-b border-border last:border-b-0">
                    <button type="button" onClick={() => setOpenItem(opened ? null : item.id)} className="flex w-full items-center justify-between gap-5 px-5 py-4 text-left hover:bg-secondary/35 sm:px-6">
                      <span className="font-semibold">{item.title}</span>
                      <ChevronDown className={`shrink-0 text-muted-foreground transition-transform duration-200 ${opened ? "rotate-180" : ""}`} size={18} />
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${opened ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5 text-sm leading-7 text-muted-foreground sm:px-6">
                          <p>{item.body}</p>
                          {item.action?.to && <Button asChild variant="outline" size="sm" className="mt-4"><Link to={item.action.to}>{item.action.label} <ArrowRight size={14} /></Link></Button>}
                          {item.action?.href && <Button asChild variant="outline" size="sm" className="mt-4"><a href={item.action.href} target="_blank" rel="noopener noreferrer">{item.action.label} <ArrowRight size={14} /></a></Button>}
                          {item.supportAction && <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => scrollToSupport(item.id === "vulnerability" ? "security" : undefined)}>Написать в поддержку <ArrowRight size={14} /></Button>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="px-6 py-12 text-center">
                  <CircleHelp className="mx-auto text-muted-foreground" size={28} />
                  <h3 className="mt-4 font-heading text-lg font-bold">Ничего не найдено</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Попробуйте изменить формулировку или напишите в поддержку.</p>
                  <Button type="button" className="mt-5" onClick={() => scrollToSupport()}>Написать в поддержку</Button>
                </div>
              )}
            </Reveal>
          </div>
        </section>

        <section id="support" className="scroll-mt-6 mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
          <div className="grid gap-9 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <Reveal>
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">Не нашли ответ? Напишите нам</h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">Опишите вопрос как можно точнее. Если проблема техническая, приложите скриншот без секретных данных.</p>
              <div className="mt-7 border-l-2 border-primary bg-secondary/35 px-5 py-4 text-sm leading-6 text-muted-foreground">
                Не отправляйте пароль, cookie, токены доступа, секретные ключи и полные дампы браузера.
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              {mailPrepared ? (
                <div className="rounded-lg border border-border bg-card p-7 shadow-sm sm:p-8">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><CheckCircle2 size={21} /></span>
                  <h3 className="mt-5 font-heading text-2xl font-bold">Письмо подготовлено</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">Мы открыли ваше почтовое приложение с заполненным обращением. Проверьте текст, приложите выбранные скриншоты и отправьте письмо.</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild><a href={`mailto:${SUPPORT_EMAIL}`}>Открыть почту ещё раз</a></Button>
                    <Button type="button" variant="outline" onClick={() => setMailPrepared(false)}>Новое обращение</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={prepareMail} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                    <Field label="Категория" htmlFor="support-category">
                      <select id="support-category" value={form.category} onChange={(event) => updateForm("category", event.target.value)} className="flex h-11 w-full rounded-md border border-input bg-secondary/25 px-3 text-sm shadow-none outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15">
                        {CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </Field>
                    <Field label="Email для ответа" htmlFor="support-email">
                      <Input id="support-email" type="email" value={form.reply_email} onChange={(event) => updateForm("reply_email", event.target.value.toLowerCase())} maxLength={254} className="h-11 bg-secondary/25 shadow-none focus-visible:ring-2 focus-visible:ring-primary/15" required />
                    </Field>
                    <Field label="Тема" htmlFor="support-subject" className="sm:col-span-2">
                      <Input id="support-subject" value={form.subject} onChange={(event) => updateForm("subject", event.target.value)} minLength={5} maxLength={120} placeholder="Коротко опишите вопрос" className="h-11 bg-secondary/25 shadow-none focus-visible:ring-2 focus-visible:ring-primary/15" required />
                    </Field>
                    <Field label="Сообщение" htmlFor="support-message" className="sm:col-span-2">
                      <Textarea id="support-message" value={form.message} onChange={(event) => updateForm("message", event.target.value)} minLength={20} maxLength={4000} rows={7} placeholder="Что произошло, где и после какого действия?" className="resize-none bg-secondary/25 shadow-none focus-visible:ring-2 focus-visible:ring-primary/15" required />
                      <span className="mt-1 block text-right text-[11px] tabular-nums text-muted-foreground">{form.message.length}/4000</span>
                    </Field>
                    <div className="sm:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Label htmlFor="support-files">Скриншоты</Label>
                        <span className="text-[11px] text-muted-foreground">До 3 файлов по 5 МБ</span>
                      </div>
                      <label htmlFor="support-files" className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-secondary/20 px-4 py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.03] hover:text-primary">
                        <FileImage size={17} /> Выбрать скриншоты
                      </label>
                      <input id="support-files" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleAttachments} className="sr-only" />
                      {attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {attachments.map((file, index) => (
                            <span key={`${file.name}-${file.lastModified}`} className="inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs">
                              <span className="max-w-52 truncate">{file.name}</span>
                              <button type="button" onClick={() => setAttachments((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="text-muted-foreground hover:text-destructive" title="Убрать файл"><X size={13} /></button>
                            </span>
                          ))}
                        </div>
                      )}
                      {attachmentError && <p className="mt-2 text-xs text-destructive">{attachmentError}</p>}
                    </div>
                  </div>
                  {form.category === "security" && <div className="border-t border-destructive/15 bg-destructive/5 px-5 py-4 text-sm leading-6 text-destructive sm:px-7">Не публикуйте детали уязвимости в открытых каналах. Отправьте их только через приватное письмо.</div>}
                  <div className="flex flex-col justify-between gap-3 border-t border-border bg-secondary/20 px-5 py-4 sm:flex-row sm:items-center sm:px-7">
                    <p className="text-xs text-muted-foreground">Ответ придёт на указанный email.</p>
                    <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />} Подготовить обращение</Button>
                  </div>
                </form>
              )}
            </Reveal>
          </div>
        </section>

        <section id="contacts" className="scroll-mt-6 border-t border-border bg-secondary/25">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
            <Reveal>
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">Контакты</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Выберите подходящий канал. Персональные вопросы не отправляйте в публичные комментарии.</p>
            </Reveal>
            <Stagger className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {CONTACTS.map((contact) => {
                const Icon = contact.icon;
                const external = contact.href.startsWith("http");
                return (
                  <StaggerItem key={contact.title}>
                    <a href={contact.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="group flex min-h-52 h-full flex-col border border-border bg-card p-5 shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${contact.tone}`}><Icon size={20} /></span>
                      <h3 className="mt-6 font-heading text-lg font-bold">{contact.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{contact.text}</p>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">{contact.action} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
                    </a>
                  </StaggerItem>
                );
              })}
            </Stagger>
            <div className="mt-10 flex flex-col justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
              <p>Отправляя обращение, вы соглашаетесь с обработкой данных для ответа на ваш вопрос.</p>
              <div className="flex gap-5"><Link to="/terms" className="hover:text-foreground">Условия использования</Link><Link to="/privacy" className="hover:text-foreground">Политика обработки данных</Link></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function PublicHeader({ isAuthenticated }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5"><img src="/logo.svg" alt="" className="h-8 w-8 object-contain" /><span className="font-heading text-lg font-bold">ML-Арена</span></Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/">На главную</Link></Button>
          <Button asChild><Link to={isAuthenticated ? "/profile" : "/login"}>{isAuthenticated ? "Профиль" : "Войти"}</Link></Button>
        </div>
      </div>
    </header>
  );
}

function Field({ label, htmlFor, className = "", children }) {
  return <div className={`space-y-2 ${className}`}><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
