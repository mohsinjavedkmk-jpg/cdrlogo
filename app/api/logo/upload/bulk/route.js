import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import sharp from "sharp";
import OpenAI from "openai";
import { uploadToR2 } from "../../../../lib/uploadToR2";
import { prisma } from "../../../../lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── mime helpers ──────────────────────────────────────────────────────────────
const MIME = {
  svg: "image/svg+xml",
  ai: "application/postscript",
  cdr: "application/cdr",
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

function ext(filename) {
  return filename.split(".").pop().toLowerCase();
}

function mime(filename) {
  return MIME[ext(filename)] || "application/octet-stream";
}

// ── XML escape ────────────────────────────────────────────────────────────────
function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── Arial Bold width table ────────────────────────────────────────────────────
const ARIAL_BOLD_W = {
  " ": 0.278, "!": 0.333, '"': 0.474, "#": 0.556, "$": 0.556, "%": 0.889,
  "&": 0.722, "'": 0.278, "(": 0.333, ")": 0.333, "*": 0.389, "+": 0.584,
  ",": 0.278, "-": 0.333, ".": 0.278, "/": 0.278, "0": 0.556, "1": 0.556,
  "2": 0.556, "3": 0.556, "4": 0.556, "5": 0.556, "6": 0.556, "7": 0.556,
  "8": 0.556, "9": 0.556, ":": 0.333, ";": 0.333, "<": 0.584, "=": 0.584,
  ">": 0.584, "?": 0.611, "@": 0.975, "A": 0.722, "B": 0.722, "C": 0.667,
  "D": 0.722, "E": 0.667, "F": 0.611, "G": 0.778, "H": 0.722, "I": 0.278,
  "J": 0.556, "K": 0.722, "L": 0.611, "M": 0.833, "N": 0.722, "O": 0.778,
  "P": 0.667, "Q": 0.778, "R": 0.722, "S": 0.667, "T": 0.611, "U": 0.722,
  "V": 0.667, "W": 0.944, "X": 0.667, "Y": 0.667, "Z": 0.611, "[": 0.333,
  "\\": 0.278, "]": 0.333, "^": 0.584, "_": 0.556, "`": 0.278, "a": 0.556,
  "b": 0.611, "c": 0.556, "d": 0.611, "e": 0.556, "f": 0.333, "g": 0.611,
  "h": 0.611, "i": 0.278, "j": 0.278, "k": 0.556, "l": 0.278, "m": 0.889,
  "n": 0.611, "o": 0.611, "p": 0.611, "q": 0.611, "r": 0.389, "s": 0.556,
  "t": 0.333, "u": 0.611, "v": 0.556, "w": 0.778, "x": 0.556, "y": 0.556,
  "z": 0.500, "{": 0.389, "|": 0.280, "}": 0.389, "~": 0.584,
};
const FALLBACK_W = 0.62;

function measureText(text, fontSize) {
  let w = 0;
  for (const ch of text) w += (ARIAL_BOLD_W[ch] ?? FALLBACK_W) * fontSize;
  return Math.ceil(w);
}

// ── Watermark ─────────────────────────────────────────────────────────────────
async function applyWatermark(buffer, wm) {
  if (!wm?.enabled || !wm?.text?.trim()) return buffer;

  const meta = await sharp(buffer).metadata();
  const W = meta.width;
  const H = meta.height;

  const fontSize = Math.max(1, wm.fontSize ?? Math.floor(W * 0.04));
  const opacity  = Math.min(1, Math.max(0, (wm.opacity ?? 30) / 100));
  const color    = wm.color    || "#ffffff";
  const position = wm.position || "center";

  const textW = measureText(wm.text, fontSize);
  const textH = Math.ceil(fontSize * 1.15);
  const pad   = Math.max(8, Math.floor(Math.min(W, H) * 0.015));

  let tx, ty;
  switch (position) {
    case "top-left":      tx = pad;                         ty = pad;                        break;
    case "top-right":     tx = W - pad - textW;             ty = pad;                        break;
    case "top-center":    tx = Math.round((W - textW) / 2); ty = pad;                        break;
    case "bottom-left":   tx = pad;                         ty = H - pad - textH;            break;
    case "bottom-right":  tx = W - pad - textW;             ty = H - pad - textH;            break;
    case "bottom-center": tx = Math.round((W - textW) / 2); ty = H - pad - textH;            break;
    case "center":
    default:              tx = Math.round((W - textW) / 2); ty = Math.round((H - textH) / 2); break;
  }

  tx = Math.max(0, Math.min(tx, W - textW));
  ty = Math.max(0, Math.min(ty, H - textH));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <text x="${tx}" y="${ty}" text-anchor="start" dominant-baseline="hanging"
    font-size="${fontSize}" font-weight="bold" font-family="Arial, sans-serif"
    fill="${color}" opacity="${opacity.toFixed(4)}" letter-spacing="0"
  >${escapeXml(wm.text)}</text>
</svg>`;

  return sharp(buffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toBuffer();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (!bytes || bytes === 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function logoNameFromFolderName(folderName) {
  return folderName
    .replace(/^\d+\s+/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function generateSlugFromName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\bversion\s*\d+\b/g, "")
    .replace(/\bv\.?\s*\d+\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function getSignificantWords(name) {
  const stop = new Set(["logo", "version", "the", "and", "of", "new", "old"]);
  return name
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !stop.has(w) && !/^v\.?\d+$/.test(w) && !/^\d+$/.test(w));
}

function extractCategoryNames(categoriesJson) {
  if (!categoriesJson) return [];
  let list = categoriesJson;
  if (typeof list === "string") {
    try { list = JSON.parse(list); } catch { return []; }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((c) => {
      if (typeof c === "string") return c;
      if (c && typeof c === "object") return c.name || c.title || c.label || c.slug || null;
      return null;
    })
    .filter(Boolean);
}

// ── DB: find related / exact matches ──────────────────────────────────────────
async function findRelatedLogos(logoName) {
  const words = getSignificantWords(logoName);
  if (!words.length) return { related: [], exactNormalizedMatches: [] };

  const candidates = await prisma.logo.findMany({
    where: {
      OR: words.map((w) => ({ logoName: { contains: w, mode: "insensitive" } })),
    },
    select: {
      logoName: true,
      metaTitle: true,
      metaDescription: true,
      description: true,
      tags: true,
      category: true,
      brand: true,
      website: true,
      country: true,
      industry: true,
      slug: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const targetNorm = normalizeName(logoName);
  const exactNormalizedMatches = candidates.filter(
    (c) => normalizeName(c.logoName) === targetNorm
  );

  return { related: candidates.slice(0, 5), exactNormalizedMatches };
}

// ── Auto-version name ─────────────────────────────────────────────────────────
function generateVersionedName(logoName, exactNormalizedMatches) {
  const usedVersions = new Set();

  for (const match of exactNormalizedMatches) {
    const m = match.logoName.match(/\bv(?:ersion)?\.?\s*(\d+)\b/i);
    if (m) usedVersions.add(parseInt(m[1], 10));
    else   usedVersions.add(1);
  }

  let next = 1;
  while (usedVersions.has(next)) next++;
  if (next === 1 && usedVersions.has(1)) next = 2;

  const cleanBase = logoName
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\bversion\s*\d+\b/gi, "")
    .replace(/\bv\.?\s*\d+\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return `${cleanBase} V${next}`;
}

// ── OpenAI with 1 retry ───────────────────────────────────────────────────────
async function callOpenAIWithRetry(params, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await openai.chat.completions.create(params);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[OpenAI] Attempt ${attempt + 1} failed, retrying in 1s...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// ── AI content generation ─────────────────────────────────────────────────────
// Now also generates: ogTitle, ogDescription, twitterTitle, twitterDescription
// to match single-upload parity. altText added too.
async function generateAIContent({
  logoName,
  userCategory,
  availableCategories,
  relatedLogos,
  canonicalUrl,
}) {
  const isVariant = relatedLogos.length > 0;

  const relatedContext = isVariant
    ? relatedLogos
        .slice(0, 5)
        .map(
          (r, i) =>
            `Previous version ${i + 1}:\n- Name: ${r.logoName}\n- Category: ${r.category || "N/A"}\n- Brand: ${r.brand || "N/A"}\n- Website: ${r.website || "N/A"}\n- Country: ${r.country || "N/A"}\n- Industry: ${r.industry || "N/A"}\n- Meta Title: ${r.metaTitle || "N/A"}\n- Meta Description: ${r.metaDescription || "N/A"}\n- Description: ${r.description || "N/A"}\n- Tags: ${Array.isArray(r.tags) ? r.tags.join(", ") : "N/A"}`
        )
        .join("\n\n")
    : "";

  const usedOpeners = isVariant
    ? relatedLogos
        .map((r) => (r.description || "").split(/[.!?]/)[0].trim())
        .filter(Boolean)
    : [];

  const hasCategoryList = availableCategories.length > 0;

  // ── System prompt ─────────────────────────────────────────────────────────
  const systemPrompt = `You are a senior SEO specialist for a professional logo download website (cdrlogo.com). Your job is to write SEO content that ranks for queries like "Nike logo PNG download", "Apple logo SVG vector free", "brand logo transparent background", AND to classify each logo's category, brand, country, and industry.

BRAND/WEBSITE/INDUSTRY/COUNTRY RULES (non-negotiable):
1. You MUST always identify the real-world brand from the logo name — never invent a placeholder brand and never leave it blank.
2. You MUST always identify the brand's real industry/sector with specificity (e.g. "Sportswear & Athletic Apparel", not "Retail").
3. You MUST always identify the brand's real home country (e.g. "United States", "Germany").
4. Website is confidence-gated ONLY: fill it if you are genuinely sure of the exact official domain; otherwise return "" — getting a wrong domain is worse than no domain.
5. If, after genuine effort, no real brand can be identified at all, use: brand="cdrlogo.com", industry="Logo Design & Graphics", country="Worldwide", website="".
6. Never leave brand, industry, or country empty. Never use vague placeholders.

You always return valid JSON only — no markdown, no code fences, no commentary.`;

  // ── User prompt ───────────────────────────────────────────────────────────
  const userPrompt = `Generate complete SEO content and metadata for this logo entry on cdrlogo.com.

== LOGO DETAILS ==
Logo Name     : ${logoName}
Canonical URL : ${canonicalUrl}
Uploader category hint (may be wrong or missing): ${userCategory || "(none provided)"}
${hasCategoryList
    ? `\nAvailable site categories (pick EXACTLY ONE, copy the string verbatim — do not invent or modify):\n${availableCategories.map((c) => `- ${c}`).join("\n")}`
    : `\nNo category list configured. Use the uploader hint or your best short classification.`
  }
${isVariant
    ? `\nThis is a variant/new version of an existing logo. Previous version(s):\n\n${relatedContext}\n\nPreviously used description openers (DO NOT reuse): ${usedOpeners.length ? usedOpeners.map((o) => `"${o}"`).join(", ") : "none"}`
    : "\nThis is a new logo with no prior versions."
  }

== FIELD RULES ==

category      : Best-fitting category from the list above (exact string). Prefer uploader hint if it matches.
brand         : Real-world brand this logo belongs to. Decide yourself — never blank. Fallback: "cdrlogo.com".
website       : Official domain only if you are highly confident (e.g. "nike.com"). Otherwise return "".
country       : Brand's home country (e.g. "United States"). Decide from your knowledge. Fallback: "Worldwide".
industry      : Specific sector (e.g. "Sportswear & Athletic Apparel"). Fallback: "Logo Design & Graphics".

meta_title (50-60 chars HARD LIMIT — NEVER exceed 60):
  • Format: "{Brand} Logo PNG SVG Vector Free Download | cdrlogo.com"
  • Brand name + at least TWO of: PNG, SVG, Vector, Download, Free
  • End with "| cdrlogo.com"
  • NEVER empty

meta_title (50-60 chars HARD LIMIT — NEVER exceed 60):
  • Format: "{Brand} Logo PNG SVG Vector Free Download | cdrlogo.com"
  • Include brand name + at least TWO of: PNG, SVG, Vector, Download, Free
  • End with "| cdrlogo.com"
  • NEVER empty

meta_description (140-155 chars HARD LIMIT):
  • Download CTA, NOT a blog intro
  • Contain: brand/logo name + at least 3 of: free download, PNG, SVG, vector, transparent, high quality, AI, EPS
  • Structure: "Download [Brand] logo in [formats]. [one benefit sentence]. Available at cdrlogo.com."
  • NEVER use: "In this article", "We explore", "This post", "Learn about"
  • NEVER empty

main_description (120-155 words):
  • Informative blog-style paragraph about the brand/logo
  • Opening sentence MUST mention downloading + at least one format (PNG/SVG/vector)
  • Cover: what logo is, what brand represents, industry/sector, brief brand context, download formats (PNG, SVG, AI, EPS, CDR), use cases
  • Include naturally: "free download", "vector format", "transparent background", "high resolution"
  • Do NOT describe colors/shapes/visual design — only brand context + download utility
  • NEVER empty

main_description (120-155 words):
  • Informative blog-style paragraph — natural editorial tone
  • Opening sentence MUST mention downloading + at least one format (PNG/SVG/vector)
  • Cover: brand identity, industry/sector, brief brand context, formats (PNG, SVG, AI, EPS, CDR), use cases
  • Include naturally: "free download", "vector format", "transparent background", "high resolution"
  • Do NOT describe colors/shapes/visual design
  • NEVER empty

alt_text (10-15 words):
  • Format: "{Brand} logo in PNG SVG vector format — free download on cdrlogo.com"
  • NEVER empty

history (40-60 words):
  • Short brand founding/milestone paragraph tying the logo to their timeline
  • If brand unknown: "Download the ${logoName} logo from cdrlogo.com. Available in PNG, SVG, AI, EPS and CDR vector formats for commercial and personal use."
  • NEVER empty

tags (12-15 items, array of strings):
  • Include: brand/logo name, "PNG", "SVG", "vector", "free download", "transparent", industry term, "logo download", "cdrlogo.com"
  • Add: "AI file", "EPS", "CDR" where relevant
  • NEVER empty array

og_title (50-60 chars):
  • Open Graph title for social sharing (Facebook, LinkedIn, WhatsApp)
  • Format: "{Brand} Logo — Free PNG & SVG Vector Download"
  • Social/click-friendly — omit "| cdrlogo.com" suffix
  • Brand name + download intent required
  • NEVER empty

og_description (120-160 chars):
  • OG description for social previews — conversational, written for humans scrolling feeds
  • Brand + download CTA + at least 2 formats (PNG, SVG, vector, AI, CDR)
  • NEVER empty

twitter_title (50-60 chars):
  • Twitter/X card title — can mirror og_title, optimised for narrower card display
  • Brand name + at least one format keyword
  • NEVER empty

twitter_description (100-140 chars):
  • Twitter/X card description — punchy, action-oriented
  • Brand + "download" + at least one format
  • NEVER empty
${isVariant ? `
== VARIANT UNIQUENESS RULES ==
1. Open main_description from a different angle than previous versions — still mention download + format in sentence 1.
2. Do not mirror sentence structure of prior versions.
3. Do not reuse phrases from prior meta_title, meta_description, og_title, og_description, twitter_title, twitter_description.
4. Tags: keep core brand/format terms, add 3-4 new version-specific tags.` : ""}

Avoid these words/phrases in any field: high quality, premium, stunning, modern branding, cutting-edge, innovative, industry leader, trusted worldwide, iconic brand.

Respond ONLY with valid JSON — no markdown, no code fences:
{
  "category": "...",
  "brand": "...",
  "website": "...",
  "country": "...",
  "industry": "...",
  "meta_title": "...",
  "meta_description": "...",
  "main_description": "...",
  "alt_text": "...",
  "history": "...",
  "tags": ["...", "..."],
  "og_title": "...",
  "og_description": "...",
  "twitter_title": "...",
  "twitter_description": "..."
}`;

  const completion = await callOpenAIWithRetry({
   model: "gpt-4.1-mini",
    temperature: 0.6,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt   },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsed;
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }

  // ── Resolve category ──────────────────────────────────────────────────────
  let resolvedCategory = String(parsed.category || "").trim();
  if (hasCategoryList) {
    const match = availableCategories.find(
      (c) => c.toLowerCase() === resolvedCategory.toLowerCase()
    );
    resolvedCategory = match
      || availableCategories.find(
           (c) => c.toLowerCase() === String(userCategory || "").toLowerCase()
         )
      || userCategory
      || availableCategories[0];
  } else if (!resolvedCategory) {
    resolvedCategory = userCategory || "";
  }

  // ── Resolve brand / country / industry (forced — never empty) ────────────
  const brand    = (parsed.brand    && String(parsed.brand).trim())    || "cdrlogo.com";
  const country  = (parsed.country  && String(parsed.country).trim())  || "Worldwide";
  const industry = (parsed.industry && String(parsed.industry).trim()) || "Logo Design & Graphics";

  // website stays confidence-gated — empty string is intentional
  const website  = (parsed.website  && String(parsed.website).trim())  || "";

  // ── OG / Twitter fallbacks ────────────────────────────────────────────────
  const metaTitle       = parsed.meta_title       || `${logoName} Logo PNG SVG Vector Free Download | cdrlogo.com`;
  const metaDescription = parsed.meta_description || `Download ${logoName} logo in PNG, SVG and vector formats for free. Transparent background, high resolution. Available at cdrlogo.com.`;
  const description     = parsed.main_description || `Download the ${logoName} logo from cdrlogo.com in PNG, SVG, AI, EPS and CDR vector formats. Suitable for websites, presentations, print and apps. High resolution, transparent background available for free.`;
  const altText         = parsed.alt_text         || `${logoName} logo in PNG SVG vector format — free download on cdrlogo.com`;
  const history         = parsed.history          || `Download the ${logoName} logo from cdrlogo.com. Available in PNG, SVG, AI, EPS and CDR vector formats for commercial and personal use.`;
  const tags            = Array.isArray(parsed.tags) && parsed.tags.length
    ? parsed.tags
    : [logoName, "logo", "PNG", "SVG", "vector", "free download", "transparent", "cdrlogo.com"];

  const ogTitle            = (parsed.og_title            && String(parsed.og_title).trim())            || `${logoName} Logo — Free PNG & SVG Vector Download`;
  const ogDescription      = (parsed.og_description      && String(parsed.og_description).trim())      || `Download the ${logoName} logo in PNG, SVG and vector formats for free. Transparent background available at cdrlogo.com.`;
  const twitterTitle       = (parsed.twitter_title       && String(parsed.twitter_title).trim())       || `${logoName} Logo PNG SVG Vector — Free Download`;
  const twitterDescription = (parsed.twitter_description && String(parsed.twitter_description).trim()) || `Download the ${logoName} logo for free — PNG, SVG, AI, CDR vector formats. Transparent & high resolution.`;

  return {
    category:  resolvedCategory,
    brand,
    website,
    country,
    industry,
    metaTitle,
    metaDescription,
    description,
    altText,
    history,
    tags,
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
    isVariant,
    relatedSlugs: relatedLogos.map((r) => r.slug).filter(Boolean),
  };
}

// ── Process one logo folder ───────────────────────────────────────────────────
async function processOneLogoFolder({
  folderName,
  folderFiles,
  sharedFields,
  watermark,
}) {
  const rawLogoName = logoNameFromFolderName(folderName);
  console.log(`\n  ── Processing folder: "${folderName}" → "${rawLogoName}"`);

  try {
    // ── Step A: resolve final name & slug (auto-versioning) ───────────────────
    const { related, exactNormalizedMatches } = await findRelatedLogos(rawLogoName);

    let finalLogoName = rawLogoName;
    let versioned     = false;

    if (exactNormalizedMatches.length > 0) {
      finalLogoName = generateVersionedName(rawLogoName, exactNormalizedMatches);
      versioned     = true;
      console.log(`  [name] Auto-versioned: "${rawLogoName}" → "${finalLogoName}"`);
    }

    const finalSlug = generateSlugFromName(finalLogoName);
    console.log(`  [slug] ${finalSlug}`);

    // canonicalUrl always points to cdrlogo.com — matches single-upload behavior
    const canonicalUrl = `https://cdrlogo.com/logos/${finalSlug}/`;

    // ── Step B: AI content generation ─────────────────────────────────────────
    // canonicalUrl is now passed in so OG/Twitter prompts can reference it.
    const aiContent = await generateAIContent({
      logoName:            finalLogoName,
      userCategory:        sharedFields.category,
      availableCategories: sharedFields.availableCategories,
      relatedLogos:        related,
      canonicalUrl,
    });

    console.log(`  [ai] category: "${aiContent.category}" | brand: "${aiContent.brand}" | website: "${aiContent.website || "(none)"}" | country: "${aiContent.country}" | industry: "${aiContent.industry}"`);
    console.log(`  [ai] og_title: "${aiContent.ogTitle}" | twitter_title: "${aiContent.twitterTitle}"`);
    console.log(`  [ai] metaTitle: "${aiContent.metaTitle}" | tags: ${aiContent.tags.length}`);

    // ── Step C: classify & process files ──────────────────────────────────────
    const publicFiles  = [];
    const privateFiles = [];
    let svgContent     = null;
    const fileSizes    = { svg: 0, png: 0, ai: 0, cdr: 0 };

    for (const { filename, buffer: fileBuffer } of folderFiles) {
      const fileExt = ext(filename);

      if (fileExt === "html" || fileExt === "htm") {
        console.log(`  [skip] Ignoring HTML file: ${filename}`);
        continue;
      }

      const fileSize = (fileBuffer.length / 1024).toFixed(2);
      console.log(`  [file] ${filename} (${fileSize} KB)`);

      if (fileExt === "svg") {
        privateFiles.push({ key: `separate/${finalSlug}/${filename}`, buffer: fileBuffer, contentType: mime(filename) });
        fileSizes.svg = fileBuffer.length;
        if (!svgContent) svgContent = fileBuffer.toString("utf-8");

      } else if (fileExt === "png") {
        privateFiles.push({ key: `separate/${finalSlug}/${filename}`, buffer: fileBuffer, contentType: mime(filename) });
        fileSizes.png = fileBuffer.length;

        // Watermark on public WebP preview only — private PNG stays clean
        const watermarked = await applyWatermark(fileBuffer, watermark);
        const webpBuffer  = await sharp(watermarked).webp({ quality: 90 }).toBuffer();
        const webpName    = filename.replace(/\.png$/i, ".webp");
        publicFiles.push({ key: `public/${finalSlug}/${webpName}`, buffer: webpBuffer, contentType: "image/webp" });

      } else if (fileExt === "ai") {
        privateFiles.push({ key: `separate/${finalSlug}/${filename}`, buffer: fileBuffer, contentType: mime(filename) });
        fileSizes.ai = fileBuffer.length;

      } else if (fileExt === "cdr") {
        privateFiles.push({ key: `separate/${finalSlug}/${filename}`, buffer: fileBuffer, contentType: mime(filename) });
        fileSizes.cdr = fileBuffer.length;

      } else {
        privateFiles.push({ key: `private/${finalSlug}/${filename}`, buffer: fileBuffer, contentType: mime(filename) });
      }
    }

    // ── Step D: upload to R2 ──────────────────────────────────────────────────
    const allUploads = [...publicFiles, ...privateFiles];
    const uploadResults = await Promise.all(
      allUploads.map(async ({ key, buffer, contentType }) => {
        try {
          return await uploadToR2({ fileBuffer: buffer, fileName: key, mimeType: contentType });
        } catch (err) {
          console.error(`  [r2] ❌ Failed: ${key} — ${err.message}`);
          return null;
        }
      })
    );

    const urlMap = {};
    allUploads.forEach(({ key }, i) => { urlMap[key] = uploadResults[i]; });

    const findUrl = (pred) => {
      const match = allUploads.find(pred);
      return match ? urlMap[match.key] : null;
    };

    const svgUrl  = findUrl((f) => f.key.endsWith(".svg"));
    const pngUrl  = findUrl((f) => f.key.endsWith(".png"));
    const webpUrl = findUrl((f) => f.key.endsWith(".webp"));
    const aiUrl   = findUrl((f) => f.key.endsWith(".ai"));
    const cdrUrl  = findUrl((f) => f.key.endsWith(".cdr"));

    // ogImageUrl — public WebP is the OG/Twitter card image (same as single-upload)
    // null if no PNG was in the folder (edge case)
    const ogImageUrl = webpUrl || null;

    console.log(`  [urls] webp: ${webpUrl || "null"} | ogImageUrl: ${ogImageUrl || "null"}`);

    // ── Step E: save to DB ────────────────────────────────────────────────────
    const logo = await prisma.logo.create({
      data: {
        logoName:     finalLogoName,
        slug:         finalSlug,
        brand:        aiContent.brand,
        website:      aiContent.website,
        category:     aiContent.category,
        industry:     aiContent.industry,
        country:      aiContent.country,
        license:      sharedFields.license,
        description:  aiContent.description,
        history:      aiContent.history,
        tags:         aiContent.tags,
        brandColors:  sharedFields.brandColors,
        publishStatus:sharedFields.publishStatus,
        downloadCount:sharedFields.downloadCount,
        svgUrl,
        pngUrl,
        webpUrl,
        aiUrl,
        cdrUrl,
        svgContent,
        metaTitle:    aiContent.metaTitle,
        metaDescription: aiContent.metaDescription,
        altText:      aiContent.altText,
        svgfilesize:  formatSize(fileSizes.svg),
        pngfilesize:  formatSize(fileSizes.png),
        aifilesize:   formatSize(fileSizes.ai),
        cdrfilesize:  formatSize(fileSizes.cdr),

        // ── SEO / social fields — full parity with single-upload ───────────
        canonicalUrl,
        ogTitle:           aiContent.ogTitle,
        ogDescription:     aiContent.ogDescription,
        ogImageUrl,                         // public WebP CDN URL
        ogType:            "website",
        twitterTitle:      aiContent.twitterTitle,
        twitterDescription:aiContent.twitterDescription,
        twitterImage:      ogImageUrl,      // same image reused for Twitter card
        twitterCardType:   "summary_large_image",
      },
    });

    console.log(`  [db] ✓ Saved ID: ${logo.id}`);

    return {
      success:      true,
      logoName:     finalLogoName,
      slug:         finalSlug,
      versioned,
      originalName: rawLogoName,
      category:     aiContent.category,
      brand:        aiContent.brand,
      website:      aiContent.website,
      country:      aiContent.country,
      industry:     aiContent.industry,
      canonicalUrl,
      ogImageUrl,
      id:           logo.id,
    };

  } catch (err) {
    console.error(`  [error] ❌ "${rawLogoName}": ${err.message}`);
    return {
      success:  false,
      logoName: rawLogoName,
      slug:     generateSlugFromName(rawLogoName),
      error:    err.message,
    };
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req) {
  console.log("\n========== BULK-UPLOAD START ==========");
  const startTime = Date.now();

  try {
    const formData = await req.formData();

    const category     = formData.get("category")     || "";
    const license      = formData.get("license")      || "";
    const publishStatus= formData.get("publishStatus")|| "Draft";
    const downloadCount= formData.get("downloadCount")|| "unlimited";

    let brandColors = [];
    try { brandColors = JSON.parse(formData.get("brandColors") || "[]"); } catch { }

    // ── Wrapper ZIP ───────────────────────────────────────────────────────────
    const wrapperFile = formData.get("file");
    if (!wrapperFile) {
      return NextResponse.json({ error: "No ZIP file uploaded." }, { status: 400 });
    }

    console.log(`[1] Wrapper ZIP received: ${wrapperFile.name}`);

    const wrapperBuffer = Buffer.from(await wrapperFile.arrayBuffer());
    const wrapperZip    = new AdmZip(wrapperBuffer);
    const allEntries    = wrapperZip.getEntries();

    // ── Group files by top-level folder ───────────────────────────────────────
    const folderMap = new Map();

    for (const entry of allEntries) {
      if (entry.isDirectory) continue;

      const parts = entry.entryName.split("/").filter(Boolean);
      if (parts.length < 2) {
        console.log(`[skip] Root-level file ignored: ${entry.entryName}`);
        continue;
      }

      const topFolder = parts[0];
      if (topFolder.startsWith("__MACOSX") || topFolder.startsWith(".")) continue;

      const filename = parts[parts.length - 1];
      if (filename.startsWith(".")) continue;

      if (!folderMap.has(topFolder)) folderMap.set(topFolder, []);
      folderMap.get(topFolder).push({ filename, buffer: entry.getData() });
    }

    if (folderMap.size === 0) {
      return NextResponse.json(
        { error: "No logo folders found inside the ZIP. Each logo must be in its own sub-folder." },
        { status: 400 }
      );
    }

    console.log(`[2] Found ${folderMap.size} logo folder(s):`);
    for (const [name] of folderMap) console.log(`     - ${name}`);

    // ── Fetch Website settings: watermark + category list from DB ────────────
    const websiteRecord      = await prisma.website.findFirst();
    const watermark          = websiteRecord?.watermark ?? null;
    const availableCategories= extractCategoryNames(websiteRecord?.categories);

    console.log(`[3] Watermark: ${watermark?.enabled ? "ENABLED" : "DISABLED"}`);
    console.log(`[3] Site categories (from DB): ${availableCategories.length ? availableCategories.join(", ") : "(none configured)"}`);

    const sharedFields = {
      category,
      license,
      publishStatus,
      downloadCount,
      brandColors,
      availableCategories,
    };

    // ── Process each folder sequentially ─────────────────────────────────────
    const results = [];
    let successCount = 0;
    let failCount    = 0;
    let idx          = 0;

    for (const [folderName, folderFiles] of folderMap) {
      idx++;
      console.log(`\n[${idx}/${folderMap.size}] Folder: "${folderName}" (${folderFiles.length} file(s))`);

      const result = await processOneLogoFolder({
        folderName,
        folderFiles,
        sharedFields,
        watermark,
      });

      results.push(result);
      if (result.success) successCount++;
      else                failCount++;

      // ── Audit log ──────────────────────────────────────────────────────────
      await prisma.log.create({
        data: {
          who: "api:bulk-upload-logo",
          content: result.success
            ? `Bulk upload ✓ "${result.logoName}" (slug: ${result.slug}, category: ${result.category}, brand: ${result.brand || "—"}, website: ${result.website || "—"}, country: ${result.country || "—"}, industry: ${result.industry || "—"}, ogImageUrl: ${result.ogImageUrl || "—"})${result.versioned ? ` [auto-versioned from "${result.originalName}"]` : ""}`
            : `Bulk upload ❌ "${result.logoName}": ${result.error}`,
        },
      });
    }

    const duration = Date.now() - startTime;
    console.log(`\n========== BULK-UPLOAD DONE ==========`);
    console.log(`Total: ${folderMap.size} | Success: ${successCount} | Failed: ${failCount}`);
    console.log(`Time: ${duration}ms`);
    console.log(`======================================\n`);

    return NextResponse.json({
      message: `Bulk upload complete. ${successCount} succeeded, ${failCount} failed.`,
      total:   folderMap.size,
      successCount,
      failCount,
      results,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n========== BULK-UPLOAD ERROR ==========`);
    console.error(`Time elapsed : ${duration}ms`);
    console.error(`Error        : ${error.message}`);
    console.error(`Stack        : ${error.stack}`);
    console.error(`=======================================\n`);

    await prisma.log.create({
      data: {
        who: "api:bulk-upload-logo",
        content: `Bulk upload fatal error: ${error?.message}`,
      },
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}