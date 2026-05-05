/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "http://localhost:3000" || "https://cdrlogo.com",
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,

  // ── just exclude what you don't want ──────────────────────
  exclude: [
    "/admin",
    "/admin/*",
    "/api/*",
    "/login",
    "/verify",
    "/template",
    "/logo/*",   // ← exclude dynamic since DB needed for these
    "/blog/*",   // ← exclude dynamic since DB needed for these
    "/search/*",
  ],

  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/admin", "/api", "/login", "/verify"] },
    ],
  },
};