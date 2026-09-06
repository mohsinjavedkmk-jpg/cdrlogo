import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://www.cdrlogo.com").replace(/\/$/, "");

  const [logos, blogs] = await Promise.all([
    prisma.logo.findMany({
      where: { publishStatus: "Published" },
      select: { slug: true, updatedAt: true, category: true, webpUrl: true, logoName: true }, // ← added webpUrl, logoName
      orderBy: { updatedAt: "desc" },
    }),
    prisma.blog.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // -------------------------------
  // SAFE CATEGORY EXTRACTION
  // -------------------------------
  const excludedCategories = ["template"]; // ← add any slugs you want to exclude here

  const categories = [
    ...new Set(
      logos
        .flatMap(l => Array.isArray(l.category) ? l.category : [])
        .map(c => String(c).trim().toLowerCase().replace(/\s+/g, "-"))
        .filter(Boolean)
        .filter(c => !excludedCategories.includes(c)) // ← excludes "template"
    )
  ];

  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/brands`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 }, // ← changed
    { url: `${baseUrl}/template`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/about-us`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/logos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  // -------------------------------
  // CATEGORY ROUTES
  // -------------------------------
  const categoryRoutes = categories.map(cat => ({
    url: `${baseUrl}/categories/logos/${encodeURIComponent(cat.toLowerCase())}`, // ← changed
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // -------------------------------
  // LOGO ROUTES (now with image data)
  // -------------------------------
  const logoRoutes = logos
    .filter(l => typeof l.slug === "string" && l.slug.trim() !== "")
    .map(l => ({
      url: `${baseUrl}/logo/${l.slug.replace(/^\/+/, "").trim()}`,
      lastModified: l.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
      image: l.webpUrl || null,        // ← same row as slug, no zipping
      imageTitle: l.logoName || null,  // ← same row as slug, no zipping
    }));

  // -------------------------------
  // BLOG ROUTES
  // -------------------------------
  const blogRoutes = blogs
    .filter(b => typeof b.slug === "string" && b.slug.trim() !== "")
    .map(b => ({
      url: `${baseUrl}/blog/${b.slug.replace(/^\/+/, "").trim()}`,
      lastModified: b.updatedAt || new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  // -------------------------------
  // FINAL OUTPUT
  // -------------------------------
  const allRoutes = [
    ...staticRoutes,
    ...categoryRoutes,
    ...logoRoutes,
    ...blogRoutes,
  ];

  return NextResponse.json(allRoutes.filter(r => r.url && typeof r.url === "string"));
}