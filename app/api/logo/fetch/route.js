import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();

    let letter   = body.letter?.toLowerCase()?.trim();
    let category = body.category?.toLowerCase()?.trim();

    const where = { publishStatus: "Published" };

    if (letter && letter !== "all" && letter !== "0-9") {
      where.logoName = {
        startsWith: letter,
        mode: "insensitive",
      };
    }

    let logos = await prisma.logo.findMany({
      where,
      select: {
        id:          true,
        logoName:    true,
        category:    true, // String[]
        brandColors: true,
        webpUrl:     true,
        slug:        true,
      },
    });

    // 0-9 filter (can't do in Prisma startsWith)
    if (letter === "0-9") {
      logos = logos.filter(l => /^[0-9]/.test(l.logoName));
    }

    // category is a String[], so filter case-insensitively in JS
    if (category && category !== "all") {
      logos = logos.filter(l =>
        Array.isArray(l.category) &&
        l.category.some(c => c.toLowerCase().trim() === category)
      );
    }

    return NextResponse.json({ logos });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}