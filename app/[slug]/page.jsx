import Client from "./client.jsx";

const cleanText = (text) =>
  text ? text.replace(/[\r\n\t\u200B]+/g, " ").replace(/\s+/g, " ").trim() : "";

const DEFAULT_TITLE = "Vector Logo Downloads | CDR, SVG, AI & PNG Files - CDRLogo";
const DEFAULT_DESCRIPTION =
  "Vector logo downloads in CDR, SVG, AI, EPS and PNG formats for graphic designers, students and print professionals. Design reference library at cdrlogo.com.";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.cdrlogo.com";

  try {
    const res = await fetch(`${baseUrl}/api/website/cms/get-slug`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Page not found");

    const json = await res.json();
    const page = json.data;

    const title =
      cleanText(page?.metaTitle) || cleanText(page?.title) || DEFAULT_TITLE;

    const description =
      cleanText(page?.metaDescription) ||
      cleanText(page?.excerpt) ||
      DEFAULT_DESCRIPTION;

    const canonical = `${baseUrl}/${slug}`;
    const image = page?.ogImage || `${baseUrl}/og-image.jpg`;

    return {
      title,
      description,
      alternates: { canonical },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: "CDRLogo",
        type: "article",
        images: [{ url: image, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch (error) {
    // Page missing / API error — don't index a 404
    return {
      title: "Page Not Found - CDRLogo",
      description:
        "The page you're looking for doesn't exist or hasn't been published yet.",
      robots: { index: false, follow: false },
    };
  }
}

export default function Page() {
  return <Client/>;
}