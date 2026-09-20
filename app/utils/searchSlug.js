export function toSearchSlug(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "-")   // spaces / underscores / multiple dashes → single dash
    .replace(/^-+|-+$/g, "");   // leading & trailing dashes remove
}