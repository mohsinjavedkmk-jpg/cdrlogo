import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import sharp from "sharp";
import { uploadToR2 } from "../../../../lib/uploadToR2";
import { prisma } from "../../../../lib/prisma";

// ── mime helpers ──────────────────────────────────────────────────────────────
const MIME = {
  svg:  "image/svg+xml",
  ai:   "application/postscript",
  cdr:  "application/cdr",
  png:  "image/png",
  webp: "image/webp",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
};

function ext(filename) {
  return filename.split(".").pop().toLowerCase();
}

function mime(filename) {
  return MIME[ext(filename)] || "application/octet-stream";
}

// ── route handler ─────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const formData = await req.formData();

    // ── 1. pull fields from FormData ─────────────────────────────────────────
    const slug            = formData.get("slug")?.trim();
    const logoName        = formData.get("logoName")?.trim();
    const brand           = formData.get("brand") || "";
    const website         = formData.get("website") || "";
    const category        = formData.get("category") || "";
    const industry        = formData.get("industry") || "";
    const country         = formData.get("country") || "";
    const license         = formData.get("license") || "";
    const description     = formData.get("description") || "";
    const history         = formData.get("history") || "";
    const metaTitle       = formData.get("metaTitle") || "";
    const metaDescription = formData.get("metaDescription") || "";
    const altText         = formData.get("altText") || "";
    const focusKeywords   = formData.get("focusKeywords") || "";
    const publishStatus   = formData.get("publishStatus") || "Draft";

    // downloadCount stored as String — "unlimited" or a numeric string like "5"
    const downloadCount = formData.get("downloadCount") || "unlimited";

    let tags        = [];
    let brandColors = [];
    try { tags        = JSON.parse(formData.get("tags") || "[]"); } catch {}
    try { brandColors = JSON.parse(formData.get("brandColors") || "[]"); } catch {}

    if (!slug)     return NextResponse.json({ error: "slug is required." },     { status: 400 });
    if (!logoName) return NextResponse.json({ error: "logoName is required." }, { status: 400 });

    // ── 2. collect uploaded ZIP files ────────────────────────────────────────
    const zipFiles = formData.getAll("files");
    if (!zipFiles.length) {
      return NextResponse.json({ error: "No ZIP file uploaded." }, { status: 400 });
    }

    // ── 3. process every ZIP ──────────────────────────────────────────────────
    // publicFiles  → stored under  public/{slug}/   (WebP only)
    // privateFiles → stored under  separate/{slug}/ (SVG, PNG, AI, CDR, everything else)
    const publicFiles  = [];   // { key, buffer, contentType }
    const privateFiles = [];

    // SVG source code extracted from the ZIP (first SVG found wins)
    let svgContent = null;

    for (const zipFile of zipFiles) {
      const arrayBuffer = await zipFile.arrayBuffer();
      const zipBuffer   = Buffer.from(arrayBuffer);
      const zip         = new AdmZip(zipBuffer);
      const entries     = zip.getEntries();

      for (const entry of entries) {
        if (entry.isDirectory) continue;

        const filename   = entry.entryName.split("/").pop();
        const fileExt    = ext(filename);
        const fileBuffer = entry.getData();

        // ── SVG → private + capture SVG source code ───────────────────────
        if (fileExt === "svg") {
          privateFiles.push({
            key:         `separate/${slug}/${filename}`,
            buffer:      fileBuffer,
            contentType: mime(filename),
          });

          // Store raw SVG markup in DB (first SVG only)
          if (!svgContent) {
            svgContent = fileBuffer.toString("utf-8");
          }
        }

        // ── PNG → private + generate WebP → public ────────────────────────
        else if (fileExt === "png") {
          privateFiles.push({
            key:         `separate/${slug}/${filename}`,
            buffer:      fileBuffer,
            contentType: mime(filename),
          });

          // Convert PNG → WebP and push to public
          const webpBuffer = await sharp(fileBuffer)
            .webp({ quality: 90 })
            .toBuffer();
          const webpName = filename.replace(/\.png$/i, ".webp");
          publicFiles.push({
            key:         `public/${slug}/${webpName}`,
            buffer:      webpBuffer,
            contentType: "image/webp",
          });
        }

        // ── AI / CDR → private ────────────────────────────────────────────
        else if (fileExt === "ai" || fileExt === "cdr") {
          privateFiles.push({
            key:         `separate/${slug}/${filename}`,
            buffer:      fileBuffer,
            contentType: mime(filename),
          });
        }

        // ── everything else (jpg, eps, pdf, …) → private ─────────────────
        else {
          privateFiles.push({
            key:         `private/${slug}/${filename}`,
            buffer:      fileBuffer,
            contentType: mime(filename),
          });
        }
      }
    }

    // ── 4. upload all files to R2 ─────────────────────────────────────────────
    const allUploads = [...publicFiles, ...privateFiles];
    const uploadResults = await Promise.all(
      allUploads.map(({ key, buffer, contentType }) =>
        uploadToR2({ fileBuffer: buffer, fileName: key, mimeType: contentType })
      )
    );

    // build a map  key → url
    const urlMap = {};
    allUploads.forEach(({ key }, i) => { urlMap[key] = uploadResults[i]; });

    // ── 5. collect individual file URLs ───────────────────────────────────────
    const findUrl = (predicate) => {
      const match = allUploads.find(predicate);
      return match ? urlMap[match.key] : null;
    };

    const svgUrl  = findUrl(f => f.key.endsWith(".svg"));
    const pngUrl  = findUrl(f => f.key.endsWith(".png"));
    const webpUrl = findUrl(f => f.key.endsWith(".webp"));
    const aiUrl   = findUrl(f => f.key.endsWith(".ai"));
    const cdrUrl  = findUrl(f => f.key.endsWith(".cdr"));

    // ── 6. save to database ───────────────────────────────────────────────────
    const logo = await prisma.logo.create({
      data: {
        logoName,
        slug,
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
        downloadCount,   // String: "unlimited" | "5" | "100" …

        // file URLs
        svgUrl,
        pngUrl,
        webpUrl,
        aiUrl,
        cdrUrl,

        // raw SVG markup stored in DB
        svgContent,

        // SEO
        metaTitle,
        metaDescription,
        altText,
        focusKeywords,
      },
    });

    return NextResponse.json({
      message: "Logo uploaded successfully!",
      logo,
      files: {
        public:  publicFiles.map(f => ({ key: f.key, url: urlMap[f.key] })),
        private: privateFiles.map(f => ({ key: f.key, url: urlMap[f.key] })),
      },
    });

  } catch (error) {
    console.error("[upload-logo]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}