

export function toSearchSlug(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// URL slug ko wapas input box ke liye readable text me convert karta hai —
// hyphen sirf spacing ke liye tha, box me dikhna nahi chahiye.
export function fromSearchSlug(slug) {
  return String(slug || "")
    .replace(/-+/g, " ")
    .trim();
}