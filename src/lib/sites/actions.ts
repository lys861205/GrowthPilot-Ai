"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import type { Platform } from "@/types";

const addSiteSchema = z.object({
  url: z
    .string()
    .url("Please enter a valid URL including https://")
    .refine((u) => u.startsWith("http"), "URL must start with http:// or https://"),
  name: z.string().min(1, "Site name is required").max(100),
  platform: z.enum(["shopify", "wordpress", "other"]).default("other"),
});

export type SiteActionResult =
  | { success: true; siteId: string }
  | { success: false; error: string };

export async function addSiteAction(
  _prev: SiteActionResult | null,
  formData: FormData
): Promise<SiteActionResult> {
  const session = await requireSession();

  const raw = {
    url: (formData.get("url") as string)?.trim().replace(/\/$/, ""),
    name: formData.get("name") as string,
    platform: formData.get("platform") as Platform,
  };

  const parsed = addSiteSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Check duplicate URL for this user
  const existing = await db.query.sites.findFirst({
    where: and(
      eq(sites.userId, session.user.id),
      eq(sites.url, parsed.data.url)
    ),
  });

  if (existing) {
    return { success: false, error: "You already have a site with this URL" };
  }

  const [site] = await db
    .insert(sites)
    .values({
      userId: session.user.id,
      url: parsed.data.url,
      name: parsed.data.name,
      platform: parsed.data.platform,
    })
    .returning({ id: sites.id });

  redirect(`/dashboard/sites`);
}

export async function deleteSiteAction(siteId: string): Promise<SiteActionResult> {
  const session = await requireSession();

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, session.user.id)),
  });

  if (!site) {
    return { success: false, error: "Site not found" };
  }

  await db.delete(sites).where(eq(sites.id, siteId));
  return { success: true, siteId };
}
