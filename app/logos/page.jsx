import Link from "next/link";
import { prisma } from "../lib/prisma";
import "./logos.css";


const SITE_URL = "https://www.cdrlogo.com";

export async function generateMetadata() {
  const title = "Complete Logo Index — All Logos | CDRLogo";
  const description =
    "Full index of every logo available on CDRLogo.";

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/logos` },
    robots: { index: true, follow: true },
  };
}

// Fetch every published logo — no pagination, no grouping. This page
// exists purely so search engine crawlers can discover every single
// /logo/{slug} URL from one flat, simple list.
async function getAllLogos() {
  const logos = await prisma.logo.findMany({
    where: { publishStatus: "Published" },
    orderBy: { logoName: "asc" },
    select: { slug: true, logoName: true, brand: true },
  });
  return logos;
}

export default async function LogosPage() {
  const logos = await getAllLogos();

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "All Logos",
    description: "Complete index of every logo on CDRLogo.",
    numberOfItems: logos.length,
    itemListElement: logos.map((logo, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/logo/${logo.slug}`,
      name: logo.logoName,
    })),
  };

  return (
    <main className="logos-index-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <h1>All Logos</h1>
      <p className="count">{logos.length.toLocaleString()} logos total</p>

      <ul className="index-list">
        {logos.map((logo) => (
          <li key={logo.slug}>
            <Link href={`/logo/${logo.slug}`} prefetch={false}>
              {logo.logoName}
              {logo.brand ? ` — ${logo.brand}` : ""}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}