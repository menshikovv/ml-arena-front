import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Copy,
  FileImage,
  LifeBuoy,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal, Stagger, StaggerItem } from "@/components/ml/PageReveal";
import ThemeToggle from "@/components/ml/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/AuthContext";

const SUPPORT_EMAIL = "support@mlarena.ru";

const TOPICS = [
  { id: "about", title: "Об ML-Арене", text: "Как устроена платформа и чем она отличается", icon: CircleHelp },
  { id: "account", title: "Аккаунт", text: "Регистрация, подтверждение почты и вход", icon: UserRound },
  { id: "activities", title: "Активности", text: "Соревнования, решения, правила и команды", icon: Sparkles },
  { id: "passport", title: "Рейтинг и ML-паспорт", text: "Результаты, компетенции и внешние достижения", icon: ShieldCheck },
  { id: "career", title: "Компании", text: "Карьерные возможности и видимость данных", icon: BriefcaseBusiness },
  { id: "support", title: "Поддержка", text: "Ошибки, безопасность и удаление аккаунта", icon: LifeBuoy },
];

const FAQ_ITEMS = [
  {
    id: "what-is-ml-arena",
    category: "about",
    title: "Что такое ML-Арена?",
    keywords: ["платформа", "практика", "компетенции", "навыки"],
    body: "ML-Арена — платформа для подтверждения и развития компетенций в машинном обучении через практику. Пользователь решает задачи, участвует в соревнованиях и рейтинговых форматах, подтверждает результаты и постепенно формирует собственный ML-паспорт. Цель платформы — показать не только заявленные навыки, но и то, чем они подтверждены на практике.",
  },
  {
    id: "platform-difference",
    category: "about",
    title: "Чем ML-Арена отличается от обычной платформы с ML-соревнованиями?",
    keywords: ["отличия", "соревнования", "результаты", "история"],
    body: "Соревнования — только один из форматов ML-Арены. Результаты разных активностей используются для формирования ML-паспорта: истории результатов, сильных направлений, подтверждённых достижений и объективной статистики. Со временем такой профиль даёт более полное представление о практических компетенциях, чем итог одного соревнования.",
  },
  {
    id: "kaggle-analogue",
    category: "about",
    title: "ML-Арена — это аналог Kaggle?",
    keywords: ["kaggle", "ods", "аналог", "внешние площадки"],
    body: "Нет. ML-Арена не ставит задачу заменить Kaggle или другие площадки. Платформа строится вокруг накопления подтверждений компетенций из разных источников и форматов. Сильные результаты с Kaggle, ODS.ai и других платформ можно будет учитывать как внешние достижения, а не начинать профессиональную историю заново.",
  },
  {
    id: "register",
    category: "account",
    title: "Как зарегистрироваться на ML-Арене?",
    keywords: ["регистрация", "аккаунт", "создать профиль"],
    body: "Войдите в существующий аккаунт. После входа можно заполнить профиль; подтверждённые результаты и статистика ML-паспорта формируются отдельно на основании активности.",
    action: { label: "Перейти ко входу", to: "/login" },
  },
  {
    id: "email",
    category: "account",
    title: "Я не получил письмо для подтверждения почты. Что делать?",
    keywords: ["письмо", "код", "почта", "email", "спам"],
    body: "Проверьте папки «Спам» и «Промоакции» и подождите несколько минут. Затем попробуйте запросить письмо повторно. Если проблема сохраняется, обратитесь в поддержку и укажите адрес, использованный при регистрации. Никогда не отправляйте сотрудникам ML-Арены свой пароль.",
    supportAction: true,
  },
  {
    id: "cannot-login",
    category: "account",
    title: "Я не могу войти в аккаунт. Что делать?",
    keywords: ["вход", "пароль", "не могу войти", "восстановление"],
    body: "Проверьте правильность адреса электронной почты и пароля. Если вы забыли пароль, воспользуйтесь восстановлением доступа. Если войти всё равно не получается, обратитесь в поддержку и по возможности приложите скриншот ошибки. Пароль отправлять не нужно.",
    action: { label: "Восстановить доступ", to: "/forgot-password" },
  },
  {
    id: "available-activities",
    category: "activities",
    title: "Какие активности будут доступны на ML-Арене?",
    keywords: ["активности", "форматы", "соревнования", "дуэли", "задачи"],
    body: "ML-Арена использует несколько практических форматов:\n• полноценные ML-соревнования;\n• быстрые задачи;\n• рейтинговые дуэли;\n• тематические испытания;\n• специальные активности от компаний и партнёров.\n\nУ каждого формата могут быть собственные правила, продолжительность и система оценки.",
  },
  {
    id: "join-activity",
    category: "activities",
    title: "Как принять участие в активности?",
    keywords: ["участие", "начать", "данные", "правила"],
    body: "Откройте страницу интересующей активности и ознакомьтесь с описанием, сроками, правилами и условиями участия. Если нужно скачать данные, подготовить решение или загрузить файл, порядок действий будет указан непосредственно на странице. Правила разных активностей могут отличаться.",
  },
  {
    id: "activity-price",
    category: "activities",
    title: "Нужно ли платить за участие?",
    keywords: ["цена", "бесплатно", "оплата", "тариф"],
    body: "Если на странице конкретной активности не указано обратное, участие бесплатно. Платные возможности ML-Арены не дают преимущество при расчёте соревновательного результата, рейтинга или итогового места.",
  },
  {
    id: "submit-solution",
    category: "activities",
    title: "Как отправляется решение в ML-соревновании?",
    keywords: ["решение", "csv", "отправка", "загрузка", "предсказания"],
    body: "Формат зависит от задачи. В большинстве классических ML-соревнований пользователь скачивает данные, обучает модель в удобной среде, формирует файл с предсказаниями и загружает его на ML-Арену. После загрузки система проверяет формат и рассчитывает результат по правилам задачи.",
  },
  {
    id: "source-code",
    category: "activities",
    title: "Нужно ли загружать исходный код?",
    keywords: ["код", "репозиторий", "воспроизводимость", "проверка"],
    body: "Не для каждой отправки. Однако правила активности могут предусматривать дополнительную проверку лучших решений. Тогда ML-Арена может запросить исходный код, описание подхода, зависимости, инструкции по запуску и другие материалы. Для отдельных результатов также может проводиться проверка воспроизводимости или защита решения.",
  },
  {
    id: "file-rejected",
    category: "activities",
    title: "Почему файл с моим решением не принимается?",
    keywords: ["файл", "ошибка", "формат", "столбцы", "идентификаторы"],
    body: "Чаще всего проблема связана с форматом файла. Проверьте:\n• названия столбцов;\n• наличие всех необходимых объектов;\n• отсутствие повторяющихся идентификаторов;\n• отсутствие пропущенных значений;\n• допустимый формат предсказаний;\n• соответствие примеру файла из условий задачи.\n\nЕсли найти проблему не получается, обратитесь в поддержку и приложите текст ошибки или скриншот.",
    supportAction: true,
  },
  {
    id: "final-score-difference",
    category: "activities",
    title: "Почему итоговый результат может отличаться от результата во время соревнования?",
    keywords: ["итоговый результат", "скрытые данные", "публичная таблица", "финальная оценка"],
    body: "В некоторых задачах промежуточный результат рассчитывается только на части проверочных данных, а финальная оценка — на другой, заранее скрытой части. Это уменьшает влияние случайного подбора решения под промежуточный результат и точнее оценивает итоговый подход. Конкретный порядок всегда указан в правилах активности.",
  },
  {
    id: "attempt-limit",
    category: "activities",
    title: "Сколько решений можно отправлять?",
    keywords: ["лимит", "попытки", "отправки", "сколько решений"],
    body: "Количество попыток определяется правилами конкретной активности. Доступный лимит отображается на её странице и действует одинаково для участников соответствующего формата.",
  },
  {
    id: "ai-tools",
    category: "activities",
    title: "Можно ли использовать ChatGPT, Claude, Cursor и другие ИИ-инструменты?",
    keywords: ["chatgpt", "claude", "cursor", "ии", "ai", "нейросети"],
    body: "Это определяется правилами конкретной активности. ИИ-инструменты становятся частью современной работы ML-разработчика, поэтому их использование не обязательно запрещено во всех форматах. Пользователь отвечает за итоговое решение и соблюдение правил. Если для задачи есть ограничения на использование ИИ, они будут указаны отдельно.",
  },
  {
    id: "team-participation",
    category: "activities",
    title: "Можно ли участвовать командой?",
    keywords: ["команда", "вместе", "участники", "командный формат"],
    body: "Зависит от конкретной активности. Если командное участие разрешено, на странице будут указаны правила формирования команды и максимально допустимое количество участников. В остальных случаях активность считается индивидуальной.",
  },
  {
    id: "rating",
    category: "passport",
    title: "Что такое рейтинг ML-Арены?",
    keywords: ["рейтинг", "очки", "место", "расчёт"],
    body: "Рейтинг отражает результаты пользователя в рейтинговых активностях ML-Арены. Он формируется на основании фактических результатов, а не выставляется пользователем самостоятельно. В разных форматах могут использоваться разные механики расчёта.",
  },
  {
    id: "ml-passport",
    category: "passport",
    title: "Что такое ML-паспорт?",
    keywords: ["ml-паспорт", "компетенции", "результаты", "профиль"],
    body: "ML-паспорт — профиль подтверждённых ML-компетенций. В нём постепенно собираются объективные данные из практической активности: направления машинного обучения, результаты задач и соревнований, динамика, подтверждённые достижения и другие показатели. Обычный профиль пользователь заполняет сам, а ML-паспорт формируется на основании результатов и подтверждений.",
  },
  {
    id: "self-declared-skills",
    category: "passport",
    title: "Можно ли самостоятельно указать в ML-паспорте, что я хорошо знаю NLP, CV или RecSys?",
    keywords: ["nlp", "cv", "recsys", "навыки", "самооценка"],
    body: "Самостоятельно заявленные навыки и подтверждённые компетенции — разные вещи. Интересы и информацию о себе можно указывать в обычном профиле. Подтверждённая часть ML-паспорта формируется на основании результатов практических активностей и проверенных достижений.",
  },
  {
    id: "external-achievements",
    category: "passport",
    title: "Можно ли добавить достижения с Kaggle, ODS.ai и других платформ?",
    keywords: ["kaggle", "ods", "внешние достижения", "олимпиады"],
    body: "ML-Арена планирует поддерживать раздел внешних достижений. Результаты с других ML-платформ, соревнований и олимпиад будут отображаться отдельно от результатов ML-Арены — с указанием источника и уровня подтверждения. Добавленные достижения могут проходить автоматическую или ручную проверку.",
  },
  {
    id: "keep-kaggle-results",
    category: "passport",
    title: "Если у меня уже есть достижения на Kaggle, мне придётся начинать всё заново?",
    keywords: ["kaggle", "заново", "перенести", "достижения"],
    body: "Нет. Одна из задач ML-Арены — позволить пользователю собирать профессиональные подтверждения в одном месте, а не обнулять существующие результаты. Сильное достижение на внешней площадке дополняет ML-паспорт, а не конкурирует с результатами ML-Арены.",
  },
  {
    id: "passport-data",
    category: "passport",
    title: "Какие данные могут отображаться в ML-паспорте?",
    keywords: ["данные паспорта", "показатели", "статистика", "история"],
    body: "По мере развития платформы в ML-паспорте могут отображаться:\n• направления с подтверждёнными результатами;\n• результаты практических активностей;\n• место относительно других участников;\n• динамика и стабильность результатов;\n• история подтверждённых достижений;\n• результаты проверки и воспроизводимости;\n• внешние достижения с указанием источника.\n\nНабор показателей зависит от доступных на платформе форматов.",
  },
  {
    id: "company-results",
    category: "career",
    title: "Могут ли компании использовать результаты ML-Арены?",
    keywords: ["компании", "работодатель", "результаты", "найм"],
    body: "Одна из задач ML-Арены — дать компаниям дополнительный способ оценивать практические компетенции специалистов. Вместо ориентации только на резюме и заявленные навыки компания сможет учитывать подтверждённые результаты практических задач и другие данные ML-паспорта.",
  },
  {
    id: "company-contact",
    category: "career",
    title: "Могут ли компании связаться со мной через ML-Арену?",
    keywords: ["связаться", "работа", "карьерная видимость", "контакты"],
    body: "Только если пользователь включил соответствующую возможность и предоставил необходимые согласия. Карьерная видимость профиля и передача контактных данных работодателям не включаются автоматически. Пользователь самостоятельно управляет доступными карьерными настройками.",
  },
  {
    id: "company-personal-data",
    category: "career",
    title: "Видят ли компании все мои персональные данные?",
    keywords: ["персональные данные", "приватность", "видимость", "работодатель"],
    body: "Нет. Доступ зависит от настроек пользователя, режима видимости профиля и предоставленных согласий. ML-Арена не передаёт работодателям контактные или другие закрытые персональные данные автоматически и без соответствующего основания.",
  },
  {
    id: "bug",
    category: "support",
    title: "Как сообщить об ошибке на сайте?",
    keywords: ["ошибка", "баг", "не работает", "проблема", "сайт"],
    body: "Укажите, что вы пытались сделать, на какой странице возникла проблема, что произошло и что вы ожидали увидеть. По возможности приложите скриншот. Если проблема связана с конкретной активностью, добавьте её название. Не прикладывайте пароли, cookie, токены и другие секретные данные.",
    supportAction: true,
  },
  {
    id: "vulnerability",
    category: "support",
    title: "Что делать, если я нашёл уязвимость?",
    keywords: ["уязвимость", "безопасность", "security", "взлом"],
    body: "Не публикуйте сведения об уязвимости и не пытайтесь использовать её против пользователей или инфраструктуры ML-Арены. Свяжитесь с нами через поддержку и по возможности опишите условия воспроизведения и потенциальные последствия проблемы.",
    supportAction: true,
  },
  {
    id: "delete-account",
    category: "support",
    title: "Как удалить аккаунт или запросить удаление персональных данных?",
    keywords: ["удалить", "аккаунт", "данные", "персональные данные"],
    body: "Отправьте запрос через поддержку с адреса электронной почты, связанного с аккаунтом. Для защиты пользователя команда может запросить дополнительное подтверждение того, что обращение поступило от владельца аккаунта.",
    supportAction: true,
  },
  {
    id: "partnership",
    category: "support",
    title: "Куда обращаться по вопросам сотрудничества?",
    keywords: ["партнёрство", "компания", "образование", "сообщество", "сотрудничество"],
    body: "Для компаний, образовательных организаций, сообществ и потенциальных партнёров предусмотрена отдельная страница «Сотрудничество». Там можно узнать о форматах работы с ML-Ареной и оставить заявку на обсуждение проекта. Технические вопросы лучше направлять через поддержку.",
    action: { label: "Перейти на страницу для компаний", to: "/companies" },
  },
];

const CONTACTS = [
  { title: "Поддержка", text: "Вопросы об аккаунте, сайте, результатах и работе платформы.", action: "Открыть поддержку", to: "/support", icon: LifeBuoy, tone: "bg-primary/10 text-primary" },
  { title: "Компаниям", text: "Корпоративные соревнования, поиск специалистов и совместные ML-проекты.", action: "Открыть страницу для компаний", to: "/companies", icon: BriefcaseBusiness, tone: "bg-[hsl(var(--chart-4)/0.14)] text-[hsl(var(--chart-4))]" },
  { title: "Написать на почту", text: "Прямая связь с командой ML-Арены для любых вопросов.", action: "Скопировать email", href: "mailto:support@mlarena.ru", icon: Mail, tone: "bg-green/10 text-green", copyEmail: "support@mlarena.ru" },
];

const CATEGORY_OPTIONS = [
  ["account_profile", "Аккаунт и профиль"],
  ["technical", "Техническая проблема"],
  ["founder_season", "Founder Season"],
  ["privacy_legal", "Данные и документы"],
  ["security", "Безопасность"],
];

function normalizeSearch(value) {
  return value.toLowerCase().replaceAll("ё", "е").replace(/\s+/g, " ").trim();
}

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;
  const scroller = element.closest(".arena-app-main");
  if (scroller) {
    const top = element.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    scroller.scrollTo({ top, behavior: "smooth" });
    return;
  }
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Help({ embedded = false, contactsOnly = false }) {
  const { appPublicSettings, isAuthenticated, user } = useAuth();
  const contacts = appPublicSettings?.telegram_url
    ? [...CONTACTS, { title: "Telegram-канал", text: "Анонсы, обновления и новости платформы.", action: "Открыть в Telegram", href: appPublicSettings.telegram_url, icon: Send, tone: "bg-sky/10 text-sky", external: true }]
    : CONTACTS;
  const location = useLocation();
  const initialCategory = new URLSearchParams(location.search).get("category") || "all";
  const initialSupportCategory = CATEGORY_OPTIONS.some(([value]) => value === initialCategory) ? initialCategory : "technical";
  const [category, setCategory] = useState(TOPICS.some((topic) => topic.id === initialCategory) ? initialCategory : "all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openItem, setOpenItem] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mailPrepared, setMailPrepared] = useState(false);
  const [form, setForm] = useState({ category: initialSupportCategory, subject: "", message: "", reply_email: user?.email || "" });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 200);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (user?.email) setForm((current) => ({ ...current, reply_email: current.reply_email || user.email }));
  }, [user?.email]);

  const filteredFaq = useMemo(() => {
    const query = normalizeSearch(debouncedSearch);
    const items = category === "all" ? FAQ_ITEMS : FAQ_ITEMS.filter((item) => item.category === category);
    if (query.length < 2) return items;
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
    scrollToSection("support");
  };

  const selectTopic = (topicId) => {
    setCategory(topicId);
    setSearch("");
    scrollToSection("faq");
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

  if (contactsOnly) {
    return (
      <div className="min-h-full bg-background text-foreground">
        {!embedded && <PublicHeader isAuthenticated={isAuthenticated} />}
        <main><ContactsSection contacts={contacts} standalone /></main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      {!embedded && <PublicHeader isAuthenticated={isAuthenticated} />}

      <main>
        <section className="relative overflow-hidden border-b border-border bg-secondary/25">
          <motion.div
            className="pointer-events-none absolute inset-0"
            initial={false}
            animate={{ x: [0, 18, 0], y: [0, -12, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-[hsl(var(--chart-4))]/5 blur-3xl" />
          </motion.div>
          <Reveal viewportReveal className="relative mx-auto max-w-[1380px] px-4 py-14 text-center sm:px-6 md:py-20 lg:px-8">
            <motion.span
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/15"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <LifeBuoy size={23} />
            </motion.span>
            <h1 className="mt-5 font-heading text-4xl font-bold sm:text-5xl">Помощь и поддержка</h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Ответы на частые вопросы и связь с командой ML-Арены.</p>
            <div className="relative mx-auto mt-8 max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={19} />
              <motion.div whileFocus={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти ответ..." className="h-12 rounded-lg bg-card pl-12 pr-12 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20" />
              </motion.div>
              {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" title="Очистить поиск"><X size={16} /></button>}
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-[1380px] px-4 py-14 sm:px-6 md:py-16 lg:px-8">
          <Reveal viewportReveal>
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">Популярные темы</h2>
            <p className="mt-2 text-sm text-muted-foreground">Выберите направление, чтобы сразу перейти к нужным ответам.</p>
          </Reveal>
          <Stagger viewportReveal className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <StaggerItem key={topic.id}>
                  <button type="button" onClick={() => selectTopic(topic.id)} className="group flex h-full min-h-40 w-full flex-col border border-border bg-card p-5 text-left shadow-sm transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-[transform,background-color] duration-300 group-hover:-translate-y-0.5 group-hover:bg-primary group-hover:text-primary-foreground"><Icon size={19} /></span>
                    <span className="mt-6 font-heading text-lg font-bold transition-colors duration-300 group-hover:text-primary">{topic.title}</span>
                    <span className="mt-2 text-sm leading-6 text-muted-foreground">{topic.text}</span>
                  </button>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        <section id="faq" className="scroll-mt-6 border-y border-border bg-secondary/20">
          <div className="mx-auto grid max-w-[1380px] gap-8 px-4 py-14 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] md:py-16 lg:px-8">
            <Reveal viewportReveal className="min-w-0">
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">Частые вопросы</h2>
              <div className="mt-6 flex gap-2 overflow-x-auto pb-1 md:flex-col">
                {[["all", "Все вопросы"], ...TOPICS.map((topic) => [topic.id, topic.title])].map(([id, label]) => {
                  const active = category === id;
                  return (
                    <button key={id} type="button" onClick={() => setCategory(id)} className={`relative shrink-0 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${active ? "text-primary-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground"}`}>
                      {active && <motion.span layoutId="faq-filter-pill" className="absolute inset-0 rounded-md bg-primary" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>
            </Reveal>

            <Reveal viewportReveal delay={0.06} className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
              {filteredFaq.length ? (
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredFaq.map((item) => {
                    const opened = openItem === item.id;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="border-b border-border last:border-b-0"
                      >
                        <button type="button" onClick={() => setOpenItem(opened ? null : item.id)} className="group flex w-full items-center justify-between gap-5 px-5 py-4 text-left transition-colors duration-300 hover:bg-secondary/35 sm:px-6">
                          <span className="font-semibold">{item.title}</span>
                          <ChevronDown className={`shrink-0 text-muted-foreground transition-[transform,color] duration-300 group-hover:text-primary ${opened ? "rotate-180" : ""}`} size={18} />
                        </button>
                        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${opened ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                          <div className="overflow-hidden">
                            <div className="px-5 pb-5 text-sm leading-7 text-muted-foreground sm:px-6">
                              <p className="whitespace-pre-line">{item.body}</p>
                              {item.action?.to && <Button asChild variant="outline" size="sm" className="mt-4"><Link to={item.action.to}>{item.action.label} <ArrowRight size={14} /></Link></Button>}
                              {item.action?.href && <Button asChild variant="outline" size="sm" className="mt-4"><a href={item.action.href} target="_blank" rel="noopener noreferrer">{item.action.label} <ArrowRight size={14} /></a></Button>}
                              {item.supportAction && <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => scrollToSupport(item.id === "vulnerability" ? "security" : undefined)}>Написать в поддержку <ArrowRight size={14} /></Button>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
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

        <section id="support" className="scroll-mt-6 mx-auto max-w-[1380px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="grid gap-9 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <Reveal viewportReveal>
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">Не нашли ответ? Напишите нам</h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">Опишите вопрос как можно точнее. Если проблема техническая, приложите скриншот без секретных данных.</p>
              <div className="mt-7 border-l-2 border-primary bg-secondary/35 px-5 py-4 text-sm leading-6 text-muted-foreground">
                Не отправляйте пароль, cookie, токены доступа, секретные ключи и полные дампы браузера.
              </div>
            </Reveal>

            <Reveal viewportReveal delay={0.06}>
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

      </main>
    </div>
  );
}

function PublicHeader({ isAuthenticated }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5"><img src="/logo.svg" alt="" className="h-8 w-8 object-contain" /><span className="font-heading text-lg font-bold">ML-Арена</span></Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/">На главную</Link></Button>
          <Button asChild><Link to={isAuthenticated ? "/profile" : "/login"}>{isAuthenticated ? "Профиль" : "Войти"}</Link></Button>
        </div>
      </div>
    </header>
  );
}

function Field({ label, htmlFor, className = "", children }) {
  return <div className={`space-y-2 ${className}`}><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}

function ContactsSection({ contacts, standalone = false }) {
  const Heading = standalone ? "h1" : "h2";
  const [copiedEmail, setCopiedEmail] = useState(null);

  const handleCopyEmail = async (email) => {
    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <section id="contacts" className={`relative border-border bg-secondary/25 overflow-hidden ${standalone ? "flex min-h-[calc(100vh-70px)] items-center" : "scroll-mt-6 border-t"}`}>
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{
          x: [0, 20, 0],
          y: [0, -15, 0],
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[hsl(var(--chart-4))]/5 blur-3xl" />
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{
          x: [0, -15, 0],
          y: [0, 20, 0],
          scale: [1, 1.015, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
      >
        <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full bg-green/5 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full bg-sky/5 blur-3xl" />
      </motion.div>

      <div className={`relative mx-auto w-full max-w-[1380px] px-4 py-14 sm:px-6 lg:px-8 ${standalone ? "md:py-16" : "md:py-20"}`}>
        <Reveal viewportReveal y={16}>
          <Heading className={`font-heading font-bold ${standalone ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}>Контакты</Heading>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Выберите подходящий канал. Персональные вопросы не отправляйте в публичные комментарии.</p>
        </Reveal>

        <motion.div
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-green/10 px-3 py-1.5 text-xs font-medium text-green"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <motion.span
            className="relative flex h-1.5 w-1.5 rounded-full bg-green"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <span>Команда на связи и готова помочь</span>
        </motion.div>

        <Stagger viewportReveal className="mt-8 grid max-w-5xl gap-4 md:grid-cols-2" delay={0.06} staggerChildren={0.08}>
          {contacts.map((contact) => {
            const Icon = contact.icon;
            const isEmail = contact.copyEmail;
            const isExternal = contact.external;

            return (
              <StaggerItem key={contact.title}>
                <motion.div
                  className="group relative flex h-full min-h-60 flex-col border border-border bg-card p-6 text-left shadow-sm overflow-hidden"
                  initial={{ opacity: 0, y: 12 }}
                  whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgb(0 0 0 / 0.15)", transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${contact.tone}`}
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Icon size={20} />
                  </motion.div>
                  <h2 className="mt-6 font-heading text-lg font-bold">{contact.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{contact.text}</p>

                  {isEmail ? (
                    <motion.button
                      onClick={() => handleCopyEmail(contact.copyEmail)}
                      className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      whileTap={{ scale: 0.97 }}
                    >
                      {copiedEmail === contact.copyEmail ? (
                        <>
                          <Check className="text-green" size={15} />
                          <span>Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={15} />
                          <span>{contact.action}</span>
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <motion.a
                      href={contact.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {contact.action}
                      <motion.span
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <ArrowRight size={15} />
                      </motion.span>
                      {isExternal && <motion.span className="ml-1" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, duration: 0.3 }}><MessageSquare size={12} /></motion.span>}
                    </motion.a>
                  )}

                  {contact.to && (
                    <Link to={contact.to} className="absolute inset-0" aria-label={contact.title} />
                  )}
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>Выберите направление, и мы покажем подходящий способ связи.</p>
          <div className="flex flex-wrap gap-5"><Link to="/terms" className="hover:text-foreground">Условия использования</Link><Link to="/privacy" className="hover:text-foreground">Политика обработки данных</Link></div>
        </div>
      </div>
    </section>
  );
}
