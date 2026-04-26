// app/api/blogs/route.js
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";



// GET /api/blogs?page=1&limit=9&category=tutorials
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "9");
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = {
      published: true,
      ...(category && { category: { equals: category, mode: "insensitive" } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } }
        ],
      }),
    };

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          category: true,
          coverEmoji: true,
          readTime: true,
          createdAt: true,
           published: true,
        },
      }),
      prisma.blog.count({ where }),
    ]);

    return NextResponse.json({
      blogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/blogs]", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

// POST /api/blogs  — create a new blog post
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, slug, excerpt, content, category, coverEmoji, readTime ,published } = body;
    console.log("Creating blog with slug:", published);


    if (!title || !slug || !excerpt || !content || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug:"/"+slug,
        excerpt,
        content,
        category,
        coverEmoji: coverEmoji || "📝",
        readTime: readTime || 5,
        published:published || true,
      },
    });

    return NextResponse.json({ blog }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error("[POST /api/blogs]", error);
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
  }
}