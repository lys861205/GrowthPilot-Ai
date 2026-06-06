"use client";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { px: 56, stroke: 5, r: 22, textSize: "text-sm", labelSize: "text-xs" },
  md: { px: 88, stroke: 7, r: 35, textSize: "text-xl", labelSize: "text-xs" },
  lg: { px: 128, stroke: 8, r: 50, textSize: "text-3xl", labelSize: "text-sm" },
};

function scoreColor(score: number) {
  if (score >= 80) return { stroke: "#22c55e", text: "text-green-600" };
  if (score >= 60) return { stroke: "#eab308", text: "text-yellow-600" };
  if (score >= 40) return { stroke: "#f97316", text: "text-orange-500" };
  return { stroke: "#ef4444", text: "text-red-500" };
}

function scoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

export function ScoreRing({
  score,
  size = "md",
  showLabel = true,
  className,
}: ScoreRingProps) {
  const cfg = SIZE_CONFIG[size];
  const { stroke, text } = scoreColor(score);
  const circumference = 2 * Math.PI * cfg.r;
  const offset = circumference - (score / 100) * circumference;
  const center = cfg.px / 2;

  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)}>
      {/* Relative wrapper so score text can be absolutely centred over the SVG */}
      <div className="relative" style={{ width: cfg.px, height: cfg.px }}>
        <svg
          width={cfg.px}
          height={cfg.px}
          viewBox={`0 0 ${cfg.px} ${cfg.px}`}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={cfg.r}
            fill="none"
            stroke="currentColor"
            strokeWidth={cfg.stroke}
            className="text-slate-100"
          />
          {/* Score arc */}
          <circle
            cx={center}
            cy={center}
            r={cfg.r}
            fill="none"
            stroke={stroke}
            strokeWidth={cfg.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        {/* Score number — plain div centred over SVG, no SVG text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold tabular-nums text-slate-900", cfg.textSize)}>
            {score}
          </span>
        </div>
      </div>

      {showLabel && (
        <span className={cn("font-medium", text, cfg.labelSize)}>
          {scoreLabel(score)}
        </span>
      )}
    </div>
  );
}
