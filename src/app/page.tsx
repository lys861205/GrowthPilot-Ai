import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { LandingPage } from "@/components/marketing/LandingPage";

export default async function RootPage() {
  const session = await getServerSession();
  if (session) redirect("/dashboard");
  return <LandingPage />;
}
