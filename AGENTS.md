# AGENTS.md — ml-arena

## Project Overview
ML-arena — React SPA для сравнения и соревнования ML-моделей. Платформа, где ML-специалисты соревнуются в решении задач (регрессия, классификация, NLP, CV, tabular), участвуют в турнирах (duels), отслеживают рейтинг, получают бейджи и могут быть найдены работодателями.

---

## Tech Stack

| Категория | Технология |
|-----------|-----------|
| **Framework** | React 18 + Vite 6 |
| **Routing** | react-router-dom v6 |
| **UI** | shadcn/ui-style: Radix UI primitives + Tailwind CSS 3 + `class-variance-authority` |
| **Forms** | react-hook-form + zod |
| **Server State** | @tanstack/react-query 5 |
| **Payments** | Stripe (`@stripe/react-stripe-js`, `@stripe/stripe-js`) |
| **Drag & Drop** | @hello-pangea/dnd |
| **Charts** | recharts, three.js |
| **Animations** | framer-motion |
| **Icons** | lucide-react |
| **Notifications** | react-hot-toast, sonner, custom `use-toast` |
| **Platform** | @base44/sdk, @base44/vite-plugin |
| **Linting** | ESLint 9 (flat config) |
| **Type Checking** | TypeScript via jsconfig.json (JSDoc types) |

---

## Directory Structure

```
ml-arena/
├── src/
│   ├── api/
│   │   ├── base44Client.js      # API facade (mock-backed)
│   │   └── mockData.js          # In-memory mock data & CRUD ops
│   ├── components/
│   │   ├── ml/                  # ML-specific components
│   │   │   ├── AppLayout.jsx    # App shell (sidebar + header + outlet)
│   │   │   ├── Avatar.jsx
│   │   │   ├── CompetitionCard.jsx
│   │   │   ├── CountdownTimer.jsx
│   │   │   ├── LeagueBadge.jsx
│   │   │   └── StatCard.jsx
│   │   ├── ui/                  # shadcn/ui primitives
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   ├── input-otp.jsx
│   │   │   ├── label.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── toast.jsx
│   │   │   ├── toaster.jsx
│   │   │   └── use-toast.jsx
│   │   ├── AuthLayout.jsx       # Wrapper для страниц авторизации
│   │   ├── ProtectedRoute.jsx   # Guard for authenticated routes
│   │   ├── ScrollToTop.jsx      # Scroll restoration on route change
│   │   └── UserNotRegisteredError.jsx
│   ├── hooks/
│   │   └── use-mobile.jsx       # useIsMobile() hook (breakpoint 768px)
│   ├── lib/
│   │   ├── app-params.js        # Base44 URL/query params reader
│   │   ├── AuthContext.jsx      # Auth provider + useAuth hook
│   │   ├── ml-arena.js          # Leagues, metrics, task types, score formatting
│   │   ├── PageNotFound.jsx     # 404 page
│   │   ├── query-client.js      # QueryClient instance (refetchOnWindowFocus: false)
│   │   └── utils.js             # cn(), isIframe
│   ├── pages/
│   │   ├── Admin.jsx            # Admin panel (stats, moderation, CRUD)
│   │   ├── CompanyDashboard.jsx # Create competitions, HR funnel, invites
│   │   ├── CompetitionDetail.jsx # Tabbed: Overview/Data/Leaderboard/Rules/Discussion
│   │   ├── Competitions.jsx     # Competition listing with filters
│   │   ├── DuelLobby.jsx        # Duel view (players, timer, upload, chat)
│   │   ├── Duels.jsx            # Duel listing, search opponents
│   │   ├── ForgotPassword.jsx
│   │   ├── Landing.jsx          # Landing page (hero, features, leagues)
│   │   ├── Leaderboard.jsx      # Top 3 podium + ranking table
│   │   ├── Login.jsx
│   │   ├── Pricing.jsx          # 3 plans (Free/Pro/Premium)
│   │   ├── Profile.jsx          # Profile page (stats, charts, badges)
│   │   ├── Register.jsx
│   │   └── ResetPassword.jsx
│   ├── utils/
│   │   └── index.ts             # createPageUrl()
│   ├── App.jsx                  # Root component: providers + routes
│   ├── index.css                # Tailwind base + CSS variables (light/dark)
│   └── main.jsx                 # Entry point
├── public/
├── eslint.config.js             # Flat config (ignores lib/, components/ui/)
├── jsconfig.json                # Path alias @/ → ./src/
├── tailwind.config.js           # shadcn/ui theme (HSL vars, dark mode: class)
├── vite.config.js               # @base44/vite-plugin + @vitejs/plugin-react
├── vercel.json
├── index.html
└── package.json
```

---

## Routing (App.jsx)

```
Provider tree: AuthProvider → QueryClientProvider → Router
```

| Route | Component | Access |
|-------|-----------|--------|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/forgot-password` | ForgotPassword | Public |
| `/reset-password` | ResetPassword | Public |
| `/competitions` | Competitions | Protected |
| `/competitions/:id` | CompetitionDetail | Protected |
| `/duels` | Duels | Protected |
| `/duels/:id` | DuelLobby | Protected |
| `/leaderboard` | Leaderboard | Protected |
| `/profile` | → redirect to `/profile/me` | Protected |
| `/profile/:id` | Profile | Protected |
| `/company/dashboard` | CompanyDashboard | Protected |
| `/pricing` | Pricing | Protected |
| `/admin` | Admin | Protected |
| `*` | PageNotFound (404) | Public |

Protected routes wrapped in `ProtectedRoute` > `AppLayout` (sidebar layout).

---

## API Layer

Все запросы проходят через `src/api/base44Client.js`:

```js
import { mockEntities, mockCore, mockAuth } from '@/api/mockData';

export const base44 = {
  entities: mockEntities,           // CRUD для: MLProfile, Badge, Competition, Submission, Discussion, Duel, JobInvite
  integrations: { Core: mockCore }, // UploadFile, SendEmail
  auth: mockAuth,                   // me() → { id, email, role }
};
```

**MockData** — in-memory хранилище с искусственной задержкой 150-300ms. Все данные сбрасываются при перезагрузке страницы.

**Паттерн использования в страницах:**
```js
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const { data, isLoading } = useQuery({
  queryKey: ['competitions'],
  queryFn: () => base44.entities.Competition.list('-created_date', 50),
});

const mutation = useMutation({
  mutationFn: (data) => base44.entities.Competition.create(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competitions'] }),
});
```

---

## Auth (AuthContext.jsx)

- `AuthProvider` оборачивает всё приложение
- `useAuth()` возвращает: `user`, `isAuthenticated`, `isLoadingAuth`, `isLoadingPublicSettings`, `authError`, `logout()`, `navigateToLogin()`, `checkUserAuth()`, `checkAppState()`
- **Сейчас замокано**: `isAuthenticated = true`, `user = { id: 'mock-user', email: 'user@example.com', role: 'user' }`
- `authError` может быть: `{ type: 'user_not_registered' }` или `{ type: 'auth_required' }`
- `ProtectedRoute` перенаправляет на `/login` если `!isAuthenticated && authChecked`

---

## Key Libraries

### src/lib/ml-arena.js
- `getLeague(rating)` — возвращает `{ name, class, color, glow }` на основе rating (≥1500: Platinum, ≥1300: Gold, ≥1100: Silver, else Bronze)
- `getLeagueProgress(rating)` — `{ current, max, percent }` для прогресс-бара
- `METRIC_LABELS` — метрики → русские названия
- `TASK_TYPE_LABELS` — `{ regression, classification, nlp, cv, tabular }`
- `TASK_TYPE_COLORS` — цвета типов задач
- `isHigherBetter(metric)` — true для `accuracy`, `roc_auc`, `f1`
- `formatScore(score, metric)` — форматирует как проценты или десятичные

### src/lib/utils.js
- `cn(...inputs)` — обёртка над `clsx` + `tailwind-merge` (объединение Tailwind-классов)
- `isIframe` — проверка, запущено ли приложение в iframe

### src/lib/query-client.js
```js
new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});
```

### src/lib/app-params.js
Читает параметры `app_id`, `access_token`, `from_url`, `functions_version`, `app_base_url` из URL и localStorage (Base44 platform).

---

## Styling Conventions

- **100% Tailwind utility classes** — никаких CSS modules или styled-components
- **CSS variables** в `index.css` для темизации (light/dark), dark mode через класс `.dark`
- **`cn()`** для объединения классов: `cn('base-class', className)`
- **shadcn/ui** компоненты используют `class-variance-authority` для variant/size пропсов
- Цвета через CSS vars: `bg-primary`, `text-muted-foreground`, `border-border`, и т.д.
- Радиус через `var(--radius)` (0.5rem по умолчанию)
- Шрифты через CSS vars: `font-heading`, `font-body`, `font-display`, `font-mono`

---

## Component Patterns

### shadcn/ui компоненты (src/components/ui/)
```jsx
import * as React from "react"
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"

const Component = React.forwardRef(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn(...)} {...props} />
})
Component.displayName = "Component"

export { Component }
```
- `React.forwardRef` для всех UI-компонентов
- `displayName` на каждом компоненте
- Named exports only
- `@radix-ui/react-slot` для `asChild` паттерна (см. `button.jsx`)

### Page components (src/pages/)
- Default exports (в отличие от ui-компонентов)
- Начинаются с заглавной буквы, одно слово или CamelCase
- Используют `useQuery`/`useMutation` для данных

### ML components (src/components/ml/)
- Mix named и default exports
- Наследуют shadcn/ui компоненты (Card, Button и т.д.)
- Используют `@/lib/ml-arena` для бизнес-логики

---

## ESLint Rules (eslint.config.js)

- Проверяет только `src/components/**` и `src/pages/**`
- Игнорирует `src/lib/**` и `src/components/ui/**`
- `react/prop-types` — off (используем JSDoc)
- `react/react-in-jsx-scope` — off (React 18)
- `unused-imports/no-unused-imports` — error
- `react-hooks/rules-of-hooks` — error
- Кастомные DOM-атрибуты: `cmdk-input-wrapper`, `toast-close` — разрешены

---

## Commands

```bash
npm run dev        # Start dev server (Vite)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint check (quiet mode, only src/components/** & src/pages/**)
npm run lint:fix   # ESLint auto-fix
npm run typecheck  # TypeScript type checking via jsconfig.json (JSDoc)
```

---

## Code Conventions

- **JSDoc типы** вместо TypeScript (.js файлы, `jsconfig.json` включает проверку)
- **`@/` alias** для импортов из `src/`: `import { cn } from '@/lib/utils'`
- **Порядок импортов**: React → библиотеки → `@/` модули
- **Named exports** для ui-компонентов и утилит
- **Default exports** для страниц (pages/) и некоторых ML-компонентов
- **Никаких комментариев** в коде, если только логика неочевидна
- **Tailwind классы** для всего styling
- `cn()` для merging классов в компонентах
- **React.forwardRef** + `displayName` для переиспользуемых компонентов
- Избегать создания новых файлов — редактировать существующие

---

## Conventions for AI Agents

1. **Перед редактированием** — прочитай файл целиком, чтобы понять контекст и импорты
2. **При изменении компонента** — проверь, какие Radix-примитивы и библиотеки уже импортированы; не добавляй новые зависимости без необходимости
3. **После изменений** — запусти `npm run lint` и `npm run typecheck` (кроме тривиальных правок)
4. **Не добавляй комментарии** — код должен быть самодокументируемым
5. **Не создавай новые файлы** без необходимости — предпочитай редактирование существующих
6. **`src/lib/utils.js`** — для общих утилит, `cn()` уже там
7. **`src/api/`** — для API-вызовов через @tanstack/react-query хуки
8. **`src/lib/ml-arena.js`** — для бизнес-логики (лиги, метрики, типы задач)
9. **Mock API** — все запросы в `base44Client.js`/`mockData.js`, не трогай без необходимости
10. **Не меняй ESLint/конфиги** без явного запроса

---

## Key Constraints

- No real backend yet — всё через mockData.js
- `jsconfig.json` вместо `tsconfig.json` — JSDoc аннотации, не TSX
- Версия React 18 (не 19), обратная совместимость важна
- `@base44/vite-plugin` обязателен для платформы (4 фичи: HMR, navigation, analytics, visual edit)
- CSS custom properties для всех цветов — не использовать хардкод цветов
