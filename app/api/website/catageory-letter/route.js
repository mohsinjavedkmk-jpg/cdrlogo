import { prisma } from "../../../lib/prisma";

// helper: group categories
function groupCategories(categories = []) {
  const grouped = {};

  categories.forEach((cat) => {
    const firstChar = cat[0]?.toUpperCase();

    const key =
      /[0-9]/.test(firstChar) ? "0-9" :
      /[A-Z]/.test(firstChar) ? firstChar :
      "Other";

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(cat);
  });

  // sort each group
  Object.keys(grouped).forEach((k) => {
    grouped[k].sort();
  });

  return grouped;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { letter = "all" } = body;

    const website = await prisma.website.findFirst();

    if (!website || !website.categories) {
      return Response.json({});
    }

    const grouped = groupCategories(website.categories);

    // ✅ ALL
    if (letter === "all") {
      return Response.json(grouped);
    }

    // ✅ SINGLE LETTER
    const key =
      letter === "0-9"
        ? "0-9"
        : letter.toUpperCase();

    return Response.json({
      [key]: grouped[key] || [],
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}