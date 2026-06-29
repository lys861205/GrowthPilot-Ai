import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-slate-500 mb-8">Last updated: June 29, 2026</p>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">1. Information We Collect</h2>
          <p className="text-slate-600 leading-relaxed">
            We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested, delivery notes, and other information you choose to provide.
          </p>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">2. Google Search Console Data</h2>
          <p className="text-slate-600 leading-relaxed">
            When you integrate GrowthPilot with your Google Search Console (GSC) account, we request read-only access to your site's performance data, including keywords, impressions, clicks, CTR, and average position. We use this data exclusively to power the SEO analytics and Content AI features within your GrowthPilot dashboard. We do not sell or share this specific search data with any third parties.
          </p>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">3. Use of Information</h2>
          <p className="text-slate-600 leading-relaxed">
            We may use the information we collect about you to:
          </p>
          <ul className="list-disc pl-6 text-slate-600 space-y-2">
            <li>Provide, maintain, and improve our Services;</li>
            <li>Perform internal operations, including to prevent fraud;</li>
            <li>Send or facilitate communications between you and our support team;</li>
            <li>Send you customized communications, such as updates on your SEO audits or background worker statuses.</li>
          </ul>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">4. Sharing of Information</h2>
          <p className="text-slate-600 leading-relaxed">
            We do not share your personal information with outside parties except as necessary to provide our services (such as processing payments via Stripe, or utilizing LLM APIs like Qwen for content generation). In these instances, data is only shared to the extent strictly necessary for the service provision.
          </p>
        </section>

        <section className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">5. Contact Us</h2>
          <p className="text-slate-600 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at: support@growthpilot.ai
          </p>
        </section>
      </div>
    </div>
  );
}
