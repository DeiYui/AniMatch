// src/lib/engine/query.ts
// Context → Query: a target vector plus the constraints rank() needs. Fixed mapping, no LLM.
import type { Context, Mood } from "@/lib/context/schema";
import type { Title } from "@/lib/dataset";
import type { AvoidKey } from "@/data/avoidMap";
import type { ThemeKey } from "@/data/themes";
import type { Notice } from "@/lib/messages";
import { addVectors, scaleVector, unitVector, zeroVector, type Vector } from "@/lib/vector";

// Share of the reference title's vector in the target when moods are also stated.
// With no stated mood, the reference alone is the target.
export const REFERENCE_SHARE = 0.5;

export type Query = {
  target: Vector; // mood dimensions only; heavy is always 0. All zero when no mood and no reference.
  energy: Context["energy"];
  primaryMood: Mood | null; // for the soft floor; null when moods are only the default
  timeBudgetMin: number | null;
  family: boolean;
  avoid: AvoidKey[];
  reference: Title | null;
  format: Context["format"]; // hard filter
  completedOnly: boolean; // hard filter
  era: Context["era"]; // soft bonus
  popularity: Context["popularity"]; // soft bonus
  themes: ThemeKey[]; // what it should be about
  notices: Notice[]; // shown to the user, e.g. reference not found
};

export const isDefaultMoods = (moods: Context["moods"]) =>
  moods.length === 1 && moods[0].type === "relax" && moods[0].weight === 0.5;

/** Target from the stated moods, before any reference blending. Default moods mean "none stated" → zero. */
export function moodVector(context: Context): Vector {
  const v = zeroVector();
  if (isDefaultMoods(context.moods)) return v;
  for (const m of context.moods) v[m.type] = Math.max(v[m.type], m.weight);
  return v;
}

/** NFKC, lowercase, no spaces/punctuation/symbols. */
export const normalizeName = (s: string): string =>
  s.normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");

const namesOf = (t: Title): string[] =>
  [t.title.native, t.title.romaji, t.title.english, ...t.synonyms].flatMap((n) => (n ? [normalizeName(n)] : []));

// Among several matches prefer the franchise's starting point, then the most popular.
const bestOf = (matches: Title[]): Title | null =>
  [...matches].sort(
    (a, b) => Number(a.hasPrequelInDataset) - Number(b.hasPrequelInDataset) || b.popularity - a.popularity,
  )[0] ?? null;

/** Exact normalized match first, then substring (unless exactOnly). No fuzzy matching. */
export function findTitle(name: string, titles: Title[], { exactOnly = false } = {}): Title | null {
  const q = normalizeName(name);
  if (!q) return null;
  const exact = titles.filter((t) => namesOf(t).includes(q));
  if (exact.length) return bestOf(exact);
  if (exactOnly || q.length < 2) return null;
  return bestOf(titles.filter((t) => namesOf(t).some((n) => n.includes(q))));
}

export function contextToQuery(context: Context, titles: Title[]): Query {
  const notices: Notice[] = [];
  const defaultMoods = isDefaultMoods(context.moods);
  let target = moodVector(context);

  let reference: Title | null = null;
  if (context.referenceTitle) {
    reference = findTitle(context.referenceTitle, titles);
    if (reference) {
      const share = defaultMoods ? 1 : REFERENCE_SHARE;
      const refMoods = { ...reference.vector, heavy: 0 };
      // Blend unit vectors so the share means the same thing regardless of magnitudes.
      target = addVectors(scaleVector(unitVector(target), 1 - share), scaleVector(unitVector(refMoods), share));
    } else {
      notices.push({ key: "referenceNotFound", title: context.referenceTitle });
    }
  }

  return {
    target,
    energy: context.energy,
    primaryMood: defaultMoods ? null : context.moods[0].type,
    timeBudgetMin: context.timeBudgetMin,
    family: context.company === "family",
    avoid: context.avoid,
    reference,
    format: context.format,
    completedOnly: context.completedOnly,
    era: context.era,
    popularity: context.popularity,
    themes: context.themes,
    notices,
  };
}
