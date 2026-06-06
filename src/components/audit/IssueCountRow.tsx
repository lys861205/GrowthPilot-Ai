"use client";

import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

interface IssueCountRowProps {
  critical: number;
  warnings: number;
  passed: number;
}

export function IssueCountRow({ critical, warnings, passed }: IssueCountRowProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
        <AlertCircle className="h-8 w-8 text-red-500 shrink-0" />
        <div>
          <p className="text-2xl font-bold tabular-nums text-red-600">{critical}</p>
          <p className="text-xs font-medium text-red-500">Critical</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-yellow-100 bg-yellow-50 p-4">
        <AlertTriangle className="h-8 w-8 text-yellow-500 shrink-0" />
        <div>
          <p className="text-2xl font-bold tabular-nums text-yellow-600">{warnings}</p>
          <p className="text-xs font-medium text-yellow-500">Warnings</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
        <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
        <div>
          <p className="text-2xl font-bold tabular-nums text-green-600">{passed}</p>
          <p className="text-xs font-medium text-green-500">Passed</p>
        </div>
      </div>
    </div>
  );
}
