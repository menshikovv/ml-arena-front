import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Avatar from "@/components/ml/Avatar";
import {
  Swords, ChartNoAxesColumnIncreasing, Trophy, User, Building2, Crown, Shield,
  Menu, X, LogOut, ChevronLeft
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/competitions", label: "Соревнования", icon: Trophy, gradientId: "sidebar-competitions-gradient" },
  { to: "/duels", label: "Дуэли", icon: Swords, gradientId: "sidebar-duels-gradient" },
  { to: "/leaderboard", label: "Лидерборд", icon: ChartNoAxesColumnIncreasing, gradientId: "sidebar-leaderboard-gradient" },
  { to: "/profile", label: "ML-паспорт", icon: User, gradientId: "sidebar-profile-gradient" },
  { to: "/company/dashboard", label: "Кабинет компании", icon: Building2, gradientId: "sidebar-company-gradient" },
  { to: "/pricing", label: "Подписки", icon: Crown, gradientId: "sidebar-pricing-gradient" },
  { to: "/admin", label: "Админ", icon: Shield, gradientId: "sidebar-admin-gradient" },
];

function ArenaLogoMark({ className = "h-8 w-8" }) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${className}`} aria-hidden="true">
      <span className="absolute inset-0 rounded-[28%] bg-white shadow-[0_10px_24px_-14px_rgba(0,102,255,0.7)]" />
      <span className="absolute inset-[2px] rounded-full bg-[conic-gradient(from_218deg,#155BFF_0deg,#155BFF_132deg,#20D6C6_226deg,#155BFF_340deg)]" />
      <span className="absolute inset-[7px] rounded-full bg-white" />
      <span className="absolute bottom-[5px] h-[10px] w-[7px] rounded-t-[3px] bg-[#155BFF]" />
      <span className="absolute bottom-[9px] left-[8px] h-[11px] w-[4px] rounded-sm bg-[#155BFF]" />
      <span className="absolute bottom-[9px] right-[8px] h-[11px] w-[4px] rounded-sm bg-[#20D6C6]" />
      <span className="absolute bottom-[11px] left-[13px] h-[15px] w-[5px] rounded-sm bg-[#1682FF]" />
      <span className="absolute bottom-[11px] right-[13px] h-[15px] w-[5px] rounded-sm bg-[#18C8D6]" />
      <span className="absolute left-1/2 top-[4px] h-[23px] w-[2.5px] -translate-x-1/2 rounded-full bg-[#155BFF]" />
      <span className="absolute left-1/2 top-[7px] ml-[1px] h-[9px] w-[15px] rounded-r-full bg-[#155BFF]" />
      <span className="absolute left-1/2 top-[3px] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#155BFF]" />
    </span>
  );
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = () => {
    logout();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-2.5 px-4 h-16 border-b border-border shrink-0 ${collapsed ? "justify-center" : ""}`}>
        <Link to="/" className="flex items-center gap-2.5 group">
          <ArenaLogoMark className="h-8 w-8" />
          {!collapsed && (
            <span className="font-heading font-bold text-lg tracking-tight">ML-Арена</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={19}
                stroke={`url(#${item.gradientId})`}
                strokeWidth={2.25}
                className="shrink-0 drop-shadow-[0_2px_5px_rgba(37,99,235,0.22)]"
              >
                <defs>
                  <linearGradient id={item.gradientId} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="42%" stopColor="#2563EB" />
                    <stop offset="72%" stopColor="#22D3EE" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </Icon>
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border mt-auto shrink-0">
        <div className={`flex items-center gap-3 p-2 rounded-lg ${collapsed ? "justify-center" : ""}`}>
          <Avatar name={user?.full_name || user?.email || "U"} size={32} />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name || "Пользователь"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Выйти">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-card/40 border-r border-border transition-all duration-300 shrink-0 ${collapsed ? "w-16" : "w-60"}`}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 -right-0 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors z-10"
        >
          <ChevronLeft size={14} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-border bg-card/40 shrink-0">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <ArenaLogoMark className="h-8 w-8" />
            <span className="font-heading font-bold">ML-Арена</span>
          </Link>
        </header>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="w-60 bg-card border-r border-border">
              <SidebarContent />
            </div>
            <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
