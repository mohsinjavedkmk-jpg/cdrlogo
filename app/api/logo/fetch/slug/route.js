// app/api/logo/fetch/slug/route.js
import { prisma } from "../../../../lib/prisma";

const MAX_RELATED = 6;
const CANDIDATE_POOL = 300;

const norm = (v) => String(v || "").trim().toLowerCase();

export async function POST(req) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return Response.json({ success: false, error: "Slug is required" }, { status: 400 });
    }

    const logo = await prisma.logo.findUnique({
      where: { slug },
      select: {
        id: true, logoName: true, slug: true, brand: true, website: true,
        category: true, industry: true, country: true, license: true,
        description: true, history: true, tags: true,
        webpUrl: true, svgUrl: true, pngUrl: true, aiUrl: true, cdrUrl: true,
        svgfilesize: true, pngfilesize: true, aifilesize: true, cdrfilesize: true,
        svgContent: true,
        metaTitle: true, metaDescription: true, altText: true,
        canonicalUrl: true, ogTitle: true, ogDescription: true, ogImageUrl: true, ogType: true,
        twitterTitle: true, twitterDescription: true, twitterImage: true, twitterCardType: true,
        publishStatus: true,
        imageObjectSchema: true, breadcrumbSchema: true, faqSchema: true,
        downloadedNumberByPeople: true,
        createdAt: true, updatedAt: true,
      },
    });

    if (!logo) {
      return Response.json({ success: false, error: "Logo not found" }, { status: 404 });
    }

    const logoCategories = (Array.isArray(logo.category) ? logo.category : []).filter(Boolean);
    const logoTags = (Array.isArray(logo.tags) ? logo.tags : []).map(norm);
    const normCategories = logoCategories.map(norm);
    const ownBrandKey = norm(logo.brand || logo.logoName);

    let related = [];

    if (logoCategories.length > 0) {
      // 1) Candidate pool: same category, published, has thumbnail
      const candidates = await prisma.logo.findMany({
        where: {
          slug: { not: slug },
          publishStatus: { in: ["published", "Published"] },
          category: { hasSome: logoCategories },
          webpUrl: { not: null },
        },
        select: {
          slug: true, logoName: true, brand: true,
          webpUrl: true, category: true, tags: true,
        },
        orderBy: { downloadedNumberByPeople: "desc" },
        take: CANDIDATE_POOL,
      });

      // 2) Score: more shared categories first, then shared tags.
      //    (DB order = downloads desc, and sort() is stable, so it stays the tiebreaker)
      const scored = candidates
        .map((c) => {
          const cCats = (Array.isArray(c.category) ? c.category : []).map(norm);
          const cTags = (Array.isArray(c.tags) ? c.tags : []).map(norm);
          return {
            ...c,
            _catScore: cCats.filter((x) => normCategories.includes(x)).length,
            _tagScore: cTags.filter((x) => logoTags.includes(x)).length,
          };
        })
        .sort((a, b) => b._catScore - a._catScore || b._tagScore - a._tagScore);

      // 3) Strict filters + one card per brand
      const seenBrands = new Set([ownBrandKey]); // skips own brand's other variants too
      const seenSlugs = new Set([slug]);
      const seenThumbs = new Set();

      for (const c of scored) {
        if (related.length >= MAX_RELATED) break;

        const brandKey = norm(c.brand || c.logoName);
        const thumb = String(c.webpUrl || "").trim();

        if (!brandKey || !thumb) continue;                              // no brand / no thumbnail
        if (!thumb.toLowerCase().includes(norm(c.slug))) continue;      // thumbnail ↔ slug mismatch
        if (seenBrands.has(brandKey)) continue;                         // same brand already shown
        if (seenSlugs.has(c.slug)) continue;                            // duplicate card
        if (seenThumbs.has(thumb)) continue;                            // duplicate thumbnail

        seenBrands.add(brandKey);
        seenSlugs.add(c.slug);
        seenThumbs.add(thumb);

        related.push({
          slug: c.slug,
          logoName: c.logoName,
          brand: c.brand,
          webpUrl: c.webpUrl,
        });
      }
    }

    // No fallback fill on purpose: if fewer than 6 relevant brands exist, show fewer.
    return Response.json({ success: true, data: logo, related });
  } catch (err) {
    console.error("[fetch/slug] ✗ ERROR:", err);
    return Response.json(
      { success: false, error: "Server error", message: err.message },
      { status: 500 }
    );
  }
}