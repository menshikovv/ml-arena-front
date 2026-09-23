import { Suspense, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BookOpenText, BriefcaseBusiness, ChartNoAxesColumnIncreasing, ChevronDown, ChevronLeft, Crown, LifeBuoy, LogIn, LogOut, Menu, Pencil, Search, ShieldCheck, Swords, Trophy, UserRoundCheck, X } from "lucide-react";
import { api } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import ThemeToggle from "@/components/ml/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const NAV_ITEMS = [
  { to: "/competitions", label: "Соревнования", icon: Trophy, feature: "competitions" },
  { to: "/duels", label: "Дуэли", icon: Swords, feature: "duels" },
  { to: "/rating", label: "Рейтинг", icon: ChartNoAxesColumnIncreasing, feature: "rating" },
  { to: "/ml-passport", label: "ML-паспорт", icon: UserRoundCheck, feature: "ml_passport" },
  { to: "/blog", label: "Блог", icon: BookOpenText },
  { to: "/companies", label: "Компаниям", icon: BriefcaseBusiness },
  { to: "/support", label: "Поддержка", icon: LifeBuoy },
];

const PAGE_TITLES = [
  ["/competitions", "Соревнования"],
  ["/duels", "Дуэли"],
  ["/rating", "Рейтинг"],
  ["/leaderboard", "Рейтинг"],
  ["/ml-passport", "ML-паспорт"],
  ["/blog", "Блог"],
  ["/profile/edit", "Редактирование профиля"],
  ["/profile", "ML-паспорт"],
  ["/company/dashboard", "Кабинет компании"],
  ["/pricing", "Тарифы"],
  ["/admin", "Панель администратора"],
  ["/support", "Поддержка"],
  ["/companies", "Компаниям"],
];

function ArenaLogoMark({ className = "h-8 w-8" }) {
  return <img src="/logo.svg" alt="" className={`shrink-0 object-contain ${className}`} aria-hidden="true" />;
}

function UserSearch({ compact = false }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const term = search.trim().toLowerCase();
  const peopleQuery = useQuery({
    queryKey: ["header-profile-search"],
    queryFn: () => api.profiles.search({ limit: 100, offset: 0, sort: "user_name" }),
    enabled: open && term.length >= 2,
    staleTime: 60000,
  });
  const people = (peopleQuery.data?.data || peopleQuery.data?.items || []).filter((person) =>
    [person.user_name, person.first_name, person.last_name].some((value) => value?.toLowerCase().includes(term))
  ).slice(0, 5);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (compact && open) inputRef.current?.focus();
  }, [compact, open]);

  const selectPerson = (person) => {
    setSearch("");
    setOpen(false);
    navigate(`/profile/${person.user_id || person.id}`);
  };

  return <div ref={containerRef} className={`relative shrink-0 ${compact ? "" : "w-[min(27vw,330px)] min-w-[210px]"}`} onKeyDown={(event) => {
    if (event.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    if (event.key === "Enter" && event.target === inputRef.current && open && people.length) selectPerson(people[0]);
  }}>
    {compact && <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Поиск пользователей" title="Поиск пользователей" aria-expanded={open} className="flex h-10 w-10 items-center justify-center border border-border bg-background text-muted-foreground hover:text-primary"><Search size={19} /></button>}
    {(!compact || open) && <div className={compact ? "absolute right-0 top-[calc(100%+10px)] z-40 w-[min(360px,calc(100vw-24px))] border border-border bg-card p-2 shadow-xl" : "relative"}>
      <div className="flex h-10 items-center gap-2 border border-border bg-secondary/55 px-3 text-muted-foreground"><Search size={18} className="shrink-0" /><input ref={inputRef} type="search" value={search} onFocus={() => setOpen(true)} onChange={(event) => setSearch(event.target.value)} aria-label="Поиск пользователей" placeholder="Поиск пользователей..." className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" /></div>
      {open && term.length >= 2 && <div className={`${compact ? "mt-2" : "absolute right-0 top-[calc(100%+6px)] z-40"} w-full overflow-hidden border border-border bg-card p-1 shadow-xl`}>
        {peopleQuery.isLoading ? <p className="px-3 py-3 text-sm text-muted-foreground">Ищем пользователей...</p> : peopleQuery.isError ? <p className="px-3 py-3 text-sm text-muted-foreground">Поиск временно недоступен</p> : people.length ? people.map((person) => <button key={person.user_id || person.id} type="button" onClick={() => selectPerson(person)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-secondary focus-visible:bg-secondary"><Avatar name={[person.first_name, person.last_name].filter(Boolean).join(" ") || person.user_name} src={person.avatar_url} size={32} /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{[person.first_name, person.last_name].filter(Boolean).join(" ") || person.user_name}</span><span className="block truncate text-xs text-muted-foreground">@{person.user_name}</span></span></button>) : <p className="px-3 py-3 text-sm text-muted-foreground">Совпадений нет</p>}
      </div>}
    </div>}
  </div>;
}

function HeaderAccount({ user, isAuthenticated, onLogout }) {
  const detailsRef = useRef(null);
  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (detailsRef.current?.open && !detailsRef.current.contains(event.target)) detailsRef.current.open = false;
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && detailsRef.current) detailsRef.current.open = false;
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  if (!isAuthenticated) return <Button asChild size="sm" variant="outline"><Link to="/login"><LogIn size={15} /><span className="hidden sm:inline">Войти</span></Link></Button>;
  const close = () => { if (detailsRef.current) detailsRef.current.open = false; };
  return <details ref={detailsRef} className="arena-account relative shrink-0">
    <summary aria-label="Меню профиля" className="flex cursor-pointer list-none items-center gap-1 text-muted-foreground [&::-webkit-details-marker]:hidden"><Avatar name={user?.full_name || user?.nickname || user?.email} src={user?.avatar_url} size={36} /><ChevronDown size={16} className="arena-account__chevron hidden sm:block" /></summary>
    <div className="arena-account__menu absolute right-0 top-[calc(100%+13px)] z-40 w-56 border border-border bg-card p-1 shadow-xl">
      <p className="truncate border-b border-border px-3 py-2 text-sm font-semibold">{user?.full_name || user?.nickname || user?.email}</p>
      <Link to="/profile" onClick={close} className="block px-3 py-2 text-sm hover:bg-secondary">Мой ML-паспорт</Link>
      <Link to="/profile/edit" onClick={close} className="block px-3 py-2 text-sm hover:bg-secondary">Редактировать профиль</Link>
      <button type="button" onClick={() => { close(); onLogout(); }} className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm hover:bg-secondary"><LogOut size={15} /> Выйти</button>
    </div>
  </details>;
}

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { appPublicSettings, isAuthenticated, user, logout } = useAuth();
  const adminAccess = useQuery({ queryKey: ["admin", "me"], queryFn: api.admin.me, enabled: user?.role === "admin", retry: false, staleTime: 60000 });
  const isSuperAdmin = adminAccess.data?.roles?.includes("super_admin");
  const publicNavItems = NAV_ITEMS.filter((item) => !item.feature || appPublicSettings?.features?.[item.feature] === true);
  const roleNavItems = user?.role === "organization"
    ? [...publicNavItems, { to: "/company/dashboard", label: "Кабинет компании", icon: BriefcaseBusiness }]
    : publicNavItems;
  const navItems = user?.role === "admin"
    ? [...roleNavItems.flatMap((item) => item.to === "/support" && isSuperAdmin
      ? [{ to: "/pricing", label: "Тарифы", icon: Crown }, item]
      : [item]), { to: "/admin", label: "Админка", icon: ShieldCheck }]
    : roleNavItems;
  const isActive = (path) => {
    if (path.includes("?")) {
      const [pathname, search] = path.split("?");
      return location.pathname === pathname && location.search === `?${search}`;
    }
    if (path === "/admin") return location.pathname === path && !location.search;
    if (path === "/ml-passport") {
      return location.pathname === path
        || location.pathname.startsWith(`${path}/`)
        || location.pathname === "/profile"
        || location.pathname.startsWith("/profile/");
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  const pageTitle = PAGE_TITLES.find(([path]) => location.pathname === path || location.pathname.startsWith(`${path}/`))?.[1] || "ML-Арена";

  useEffect(() => {
    document.documentElement.classList.add("arena-app-active");
    return () => document.documentElement.classList.remove("arena-app-active");
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  const renderSidebarContent = (mobile = false) => {
    const expanded = mobile || !collapsed;
    return (
    <div className="flex h-full flex-col">
      <div className={`arena-sidebar-logo flex h-[76px] shrink-0 items-center border-b border-sidebar-border px-4 ${!expanded ? "justify-center" : ""}`}>
        <Link to="/" className="group flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-card shadow-sm ring-1 ring-sidebar-border"><ArenaLogoMark className="h-8 w-8" /></span>
          {expanded && <span className="min-w-0"><span className="block truncate font-heading text-xl font-extrabold leading-none">ML-Арена</span><span className="mt-1.5 block text-[10px] font-semibold uppercase text-muted-foreground">Founder Season</span></span>}
        </Link>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-2 overflow-y-auto px-3 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={`arena-nav-item group relative flex min-h-13 items-center gap-3 px-3 py-2.5 text-[15px] font-semibold ${active ? "arena-nav-item-active text-primary-foreground" : "text-sidebar-foreground hover:text-primary"} ${!expanded ? "justify-center" : ""}`} title={!expanded ? item.label : undefined}>
              <span className={`relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center border transition-colors ${active ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-sidebar-border bg-card text-primary group-hover:border-primary/25 group-hover:bg-primary/5"}`}>
                <Icon size={19} strokeWidth={2.15} />
              </span>
              {expanded && <span className="relative z-[1] truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 border-t border-sidebar-border bg-card/55 p-3">
        {isAuthenticated ? (
          <div className={`${!expanded ? "flex justify-center py-2" : "p-2"}`}>
            <Link to="/profile" onClick={() => setMobileOpen(false)} className="group flex items-center gap-3">
              <Avatar name={user?.full_name || user?.nickname || user?.email} src={user?.avatar_url} size={36} className="ring-2 ring-card ring-offset-1 ring-offset-primary/20" />
              {expanded && <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-semibold group-hover:text-primary">{user?.full_name || user?.nickname || "Участник"}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.full_name && user?.nickname ? `@${user.nickname.replace(/^@/, "")}` : user?.email}</p></div>}
            </Link>
            {expanded && <div className="mt-4 grid grid-cols-[1fr_42px] gap-2"><Button asChild size="sm" variant="outline" className="min-h-11 rounded-none"><Link to="/profile/edit" onClick={() => setMobileOpen(false)}><Pencil size={14} /> Настроить</Link></Button><Button type="button" size="icon" variant="ghost" className="h-11 w-[42px] rounded-none" onClick={handleLogout} title="Выйти"><LogOut size={16} /></Button></div>}
          </div>
        ) : (
          <div className={`space-y-2 ${!expanded ? "flex flex-col items-center" : ""}`}>
            <Button asChild size={!expanded ? "icon" : "sm"} variant="outline" className={!expanded ? "" : "min-h-11 w-full"}><Link to="/login" onClick={() => setMobileOpen(false)} title="Войти"><LogIn size={16} />{expanded && "Войти"}</Link></Button>
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="arena-app-shell flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-background font-body">
      <aside className={`arena-sidebar relative hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 md:flex ${collapsed ? "w-20" : "w-[272px]"}`}>
        {renderSidebarContent()}
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="arena-sidebar-toggle absolute -right-3 top-[88px] z-10 flex h-10 w-6 items-center justify-center border border-sidebar-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary" title={collapsed ? "Развернуть меню" : "Свернуть меню"}>
          <ChevronLeft size={14} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="relative z-30 hidden h-[70px] shrink-0 items-center justify-between gap-4 border-b border-border bg-card/90 px-6 backdrop-blur-xl md:flex lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-5 w-1 bg-primary" />
            <h2 className="truncate font-heading text-lg font-extrabold">{pageTitle}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-3"><div className="hidden xl:block"><UserSearch /></div><div className="xl:hidden"><UserSearch compact /></div><ThemeToggle /><HeaderAccount user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} /></div>
        </header>
        <header className="relative z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-3 md:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center border border-border bg-background text-foreground transition-colors active:bg-secondary" title="Открыть меню" aria-label="Открыть меню" aria-expanded={mobileOpen} aria-controls="arena-mobile-navigation"><Menu size={20} /></button>
          <span className="min-w-0 flex-1 truncate font-heading text-sm font-extrabold">{pageTitle}</span>
          <UserSearch compact />
          <ThemeToggle />
          <HeaderAccount user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        </header>
        <div className={`fixed inset-0 z-50 flex md:hidden ${mobileOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"}`} aria-hidden={!mobileOpen}>
          <div id="arena-mobile-navigation" className={`arena-sidebar relative w-[292px] max-w-[86vw] border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="absolute right-3 top-3 z-10"><button type="button" onClick={() => setMobileOpen(false)} className="flex h-11 w-11 items-center justify-center border border-border bg-card shadow" title="Закрыть меню" aria-label="Закрыть меню"><X size={18} /></button></div>
            {renderSidebarContent(true)}
          </div>
          <button type="button" aria-label="Закрыть меню" className={`flex-1 bg-foreground/35 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none ${mobileOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMobileOpen(false)} />
        </div>
        <main className="arena-app-main scrollbar-thin min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children || <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Загрузка страницы"><div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" /></div>}><Outlet /></Suspense>}
        </main>
      </div>
    </div>
  );
}
