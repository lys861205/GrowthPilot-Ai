import { requireSession } from "@/lib/auth/session";
import { getSitesByUserId } from "@/lib/db/queries";
import { AddSiteForm } from "@/components/dashboard/AddSiteForm";
import { DeleteSiteButton } from "@/components/dashboard/DeleteSiteButton";
import { Globe, ArrowRight, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import { InjectDemoButton } from "./InjectDemoButton";

export default async function SitesPage() {
  const session = await requireSession();
  const siteList = await getSitesByUserId(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sites</h1>
        <p className="mt-1 text-slate-500">Manage the websites you want to audit and optimise.</p>
      </div>

      <AddSiteForm />

      {siteList.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center bg-slate-50/50 flex flex-col items-center justify-center">
          <div className="rounded-full bg-slate-100 p-4 mb-4">
            <Globe className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No sites added yet</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Add your first site above to start tracking SEO performance.
          </p>
          
          <div className="mt-8 pt-8 border-t border-slate-200 w-full max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-slate-700">Hackathon Judge?</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Skip the wait and populate the dashboard with realistic dummy data instantly.
            </p>
            <InjectDemoButton />
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
          {siteList.map((site) => (
            <li key={site.id} className="flex items-center gap-4 px-5 py-4">
              <div className="rounded-lg bg-indigo-50 p-2">
                <Globe className="h-4 w-4 text-indigo-600" />
              </div>
              <Link href={`/dashboard/sites/${site.id}`} className="flex-1 min-w-0 hover:underline">
                <p className="font-medium text-slate-900">{site.name}</p>
                <p className="text-sm text-slate-400 truncate">{site.url}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  Added {new Date(site.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/dashboard/audit?siteId=${site.id}`}
                  className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1"
                >
                  Run audit <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <DeleteSiteButton siteId={site.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
