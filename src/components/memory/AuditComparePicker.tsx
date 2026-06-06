"use client";

import { useRouter } from "next/navigation";

interface AuditOption {
  id: string;
  overallScore: number | null;
  completedAt: string | null;
}

interface Props {
  siteId: string;
  allAudits: AuditOption[];
  baseAuditId: string;
  selectedCompareId: string;
}

export function AuditComparePicker({ siteId, allAudits, baseAuditId, selectedCompareId }: Props) {
  const router = useRouter();

  // Audits available to compare against (all except the latest/base)
  const options = allAudits.filter((a) => a.id !== baseAuditId);

  if (options.length === 0) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`/dashboard/sites/${siteId}?compareWith=${e.target.value}`);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">Compare latest vs</span>
      <select
        value={selectedCompareId}
        onChange={handleChange}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {options.map((a) => {
          const date = a.completedAt
            ? new Date(a.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "Unknown date";
          return (
            <option key={a.id} value={a.id}>
              {date} — Score {a.overallScore ?? "?"}
            </option>
          );
        })}
      </select>
    </div>
  );
}
