"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface PostureChartProps {
  data: {
    date: string;
    score: number;
  }[];
}

export function PostureChart({ data }: PostureChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-bg-card/20 p-4">
        <p className="text-sm text-text-muted">No scan history available to plot posture score.</p>
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00FF41" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#00FF41" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis 
            dataKey="date" 
            stroke="#888888" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#888888" 
            fontSize={10}
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(10, 15, 10, 0.95)",
              border: "1px solid rgba(0, 255, 65, 0.2)",
              borderRadius: "8px",
              color: "#ffffff"
            }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#00FF41" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#scoreColor)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
