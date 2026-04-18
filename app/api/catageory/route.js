import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const result = await prisma.logo.groupBy({
      by: ["category"],
    //   where: {
    //     publishStatus: "Published",
    //   },
      _count: {
        category: true,
      },
    });

    // format response
    const formatted = result.map(item => ({
      [item.category]: item._count.category,
    }));

    return NextResponse.json({ categories: formatted });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}