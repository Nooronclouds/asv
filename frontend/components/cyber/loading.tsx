"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-3",
};

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizes[size],
        className
      )}
    />
  );
}

interface LoadingStateProps {
  messages?: string[];
  interval?: number;
  className?: string;
}

export function LoadingState({
  messages = ["Loading..."],
  interval = 2000,
  className,
}: LoadingStateProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (messages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [messages, interval]);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LoadingSpinner size="sm" />
      <span className="text-[13px] text-text-muted">{messages[currentIndex]}</span>
    </div>
  );
}
