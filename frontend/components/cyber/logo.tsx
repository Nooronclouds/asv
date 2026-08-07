"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Hexagon } from "lucide-react";

interface LogoProps {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: "h-5 w-5", text: "text-base" },
  md: { icon: "h-6 w-6", text: "text-lg" },
  lg: { icon: "h-8 w-8", text: "text-[22px]" },
};

export function Logo({ className, href = "/", size = "md" }: LogoProps) {
  const { icon, text } = sizes[size];

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <Hexagon className={cn(icon, "text-primary")} />
      <span className={cn("font-display font-extrabold whitespace-nowrap", text)}>
        <span className="text-primary">VANGUARD</span>
        <span className="text-text-muted"> SME</span>
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}
