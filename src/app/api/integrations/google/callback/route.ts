import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { gscAccounts } from "@/lib/db/schema";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id; 

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    if (!code) {
      return NextResponse.redirect(new URL("/settings?error=missing_code", req.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/settings?error=missing_credentials", req.url));
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google Token Error:", tokenData);
      return NextResponse.redirect(new URL("/settings?error=token_failed", req.url));
    }

    // Get user info to save email / google account id
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoResponse.json();

    const inserted = await db.insert(gscAccounts).values({
      userId,
      googleAccountId: userInfo.id,
      email: userInfo.email,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    }).returning();

    // Trigger background job to fetch sites immediately
    const { gscSyncQueue } = await import("@/lib/redis/queue");
    await gscSyncQueue.add("sync", { accountId: inserted[0].id });

    // Redirect back to dashboard
    return NextResponse.redirect(new URL("/dashboard?success=gsc_connected", req.url));

  } catch (error) {
    console.error("GSC Callback Error:", error);
    return NextResponse.redirect(new URL("/dashboard?error=server_error", req.url));
  }
}
