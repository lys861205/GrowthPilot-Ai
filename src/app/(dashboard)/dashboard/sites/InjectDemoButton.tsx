"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { injectDemoDataAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function InjectDemoButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInject = async () => {
    try {
      setLoading(true);
      await injectDemoDataAction();
      toast.success("Demo data injected successfully! 🚀");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to inject demo data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleInject}
      disabled={loading}
      className="mx-auto flex w-fit min-w-[220px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6 text-base font-semibold text-white shadow-xl shadow-amber-500/20 transition-all duration-300 hover:scale-105 hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-500/40"
    >
      <Sparkles className={`h-5 w-5 ${loading ? "animate-spin" : "animate-pulse"}`} />
      <span>Load Demo Data</span>
    </Button>
  );
}
