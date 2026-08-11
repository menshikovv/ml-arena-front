import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/ml/ThemeToggle";
import { Button } from "@/components/ui/button";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children, wide = false }) {
  return (
    <div className="relative min-h-screen bg-secondary/30 px-4 py-16">
      <Button asChild variant="ghost" size="icon" className="absolute left-4 top-4 md:left-6 md:top-6">
        <Link to="/" aria-label="Вернуться на главную" title="Вернуться на главную"><ArrowLeft size={20} /></Link>
      </Button>
      <div className="absolute right-4 top-4 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      <div className={`${wide ? "max-w-2xl" : "max-w-md"} mx-auto w-full`}>
        <div className="mb-8 text-center">
          <Link to="/" className="mb-7 inline-flex items-center gap-2.5">
            <img src="/logo.svg" alt="" className="h-9 w-9 object-contain" />
            <span className="font-heading text-lg font-bold">ML-Арена</span>
          </Link>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Icon size={23} aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
