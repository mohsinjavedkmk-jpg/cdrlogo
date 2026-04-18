import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import archiver from "archiver";
import { PassThrough } from "stream";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const format = searchParams.get("format") || "all";

    if (!token) {
      return new Response("Token missing", { status: 400 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return new Response("Token expired", { status: 403 });
    }

    const logo = await prisma.logo.findUnique({
      where: { id: decoded.logoId },
    });

    if (!logo) {
      return new Response("Not found", { status: 404 });
    }

    // -------------------------
    // SINGLE FILE DOWNLOAD
    // -------------------------
    if (format !== "all") {
      let fileUrl;
      let fileName;

      switch (format) {
        case "svg":
          fileUrl = logo.svgUrl;
          fileName = `${logo.slug}.svg`;
          break;
        case "png":
          fileUrl = logo.pngUrl;
          fileName = `${logo.slug}.png`;
          break;
        case "ai":
          fileUrl = logo.aiUrl;
          fileName = `${logo.slug}.ai`;
          break;
        case "cdr":
          fileUrl = logo.cdrUrl;
          fileName = `${logo.slug}.cdr`;
          break;
        default:
          return new Response("Invalid format", { status: 400 });
      }

      if (!fileUrl) {
        return new Response("File not found", { status: 404 });
      }

      const res = await fetch(fileUrl);
      const buffer = await res.arrayBuffer();

      return new Response(Buffer.from(buffer), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename=${fileName}`,
        },
      });
    }

    // -------------------------
    // ZIP DOWNLOAD (ALL FILES)
    // -------------------------
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();

    archive.pipe(stream);

    const addFile = async (url, name) => {
      if (!url) return;
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      archive.append(Buffer.from(buffer), { name });
    };
//   downloadedNumberByPeople
    await addFile(logo.svgUrl, "logo.svg");
    await addFile(logo.pngUrl, "logo.png");
    await addFile(logo.aiUrl, "logo.ai");
    await addFile(logo.cdrUrl, "logo.cdr");

    await archive.finalize();

    return new Response(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${logo.slug}.zip`,
      },
    });

  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}