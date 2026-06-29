"use client";

import type { ScorePoint } from "@/lib/redis/memory";

interface Props {
  data: ScorePoint[];
}

export function ScoreTrendChart({ data }: Props) {
  if (data.length === 0) return null;

  const scores = data.map((d) => d.score);
  const min = Math.max(0, Math.min(...scores) - 10);
  const max = Math.min(100, Math.max(...scores) + 10);
  const range = max - min || 1;

  const W = 600;
  const H = 160;
  const PAD = { top: 12, right: 16, bottom: 32, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const pts = data.map((d, i) => ({
    x: PAD.left + (data.length > 1 ? i * xStep : chartW / 2),
    y: PAD.top + chartH - ((d.score - min) / range) * chartH,
    score: d.score,
    date: new Date(d.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  // Y grid lines at every 20 points
  const gridYs = [];
  for (let v = Math.ceil(min / 20) * 20; v <= max; v += 20) {
    gridYs.push({ v, y: PAD.top + chartH - ((v - min) / range) * chartH });
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 280 }}
      >
        {/* Grid lines */}
        {gridYs.map(({ v, y }) => (
          <g key={v}>
            <line
              x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
              stroke="#e2e8f0" strokeWidth={1}
            />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
              {v}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#grad)" opacity={0.15} />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots + tooltips */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#6366f1" stroke="#fff" strokeWidth={2} />
            {/* Score label on hover via title */}
            <title>{p.date}: {p.score}/100</title>
          </g>
        ))}

        {/* X-axis labels — show first, last, and evenly spaced */}
        {pts.map((p, i) => {
          const show = data.length <= 6 || i === 0 || i === pts.length - 1 || i % Math.ceil(data.length / 5) === 0;
          if (!show) return null;
          return (
            <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize={10} fill="#94a3b8">
              {p.date}
            </text>
          );
        })}

        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
