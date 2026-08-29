import React from "react";
import { cn } from "@/lib/utils";

export function PageFrame({ children, className }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1380px] px-4 py-6 md:px-6 lg:px-8 lg:py-10", className)}>
      {children}
    </div>
  );
}

export function PageHeader({ title, description, actions, children, className }) {
  return (
    <header className={cn("border-b border-border pb-7", className)}>
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="min-w-0 max-w-4xl">
          <h1 className="font-heading text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
          {description && <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{description}</p>}
          {children}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
