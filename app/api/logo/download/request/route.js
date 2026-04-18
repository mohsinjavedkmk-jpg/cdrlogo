import { prisma } from "../../../../lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { logoId, format } = await req.json(); 
    // format optional: "all", "svg", "png", "ai", "cdr"

    const logo = await prisma.logo.findUnique({
      where: { id: logoId },
    });

    if (!logo) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const token = jwt.sign(
      { logoId, format: format || "all" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    return Response.json({
      downloadUrl: `/api/logo/download?token=${token}&format=${format || "all"}`,
    });

  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}