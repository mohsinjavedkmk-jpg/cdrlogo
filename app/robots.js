export default function robots() {
   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000" || "https://cdrlogo.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/login", "/verify"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}