/**
 * Returns a valid perfume image URL only if it points to fimgs.net (real Fragrantica imagery).
 * Old AI-generated or placeholder images are filtered out and should fall back to the bottle SVG.
 */
export function getPerfumeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  return url.includes("fimgs.net") ? url : null;
}
