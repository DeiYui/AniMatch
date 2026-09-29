// src/lib/labels.ts
// Japanese display labels shared by chips (client) and explanations (server).
import type { Dimension } from "@/lib/vector";
import type { Context, Mood } from "@/lib/context/schema";
import type { Anime } from "@/lib/anime/schema";

export const MOOD_LABELS: Record<Mood, string> = {
  laugh: "笑い",
  cry: "泣ける",
  thrill: "ワクワク",
  relax: "癒やし",
  think: "考察",
  romance: "恋愛",
  dark: "ダーク",
};

// Used in reasons as 「<label>：高」.
export const DIMENSION_LABELS: Record<Dimension, string> = {
  laugh: "笑い度",
  cry: "感動度",
  thrill: "ワクワク度",
  relax: "癒やし度",
  think: "考察度",
  romance: "恋愛度",
  dark: "ダーク度",
  heavy: "重い展開",
};

export const ENERGY_LABELS: Record<Context["energy"], string | null> = {
  low: "疲れ気味",
  mid: null, // the default; no chip
  high: "がっつり見たい",
};

export const COMPANY_LABELS: Record<NonNullable<Context["company"]>, string> = {
  alone: "ひとりで",
  partner: "恋人と",
  friends: "友達と",
  family: "家族と",
};

/** Japanese title first (UI is Japanese), then romaji, then English. */
export const displayTitle = (a: Pick<Anime, "title">): string =>
  a.title.native ?? a.title.romaji ?? a.title.english ?? "";
