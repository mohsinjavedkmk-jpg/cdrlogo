// app/api/auth/verify/route.js

import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      await prisma.log.create({
        data: {
          who: `api:verify-email`,
          content: `Invalid token received`,
        },
      });
      return NextResponse.json(
        { status: false, message: "Invalid token" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    // Token not in DB — either already nulled after first use, or never existed
    if (!user) {
      await prisma.log.create({
        data: {
          who: `api:verify-email`,
          content: `Token not found — already used or invalid: ${token}`,
        },
      });
      return NextResponse.json(
        {
          status: false,
          alreadyUsed: true, // frontend shows amber + login button instead of red error
          message: "This verification link has already been used. If your email is verified, you can log in.",
        },
        { status: 400 }
      );
    }

    // Token still in DB but user already verified (edge case)
    if (user.isVerified) {
      await prisma.log.create({
        data: {
          who: `user:${user.email}`,
          content: `Verification attempted but already verified`,
        },
      });
      return NextResponse.json({
        status: false,
        alreadyUsed: true,
        message: "Your email is already verified. Please log in.",
      });
    }

    // First time — verify and null the token so link cannot be reused
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        type: "user",
      },
    });

    await prisma.log.create({
      data: {
        who: `user:${user.email}`,
        content: `Email verified successfully for ${user.email}`,
      },
    });

    return NextResponse.json({
      status: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    console.error("VERIFY ERROR:", error);
    await prisma.log.create({
      data: {
        who: `api:verify-email`,
        content: `Server error during email verification: ${error?.message}`,
      },
    });
    return NextResponse.json(
      { status: false, message: "Server error" },
      { status: 500 }
    );
  }
}