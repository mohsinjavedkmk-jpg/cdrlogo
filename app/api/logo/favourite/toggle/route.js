import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    // 🔒 Auth check
    if (!session?.user?.id) {
      return Response.json(
        { error: "Login required to favourite logos" },
        { status: 401 }
      );
    }

    const { logoId } = await req.json();

    if (!logoId) {
      return Response.json(
        { error: "logoId required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // ✅ Check if logo exists (important!)
    const logoExists = await prisma.logo.findUnique({
      where: { id: logoId },
      select: { id: true },
    });

    if (!logoExists) {
      return Response.json(
        { error: "Logo not found" },
        { status: 404 }
      );
    }

    // ⚡ Faster check (no heavy include)
    const alreadyFav = await prisma.user.count({
      where: {
        id: userId,
        favorites: {
          some: { id: logoId },
        },
      },
    });

    // 🔁 Toggle logic
    await prisma.user.update({
      where: { id: userId },
      data: {
        favorites: alreadyFav
          ? { disconnect: { id: logoId } }
          : { connect: { id: logoId } },
      },
    });

    return Response.json({
      success: true,
      favourited: !alreadyFav,
      action: alreadyFav ? "removed" : "added",
    });

  } catch (err) {
    console.error("[favourite/toggle]", err);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}