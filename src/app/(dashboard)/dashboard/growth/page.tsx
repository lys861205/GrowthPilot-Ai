import { requireSession } from "@/lib/auth/session";
import { getSitesByUserId, getGrowthRecommendationsBySiteId } from "@/lib/db/queries";
import { GrowthBoard } from "@/components/growth/GrowthBoard";
import { TrendingUp, Globe } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ siteId?: string }>;
}

export default async function GrowthPage({ searchParams }: Props) {
  const session = await requireSession();
  const { siteId } = await searchParams;

  const siteList = await getSitesByUserId(session.user.id);
  const activeSiteId = siteId ?? siteList[0]?.id;

  const items = activeSiteId
    ? await getGrowthRecommendationsBySiteId(activeSiteId)
    : [];

  const activeSite = siteList.find((s) => s.id === activeSiteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Growth Board</h1>
          <p className="mt-1 text-slate-500">AI-generated growth opportunities ranked by impact and effort.</p>
        </div>
        {siteList.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {siteList.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/growth?siteId=${s.id}`}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                  s.id === activeSiteId
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                {s.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {siteList.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-400">Add a site and run an audit to see your growth roadmap.</p>
          <Link href="/dashboard/sites" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
            Add a site →
          </Link>
        </div>
      ) : (
        <>
          {activeSite && (
            <p className="text-sm text-slate-500">
              Showing recommendations for <strong>{activeSite.name}</strong>
            </p>
          )}
          <GrowthBoard items={items} />
        </>
      )}
    </div>
  );
}
