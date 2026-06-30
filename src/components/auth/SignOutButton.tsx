"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-100 gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
