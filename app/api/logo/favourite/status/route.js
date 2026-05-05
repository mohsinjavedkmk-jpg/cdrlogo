import { prisma } from "../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return Response.json({ favourited: false });

    const { logoId } = await req.json();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { favorites: { where: { id: logoId } } },
    });

    return Response.json({ favourited: (user?.favorites?.length ?? 0) > 0 });
  } catch {
    return Response.json({ favourited: false });
  }
}