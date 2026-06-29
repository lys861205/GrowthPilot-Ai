"use client";

import { useActionState } from "react";
import { updateCompanyInfoAction } from "@/app/(dashboard)/dashboard/sites/[id]/actions";
import { Loader2, Save, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CompanyInfoFormProps {
  siteId: string;
  initialInfo: string | null;
}

export function CompanyInfoForm({ siteId, initialInfo }: CompanyInfoFormProps) {
  const updateWithId = updateCompanyInfoAction.bind(null, siteId);
  const [state, action, pending] = useActionState(updateWithId, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-500" />
          Brand Assets (EEAT Info)
        </CardTitle>
        <CardDescription>
          Inject real company background, ISO certifications, MOQ policies, or founder quotes. 
          The AI will automatically weave this into your blog posts to pass Google's Helpful Content Update.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <textarea
              name="companyInfo"
              defaultValue={initialInfo ?? ""}
              placeholder="e.g. We are a leading custom ceramic manufacturer based in Shenzhen, established in 2010. We have ISO9001 certification. Our defect rate is strictly kept under 0.5%. Our MOQ is 500 pcs."
              className="w-full min-h-[120px] rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {state && !state.success && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          {state && state.success && (
            <p className="text-sm text-emerald-600">Company info updated successfully.</p>
          )}

          <Button type="submit" disabled={pending} className="bg-indigo-600 hover:bg-indigo-700">
            {pending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Assets</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
