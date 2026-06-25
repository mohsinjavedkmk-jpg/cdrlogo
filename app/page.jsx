import React from 'react'

import Navbar from './components/Navbar'
import Home from './components/Home'
import LogosPage from './components/LogoHome'
import HomeCatageory from './components/HomeTemplateCategories'
import BrandCategories from './components/HomeBrandsCatageory'
import TrendingLogos from './components/HomeTrendingLogo'
import TopBrands from './components/HomeTopBrand'
import Footer from './components/Footer'
import PantoneColorPicker from './components/Pantone'

export async function generateMetadata() {
  const baseUrl = "https://cdrlogo.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CDRLogo",
    url: "https://cdrlogo.com",
    description: "Logo library for educational and design reference use.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://cdrlogo.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  try {
    const res = await fetch(`${baseUrl}/api/admin/site-setting`, {
      cache: "no-store",
    });

    const data = await res.json();

    const title =
      data?.metaTitle ||
      "Download vector logos in CDR, SVG, AI, EPS and PNG formats for design reference and educational use.";

    const description =
      data?.metaDescription ||
      "Vector logo downloads in CDR, SVG, AI, EPS and PNG formats for graphic designers, students and print professionals.";

    const image = `${baseUrl}/og-image.jpg`;

    return {
      title,
      description,
      alternates: { canonical: baseUrl },
      openGraph: {
        title,
        description,
        url: baseUrl,
        siteName: "CDRLOGO",
        type: "website",
        images: [{ url: image, width: 1200, height: 630, alt: "CDRLOGO - Free Logo Templates" }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
      // ✅ JSON-LD rendered as <script type="application/ld+json"> in <head>
      other: {
        "script:ld+json": JSON.stringify(jsonLd),
      },
    };
  } catch (error) {
    return {
      title: "CDRLOGO",
      description: "Free logo maker and templates",
      alternates: { canonical: "https://cdrlogo.com" },
      openGraph: {
        title: "CDRLOGO",
        description: "Free logo maker and templates",
        url: "https://cdrlogo.com",
        siteName: "CDRLOGO",
        type: "website",
        images: [{ url: "https://cdrlogo.com/og-image.jpg", width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: "CDRLOGO",
        description: "Free logo maker and templates",
        images: ["https://cdrlogo.com/og-image.jpg"],
      },
      // ✅ Also in fallback
      other: {
        "script:ld+json": JSON.stringify(jsonLd),
      },
    };
  }
}

function page() {
  return (
    <>
      <Navbar />
      <Home />
      <PantoneColorPicker />
      <LogosPage />
      <BrandCategories />
      <HomeCatageory />
      <TrendingLogos />
      <TopBrands />
      <Footer />
    </>
  )
}

export default page