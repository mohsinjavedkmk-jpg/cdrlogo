import { prisma } from "../../lib/prisma";

// ✅ CREATE or UPDATE (singleton)
export async function POST(req) {
  try {
    const body = await req.json();
    const { categories, navItems } = body;

    // 🔒 validation
    if (!Array.isArray(categories) || categories.length === 0) {
      return Response.json(
        { error: "categories must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!navItems || typeof navItems !== "object") {
      return Response.json(
        { error: "navItems must be an array or object" },
        { status: 400 }
      );
    }

    // 🔥 singleton fetch
    const existing = await prisma.website.findFirst();

    let website;

    if (existing) {
      // ✅ update
      website = await prisma.website.update({
        where: { id: existing.id },
        data: {
          categories,
          navItems,
        },
      });
    } else {
      // ✅ create
      website = await prisma.website.create({
        data: {
          categories,
          navItems,
        },
      });
    }

    return Response.json({
      success: true,
      data: website,
    });

  } catch (error) {
    console.error("POST ERROR:", error);

    return Response.json(
      { error: "Operation failed" },
      { status: 500 }
    );
  }
}


// ✅ GET single website config
export async function GET() {
  try {
    const website = await prisma.website.findFirst({
      orderBy: { createdAt: "desc" }, // safer
    });

    return Response.json({
      success: true,
      data: website ?? null,
    });

  } catch (error) {
    console.error("GET ERROR:", error);

    return Response.json(
      { error: "Failed to fetch website" },
      { status: 500 }
    );
  }
}