"use client";

import * as React from "react";
import { AppLayout, TopBar, Card, Button, Input } from "@/components/cyber";
import { Eye, EyeOff, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface UserProfile {
  name: string;
  email: string;
  businessName: string;
  businessType: string;
  memberSince: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = React.useState<UserProfile>({
    name: "Rohan Mehta",
    email: "rohan@mehtatextiles.com",
    businessName: "Mehta Textiles",
    businessType: "Retail / Kirana Store",
    memberSince: "Jan 2024",
  });

  // Load user from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("cyberguard-user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({
          name: parsed.name || parsed.businessName || "User",
          email: parsed.email || "user@example.com",
          businessName: parsed.businessName || "My Business",
          businessType: parsed.businessType || "Other",
          memberSince: parsed.memberSince
            ? new Date(parsed.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "May 2026",
        });
      } catch {}
    }
  }, []);

  const [editing, setEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ businessName: "", email: "", businessType: "" });

  const [currentPw, setCurrentPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [showNewPw, setShowNewPw] = React.useState(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [pwSuccess, setPwSuccess] = React.useState(false);
  const [pwError, setPwError] = React.useState("");

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleEdit = () => {
    setEditForm({
      businessName: user.businessName,
      email: user.email,
      businessType: user.businessType,
    });
    setEditing(true);
  };

  const handleSave = () => {
    setUser((prev) => ({
      ...prev,
      businessName: editForm.businessName,
      email: editForm.email,
      businessType: editForm.businessType,
    }));
    setEditing(false);

    // Update localStorage
    const stored = localStorage.getItem("cyberguard-user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.businessName = editForm.businessName;
        parsed.email = editForm.email;
        parsed.businessType = editForm.businessType;
        localStorage.setItem("cyberguard-user", JSON.stringify(parsed));
      } catch {}
    }
  };

  const handleUpdatePassword = () => {
    setPwError("");
    setPwSuccess(false);

    if (!currentPw || !newPw || !confirmPw) {
      setPwError("Please fill in all fields.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match.");
      return;
    }
    if (newPw.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }

    setPwSuccess(true);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setTimeout(() => setPwSuccess(false), 3000);
  };

  const handleSignOut = () => {
    localStorage.removeItem("cyberguard-token");
    localStorage.removeItem("cyberguard-user");
    router.push("/login");
  };

  return (
    <AppLayout waveIntensity="minimal">
      <div className="mx-auto max-w-[860px]">
        <TopBar title="Account Settings" subtitle="Manage your profile" />

        {/* Profile Header */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full border border-primary-border bg-primary-dim">
              <span className="font-display text-lg font-bold text-primary">{initials}</span>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary">{user.name}</h2>
              <p className="text-[13px] text-text-muted">
                {user.email}
              </p>
              <p className="text-[13px] text-text-muted">
                {user.businessType} · Member since {user.memberSince}
              </p>
            </div>
          </div>
        </Card>

        {/* Personal Details */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-5">
            <p className="section-tag">Personal Details</p>
            {editing ? (
              <Button variant="ghost" size="sm" onClick={handleSave}>Save Changes</Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleEdit}>Edit</Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">Business Name</label>
                <Input value={editForm.businessName} onChange={(e) => setEditForm((p) => ({ ...p, businessName: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">Email</label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">Business Type</label>
                <Input value={editForm.businessType} onChange={(e) => setEditForm((p) => ({ ...p, businessType: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Business Name", value: user.businessName },
                { label: "Email", value: user.email },
                { label: "Business Type", value: user.businessType },
              ].map((item) => (
                <div key={item.label} className="flex flex-col sm:flex-row sm:gap-4">
                  <span className="w-32 flex-shrink-0 text-xs font-medium uppercase tracking-wide text-text-muted">
                    {item.label}
                  </span>
                  <span className="text-sm text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Change Password */}
        <Card className="mb-6">
          <p className="section-tag mb-5">Change Password</p>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-text-muted">
                Current Password
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="text-text-muted hover:text-text-primary" tabIndex={-1}>
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </label>
              <Input type={showCurrentPw ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-text-muted">
                New Password
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="text-text-muted hover:text-text-primary" tabIndex={-1}>
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </label>
              <Input type={showNewPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-text-muted">
                Confirm New
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="text-text-muted hover:text-text-primary" tabIndex={-1}>
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </label>
              <Input type={showConfirmPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            </div>

            {pwError && <p className="text-[13px] text-risk-critical">{pwError}</p>}
            {pwSuccess && (
              <div className="flex items-center gap-2 text-[13px] text-primary">
                <Check className="h-4 w-4" /> Password updated successfully
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleUpdatePassword}>
                Update Password
              </Button>
            </div>
          </div>
        </Card>

        {/* Scan Summary */}
        <Card className="mb-6">
          <p className="section-tag mb-4">Scan Summary</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-primary">
            <span><strong className="font-display">15</strong> total</span>
            <span className="text-text-muted">·</span>
            <span><strong className="font-display text-risk-critical">3</strong> threats found</span>
            <span className="text-text-muted">·</span>
            <span><strong className="font-display text-risk-safe">12</strong> clean</span>
            <Link href="/reports" className="ml-auto text-[13px] text-primary hover:text-primary-hover">
              View Full History →
            </Link>
          </div>
        </Card>

        {/* Sign Out */}
        <Button variant="destructive" fullWidth onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}
