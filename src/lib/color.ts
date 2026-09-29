// src/lib/color.ts
// Card accent from AniList's cover colour. It's used for text and bullets on a dark panel,
// so very dark colours are lightened toward the paper colour to stay readable.

export const NEUTRAL_ACCENT = "#8c92a3"; // --muted: no cover colour
const PAPER = [0xec, 0xe8, 0xdf];
const MIN_LUMINANCE = 0.25; // below this a colour is hard to read on --panel (#171c2b)

const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** WCAG relative luminance, 0 (black) … 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = parse(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function readableAccent(hex: string | null): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return NEUTRAL_ACCENT;
  let rgb = parse(hex);
  // Mix toward paper in steps until it's light enough (at most 4 steps of 25%).
  for (let i = 0; i < 4 && luminance(toHex(rgb)) < MIN_LUMINANCE; i++) {
    rgb = rgb.map((v, j) => v + (PAPER[j] - v) * 0.25);
  }
  return toHex(rgb);
}
