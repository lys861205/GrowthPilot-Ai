import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";

export const metadata = { title: "Create Account — GrowthPilot AI" };

export default function RegisterPage() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="text-slate-400 text-sm mt-1">
          Start growing your store with AI — free
        </p>
      </div>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
