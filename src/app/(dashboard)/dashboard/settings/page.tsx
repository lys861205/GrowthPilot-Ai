import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { gscAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { disconnectGoogle } from "./actions";

export default async function SettingsPage() {
  const session = await requireSession();
  
  const accounts = await db
    .select()
    .from(gscAccounts)
    .where(eq(gscAccounts.userId, session.user.id));
    
  const gscConnected = accounts.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-500">Manage your integrations and account settings.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              Connect third-party services to enhance your SEO insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Google Search Console</h3>
                  <p className="text-sm text-slate-500">Track actual keyword rankings and traffic</p>
                </div>
              </div>
              
              {gscConnected ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Connected
                  </div>
                  <form action={disconnectGoogle}>
                    <Button type="submit" variant="outline" size="sm">Disconnect</Button>
                  </form>
                </div>
              ) : (
                <form action="/api/integrations/google/authorize" method="GET">
                  <Button type="submit" variant="outline">Connect</Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
