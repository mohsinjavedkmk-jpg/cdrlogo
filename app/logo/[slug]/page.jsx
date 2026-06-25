// app/logo/[slug]/page.js
// generateMetadata uses every stored SEO field; falls back gracefully.
// Page component also injects ImageObject / BreadcrumbList / FAQ JSON-LD
// schema (stored on the Logo model by the upload route) into <head> via
// <script type="application/ld+json">.
// ─────────────────────────────────────────────────────────────────────────────
import LogoDetail from "./LogoDetail";

async function fetchLogo(slug) {
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
  return json.data || json;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const logo = await fetchLogo(slug);

    // ── 1. Canonical ─────────────────────────────────────────────────────────
    // Prefer the DB-stored canonical (set by the upload route to
    // https://cdrlogo.com/logo/{slug}/) but fall back to a computed value
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

    // ── 5. Robots / indexing ───────────────────────────────────────────────────
    // Only fully "Published" logos should be indexable. Draft, pending,
    // or any other non-published status is kept out of search results —
    // the page still renders normally, it's just not indexed/followed.
    const isPublished = logo.publishStatus === "Published";
    const robots = isPublished
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        }
      : {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        };

    // ── 6. Icons / misc (site-wide, safe defaults) ─────────────────────────────
    const keywords = Array.isArray(logo.tags) ? logo.tags : undefined;

    // ── 7. Assemble metadata object ───────────────────────────────────────────
    return {
      title: metaTitle,
      description: metaDescription,
      ...(keywords ? { keywords } : {}),

      alternates: {
        canonical: canonicalUrl,
      },

      robots,

      openGraph: {
        title:       ogTitle,
        description: ogDescription,
        url:         canonicalUrl,
        type:        ogType,
        siteName:    "cdrlogo.com",
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
      robots: { index: false, follow: false },
    };
  }
}

export default async function Page({ params }) {
  const { slug } = await params;

  // Schema is fetched again here (server component, separate render pass
  // from generateMetadata — Next.js dedupes identical fetch() calls within
  // the same request automatically, so this is not a duplicate network hit).
  let imageObjectSchema = null;
  let breadcrumbSchema = null;
  let faqSchema = null;

  try {
    const logo = await fetchLogo(slug);

    if (logo?.imageObjectSchema && Object.keys(logo.imageObjectSchema).length) {
      imageObjectSchema = logo.imageObjectSchema;
    }
    if (logo?.breadcrumbSchema && Object.keys(logo.breadcrumbSchema).length) {
      breadcrumbSchema = logo.breadcrumbSchema;
    }
    if (Array.isArray(logo?.faqSchema) && logo.faqSchema.length) {
      faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": logo.faqSchema,
      };
    }
  } catch (err) {
    console.error("[Page schema fetch]", err);
  }

  return (
    <>
      {imageObjectSchema && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(imageObjectSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <LogoDetail />
    </>
  );
}