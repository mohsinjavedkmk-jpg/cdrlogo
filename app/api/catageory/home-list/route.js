import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    // 1. Get only the "category" field from every PUBLISHED logo.
    const logos = await prisma.logo.findMany({
      where: {
        publishStatus: "Published",
      },
      select: {
        category: true,
      },
    });

    // 2. Collect unique category names using a Set (auto-dedupes).
    const categorySet = new Set();

    for (const logo of logos) {
      if (!Array.isArray(logo.category)) continue;

      for (const cat of logo.category) {
        if (typeof cat !== "string" || !cat.trim()) continue;

        const normalized = cat.trim().toLowerCase();

        if (normalized === "template") continue; // skip template

        categorySet.add(normalized);
      }
    }

    // 3. Convert Set -> sorted array of names.
    const categories = Array.from(categorySet).sort();

    return NextResponse.json({
      categories,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}