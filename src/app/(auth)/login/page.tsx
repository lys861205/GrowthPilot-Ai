import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export const metadata = { title: "Sign In — GrowthPilot AI" };

export default function LoginPage() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="text-slate-400 text-sm mt-1">
          Sign in to your GrowthPilot account
        </p>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-slate-400">
        No account?{" "}
        <Link
          href="/register"
          className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}
