// src/lib/messages.ts
// Language-neutral messages produced by the server (reasons, notices) and chips.
// The UI renders them with the dictionary of the current language (src/i18n/).
import type { Dimension } from "@/lib/vector";
import type { AvoidKey } from "@/data/avoidMap";
import type { ThemeKey } from "@/data/themes";
import type { Context, Mood } from "@/lib/context/schema";

export type TitleNames = { native: string | null; romaji: string | null; english: string | null };

export type Level = "high" | "mid" | "low";
export type HeavyLevel = "none" | "little" | "some";

// Reasons on a result card, in priority order (see explain.ts).
export type Reason =
  | { key: "theme"; themes: ThemeKey[] } // the requested themes this title matches
  | { key: "popular"; topPct: number } // open requests: 「人気上位5%」
  | { key: "mood"; dim: Dimension; level: Level }
  | { key: "reference"; titles: TitleNames }
  | { key: "fitsTime"; minutes: number; whole: boolean } // whole: a movie that finishes within the time
  | { key: "completed" }
  | { key: "era"; era: "recent" | "classic"; year: number }
  | { key: "popularity"; popularity: "famous" | "hidden-gem"; score: number | null }
  | { key: "heavy"; level: HeavyLevel }
  | { key: "family" }
  | { key: "avoid"; keys: AvoidKey[] }
  | { key: "substantial" }
  | { key: "sequel" }
  | { key: "shortSeries"; episodes: number }
  | { key: "score"; score: number };

/** Stable, unique key for a reason (a card can have two "mood" reasons with different dims). */
export const reasonKey = (r: Reason): string => (r.key === "mood" ? `mood:${r.dim}` : r.key);

export type Notice =
  | { key: "referenceNotFound"; title: string }
  | { key: "relaxed" }
  | { key: "fewResults"; count: number };

// What a chip (or a chip choice / add option) says.
export type ChipLabel =
  | { kind: "mood"; mood: Mood }
  | { kind: "energy"; energy: "low" | "high" }
  | { kind: "time"; minutes: number }
  | { kind: "company"; company: NonNullable<Context["company"]> }
  | { kind: "avoid"; key: AvoidKey }
  | { kind: "reference"; title: string }
  | { kind: "theme"; theme: ThemeKey }
  | { kind: "format"; format: "movie" | "series" }
  | { kind: "completed" }
  | { kind: "era"; era: "recent" | "classic" }
  | { kind: "popularity"; popularity: "famous" | "hidden-gem" };

export type ChipGroup = "mood" | "themes" | "energy" | "time" | "company" | "filters" | "avoid";

// Quick picks: short, tappable labels. Most reuse chip labels; "binge" is a combination (weekend binge).
export type PickLabel = ChipLabel | { kind: "binge" };
export type PickGroup = "mood" | "time" | "company" | "filters" | "avoid";
