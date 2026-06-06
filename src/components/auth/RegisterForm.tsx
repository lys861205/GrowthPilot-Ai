"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction, type AuthActionResult } from "@/lib/auth/actions";
import { AlertCircle, Loader2 } from "lucide-react";

const initialState: AuthActionResult | null = null;

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );

  useEffect(() => {
    if (state?.success) router.push("/dashboard");
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.success && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-slate-300 text-sm">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Jane Smith"
          autoComplete="name"
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-slate-300 text-sm">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-slate-300 text-sm">
          Password
          <span className="text-slate-500 font-normal ml-1">(min 8 chars)</span>
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium h-10"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-xs text-slate-500 text-center">
        By signing up you agree to our terms of service.
      </p>
    </form>
  );
}
