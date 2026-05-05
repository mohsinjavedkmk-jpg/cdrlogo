import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req) {
  try {

    // ── Logos with fav count + which users favourited them ──────────────
    const logos = await prisma.logo.findMany({
      where: { favoritedBy: { some: {} } },
      select: {
        id: true,
        logoName: true,
        slug: true,
        webpUrl: true,
        category: true,
        _count: { select: { favoritedBy: true } },
        favoritedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { favoritedBy: { _count: "desc" } },
    });

    // ── Users with how many / which logos they favourited ────────────────
    const users = await prisma.user.findMany({
      where: { favorites: { some: {} } },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { favorites: true } },
        favorites: {
          select: {
            id: true,
            logoName: true,
            slug: true,
            webpUrl: true,
            category: true,
          },
        },
      },
      orderBy: { favorites: { _count: "desc" } },
    });

    return Response.json({ logos, users });
  } catch (err) {
    console.error("[admin/favourites]", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}