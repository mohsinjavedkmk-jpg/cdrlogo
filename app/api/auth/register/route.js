import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "../../../lib/mailer";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // 1️⃣ Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { status: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { status: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // 2️⃣ Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { status: false, message: "Email already registered" },
        { status: 409 }
      );
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Generate verification token
    const verificationToken = uuidv4();

    // 5️⃣ Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        type: "guest",
        downloadCountUsed: 0,
        downloadLimit: 5,
        isVerified: false,
        verificationToken,
      },
    });

    // 6️⃣ Send verification email
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      {
        status: true,
        message: "Account created. Please verify your email.",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}