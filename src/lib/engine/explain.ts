// src/lib/engine/explain.ts
// Reasons built only from facts: the title's data, its vector, and which constraints it satisfied.
// Returns language-neutral Reason objects (src/lib/messages.ts); the UI renders them per language.
// At most MAX_REASONS per card, most informative first. Runtime is shown on the card itself, not here.
import type { Title } from "@/lib/dataset";
import type { Query } from "@/lib/engine/query";
import type { Ranked } from "@/lib/engine/rank";
import { fitsTimeBudget, matchedThemes, matchesEra, matchesPopularity } from "@/lib/engine/rank";
import { reasonKey, type HeavyLevel, type Level, type Reason } from "@/lib/messages";
import { MOOD_DIMENSIONS, type Dimension } from "@/lib/vector";

export const MAX_REASONS = 3;
export const MIN_LEVEL_TO_MENTION = 0.3; // don't cite a dimension the title barely has

export const level = (x: number): Level => (x >= 0.6 ? "high" : x >= 0.3 ? "mid" : "low");
export const heavyLevel = (x: number): HeavyLevel => (x < 0.25 ? "none" : x < 0.5 ? "little" : "some");

export const titleNames = (t: Pick<Title, "title">) => ({ ...t.title });

/** The title the user searched for by name: its own strongest moods, plus its score. */
export function explainSearched(t: Title): Reason[] {
  const dims = MOOD_DIMENSIONS.filter((d) => t.vector[d] >= MIN_LEVEL_TO_MENTION)
    .sort((a, b) => t.vector[b] - t.vector[a])
    .slice(0, 2)
    .map((d): Reason => ({ key: "mood", dim: d, level: level(t.vector[d]) }));
  return [...dims, ...(t.averageScore != null ? [{ key: "score", score: t.averageScore } as Reason] : [])].slice(0, MAX_REASONS);
}

/** Mood dimensions where target × title contributes most. */
export function topDimensions(t: Title, query: Query, n = 2): Dimension[] {
  return MOOD_DIMENSIONS.filter((d) => t.vector[d] >= MIN_LEVEL_TO_MENTION && query.target[d] > 0)
    .sort((a, b) => query.target[b] * t.vector[b] - query.target[a] * t.vector[a])
    .slice(0, n);
}

/**
 * Candidate reasons in priority order; the first MAX_REASONS are kept:
 * requested themes it matches → strongest mood → reference → constraints the user asked for (time, completed, era,
 * popularity, energy, family, avoid) → second mood → caveats → nice-to-know facts.
 * For open requests (「なんでもいい」) the popularity rank and score come first: that's why it was picked.
 */
export function explain({ title: t, score }: Ranked, query: Query): Reason[] {
  const [mood1, mood2] = topDimensions(t, query).map((d): Reason => ({ key: "mood", dim: d, level: level(t.vector[d]) }));
  const budget = query.timeBudgetMin;

  const themes = matchedThemes(t, query.themes).slice(0, 2);
  const open = score.mode === "open";
  const candidates: (Reason | false | null | undefined)[] = [
    themes.length > 0 && { key: "theme", themes },
    open && { key: "popular", topPct: Math.max(1, Math.ceil(t.popularityPct * 100)) },
    open && t.averageScore != null && { key: "score", score: t.averageScore },
    mood1,
    query.reference && { key: "reference", titles: titleNames(query.reference) },
    budget != null && fitsTimeBudget(t, budget) && { key: "fitsTime", minutes: budget, whole: t.episodes === 1 },
    query.completedOnly && { key: "completed" },
    query.era !== "any" && t.year != null && matchesEra(t, query.era) && { key: "era", era: query.era, year: t.year },
    query.popularity !== "any" &&
      matchesPopularity(t, query.popularity) && { key: "popularity", popularity: query.popularity, score: t.averageScore },
    query.energy === "low" && { key: "heavy", level: heavyLevel(t.vector.heavy) },
    query.family && { key: "family" },
    query.avoid.length > 0 && { key: "avoid", keys: query.avoid },
    query.energy === "high" && t.vector.heavy >= 0.5 && { key: "substantial" },
    mood2,
    t.hasPrequelInDataset && { key: "sequel" },
    score.shortSeriesBonus > 0 && { key: "shortSeries", episodes: t.episodes },
    t.averageScore != null && { key: "score", score: t.averageScore },
  ];
  // First occurrence wins, so a reason promoted to the front (e.g. the score for open requests) isn't repeated.
  const seen = new Set<string>();
  return candidates
    .filter((c): c is Reason => !!c)
    .filter((r) => !seen.has(reasonKey(r)) && !!seen.add(reasonKey(r)))
    .slice(0, MAX_REASONS);
}
