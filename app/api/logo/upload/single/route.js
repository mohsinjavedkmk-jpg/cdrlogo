import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import sharp from "sharp";
import OpenAI from "openai";
import { uploadToR2 } from "../../../../lib/uploadToR2";
import { prisma } from "../../../../lib/prisma";

let openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── mime helpers ──────────────────────────────────────────────────────────────
let MIME = {
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

// ── Per-char advance-width table for Arial Bold (em units at 1000 UPM) ───────
let ARIAL_BOLD_W = {
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
let FALLBACK_W = 0.62;

function measureText(text, fontSize) {
  let w = 0;
  for (let ch of text) w += (ARIAL_BOLD_W[ch] ?? FALLBACK_W) * fontSize;
  return Math.ceil(w);
}

// ── Pixel-perfect watermark ───────────────────────────────────────────────────
async function applyWatermark(buffer, wm) {
  if (!wm?.enabled || !wm?.text?.trim()) return buffer;

  let meta = await sharp(buffer).metadata();
  let W = meta.width;
  let H = meta.height;

  let fontSize = Math.max(1, wm.fontSize ?? Math.floor(W * 0.04));
  let opacity = Math.min(1, Math.max(0, (wm.opacity ?? 30) / 100));
  let color = wm.color || "#ffffff";
  let position = wm.position || "center";

  let textW = measureText(wm.text, fontSize);
  let textH = Math.ceil(fontSize * 1.15);

  let pad = Math.max(8, Math.floor(Math.min(W, H) * 0.015));

  let tx, ty;
  switch (position) {
    case "top-left":      tx = pad;                        ty = pad;                      break;
    case "top-right":     tx = W - pad - textW;            ty = pad;                      break;
    case "top-center":    tx = Math.round((W - textW) / 2); ty = pad;                     break;
    case "bottom-left":   tx = pad;                        ty = H - pad - textH;          break;
    case "bottom-right":  tx = W - pad - textW;            ty = H - pad - textH;          break;
    case "bottom-center": tx = Math.round((W - textW) / 2); ty = H - pad - textH;         break;
    case "center":
    default:              tx = Math.round((W - textW) / 2); ty = Math.round((H - textH) / 2); break;
  }

  tx = Math.max(0, Math.min(tx, W - textW));
  ty = Math.max(0, Math.min(ty, H - textH));

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <text
    x="${tx}"
    y="${ty}"
    text-anchor="start"
    dominant-baseline="hanging"
    font-size="${fontSize}"
    font-weight="bold"
    font-family="Arial, sans-serif"
    fill="${color}"
    opacity="${opacity.toFixed(4)}"
    letter-spacing="0"
  >${escapeXml(wm.text)}</text>
</svg>`;

  return sharp(buffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toBuffer();
}

// ── file size formatter ────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (!bytes || bytes === 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Generate slug from logo name ─────────────────────────────────────────────
function generateSlugFromName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Normalize a logo name for fuzzy comparison ────────────────────────────────
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\bversion\s*\d+\b/g, "")
    .replace(/\bv\.?\s*\d+\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// ── Extract significant words for DB pre-filtering ───────────────────────────
function getSignificantWords(name) {
  let stop = new Set(["logo", "version", "the", "and", "of", "new", "old"]);
  return name
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, "")
    .split(/[^a-z0-9]+/)
    .filter(w => w && !stop.has(w) && !/^v\.?\d+$/.test(w) && !/^\d+$/.test(w));
}

// ── Find related logos by fuzzy/normalized name match ────────────────────────
async function findRelatedLogos(logoName) {
  let words = getSignificantWords(logoName);
  if (!words.length) return { related: [], exactNormalizedMatches: [] };

  let candidates = await prisma.logo.findMany({
    where: {
      OR: words.map(w => ({ logoName: { contains: w, mode: "insensitive" } })),
    },
    select: {
      logoName: true,
      metaTitle: true,
      metaDescription: true,
      description: true,
      tags: true,
      category: true,
      brand: true,
      slug: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  let targetNorm = normalizeName(logoName);
  let exactNormalizedMatches = candidates.filter(
    c => normalizeName(c.logoName) === targetNorm
  );
  let related = candidates.slice(0, 5);

  return { related, exactNormalizedMatches };
}

// ── Generate next version name ────────────────────────────────────────────────
function generateVersionedName(logoName, exactNormalizedMatches) {
  let usedVersions = new Set();

  for (let match of exactNormalizedMatches) {
    let m = match.logoName.match(/\bv(?:ersion)?\.?\s*(\d+)\b/i);
    if (m) {
      usedVersions.add(parseInt(m[1], 10));
    } else {
      usedVersions.add(1);
    }
  }

  let next = 1;
  while (usedVersions.has(next)) next++;
  if (next === 1 && usedVersions.has(1)) next = 2;

  let cleanBase = logoName
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\bversion\s*\d+\b/gi, "")
    .replace(/\bv\.?\s*\d+\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return `${cleanBase} V${next}`;
}

// ── OpenAI call with 1 retry ──────────────────────────────────────────────────
async function callOpenAIWithRetry(params, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await openai.chat.completions.create(params);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[OpenAI] Attempt ${attempt + 1} failed, retrying...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// ── OpenAI: generate SEO content + tags + full OG/Twitter fields ─────────────
async function generateAIContent({
  logoName, brand, website, category, industry, country, relatedLogos, canonicalUrl,
}) {
  let isVariant = relatedLogos.length > 0;

  let relatedContext = isVariant
    ? relatedLogos
        .slice(0, 5)
        .map(
          (r, i) =>
            `Previous version ${i + 1}:\n- Name: ${r.logoName}\n- Meta Title: ${r.metaTitle || "N/A"}\n- Meta Description: ${r.metaDescription || "N/A"}\n- Description: ${r.description || "N/A"}\n- Tags: ${Array.isArray(r.tags) ? r.tags.join(", ") : "N/A"}`
        )
        .join("\n\n")
    : "";

  let usedOpeners = isVariant
    ? relatedLogos
        .map(r => (r.description || "").split(/[.!?]/)[0].trim())
        .filter(Boolean)
    : [];

  // Brand, website, industry: LLM always decides from logo name.
  // Form-submitted values are hints only — passed as context, not forced.
  let providedBrand    = (brand    && brand.trim())    ? brand.trim()    : "";
  let providedWebsite  = (website  && website.trim())  ? website.trim()  : "";
  let providedIndustry = (industry && industry.trim()) ? industry.trim() : "";
  let resolvedCountry  = (country  && country.trim())  ? country.trim()  : "";

  // ── System prompt ─────────────────────────────────────────────────────────
  let systemPrompt = `You are a senior SEO specialist for a professional logo download website (cdrlogo.com). Your job is to write SEO content that ranks for queries like "Nike logo PNG download", "Apple logo SVG vector free", "brand logo transparent background".

BRAND/WEBSITE/INDUSTRY RULES (non-negotiable):
1. You MUST always identify the real-world brand from the logo name — never invent a placeholder.
2. You MUST always determine the brand's real official website URL from your own knowledge (e.g. https://www.nike.com).
3. You MUST always identify the brand's real industry/sector with specificity (e.g. "Sportswear & Athletic Apparel", not "Retail").
4. If, after genuine effort, you truly cannot identify ANY real brand, use: brand="cdrlogo.com", website="https://cdrlogo.com", industry="Logo Design & Graphics".
5. Never leave brand, website, or industry empty. Never use vague placeholders.

You always return valid JSON only — no markdown, no code fences, no commentary.`;

  // ── User prompt ───────────────────────────────────────────────────────────
  let userPrompt = `Generate complete SEO content for this logo page on cdrlogo.com.

== LOGO DETAILS ==
Logo Name : ${logoName}
${providedBrand    ? `Brand     : ${providedBrand} (use if correct, but verify from your own knowledge)`    : `Brand     : UNKNOWN — infer the real brand from the logo name. Only fall back to "cdrlogo.com" if truly unidentifiable.`}
${providedWebsite  ? `Website   : ${providedWebsite} (use if correct, verify from your own knowledge)`      : `Website   : UNKNOWN — determine the brand's real official URL from your knowledge.`}
Category  : ${category || "Logo"}
${providedIndustry ? `Industry  : ${providedIndustry} (use if correct, be specific)`                        : `Industry  : UNKNOWN — determine from what the brand actually does. Be specific.`}
${resolvedCountry  ? `Country   : ${resolvedCountry}` : ""}
Canonical URL : ${canonicalUrl}

== FIELD RULES ==

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

alt_text (10-15 words):
  • Format: "{Brand} logo in PNG SVG vector format — free download on cdrlogo.com"
  • NEVER empty

history (40-60 words):
  • Short brand founding/milestone paragraph tying the logo to their timeline
  • If brand unknown: "Download the ${logoName} logo from cdrlogo.com. Available in PNG, SVG, AI, EPS and CDR vector formats for commercial and personal use."
  • NEVER empty

tags (12-15 items, array of strings):
  • Must include: brand/logo name, "PNG", "SVG", "vector", "free download", "transparent", industry term, "logo download", "cdrlogo.com"
  • Add: "AI file", "EPS", "CDR" where relevant
  • NEVER empty array

og_title (50-60 chars):
  • Open Graph title for social sharing
  • Format: "{Brand} Logo — Free PNG & SVG Vector Download"
  • Slightly more social/click-friendly than meta_title — drop "| cdrlogo.com" suffix
  • Must still include brand name + download intent
  • NEVER empty

og_description (120-160 chars):
  • Open Graph description for social previews (Facebook, LinkedIn, WhatsApp)
  • Enticing one-liner: what the logo is + download CTA + key formats
  • More conversational than meta_description — written for humans scrolling social feeds
  • Must mention at least 2 formats (PNG, SVG, vector, AI, CDR)
  • NEVER empty

twitter_title (50-60 chars):
  • Twitter/X card title
  • Can mirror og_title but optimised for Twitter's narrower card display
  • Must include brand name + at least one format keyword
  • NEVER empty

twitter_description (100-140 chars):
  • Twitter/X card description — punchy, action-oriented
  • Mention brand + "download" + at least one format
  • NEVER empty

brand_used    : The exact brand name you decided to use (string)
website_used  : The brand's real official website URL with https:// (string)
industry_used : The brand's real specific industry/sector (string)
${isVariant ? `
== VARIANT / VERSION RULES ==
This is a new version of an existing logo. Previous version(s) already indexed:

${relatedContext}

Previously used description openers (DO NOT reuse any): ${usedOpeners.length ? usedOpeners.map(o => `"${o}"`).join(", ") : "none"}

Mandatory uniqueness:
1. Open main_description from a different angle (rebrand trigger, new market context, identity evolution) — still mention download + format in sentence 1.
2. Do not mirror sentence structure of prior versions.
3. Do not reuse phrases from prior meta_title, meta_description, og_title, og_description, twitter_title, twitter_description.
4. Tags: keep core brand/format terms, add 3-4 new tags (version identifier, specific use-case terms).` : ""}

Respond ONLY with valid JSON — no markdown, no code fences:
{
  "meta_title": "...",
  "meta_description": "...",
  "main_description": "...",
  "alt_text": "...",
  "history": "...",
  "tags": ["...", "...", "..."],
  "og_title": "...",
  "og_description": "...",
  "twitter_title": "...",
  "twitter_description": "...",
  "brand_used": "...",
  "website_used": "...",
  "industry_used": "..."
}`;

  let completion = await callOpenAIWithRetry({
    model: "gpt-4.1-mini",
    temperature: 0.6,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt   },
    ],
    response_format: { type: "json_object" },
  });

  let raw = completion.choices[0]?.message?.content || "{}";
  let parsed;
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }

  // ── Defensive fallbacks — LLM rules but we never ship empty strings ───────
  let resolvedBrand    = (parsed.brand_used    && String(parsed.brand_used).trim())    || providedBrand    || "cdrlogo.com";
  let resolvedWebsite  = (parsed.website_used  && String(parsed.website_used).trim())  || providedWebsite  || "https://cdrlogo.com";
  let resolvedIndustry = (parsed.industry_used && String(parsed.industry_used).trim()) || providedIndustry || "Logo Design & Graphics";

  return {
    brandUsed:    resolvedBrand,
    websiteUsed:  resolvedWebsite,
    industryUsed: resolvedIndustry,

    metaTitle:       parsed.meta_title       || `${logoName} Logo PNG SVG Vector Free Download | cdrlogo.com`,
    metaDescription: parsed.meta_description || `Download ${logoName} logo in PNG, SVG and vector formats for free. Transparent background, high resolution. Available at cdrlogo.com.`,
    description:     parsed.main_description || `Download the ${logoName} logo from cdrlogo.com in PNG, SVG, AI, EPS and CDR vector formats. Suitable for websites, presentations, print and apps. High resolution, transparent background available for free.`,
    altText:         parsed.alt_text         || `${logoName} logo PNG SVG vector format free download cdrlogo.com`,
    history:         parsed.history          || `Download the ${logoName} logo from cdrlogo.com. Available in PNG, SVG, AI, EPS and CDR vector formats for commercial and personal use.`,
    tags: Array.isArray(parsed.tags) && parsed.tags.length
      ? parsed.tags
      : [logoName, "logo", "PNG", "SVG", "vector", "free download", "transparent", "cdrlogo.com"],

    // ── New OG / Twitter fields ─────────────────────────────────────────────
    ogTitle:           parsed.og_title           || `${logoName} Logo — Free PNG & SVG Vector Download`,
    ogDescription:     parsed.og_description     || `Download the ${logoName} logo in PNG, SVG and vector formats for free. Transparent background, high resolution available at cdrlogo.com.`,
    twitterTitle:      parsed.twitter_title      || `${logoName} Logo PNG SVG Vector — Free Download`,
    twitterDescription:parsed.twitter_description|| `Download the ${logoName} logo for free — PNG, SVG, AI, CDR vector formats. Transparent & high resolution.`,

    isVariant,
    relatedSlugs: relatedLogos.map(r => r.slug).filter(Boolean),
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req) {
  console.log("\n========== UPLOAD-LOGO START ==========");
  let startTime = Date.now();

  try {
    let formData = await req.formData();
    console.log("[1] ✓ Form data received");

    // ── 1. pull fields ────────────────────────────────────────────────────────
    let slug          = formData.get("slug")?.trim();
    let logoName      = formData.get("logoName")?.trim();
    let brand         = formData.get("brand")        || "";
    let website       = formData.get("website")      || "";
    let category      = formData.get("category")     || "";
    let industry      = formData.get("industry")     || "";
    let country       = formData.get("country")      || "";
    let license       = formData.get("license")      || "";
    let publishStatus = formData.get("publishStatus")|| "Draft";
    let downloadCount = formData.get("downloadCount")|| "unlimited";
    let altText       = formData.get("altText")      || "";

    let description     = formData.get("description")     || "";
    let metaTitle       = formData.get("metaTitle")       || "";
    let metaDescription = formData.get("metaDescription") || "";
    let history         = formData.get("history")         || "";

    let brandColors = [];
    try { brandColors = JSON.parse(formData.get("brandColors") || "[]"); } catch { }

    let useAI = formData.get("useAI") !== "false";

    console.log("[1a] Parsed form fields:");
    console.log(`  slug: "${slug}"`);
    console.log(`  logoName: "${logoName}"`);
    console.log(`  brand: "${brand}"`);
    console.log(`  category: "${category}"`);
    console.log(`  useAI: ${useAI}`);

    if (!slug) {
      console.log("[1b] ❌ VALIDATION FAILED: slug is required");
      return NextResponse.json({ error: "slug is required." }, { status: 400 });
    }
    if (!logoName) {
      console.log("[1b] ❌ VALIDATION FAILED: logoName is required");
      return NextResponse.json({ error: "logoName is required." }, { status: 400 });
    }
    console.log("[1b] ✓ Basic validation passed");

    // ── 2. collect ZIP files ──────────────────────────────────────────────────
    console.log("[2] Collecting ZIP files...");
    let zipFiles = formData.getAll("files");
    if (!zipFiles.length) {
      console.log("[2] ❌ No ZIP files found");
      return NextResponse.json({ error: "No ZIP file uploaded." }, { status: 400 });
    }
    console.log(`[2] ✓ Found ${zipFiles.length} ZIP file(s)`);

    // ── 3. fetch watermark settings from DB ───────────────────────────────────
    console.log("[3] Fetching watermark settings...");
    let websiteRecord = await prisma.website.findFirst();
    let watermark = websiteRecord?.watermark ?? null;
    console.log(`[3] ✓ Watermark config: ${watermark?.enabled ? "ENABLED" : "DISABLED"}`);

    // ── 4. AI content generation ──────────────────────────────────────────────
    let tags       = [];
    let aiMeta     = { isVariant: false };
    let finalLogoName = logoName;
    let finalSlug     = slug;
    let relatedSlugs  = [];

    // canonicalUrl is always cdrlogo.com/logos/{slug}/ — rebuilt after
    // potential auto-versioning settles the final slug.
    let canonicalUrl = `https://cdrlogo.com/logos/${slug}/`;

    // ── New SEO vars with safe defaults (overwritten by AI below) ────────────
    let ogTitle            = "";
    let ogDescription      = "";
    let ogImageUrl         = "";          // set after WebP upload in step 6
    let twitterTitle       = "";
    let twitterDescription = "";
    let twitterCardType    = "summary_large_image";

    if (useAI) {
      console.log("[4] AI GENERATION ENABLED - Starting process...");
      try {
        console.log(`[4a] Finding related logos for "${logoName}"...`);
        let { related, exactNormalizedMatches } = await findRelatedLogos(logoName);
        console.log(`[4a] ✓ Found ${related.length} related logo(s), ${exactNormalizedMatches.length} exact normalized match(es)`);

        if (exactNormalizedMatches.length > 0) {
          console.log(`[4b] Exact matches found — auto-versioning LOGO NAME...`);
          exactNormalizedMatches.forEach((m, i) => {
            console.log(`     ${i + 1}. "${m.logoName}"`);
          });
          finalLogoName = generateVersionedName(logoName, exactNormalizedMatches);
          finalSlug     = generateSlugFromName(finalLogoName);
          console.log(`[4b] ✓ Logo name: "${logoName}" → "${finalLogoName}"`);
          console.log(`[4b] ✓ Slug: "${slug}" → "${finalSlug}"`);

          let versionedSlugExists = await prisma.logo.findUnique({ where: { slug: finalSlug } });
          if (versionedSlugExists) {
            console.log(`[4b] ❌ Auto-versioned slug "${finalSlug}" already exists`);
            return NextResponse.json(
              { error: `Auto-versioned slug "${finalSlug}" is already taken. Please upload again or check existing logos.` },
              { status: 409 }
            );
          }
          // Rebuild canonicalUrl after versioned slug is finalised
          canonicalUrl = `https://cdrlogo.com/logos/${finalSlug}/`;
        } else {
          console.log(`[4b] No exact matches — this is a new logo, no versioning needed`);
        }

        console.log(`[4c] Calling OpenAI (gpt-41-mini, temp=0.6)...`);
        let aiContent = await generateAIContent({
          logoName: finalLogoName,
          brand,
          website,
          category,
          industry,
          country,
          relatedLogos: related,
          canonicalUrl,
        });
        console.log(`[4c] ✓ AI response received`);
        console.log(`     - brand_used: "${aiContent.brandUsed}"`);
        console.log(`     - website_used: "${aiContent.websiteUsed}"`);
        console.log(`     - industry_used: "${aiContent.industryUsed}"`);
        console.log(`     - meta_title (${aiContent.metaTitle.length} chars): "${aiContent.metaTitle.substring(0, 60)}"`);
        console.log(`     - og_title: "${aiContent.ogTitle}"`);
        console.log(`     - twitter_title: "${aiContent.twitterTitle}"`);
        console.log(`     - tags: ${aiContent.tags.length} generated`);
        console.log(`     - history: ${aiContent.history ? "✓" : "empty"}`);

        aiMeta = {
          isVariant:       aiContent.isVariant,
          relatedCount:    related.length,
          originalLogoName: logoName,
          finalLogoName,
          versioned:       finalLogoName !== logoName,
          brandUsed:       aiContent.brandUsed,
          websiteUsed:     aiContent.websiteUsed,
          industryUsed:    aiContent.industryUsed,
        };

        // LLM's decided values always win over form-submitted hints
        brand    = aiContent.brandUsed;
        website  = aiContent.websiteUsed;
        industry = aiContent.industryUsed;

        if (aiContent.metaTitle)       metaTitle       = aiContent.metaTitle;
        if (aiContent.metaDescription) metaDescription = aiContent.metaDescription;
        if (aiContent.description)     description     = aiContent.description;
        if (aiContent.history)         history         = aiContent.history;
        if (aiContent.altText)         altText         = aiContent.altText;
        if (aiContent.tags.length)     tags            = aiContent.tags;

        // ── Assign new OG / Twitter fields ───────────────────────────────────
        ogTitle            = aiContent.ogTitle;
        ogDescription      = aiContent.ogDescription;
        twitterTitle       = aiContent.twitterTitle;
        twitterDescription = aiContent.twitterDescription;
        // twitterCardType stays "summary_large_image" (schema default)

        if (aiContent.relatedSlugs.length) relatedSlugs = aiContent.relatedSlugs;
        console.log(`[4d] ✓ AI content applied to logo`);

      } catch (aiErr) {
        console.error("[4] ❌ AI generation failed:", aiErr.message);
        await prisma.log.create({
          data: {
            who: "api:upload-logo",
            content: `AI generation error for "${logoName}": ${aiErr?.message}`,
          },
        });
        console.log("[4] ⚠ Falling back to manually entered fields");
        if (!brand    || !brand.trim())    brand    = "cdrlogo.com";
        if (!website  || !website.trim())  website  = "https://cdrlogo.com";
        if (!industry || !industry.trim()) industry = "Logo Design & Graphics";
        try { tags = JSON.parse(formData.get("tags") || "[]"); } catch { }
        // OG/Twitter fallbacks — simple but functional
        ogTitle            = `${logoName} Logo — Free PNG & SVG Vector Download`;
        ogDescription      = `Download the ${logoName} logo in PNG, SVG and vector formats for free. Transparent background, high resolution available at cdrlogo.com.`;
        twitterTitle       = `${logoName} Logo PNG SVG Vector — Free Download`;
        twitterDescription = `Download the ${logoName} logo for free — PNG, SVG, AI, CDR vector formats. Transparent & high resolution.`;
      }
    } else {
      console.log("[4] AI DISABLED - Using manual fields only");
      if (!brand    || !brand.trim())    brand    = "cdrlogo.com";
      if (!website  || !website.trim())  website  = "https://cdrlogo.com";
      if (!industry || !industry.trim()) industry = "Logo Design & Graphics";
      try { tags = JSON.parse(formData.get("tags") || "[]"); } catch { }
      // Manual-mode OG/Twitter: derive from whatever meta fields were submitted
      ogTitle            = metaTitle  || `${logoName} Logo — Free PNG & SVG Vector Download`;
      ogDescription      = metaDescription || `Download the ${logoName} logo in PNG, SVG and vector formats for free. Available at cdrlogo.com.`;
      twitterTitle       = ogTitle;
      twitterDescription = ogDescription.substring(0, 140);
    }

    if (!description) {
      console.log("[4] ❌ No description found");
      return NextResponse.json({ error: "description is required (AI generation may have failed)." }, { status: 400 });
    }
    console.log("[4] ✓ Description present");

    // ── 5. process every ZIP ──────────────────────────────────────────────────
    console.log("[5] Processing ZIP contents...");
    let publicFiles  = [];
    let privateFiles = [];
    let svgContent   = null;
    let fileSizes    = { svg: 0, png: 0, ai: 0, cdr: 0 };

    for (let zipFile of zipFiles) {
      let arrayBuffer = await zipFile.arrayBuffer();
      let zip = new AdmZip(Buffer.from(arrayBuffer));

      for (let entry of zip.getEntries()) {
        if (entry.isDirectory) continue;

        let filename  = entry.entryName.split("/").pop();
        let fileExt   = ext(filename);
        let fileBuffer= entry.getData();
        let fileSize  = (fileBuffer.length / 1024).toFixed(2);

        console.log(`     - ${filename} (${fileSize} KB)`);

        if (fileExt === "svg") {
          privateFiles.push({
            key: `separate/${finalSlug}/${filename}`,
            buffer: fileBuffer,
            contentType: mime(filename),
          });
          fileSizes.svg = fileBuffer.length;
          if (!svgContent) svgContent = fileBuffer.toString("utf-8");
          console.log(`       → private SVG stored (${fileSize} KB)`);

        } else if (fileExt === "png") {
          privateFiles.push({
            key: `separate/${finalSlug}/${filename}`,
            buffer: fileBuffer,
            contentType: mime(filename),
          });
          fileSizes.png = fileBuffer.length;

          // Watermark applies to the public WebP preview only —
          // the private PNG is always stored clean/unwatermarked.
          let watermarked = await applyWatermark(fileBuffer, watermark);
          let webpBuffer  = await sharp(watermarked).webp({ quality: 90 }).toBuffer();
          let webpName    = filename.replace(/\.png$/i, ".webp");
          publicFiles.push({
            key: `public/${finalSlug}/${webpName}`,
            buffer: webpBuffer,
            contentType: "image/webp",
          });
          console.log(`       → private PNG (${fileSize} KB) + public WebP (${(webpBuffer.length / 1024).toFixed(2)} KB)`);

        } else if (fileExt === "ai") {
          privateFiles.push({
            key: `separate/${finalSlug}/${filename}`,
            buffer: fileBuffer,
            contentType: mime(filename),
          });
          fileSizes.ai = fileBuffer.length;
          console.log(`       → private AI stored (${fileSize} KB)`);

        } else if (fileExt === "cdr") {
          privateFiles.push({
            key: `separate/${finalSlug}/${filename}`,
            buffer: fileBuffer,
            contentType: mime(filename),
          });
          fileSizes.cdr = fileBuffer.length;
          console.log(`       → private CDR stored (${fileSize} KB)`);

        } else {
          privateFiles.push({
            key: `private/${finalSlug}/${filename}`,
            buffer: fileBuffer,
            contentType: mime(filename),
          });
          console.log(`       → private misc file (${fileSize} KB)`);
        }
      }
    }
    console.log(`[5] ✓ ZIP processing complete: ${publicFiles.length} public, ${privateFiles.length} private`);

    // ── 6. upload everything to R2 ────────────────────────────────────────────
    console.log("[6] Uploading files to R2...");
    let allUploads = [...publicFiles, ...privateFiles];

    let uploadResults = await Promise.all(
      allUploads.map(async ({ key, buffer, contentType }) => {
        try {
          console.log(`     Uploading: ${key}`);
          return await uploadToR2({ fileBuffer: buffer, fileName: key, mimeType: contentType });
        } catch (err) {
          console.error(`     ❌ Failed to upload: ${key} — ${err.message}`);
          return null;
        }
      })
    );

    let urlMap = {};
    allUploads.forEach(({ key }, i) => { urlMap[key] = uploadResults[i]; });

    let failedUploads = allUploads.filter((_, i) => !uploadResults[i]);
    if (failedUploads.length) {
      console.warn(`[6] ⚠ ${failedUploads.length} file(s) failed to upload: ${failedUploads.map(f => f.key).join(", ")}`);
    }
    console.log(`[6] ✓ Upload complete (${allUploads.length - failedUploads.length}/${allUploads.length} succeeded)`);

    let findUrl = (predicate) => {
      let match = allUploads.find(predicate);
      return match ? urlMap[match.key] : null;
    };

    let svgUrl  = findUrl(f => f.key.endsWith(".svg"));
    let pngUrl  = findUrl(f => f.key.endsWith(".png"));
    let webpUrl = findUrl(f => f.key.endsWith(".webp"));
    let aiUrl   = findUrl(f => f.key.endsWith(".ai"));
    let cdrUrl  = findUrl(f => f.key.endsWith(".cdr"));

    console.log("[6a] Resolved file URLs:");
    if (svgUrl)  console.log(`     SVG: ${svgUrl}`);
    if (pngUrl)  console.log(`     PNG: ${pngUrl}`);
    if (webpUrl) console.log(`     WebP (public): ${webpUrl}`);
    if (aiUrl)   console.log(`     AI: ${aiUrl}`);
    if (cdrUrl)  console.log(`     CDR: ${cdrUrl}`);

    // ── ogImageUrl: use the public WebP as the OG/Twitter card image ─────────
    // This is the 1200x630-friendly public preview. If no WebP exists (edge
    // case: zip had no PNG), leave it null — the front-end can fall back to a
    // site-wide default OG image.
    ogImageUrl = webpUrl || null;
    console.log(`[6b] ogImageUrl set to: ${ogImageUrl || "null (no WebP available)"}`);

    // ── 7. save to DB ─────────────────────────────────────────────────────────
    console.log("[7] Saving logo to database...");
    console.log(`     Final logo name : "${finalLogoName}"`);
    console.log(`     Final slug      : "${finalSlug}"`);
    console.log(`     Brand           : "${brand}"`);
    console.log(`     Website         : "${website}"`);
    console.log(`     Industry        : "${industry}"`);
    console.log(`     canonicalUrl    : "${canonicalUrl}"`);
    console.log(`     ogTitle         : "${ogTitle}"`);
    console.log(`     ogDescription   : "${ogDescription?.substring(0, 60)}..."`);
    console.log(`     ogImageUrl      : "${ogImageUrl || "null"}"`);
    console.log(`     twitterTitle    : "${twitterTitle}"`);
    console.log(`     twitterCardType : "${twitterCardType}"`);
    console.log(`     Tags (${tags.length}): ${tags.slice(0, 5).join(", ")}${tags.length > 5 ? "..." : ""}`);

    let logo = await prisma.logo.create({
      data: {
        logoName:     finalLogoName,
        slug:         finalSlug,
        brand,
        website,
        category,
        industry,
        country,
        license,
        description,
        history,
        tags,
        brandColors,
        publishStatus,
        downloadCount,
        svgUrl,
        pngUrl,
        webpUrl,
        aiUrl,
        cdrUrl,
        svgContent,
        metaTitle,
        metaDescription,
        altText,
        svgfilesize:  formatSize(fileSizes.svg),
        pngfilesize:  formatSize(fileSizes.png),
        aifilesize:   formatSize(fileSizes.ai),
        cdrfilesize:  formatSize(fileSizes.cdr),

        // ── SEO / social fields ─────────────────────────────────────────────
        canonicalUrl,
        ogTitle,
        ogDescription,
        ogImageUrl,               // public WebP URL (watermarked preview)
        ogType:            "website",
        twitterTitle,
        twitterDescription,
        twitterImage:      ogImageUrl,   // same image reused for Twitter card
        twitterCardType,
      },
    });
    console.log(`[7] ✓ Logo saved to DB with ID: ${logo.id}`);

    await prisma.log.create({
      data: {
        who: "api:upload-logo",
        content: `Logo uploaded: ${finalSlug} (name: "${finalLogoName}")${aiMeta.versioned ? ` [auto-versioned from "${logoName}"]` : ""}${aiMeta.isVariant ? ` (AI variant, ${aiMeta.relatedCount} related)` : useAI ? " (AI-generated)" : " (manual)"}`,
      },
    });

    let duration = Date.now() - startTime;
    console.log(`\n========== UPLOAD-LOGO SUCCESS ==========`);
    console.log(`Total time  : ${duration}ms`);
    console.log(`Final Slug  : "${finalSlug}"`);
    console.log(`Logo Name   : "${finalLogoName}"${aiMeta.versioned ? ` (auto-versioned from "${logoName}")` : ""}`);
    console.log(`Files       : ${allUploads.length} total (${publicFiles.length} public, ${privateFiles.length} private)`);
    console.log(`==========================================\n`);

    return NextResponse.json({
      message: "Logo uploaded successfully!",
      logo,
      ai: aiMeta,
      files: {
        public:  publicFiles.map(f  => ({ key: f.key,  url: urlMap[f.key]  })),
        private: privateFiles.map(f => ({ key: f.key,  url: urlMap[f.key]  })),
      },
    });

  } catch (error) {
    let duration = Date.now() - startTime;
    console.error(`\n========== UPLOAD-LOGO ERROR ==========`);
    console.error(`Time elapsed : ${duration}ms`);
    console.error(`Error        : ${error.message}`);
    console.error(`Stack        : ${error.stack}`);
    console.error(`========================================\n`);

    await prisma.log.create({
      data: {
        who: "api:upload-logo",
        content: `Upload error: ${error?.message}`,
      },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}