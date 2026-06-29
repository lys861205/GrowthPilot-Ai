import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    await requireSession(); // Ensure user is logged in
    
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/google/callback`;

    if (!clientId) {
      return NextResponse.json({ error: "Missing GOOGLE_CLIENT_ID" }, { status: 500 });
    }

    const scope = "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", scope);
    authUrl.searchParams.append("access_type", "offline");
    authUrl.searchParams.append("prompt", "consent"); // Force consent to ensure we get a refresh token

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("GSC Authorize Error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
