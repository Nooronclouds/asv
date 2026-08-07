"use client";

import { Sidebar } from "@/components/cyber/sidebar";
import { WaveBackground } from "@/components/wave-background";
import { useRouter } from "next/navigation";

interface AppLayoutProps {
  children: React.ReactNode;
  waveIntensity?: "full" | "high" | "medium" | "low" | "minimal";
  notificationCount?: number;
}

export function AppLayout({
  children,
  waveIntensity = "minimal",
  notificationCount = 0,
}: AppLayoutProps) {
  const router = useRouter();

  const handleSignOut = () => {
    // Clear any auth tokens
    localStorage.removeItem("cyberguard-token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen">
      <WaveBackground intensity={waveIntensity} />
      <Sidebar onSignOut={handleSignOut} notificationCount={notificationCount} />
      <main className="relative z-10 min-h-screen p-4 pt-16 sm:p-6 sm:pt-16 lg:ml-[260px] lg:p-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
