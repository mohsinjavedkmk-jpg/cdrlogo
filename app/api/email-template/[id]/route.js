// app/api/admin/email-templates/[[...id]]/route.js
// Handles:
//   GET  /api/admin/email-templates          → list all templates
//   GET  /api/admin/email-templates/:id      → single template
//   PATCH /api/admin/email-templates/:id     → edit content / toggle status

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../auth/[...nextauth]/route";         // adjust to your path
import { prisma } from "../../../lib/prisma"; // adjust to your path

// ── Auth helper ──────────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return null;
  }
  return session;
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {


  // All templates
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      key: true,
      title: true,
      description: true,
      subject: true,
      content: true,
      status: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ templates });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(request,{ params }) {

  const { id } = await params;
  console.log("Updating template ID:", id);
  if (!id) {
    return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
  }

  const body = await request.json();
  const { title, description, subject, content, status } = body;

  if (status && !["ACTIVE", "DRAFT"].includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  const updated = await prisma.emailTemplate.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(subject !== undefined && { subject }),
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json({ template: updated });
}



export async function POST(request) {
 
  const body = await request.json();
  const { key, title, description, subject, content, status } = body;

  if (!key || !title) {
    return NextResponse.json({ error: "key and title are required" }, { status: 400 });
  }

  if (status && !["ACTIVE", "DRAFT"].includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  const template = await prisma.emailTemplate.create({
    data: {
      key,
      title,
      description: description ?? "",
      subject:     subject     ?? "",
      content:     content     ?? "",
      status:      status      ?? "DRAFT",
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}