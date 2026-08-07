"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Link2,
  Shield,
  CreditCard,
  FileText,
  User,
  LogOut,
  Bell,
  Hexagon,
  Menu,
  X,
  AlertCircle,
  Server,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const menuItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Incidents", href: "/incidents", icon: AlertCircle },
  { label: "Assets", href: "/assets", icon: Server },
  { label: "Phishing", href: "/phishing", icon: Link2 },
  { label: "Ransomware", href: "/ransomware", icon: Shield },
  { label: "UPI Verifier", href: "/upi", icon: CreditCard },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

const accountItems: NavItem[] = [
  { label: "Profile", href: "/profile", icon: User },
];

interface SidebarProps {
  onSignOut?: () => void;
  notificationCount?: number;
}

export function Sidebar({ onSignOut, notificationCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between gap-2 px-5 pb-5 pt-7">
        <div className="flex items-center gap-2">
          <Hexagon className="h-5 w-5 flex-shrink-0 text-primary" />
          <div className="flex flex-col justify-center">
            <span className="font-display text-[15px] font-extrabold leading-tight text-primary tracking-wide">
              CYBERGUARD
            </span>
            <span className="font-display text-[11px] font-bold leading-tight text-text-muted tracking-[0.2em]">
              SME
            </span>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-primary-dim hover:text-text-primary lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Menu Section */}
      <div className="flex-1 overflow-y-auto py-2">
        <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted">
          Menu
        </p>
        <nav className="flex flex-col">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const showNotificationDot = item.href === "/notifications" && notificationCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 items-center gap-3 px-5 transition-all duration-150",
                  isActive
                    ? "border-l-[3px] border-primary bg-primary-dim text-primary shadow-[-3px_0_12px_var(--primary)]"
                    : "border-l-[3px] border-transparent text-text-secondary hover:bg-primary-dim hover:text-text-primary"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px]",
                      isActive ? "text-primary" : "text-text-muted"
                    )}
                  />
                  {showNotificationDot && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-risk-critical" />
                  )}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-5 my-2 border-t border-border" />

        {/* Account Section */}
        <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted">
          Account
        </p>
        <nav className="flex flex-col">
          {accountItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 items-center gap-3 px-5 transition-all duration-150",
                  isActive
                    ? "border-l-[3px] border-primary bg-primary-dim text-primary shadow-[-3px_0_12px_var(--primary)]"
                    : "border-l-[3px] border-transparent text-text-secondary hover:bg-primary-dim hover:text-text-primary"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive ? "text-primary" : "text-text-muted"
                  )}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Sign Out */}
          <button
            onClick={onSignOut}
            className="flex h-11 items-center gap-3 border-l-[3px] border-transparent px-5 text-text-secondary transition-all duration-150 hover:bg-risk-critical-dim hover:text-risk-critical"
          >
            <LogOut className="h-[18px] w-[18px] text-text-muted" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-primary shadow-lg transition-colors hover:bg-bg-card-hover lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-border bg-bg-sidebar lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-border bg-bg-sidebar transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
