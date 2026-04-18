import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    console.log("VERIFY TOKEN:", token);

    if (!token) {
      return NextResponse.json(
        { status: false, message: "Invalid token" },
        { status: 400 }
      );
    }

    // ✅ FIX: use findFirst
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { status: false, message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json({
        status: false,
        message: "Email already verified",
      });
    }

    // ✅ Verify user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        type: "logged",
      },
    });

    return NextResponse.json({
      status: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    console.error("VERIFY ERROR:", error);

    return NextResponse.json(
      { status: false, message: "Server error" },
      { status: 500 }
    );
  }
}