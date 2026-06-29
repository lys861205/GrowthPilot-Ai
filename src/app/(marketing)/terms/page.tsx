import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
      
      <div className="prose prose-slate lg:prose-lg max-w-none">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-8">
          Terms of Service
        </h1>
        <p className="text-slate-500 mb-8">Last updated: June 29, 2026</p>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">1. Acceptance of Terms</h2>
          <p className="text-slate-600 leading-relaxed">
            By accessing or using GrowthPilot, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access our service.
          </p>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">2. Description of Service</h2>
          <p className="text-slate-600 leading-relaxed">
            GrowthPilot is a B2B AI-powered SEO automation platform. We provide tools for website technical audits, keyword tracking (via Google Search Console), and automated content generation. We reserve the right to modify or discontinue, temporarily or permanently, the Service with or without notice.
          </p>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">3. User Accounts</h2>
          <p className="text-slate-600 leading-relaxed">
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
          </p>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">4. Content and AI Generation</h2>
          <p className="text-slate-600 leading-relaxed">
            Our Service utilizes AI models to generate text ("Content AI"). While we strive for high quality, you acknowledge that AI-generated content may sometimes be inaccurate or inappropriate. You are solely responsible for reviewing, modifying, and publishing the generated content. You retain all ownership rights to the content you generate using our Service.
          </p>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">5. Fair Usage and API Limits</h2>
          <p className="text-slate-600 leading-relaxed">
            Usage of the platform must comply with our Fair Usage Policy. Excessive automated requests, attempting to reverse-engineer our proprietary AI workflows, or abusing the Google Search Console synchronization limits may result in temporary or permanent suspension of your account.
          </p>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">6. Limitation of Liability</h2>
          <p className="text-slate-600 leading-relaxed">
            In no event shall GrowthPilot, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </section>
      </div>
    </div>
  );
}
