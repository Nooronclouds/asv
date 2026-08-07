"use client";

import * as React from "react";
import { AppLayout } from "@/components/cyber/app-layout";
import { TopBar, Card, RiskDot, Button } from "@/components/cyber";
import { X, ShieldAlert, FileWarning, CreditCard, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationCategory = "phishing" | "file" | "upi" | "system";
type RiskLevel = "safe" | "moderate" | "critical";

interface Notification {
  id: string;
  category: NotificationCategory;
  message: string;
  timestamp: Date;
  risk: RiskLevel;
  read: boolean;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: "1",
    category: "phishing",
    message: "Suspicious link detected: paytm-secure.xyz attempted to impersonate PayTM",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    risk: "critical",
    read: false,
  },
  {
    id: "2",
    category: "file",
    message: "Potentially malicious file blocked: invoice_march.exe contained ransomware signatures",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    risk: "critical",
    read: false,
  },
  {
    id: "3",
    category: "upi",
    message: "UPI verification warning: merchant@suspicious appears to be newly registered",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    risk: "moderate",
    read: true,
  },
  {
    id: "4",
    category: "system",
    message: "Security scan completed: 3 new threats identified in the last 24 hours",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    risk: "moderate",
    read: true,
  },
];

const categoryIcons: Record<NotificationCategory, React.ElementType> = {
  phishing: ShieldAlert,
  file: FileWarning,
  upi: CreditCard,
  system: Bell,
};

const categoryLabels: Record<NotificationCategory, string> = {
  phishing: "Phishing Alert",
  file: "File Warning",
  upi: "UPI Flag",
  system: "System",
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <AppLayout waveIntensity="minimal" notificationCount={unreadCount}>
      <TopBar
        title="Notifications"
        subtitle="System-triggered security alerts and warnings"
      >
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </TopBar>

      {notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-dim">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold text-text-primary">
            No alerts. You&apos;re all clear.
          </h3>
          <p className="mt-2 max-w-sm text-sm text-text-secondary">
            When we detect potential threats or important security updates, they&apos;ll appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = categoryIcons[notification.category];

            return (
              <Card
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 p-5 transition-all",
                  !notification.read && "bg-bg-card-hover"
                )}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                {/* Risk dot */}
                <div className="mt-1">
                  <RiskDot risk={notification.risk} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-text-muted" />
                    <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      {categoryLabels[notification.category]}
                    </span>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-text-muted">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(notification.id);
                  }}
                  className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-primary-dim hover:text-text-primary"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
