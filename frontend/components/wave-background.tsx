"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./theme-provider";

interface WaveBackgroundProps {
  intensity?: "full" | "high" | "medium" | "low" | "minimal";
  className?: string;
}

const intensityConfig = {
  full: { height: 100, opacity: 1, particleMultiplier: 1 },
  high: { height: 70, opacity: 0.8, particleMultiplier: 0.8 },
  medium: { height: 50, opacity: 0.5, particleMultiplier: 0.6 },
  low: { height: 35, opacity: 0.4, particleMultiplier: 0.4 },
  minimal: { height: 25, opacity: 0.3, particleMultiplier: 0.3 },
};

// Detect mobile for performance optimization
const getIsMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

export function WaveBackground({ intensity = "full", className = "" }: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = intensityConfig[intensity];
    const isDark = theme === "dark";

    // Grid-based particle system for organized wave effect
    interface GridParticle {
      baseX: number;
      baseY: number;
      baseZ: number;
      size: number;
      brightness: number;
    }

    interface FloatingDust {
      x: number;
      y: number;
      size: number;
      opacity: number;
      speedX: number;
      speedY: number;
    }

    let gridParticles: GridParticle[] = [];
    let floatingDust: FloatingDust[] = [];
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      gridParticles = [];
      floatingDust = [];

      const width = canvas.width;
      const height = canvas.height;
      const mobile = getIsMobile();
      
      // Reduce particle density on mobile for better performance
      const mobileMultiplier = mobile ? 0.4 : 1;

      // Create grid-based particle field
      const cols = Math.floor(width / 12) * config.particleMultiplier * mobileMultiplier;
      const rows = Math.floor(35 * config.particleMultiplier * mobileMultiplier);
      const startY = height * 0.35;
      const endY = height;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = (col / cols) * width;
          const y = startY + (row / rows) * (endY - startY);
          const z = Math.random() * 100; // Depth for parallax

          gridParticles.push({
            baseX: x + (Math.random() - 0.5) * 8,
            baseY: y,
            baseZ: z,
            size: 1.2 + Math.random() * 1.3,
            brightness: 0.4 + Math.random() * 0.6,
          });
        }
      }

      // Floating dust particles
      const dustCount = Math.floor(50 * config.particleMultiplier * mobileMultiplier);
      for (let i = 0; i < dustCount; i++) {
        floatingDust.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 1 + Math.random() * 2,
          opacity: 0.1 + Math.random() * 0.3,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.2,
        });
      }
    };

    const draw = () => {
      // Dark background
      ctx.fillStyle = isDark ? "#030704" : "#F8FAF9";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      // Draw grid particles with wave displacement
      gridParticles.forEach((p) => {
        // Multiple wave layers for complex motion
        const depthFactor = 1 - p.baseZ / 150;
        const speed = 0.0008 * depthFactor;

        // Primary wave
        const wave1 = Math.sin(p.baseX * 0.006 + time * speed) * 40;
        // Secondary wave (cross-wave)
        const wave2 = Math.sin(p.baseX * 0.003 + p.baseY * 0.002 + time * speed * 0.7) * 25;
        // Tertiary ripple
        const wave3 = Math.sin(p.baseX * 0.012 + time * speed * 1.5) * 15;

        const totalWave = (wave1 + wave2 + wave3) * config.opacity;
        const y = p.baseY + totalWave;

        // Size varies with wave height (particles appear larger at wave peaks)
        const waveIntensity = Math.abs(totalWave) / 80;
        const dynamicSize = p.size * (1 + waveIntensity * 0.5) * depthFactor;

        // Brightness increases at wave peaks
        const dynamicBrightness = p.brightness * (0.7 + waveIntensity * 0.5);

        // Draw particle with glow
        if (isDark) {
          // Glow layer
          const glowSize = dynamicSize * 3;
          const glowGradient = ctx.createRadialGradient(p.baseX, y, 0, p.baseX, y, glowSize);
          glowGradient.addColorStop(0, `rgba(0, 255, 65, ${dynamicBrightness * 0.15 * config.opacity})`);
          glowGradient.addColorStop(1, "rgba(0, 255, 65, 0)");
          ctx.beginPath();
          ctx.arc(p.baseX, y, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();
        }

        // Core particle
        ctx.beginPath();
        ctx.arc(p.baseX, y, dynamicSize, 0, Math.PI * 2);
        if (isDark) {
          ctx.fillStyle = `rgba(0, 255, 65, ${dynamicBrightness * config.opacity})`;
        } else {
          ctx.fillStyle = `rgba(22, 163, 74, ${dynamicBrightness * 0.4 * config.opacity})`;
        }
        ctx.fill();
      });

      // Draw and update floating dust
      floatingDust.forEach((dust) => {
        dust.x += dust.speedX;
        dust.y += dust.speedY;

        // Wrap around
        if (dust.x < 0) dust.x = width;
        if (dust.x > width) dust.x = 0;
        if (dust.y < 0) dust.y = height;
        if (dust.y > height) dust.y = 0;

        ctx.beginPath();
        ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
        if (isDark) {
          ctx.fillStyle = `rgba(0, 255, 65, ${dust.opacity * config.opacity * 0.5})`;
        } else {
          ctx.fillStyle = `rgba(22, 163, 74, ${dust.opacity * config.opacity * 0.3})`;
        }
        ctx.fill();
      });

      // Top gradient fade (only for dark theme)
      if (isDark) {
        const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.45);
        topGradient.addColorStop(0, "#030704");
        topGradient.addColorStop(0.7, "rgba(3, 7, 4, 0.8)");
        topGradient.addColorStop(1, "transparent");
        ctx.fillStyle = topGradient;
        ctx.fillRect(0, 0, width, height * 0.45);

        // Subtle vignette at bottom
        const bottomGradient = ctx.createLinearGradient(0, height * 0.85, 0, height);
        bottomGradient.addColorStop(0, "transparent");
        bottomGradient.addColorStop(1, "rgba(3, 7, 4, 0.5)");
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(0, height * 0.85, width, height * 0.15);
      }

      time += 16;
      animationRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [theme, intensity]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 z-0 pointer-events-none ${className}`}
      />
      {/* Bokeh spheres for depth */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full blur-[60px] animate-pulse"
          style={{
            width: 200,
            height: 200,
            background: theme === "dark" ? "rgba(0, 255, 65, 0.06)" : "rgba(22, 163, 74, 0.04)",
            left: "5%",
            top: "55%",
            animationDuration: "4s",
          }}
        />
        <div
          className="absolute rounded-full blur-[80px] animate-pulse"
          style={{
            width: 300,
            height: 300,
            background: theme === "dark" ? "rgba(0, 255, 65, 0.04)" : "rgba(22, 163, 74, 0.03)",
            left: "75%",
            top: "60%",
            animationDuration: "6s",
          }}
        />
        <div
          className="absolute rounded-full blur-[50px] animate-pulse"
          style={{
            width: 150,
            height: 150,
            background: theme === "dark" ? "rgba(0, 255, 65, 0.05)" : "rgba(22, 163, 74, 0.035)",
            left: "35%",
            top: "70%",
            animationDuration: "5s",
          }}
        />
        <div
          className="absolute rounded-full blur-[70px] animate-pulse"
          style={{
            width: 180,
            height: 180,
            background: theme === "dark" ? "rgba(0, 255, 65, 0.045)" : "rgba(22, 163, 74, 0.03)",
            left: "90%",
            top: "45%",
            animationDuration: "7s",
          }}
        />
        <div
          className="absolute rounded-full blur-[40px] animate-pulse"
          style={{
            width: 100,
            height: 100,
            background: theme === "dark" ? "rgba(0, 255, 65, 0.055)" : "rgba(22, 163, 74, 0.04)",
            left: "20%",
            top: "80%",
            animationDuration: "3s",
          }}
        />
      </div>
    </>
  );
}
