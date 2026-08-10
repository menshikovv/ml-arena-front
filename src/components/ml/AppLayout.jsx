import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChartNoAxesColumnIncreasing, ChevronLeft, LifeBuoy, LogIn, LogOut, Menu, Pencil, Swords, Trophy, UserRound, UserRoundCheck, X } from "lucide-react";
import Avatar from "@/components/ml/Avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const NAV_ITEMS = [
  { to: "/competitions", label: "Соревнования", icon: Trophy, gradientId: "sidebar-competitions-gradient" },
  { to: "/duels", label: "Дуэли", icon: Swords, gradientId: "sidebar-duels-gradient" },
  { to: "/rating", label: "Рейтинг", icon: ChartNoAxesColumnIncreasing, gradientId: "sidebar-rating-gradient" },
  { to: "/ml-passport", label: "ML-паспорт", icon: UserRoundCheck, gradientId: "sidebar-passport-gradient" },
  { to: "/help", label: "Контакты", icon: LifeBuoy, gradientId: "sidebar-help-gradient" },
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
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4 ${collapsed ? "justify-center" : ""}`}>
        <Link to="/" className="group flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <ArenaLogoMark />
          {!collapsed && <span className="font-heading text-lg font-bold">ML-Арена</span>}
        </Link>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"} ${collapsed ? "justify-center" : ""}`} title={collapsed ? item.label : undefined}>
              <Icon size={19} stroke={`url(#${item.gradientId})`} strokeWidth={2.25} className="shrink-0">
                <defs><linearGradient id={item.gradientId} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#38BDF8" /><stop offset="45%" stopColor="#2563EB" /><stop offset="75%" stopColor="#22D3EE" /><stop offset="100%" stopColor="#8B5CF6" /></linearGradient></defs>
              </Icon>
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 border-t border-border p-3">
        {isAuthenticated ? (
          <div className={`rounded-md p-2 ${collapsed ? "flex justify-center" : ""}`}>
            <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
              <Avatar name={user?.full_name || user?.nickname || user?.email} src={user?.avatar_url} size={32} />
              {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user?.nickname || "Участник"}</p><p className="truncate text-xs text-muted-foreground">{user?.email}</p></div>}
            </Link>
            {!collapsed && <div className="mt-3 flex gap-2"><Button asChild size="sm" variant="outline" className="flex-1"><Link to="/profile/edit" onClick={() => setMobileOpen(false)}><Pencil size={14} /> Профиль</Link></Button><Button type="button" size="icon" variant="ghost" onClick={handleLogout} title="Выйти"><LogOut size={16} /></Button></div>}
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
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={`relative hidden shrink-0 flex-col border-r border-border bg-card/70 transition-[width] duration-300 md:flex ${collapsed ? "w-16" : "w-60"}`}>
        <SidebarContent />
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-secondary" title={collapsed ? "Развернуть меню" : "Свернуть меню"}>
          <ChevronLeft size={14} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} title="Открыть меню"><Menu size={20} /></button>
          <Link to="/" className="flex items-center gap-2"><ArenaLogoMark className="h-7 w-7" /><span className="font-heading font-bold">ML-Арена</span></Link>
        </header>
        {mobileOpen && <div className="fixed inset-0 z-50 flex md:hidden"><div className="w-72 max-w-[85vw] bg-card"><div className="absolute left-[min(18rem,85vw)] top-3 z-10"><button type="button" onClick={() => setMobileOpen(false)} className="ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-card shadow" title="Закрыть меню"><X size={18} /></button></div><SidebarContent /></div><button type="button" aria-label="Закрыть меню" className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} /></div>}
        <main className="scrollbar-thin min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children || <Outlet />}</main>
      </div>
    </div>
  );
}
