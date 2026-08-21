import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BookOpenText, BriefcaseBusiness, ChartNoAxesColumnIncreasing, ChevronLeft, Crown, LifeBuoy, LogIn, LogOut, Menu, Pencil, ShieldCheck, Swords, Trophy, UserRound, UserRoundCheck, X } from "lucide-react";
import { api } from "@/api/mlArenaApi";
import Avatar from "@/components/ml/Avatar";
import ThemeToggle from "@/components/ml/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const NAV_ITEMS = [
  { to: "/competitions", label: "Соревнования", icon: Trophy },
  { to: "/duels", label: "Дуэли", icon: Swords },
  { to: "/rating", label: "Рейтинг", icon: ChartNoAxesColumnIncreasing },
  { to: "/ml-passport", label: "ML-паспорт", icon: UserRoundCheck },
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

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const adminAccess = useQuery({ queryKey: ["admin", "me"], queryFn: api.admin.me, enabled: user?.role === "admin", retry: false, staleTime: 60000 });
  const isSuperAdmin = adminAccess.data?.roles?.includes("super_admin");
  const navItems = user?.role === "admin"
    ? [...NAV_ITEMS, ...(isSuperAdmin ? [{ to: "/pricing", label: "Тарифы", icon: Crown }] : []), { to: "/admin", label: "Админка", icon: ShieldCheck }]
    : NAV_ITEMS;
  const isActive = (path) => {
    if (path === "/ml-passport") {
      return location.pathname === path
        || location.pathname.startsWith(`${path}/`)
        || location.pathname === "/profile"
        || (location.pathname.startsWith("/profile/") && location.pathname !== "/profile/edit");
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  const pageTitle = PAGE_TITLES.find(([path]) => location.pathname === path || location.pathname.startsWith(`${path}/`))?.[1] || "ML-Арена";

  useEffect(() => {
    document.documentElement.classList.add("arena-app-active");
    return () => document.documentElement.classList.remove("arena-app-active");
  }, []);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className={`arena-sidebar-logo flex h-[76px] shrink-0 items-center border-b border-sidebar-border px-4 ${collapsed ? "justify-center" : ""}`}>
        <Link to="/" className="group flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-card shadow-sm ring-1 ring-sidebar-border"><ArenaLogoMark className="h-8 w-8" /></span>
          {!collapsed && <span className="min-w-0"><span className="block truncate font-heading text-xl font-extrabold leading-none">ML-Арена</span><span className="mt-1.5 block text-[10px] font-semibold uppercase text-muted-foreground">Founder Season</span></span>}
        </Link>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-2 overflow-y-auto px-3 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={`arena-nav-item group relative flex min-h-13 items-center gap-3 px-3 py-2.5 text-[15px] font-semibold ${active ? "arena-nav-item-active text-primary-foreground" : "text-sidebar-foreground hover:text-primary"} ${collapsed ? "justify-center" : ""}`} title={collapsed ? item.label : undefined}>
              <span className={`relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center border transition-colors ${active ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-sidebar-border bg-card text-primary group-hover:border-primary/25 group-hover:bg-primary/5"}`}>
                <Icon size={19} strokeWidth={2.15} />
              </span>
              {!collapsed && <span className="relative z-[1] truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 border-t border-sidebar-border bg-card/55 p-3">
        {isAuthenticated ? (
          <div className={`${collapsed ? "flex justify-center py-2" : "p-2"}`}>
            <Link to="/profile" onClick={() => setMobileOpen(false)} className="group flex items-center gap-3">
              <Avatar name={user?.full_name || user?.nickname || user?.email} src={user?.avatar_url} size={36} className="ring-2 ring-card ring-offset-1 ring-offset-primary/20" />
              {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-semibold group-hover:text-primary">{user?.full_name || user?.nickname || "Участник"}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.full_name && user?.nickname ? `@${user.nickname.replace(/^@/, "")}` : user?.email}</p></div>}
            </Link>
            {!collapsed && <div className="mt-4 grid grid-cols-[1fr_38px] gap-2"><Button asChild size="sm" variant="outline" className="rounded-none"><Link to="/profile/edit" onClick={() => setMobileOpen(false)}><Pencil size={14} /> Настроить</Link></Button><Button type="button" size="icon" variant="ghost" className="h-[38px] w-[38px] rounded-none" onClick={handleLogout} title="Выйти"><LogOut size={16} /></Button></div>}
          </div>
        ) : (
          <div className={`space-y-2 ${collapsed ? "flex flex-col items-center" : ""}`}>
            <Button asChild size={collapsed ? "icon" : "sm"} variant="outline" className={collapsed ? "" : "w-full"}><Link to="/login" onClick={() => setMobileOpen(false)} title="Войти"><LogIn size={16} />{!collapsed && "Войти"}</Link></Button>
            <Button asChild size={collapsed ? "icon" : "sm"} className={collapsed ? "" : "w-full"}><Link to="/register" onClick={() => setMobileOpen(false)} title="Регистрация"><UserRound size={16} />{!collapsed && "Регистрация"}</Link></Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="arena-app-shell flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-background font-body">
      <aside className={`arena-sidebar relative hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 md:flex ${collapsed ? "w-20" : "w-[272px]"}`}>
        <SidebarContent />
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="arena-sidebar-toggle absolute -right-3 top-[88px] z-10 flex h-10 w-6 items-center justify-center border border-sidebar-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary" title={collapsed ? "Развернуть меню" : "Свернуть меню"}>
          <ChevronLeft size={14} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="hidden h-[70px] shrink-0 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur-xl md:flex lg:px-8">
          <div className="flex items-center gap-3">
            <span className="h-5 w-1 bg-primary" />
            <h2 className="font-heading text-lg font-extrabold">{pageTitle}</h2>
          </div>
          <ThemeToggle />
        </header>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} title="Открыть меню"><Menu size={20} /></button>
          <Link to="/" className="flex items-center gap-2"><ArenaLogoMark className="h-8 w-8" /><span className="font-heading text-lg font-extrabold">ML-Арена</span></Link>
          <ThemeToggle className="ml-auto" />
        </header>
        {mobileOpen && <div className="fixed inset-0 z-50 flex md:hidden"><div className="arena-sidebar w-[292px] max-w-[86vw] border-r border-sidebar-border bg-sidebar"><div className="absolute left-[min(292px,86vw)] top-3 z-10"><button type="button" onClick={() => setMobileOpen(false)} className="ml-3 flex h-9 w-9 items-center justify-center border border-border bg-card shadow" title="Закрыть меню"><X size={18} /></button></div><SidebarContent /></div><button type="button" aria-label="Закрыть меню" className="flex-1 bg-foreground/35 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} /></div>}
        <main className="arena-app-main scrollbar-thin min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children || <Outlet />}</main>
      </div>
    </div>
  );
}
