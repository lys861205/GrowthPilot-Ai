import Link from "next/link";
import {
  Search, Zap, TrendingUp, FileText, BarChart2, BookOpen,
  CheckCircle2, ArrowRight, Star, Shield, Clock, Globe, Sparkles,
} from "lucide-react";

export function LandingPage() {
  return (
    <div style={{ display: "block", minHeight: "100vh", width: "100%", backgroundColor: "#fff", overflowX: "hidden" }}>
      <Navbar />
      <Hero />
      <LogoBar />
      <Features />
      <HowItWorks />
      <AuditDemo />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// ── Shared container ──────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  maxWidth: "72rem",
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "1.5rem",
  paddingRight: "1.5rem",
  width: "100%",
  boxSizing: "border-box",
};

function Container({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ ...containerStyle, ...style }} className={className}>
      {children}
    </div>
  );
}

function SectionLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
      light ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-50 text-indigo-600"
    }`}>
      {children}
    </span>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid #f1f5f9", backgroundColor: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}>
      <Container style={{ paddingTop: "1rem", paddingBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ display: "flex", height: "2rem", width: "2rem", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", backgroundColor: "#4f46e5", flexShrink: 0 }}>
            <Zap style={{ height: "1rem", width: "1rem", color: "#fff" }} />
          </div>
          <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>GrowthPilot AI</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors sm:block">
            Sign in
          </Link>
          <Link
            href="/login"
            style={{ borderRadius: "0.5rem", backgroundColor: "#4f46e5", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "#fff", textDecoration: "none" }}
          >
            Start Free Trial
          </Link>
        </div>
      </Container>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" style={{ position: "relative", paddingTop: "6rem", paddingBottom: "6rem" }}>
      <div
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          opacity: 0.15,
          backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
        }}
      />

      <Container style={{ position: "relative", textAlign: "center" }}>
        <div style={{ marginBottom: "1.5rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", borderRadius: "9999px", border: "1px solid rgba(129,140,248,0.3)", backgroundColor: "rgba(99,102,241,0.1)", padding: "0.375rem 1rem", fontSize: "0.875rem", fontWeight: 500, color: "rgb(165,180,252)" }}>
          <Sparkles style={{ height: "0.875rem", width: "0.875rem" }} />
          Powered by Qwen AI — Built for E-Commerce
        </div>

        <h1 style={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.025em", color: "#fff", marginTop: 0 }} className="md:text-6xl">
          Stop Losing Sales to
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Bad SEO
          </span>
        </h1>

        <p style={{ marginLeft: "auto", marginRight: "auto", marginTop: "1.5rem", maxWidth: "42rem", fontSize: "1.125rem", lineHeight: 1.7, color: "rgb(148,163,184)" }}>
          GrowthPilot AI crawls your store, finds every SEO issue, generates
          AI-optimized content, and gives you a daily action plan — so you rank
          higher, get more traffic, and convert more customers.
        </p>

        <div style={{ marginTop: "2.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem" }} className="sm:flex-row">
          <Link
            href="/login"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", borderRadius: "0.75rem", backgroundColor: "#6366f1", padding: "0.875rem 2rem", fontSize: "1rem", fontWeight: 600, color: "#fff", textDecoration: "none" }}
          >
            Audit My Store Free <ArrowRight style={{ height: "1rem", width: "1rem" }} />
          </Link>
          <a
            href="#how-it-works"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", borderRadius: "0.75rem", border: "1px solid rgb(71,85,105)", padding: "0.875rem 2rem", fontSize: "1rem", fontWeight: 500, color: "rgb(148,163,184)", textDecoration: "none" }}
          >
            See How It Works
          </a>
        </div>

        <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "rgb(100,116,139)" }}>
          Free 14-day trial · No credit card required · Setup in 2 minutes
        </p>

        <div style={{ marginTop: "4rem", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "2rem", borderTop: "1px solid rgba(51,65,85,0.5)", paddingTop: "2.5rem" }}>
          {[
            { value: "10,000+", label: "Sites Audited" },
            { value: "2.4M+", label: "Issues Fixed" },
            { value: "47%", label: "Avg. Traffic Lift" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: "1.875rem", fontWeight: 900, color: "#fff" }}>{s.value}</p>
              <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "rgb(148,163,184)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── Logo Bar ──────────────────────────────────────────────────────────────────

function LogoBar() {
  const platforms = ["Shopify", "WordPress", "WooCommerce", "BigCommerce", "Squarespace", "Webflow"];
  return (
    <div className="border-y border-slate-100 bg-slate-50" style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
      <Container>
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Works with every platform
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {platforms.map((p) => (
            <span key={p} className="text-sm font-semibold text-slate-400">{p}</span>
          ))}
        </div>
      </Container>
    </div>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

function Features() {
  const features = [
    {
      icon: Search,
      title: "Deep SEO Audit",
      description: "Crawls every page and finds missing meta tags, thin content, slow pages, broken links, and 20+ issues ranked by impact.",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: Zap,
      title: "AI Content Optimizer",
      description: "Rewrites your titles, meta descriptions, and product copy using AI trained on what actually ranks — not generic templates.",
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      icon: BookOpen,
      title: "Blog Content Agent",
      description: "Generates 10 SEO blog ideas with full outlines, keyword clusters, FAQ sections, and internal link suggestions.",
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: BarChart2,
      title: "Score History & Trends",
      description: "Tracks your SEO score over time. Compares audits side-by-side so you can see exactly what improved.",
      color: "bg-green-50 text-green-600",
    },
    {
      icon: TrendingUp,
      title: "Growth Recommendations",
      description: "AI-generated growth roadmap prioritized by impact and effort. Know exactly what to do next.",
      color: "bg-orange-50 text-orange-600",
    },
    {
      icon: FileText,
      title: "7-Day Action Plan",
      description: "A day-by-day plan tailored to your audit results. Each task includes the reason, expected impact, and time estimate.",
      color: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <section id="features" style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
      <Container>
        <SectionLabel>Features</SectionLabel>
        <h2 className="mt-3 max-w-xl text-4xl font-bold text-slate-900">
          Everything you need to dominate search results
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-500">
          GrowthPilot replaces four different tools — SEO auditor, content writer,
          keyword researcher, and growth consultant — in one dashboard.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className={`mb-4 inline-flex rounded-xl p-3 ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Add your website",
      description: "Enter your store URL. GrowthPilot connects instantly — no plugins, no code, no agency required.",
    },
    {
      step: "02",
      title: "Run your first audit",
      description: "Our crawler visits every page and checks 20+ SEO signals in under 2 minutes. You get a score and a prioritized issue list.",
    },
    {
      step: "03",
      title: "Get your action plan",
      description: "AI generates a 7-day plan tailored to your results. Quick wins first, structural fixes later — nothing generic.",
    },
    {
      step: "04",
      title: "Track your progress",
      description: "Re-audit weekly. Watch your score climb. Compare audits to see exactly what improved.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-slate-50" style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
      <Container>
        <SectionLabel>How It Works</SectionLabel>
        <h2 className="mt-3 max-w-xl text-4xl font-bold text-slate-900">
          From zero to ranked in 4 steps
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-500">
          No SEO expertise needed. GrowthPilot tells you exactly what to do and why.
        </p>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step}>
              <p className="mb-4 text-5xl font-black text-indigo-100">{s.step}</p>
              <h3 className="text-base font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── Audit Demo ────────────────────────────────────────────────────────────────

function AuditDemo() {
  const issues = [
    { label: "Missing meta descriptions", count: 8, severity: "high" },
    { label: "Thin content (< 300 words)", count: 12, severity: "high" },
    { label: "Images missing alt text", count: 24, severity: "medium" },
    { label: "Slow page load (> 3s)", count: 5, severity: "medium" },
    { label: "No H1 heading", count: 3, severity: "high" },
    { label: "Missing canonical tags", count: 11, severity: "low" },
  ];

  const actions = [
    { day: "Day 1", task: "Add meta descriptions to 8 product pages", lift: "+6 pts", effort: "Low" },
    { day: "Day 2", task: "Expand thin content on top 5 category pages", lift: "+8 pts", effort: "Medium" },
    { day: "Day 3", task: "Add alt text to 24 product images", lift: "+4 pts", effort: "Low" },
  ];

  return (
    <section style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
      <Container>
        <SectionLabel>Live Demo</SectionLabel>
        <h2 className="mt-3 max-w-xl text-4xl font-bold text-slate-900">
          See a real audit in action
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-500">
          This is what GrowthPilot finds for a typical Shopify store — and what it tells you to fix first.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <p className="font-semibold text-slate-800">example-shop.com</p>
                <p className="mt-0.5 text-xs text-slate-400">Crawled 47 pages · 2 minutes ago</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full border-4 border-amber-400">
                  <span className="text-lg font-black text-amber-600">61</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">SEO Score</p>
                  <p className="text-xs text-amber-600">Needs work</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Issues Found (63 total)</p>
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div key={issue.label} className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${
                        issue.severity === "high" ? "bg-red-500" :
                        issue.severity === "medium" ? "bg-yellow-400" : "bg-slate-300"
                      }`} />
                      <span className="truncate text-sm text-slate-700">{issue.label}</span>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                      issue.severity === "high" ? "bg-red-50 text-red-700" :
                      issue.severity === "medium" ? "bg-yellow-50 text-yellow-700" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {issue.count} pages
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
            <div className="border-b border-indigo-50 bg-indigo-50 px-6 py-4">
              <p className="font-semibold text-indigo-900">AI-Generated Action Plan</p>
              <p className="mt-0.5 text-xs text-indigo-600">Estimated score lift: +18 points this week</p>
            </div>
            <div className="space-y-3 p-6">
              {actions.map((a) => (
                <div key={a.day} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{a.day}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-green-600">{a.lift}</span>
                      <span className="text-xs text-slate-400">{a.effort} effort</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{a.task}</p>
                </div>
              ))}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-center">
                <p className="text-sm font-semibold text-indigo-700">+ 4 more days planned</p>
                <Link href="/login" className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-500 hover:underline">
                  See your full plan <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

function Testimonials() {
  const testimonials = [
    {
      quote: "We went from page 3 to page 1 for our main product keywords in 6 weeks. GrowthPilot found issues we had no idea existed.",
      name: "Sarah Chen",
      role: "Founder, LumaHome Decor",
      platform: "Shopify",
      lift: "+83% organic traffic",
    },
    {
      quote: "The 7-day action plan is genius. I used to spend hours figuring out what to fix. Now I just open GrowthPilot every Monday and follow the plan.",
      name: "Marcus Williams",
      role: "Marketing Director, OutdoorGear Co.",
      platform: "WooCommerce",
      lift: "+112% impressions",
    },
    {
      quote: "The blog agent alone paid for itself. It generated 10 content ideas that were exactly what our customers search for. Three posts are already ranking.",
      name: "Priya Sharma",
      role: "CEO, NaturalBeauty Store",
      platform: "WordPress",
      lift: "3 posts on page 1",
    },
  ];

  return (
    <section className="bg-slate-900" style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
      <Container>
        <SectionLabel light>Testimonials</SectionLabel>
        <h2 className="mt-3 max-w-xl text-4xl font-bold text-white">
          Real stores. Real results.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
              <div className="mb-4 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-slate-300">"{t.quote}"</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-700 pt-4">
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
                <span className="rounded-full bg-green-900/50 px-3 py-1 text-xs font-semibold text-green-400">
                  {t.lift}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: 29,
      description: "Perfect for small stores getting started with SEO.",
      features: ["1 website", "5 audits per month", "AI meta & title optimizer", "Growth recommendations", "7-day action plan", "Email support"],
      cta: "Start Free Trial",
      highlight: false,
    },
    {
      name: "Growth",
      price: 79,
      description: "For growing stores serious about organic traffic.",
      features: ["3 websites", "Unlimited audits", "Blog Agent (10 ideas/mo)", "Score history & trends", "Audit comparison", "Priority support", "PDF export"],
      cta: "Start Free Trial",
      highlight: true,
      badge: "Most Popular",
    },
    {
      name: "Agency",
      price: 199,
      description: "For agencies managing SEO across multiple client sites.",
      features: ["Unlimited websites", "Unlimited audits", "Blog Agent (unlimited)", "White-label PDF reports", "5 team seats", "API access", "Dedicated account manager"],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="bg-slate-50" style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
      <Container>
        <SectionLabel>Pricing</SectionLabel>
        <h2 className="mt-3 max-w-xl text-4xl font-bold text-slate-900">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 max-w-xl text-lg text-slate-500">
          Start free for 14 days. No credit card required. Cancel anytime.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.highlight
                  ? "border-2 border-indigo-500 bg-white shadow-xl"
                  : "border border-slate-200 bg-white shadow-sm"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <p className="text-base font-bold text-slate-900">{plan.name}</p>
              <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                <span className="text-slate-400">/mo</span>
              </div>

              <Link
                href="/login"
                className={`mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-slate-500">
          {[
            { icon: Shield, text: "14-day free trial" },
            { icon: Clock, text: "Cancel anytime" },
            { icon: Globe, text: "No long-term contracts" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-indigo-400" />
              {text}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
      <Container>
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 px-8 py-16 text-center shadow-2xl shadow-indigo-500/20 md:px-16">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Your competitors are optimizing.
            <br />Are you?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-200">
            Every week without SEO is traffic you're handing to someone else.
            Start your free audit today — it takes 2 minutes.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-indigo-700 shadow-lg hover:bg-indigo-50 transition-colors"
          >
            Audit My Store Free <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-sm text-indigo-300">
            Free 14-day trial · No credit card · Cancel anytime
          </p>
        </div>
      </Container>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
      <Container>
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-900">GrowthPilot AI</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Autonomous SEO growth agent for e-commerce businesses.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8 text-sm">
            <div>
              <p className="mb-3 font-semibold text-slate-700">Product</p>
              <ul className="space-y-2 text-slate-500">
                <li><a href="#features" className="hover:text-slate-700">Features</a></li>
                <li><a href="#pricing" className="hover:text-slate-700">Pricing</a></li>
                <li><Link href="/login" className="hover:text-slate-700">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-semibold text-slate-700">Use Cases</p>
              <ul className="space-y-2 text-slate-500">
                <li>Shopify SEO</li>
                <li>WordPress SEO</li>
                <li>WooCommerce SEO</li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-semibold text-slate-700">Legal</p>
              <ul className="space-y-2 text-slate-500">
                <li><Link href="/privacy" className="hover:text-slate-700">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-slate-700">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} GrowthPilot AI. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
