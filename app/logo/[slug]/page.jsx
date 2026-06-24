
// app/logo/[slug]/page.js
// generateMetadata uses every stored SEO field; falls back gracefully.
// ─────────────────────────────────────────────────────────────────────────────
import LogoDetail from "./LogoDetail";
 
export async function generateMetadata({ params }) {
  const { slug } = await params;
 
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/logo/fetch/slug`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        next: { revalidate: 3600 },
      }
    );
 
    const json = await res.json();
    const logo = json.data || json;
 
    // ── 1. Canonical ─────────────────────────────────────────────────────────
    // Prefer the DB-stored canonical (set by the upload route to
    // https://cdrlogo.com/logos/{slug}/) but fall back to a computed value
    // in case the field is missing on older records.
    const canonicalUrl =
      logo.canonicalUrl ||
      `${process.env.NEXT_PUBLIC_BASE_URL}/logo/${logo.slug}`;
 
    // ── 2. Core meta ─────────────────────────────────────────────────────────
    const metaTitle = logo.metaTitle ||
      `${logo.logoName} Logo – Free Download (SVG, PNG, AI, CDR)`;
 
    const metaDescription = logo.metaDescription ||
      (logo.description || "").slice(0, 160);
 
    // ── 3. Open Graph ────────────────────────────────────────────────────────
    const ogTitle       = logo.ogTitle       || metaTitle;
    const ogDescription = logo.ogDescription || metaDescription;
    const ogType        = logo.ogType        || "website";
 
    // ogImageUrl wins; fall back to the public WebP preview
    const ogImage = logo.ogImageUrl || logo.webpUrl || null;
 
    // ── 4. Twitter / X card ───────────────────────────────────────────────────
    const twitterCard        = logo.twitterCardType    || "summary_large_image";
    const twitterTitle       = logo.twitterTitle       || ogTitle;
    const twitterDescription = logo.twitterDescription || ogDescription;
    // twitterImage: dedicated field → ogImageUrl → webpUrl
    const twitterImage = logo.twitterImage || ogImage;
 
    // ── 5. Assemble metadata object ───────────────────────────────────────────
    return {
      title: metaTitle,
      description: metaDescription,
 
      alternates: {
        canonical: canonicalUrl,
      },
 
      openGraph: {
        title:       ogTitle,
        description: ogDescription,
        url:         canonicalUrl,
        type:        ogType,
        ...(ogImage
          ? { images: [{ url: ogImage, width: 1200, height: 630, alt: logo.altText || ogTitle }] }
          : {}),
      },
 
      twitter: {
        card:        twitterCard,
        title:       twitterTitle,
        description: twitterDescription,
        ...(twitterImage ? { images: [twitterImage] } : {}),
      },
    };
 
  } catch (err) {
    console.error("[generateMetadata]", err);
    return {
      title:       "Logo – Free Download",
      description: "Download free vector logos in SVG, PNG, AI, CDR formats.",
    };
  }
}
 
export default function Page() {
  return <LogoDetail />;
}