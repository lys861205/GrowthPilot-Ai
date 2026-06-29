import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./src/lib/db";
import { sites, blogPosts, blogIdeas } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function testFeatures() {
  console.log("--- Testing EEAT Features ---");

  const siteWithInfo = {
    name: "GrowthPilot Test Site",
    url: "https://growthpilot.ai",
    companyInfo: "We are a premium AI software development agency with 10 years of experience. We specialize in Next.js and SEO automation. We have a strict SLA of 99.9% uptime and our customer support is 24/7."
  };

  console.log(`Using site: ${siteWithInfo.name}`);
  console.log(`Company Info: ${siteWithInfo.companyInfo}`);

  // 2. Test generateBlogOutline prompt injection
  console.log("\nTesting generateBlogOutline...");
  const { generateBlogOutline } = await import("./src/lib/qwen/content");
  
  try {
    const outline = await generateBlogOutline({
      topic: "How to use AI for SEO",
      keywords: ["ai seo", "seo automation"],
      tone: "professional",
      wordCount: 900,
      siteUrl: siteWithInfo.url,
      siteName: siteWithInfo.name,
      companyInfo: siteWithInfo.companyInfo,
    });
    console.log("Outline generated successfully!");
    console.log("Sections:");
    outline.sections.forEach(s => console.log(`- ${s.heading} (${s.keyPoints.length} key points)`));
  } catch (error) {
    console.error("Failed to generate outline:", error);
  }

  console.log("\nTests completed.");
  process.exit(0);
}

testFeatures();
