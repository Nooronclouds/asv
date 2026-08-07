"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function TopBar({ title, subtitle, className, children }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={cn(
        "mb-8 flex items-start justify-between border-b border-border pb-6",
        className
      )}
    >
      <div>
        <h1 className="font-display text-xl font-bold text-text-primary sm:text-[30px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[13px] text-text-muted">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {children}
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-text-muted transition-colors hover:bg-primary-dim hover:text-text-primary"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
