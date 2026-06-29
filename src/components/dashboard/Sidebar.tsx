"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Search,
  FileText,
  TrendingUp,
  Settings,
  Zap,
  BookOpen,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/SignOutButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/sites", label: "Sites", icon: Globe },
  { href: "/dashboard/audit", label: "Audits", icon: Search },
  { href: "/dashboard/keywords", label: "Keywords", icon: Key },
  { href: "/dashboard/content", label: "Content AI", icon: FileText },
  { href: "/dashboard/blog-agent", label: "Blog Agent", icon: BookOpen },
  { href: "/dashboard/growth", label: "Growth Board", icon: TrendingUp },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
        <Zap className="h-6 w-6 text-indigo-600" />
        <span className="text-lg font-bold text-slate-900">GrowthPilot</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-indigo-600" : "text-slate-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <SignOutButton />
      </div>
    </aside>
  );
}
