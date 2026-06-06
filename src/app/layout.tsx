import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GrowthPilot AI",
    template: "%s — GrowthPilot AI",
  },
  description: "Autonomous AI Growth Agent for E-Commerce",
};

// Critical CSS inlined so Chrome paints correctly before the Tailwind stylesheet loads.
// Covers the Tailwind preflight resets that cause the biggest visible shifts.
const criticalCss = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { background-color: #f8fafc; line-height: 1.5; -webkit-font-smoothing: antialiased; }
  h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; margin: 0; }
  p, ul, ol, li, figure, blockquote, dl, dd { margin: 0; }
  img, svg, video, canvas, audio, iframe, embed, object { display: block; vertical-align: middle; }
  img, video { max-width: 100%; height: auto; }
  button, input, optgroup, select, textarea { font-family: inherit; font-size: 100%; font-weight: inherit; line-height: inherit; margin: 0; padding: 0; }
  a { color: inherit; text-decoration: inherit; }
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalCss }} />
      </head>
      <body className="bg-slate-50">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
