import { prisma } from "./lib/prisma";

export const revalidate = 3600; // regenerate every 1 hour

export default async function sitemap() {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://cdrlogo.com").replace(/\/$/, "");

  const [logos, blogs] = await Promise.all([
    prisma.logo.findMany({
      where: { publishStatus: "Published" },
      select: { slug: true, updatedAt: true, category: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.blog.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // ── Group logos by category for category pages ─────────────
  const categories = [...new Set(logos.map(l => l.category).filter(Boolean))];

  // ── Static routes ───────────────────────────────────────────
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      priority: 1.0,
      changeFrequency: "daily",
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      priority: 0.8,
      changeFrequency: "daily",
    },
    {
      url: `${baseUrl}/brands`,
      lastModified: new Date(),
      priority: 0.8,
      changeFrequency: "daily",
    },
    {
      url: `${baseUrl}/category`,
      lastModified: new Date(),
      priority: 0.8,
      changeFrequency: "daily",
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      priority: 0.4,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/request`,
      lastModified: new Date(),
      priority: 0.5,
      changeFrequency: "monthly",
    },
  ];

  // ── Category pages ──────────────────────────────────────────
  const categoryRoutes = categories.map(cat => ({
    url: `${baseUrl}/search/${encodeURIComponent(cat.toLowerCase())}`,
    lastModified: new Date(),
    priority: 0.7,
    changeFrequency: "daily",
  }));

  // ── Logo pages ──────────────────────────────────────────────
  const logoRoutes = logos
    .filter(l => l.slug?.trim())
    .map(l => ({
      url: `${baseUrl}/logo/${l.slug.replace(/^\/+/, "").trim()}`,
      lastModified: l.updatedAt ?? new Date(),
      priority: 0.9,
      changeFrequency: "weekly",
    }));

  // ── Blog pages ──────────────────────────────────────────────
  const blogRoutes = blogs
    .filter(b => b.slug?.trim())
    .map(b => ({
      url: `${baseUrl}/blog/${b.slug.replace(/^\/+/, "").trim()}`,
      lastModified: b.updatedAt ?? new Date(),
      priority: 0.6,
      changeFrequency: "monthly",
    }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...logoRoutes,
    ...blogRoutes,
  ];
}