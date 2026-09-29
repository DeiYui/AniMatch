// src/lib/engine/rank.ts
// Query → top titles: safety filters → soft constraints → score → diversity.
// If fewer than TOP_K survive, soft constraints are relaxed in order: mood floor, then time budget.
// Safety filters are never relaxed.
import type { Title } from "@/lib/dataset";
import type { Query } from "@/lib/engine/query";
import { cosineSimilarity, MOOD_DIMENSIONS } from "@/lib/vector";
import { isExcludedByDefault, isFamilyUnsafe, matchesAvoid } from "@/lib/engine/filters";

export const TOP_K = 3;

// score = 0.5 × cosine + 0.3 × intensity + 0.2 × quality, then the adjustments below.
export const COSINE_WEIGHT = 0.5; // direction: does the title have the right mix?
export const INTENSITY_WEIGHT = 0.3; // strength: how much of the requested moods does it have?
export const QUALITY_WEIGHT = 0.2;

export const LOW_ENERGY_HEAVY_PENALTY = 0.3; // energy low:  score -= heavy × this
export const HIGH_ENERGY_HEAVY_BONUS = 0.1; // energy high: score += heavy × this
export const PREQUEL_PENALTY = 0.05; // an earlier season is in the dataset → recommend where to start
export const SHORT_SERIES_BONUS = 0.05; // only while a time budget is being applied
export const SHORT_SERIES_MAX_EPISODES = 13;

export const PRIMARY_MOOD_FLOOR = 0.3; // soft: the title's value on the primary mood
export const DIVERSITY_MAX_COSINE = 0.95; // skip a candidate this similar to one already picked

// Weighted parts add up to total; cosine and intensity are also kept raw for display.
export type ScoreBreakdown = {
  cosine: number; // raw, 0..1, over mood dimensions
  intensity: number; // raw, 0..1
  similarity: number; // cosine × COSINE_WEIGHT
  strength: number; // intensity × INTENSITY_WEIGHT
  quality: number; // averageScore/100 × QUALITY_WEIGHT
  energy: number; // heavy penalty (low) or bonus (high)
  prequelPenalty: number; // ≤ 0
  shortSeriesBonus: number; // ≥ 0
  total: number;
};

export type Ranked = { title: Title; score: ScoreBreakdown };

export type RankResult = {
  results: Ranked[];
  relaxed: boolean; // any soft constraint was relaxed
  timeDropped: boolean; // the time budget was dropped (titles that fit are still listed first)
};

/** A movie fits if its length does; a series fits if one episode does. */
export const fitsTimeBudget = (t: Title, budgetMin: number): boolean => t.duration <= budgetMin;

const isShortSeries = (t: Title) => t.format !== "MOVIE" && t.episodes > 1 && t.episodes <= SHORT_SERIES_MAX_EPISODES;

/** Filters that are never relaxed: safe-by-default, family, avoid, the reference's franchise. */
export function passesSafetyFilters(t: Title, query: Query): boolean {
  if (isExcludedByDefault(t)) return false;
  if (query.family && isFamilyUnsafe(t)) return false;
  if (query.avoid.some((key) => matchesAvoid(t, key))) return false;
  if (query.reference && t.franchiseId === query.reference.franchiseId) return false;
  return true;
}

/** Weighted average of the title's values on the target's mood dimensions (weights = target). */
export function intensityOf(t: Title, query: Query): number {
  let sum = 0;
  let weights = 0;
  for (const d of MOOD_DIMENSIONS) {
    sum += query.target[d] * t.vector[d];
    weights += query.target[d];
  }
  return weights > 0 ? sum / weights : 0;
}

export function scoreTitle(t: Title, query: Query, medianScore: number, timeActive = true): ScoreBreakdown {
  const cosine = cosineSimilarity(query.target, t.vector, MOOD_DIMENSIONS);
  const intensity = intensityOf(t, query);
  const energy =
    query.energy === "low"
      ? -t.vector.heavy * LOW_ENERGY_HEAVY_PENALTY
      : query.energy === "high"
        ? t.vector.heavy * HIGH_ENERGY_HEAVY_BONUS
        : 0;
  const parts = {
    cosine,
    intensity,
    similarity: cosine * COSINE_WEIGHT,
    strength: intensity * INTENSITY_WEIGHT,
    quality: ((t.averageScore ?? medianScore) / 100) * QUALITY_WEIGHT,
    energy,
    prequelPenalty: t.hasPrequelInDataset ? -PREQUEL_PENALTY : 0,
    shortSeriesBonus: timeActive && query.timeBudgetMin != null && isShortSeries(t) ? SHORT_SERIES_BONUS : 0,
  };
  const total =
    parts.similarity + parts.strength + parts.quality + parts.energy + parts.prequelPenalty + parts.shortSeriesBonus;
  return { ...parts, total };
}

type SoftConstraints = { time: boolean; floor: boolean };

/** Every candidate that passes the filters, best first (before diversity). */
export function scoreAll(
  titles: Title[],
  query: Query,
  medianScore: number,
  soft: SoftConstraints = { time: true, floor: true },
): Ranked[] {
  const budget = soft.time ? query.timeBudgetMin : null;
  const floorMood = soft.floor ? query.primaryMood : null;
  return titles
    .filter(
      (t) =>
        passesSafetyFilters(t, query) &&
        (budget == null || fitsTimeBudget(t, budget)) &&
        (floorMood == null || t.vector[floorMood] >= PRIMARY_MOOD_FLOOR),
    )
    .map((title) => ({ title, score: scoreTitle(title, query, medianScore, soft.time) }))
    .sort((a, b) => b.score.total - a.score.total);
}

/** Greedy top-K on top of `picked`, skipping same-franchise and near-duplicate candidates. */
export function pickDiverse(sorted: Ranked[], k = TOP_K, picked: Ranked[] = []): Ranked[] {
  const out = [...picked];
  for (const c of sorted) {
    if (out.length >= k) break;
    const tooClose = out.some(
      (p) =>
        p.title.franchiseId === c.title.franchiseId ||
        cosineSimilarity(p.title.vector, c.title.vector) > DIVERSITY_MAX_COSINE,
    );
    if (!tooClose) out.push(c);
  }
  return out;
}

export function rank(titles: Title[], query: Query, medianScore: number): RankResult {
  const hasTime = query.timeBudgetMin != null;
  const hasFloor = query.primaryMood != null;

  // 1. Everything applied.
  let results = pickDiverse(scoreAll(titles, query, medianScore, { time: hasTime, floor: hasFloor }));
  if (results.length >= TOP_K) return { results, relaxed: false, timeDropped: false };

  // 2. Drop the mood floor (a system heuristic, so it goes before anything the user said).
  if (hasFloor) {
    results = pickDiverse(scoreAll(titles, query, medianScore, { time: hasTime, floor: false }));
    if (results.length >= TOP_K || !hasTime) return { results, relaxed: true, timeDropped: false };
  }
  if (!hasTime) return { results, relaxed: hasFloor, timeDropped: false };

  // 3. Drop the time budget: titles that fit still come first, then fill. No short-series bonus from here on.
  const all = scoreAll(titles, query, medianScore, { time: false, floor: false });
  const budget = query.timeBudgetMin!;
  const fitting = pickDiverse(all.filter((r) => fitsTimeBudget(r.title, budget)));
  results = pickDiverse(all.filter((r) => !fitsTimeBudget(r.title, budget)), TOP_K, fitting);
  return { results, relaxed: true, timeDropped: true };
}
