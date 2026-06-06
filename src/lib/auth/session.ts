import { headers } from "next/headers";
import { auth } from "./index";
import { redirect } from "next/navigation";

export async function getServerSession() {
  const headersList = await headers();
  return auth.api.getSession({ headers: headersList });
}

export async function requireSession() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireGuest() {
  const session = await getServerSession();
  if (session) redirect("/dashboard");
}
