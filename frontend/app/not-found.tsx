"use client";

import * as React from "react";
import { WaveBackground } from "@/components/wave-background";
import { Logo, Button } from "@/components/cyber";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();
  const [glitching, setGlitching] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 80);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleReturn = () => {
    const token = localStorage.getItem("cyberguard-token");
    router.push(token ? "/dashboard" : "/");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <WaveBackground intensity="low" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <Logo size="lg" href="/" className="mb-12" />

        <h1
          className={`font-display text-5xl font-extrabold text-primary sm:text-7xl ${
            glitching ? "translate-x-[3px] opacity-80" : ""
          }`}
          style={{
            transition: glitching ? "none" : "all 0.1s",
            filter: glitching ? "hue-rotate(90deg)" : "none",
          }}
        >
          ERROR_404
        </h1>

        <h2 className="mt-4 font-display text-2xl font-bold text-text-primary">
          Page not found.
        </h2>
        <p className="mt-2 max-w-sm text-[15px] text-text-secondary">
          This path doesn&apos;t exist in our system.
        </p>

        <div className="mt-8">
          <Button size="lg" onClick={handleReturn}>
            Return to Safety
          </Button>
        </div>
      </div>
    </div>
  );
}
