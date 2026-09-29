// src/lib/engine/rank.ts
// Query → top titles: safety filters → time filter → score → diversity.
// If fewer than TOP_K survive, only the time budget is relaxed (safety filters never are).
import type { Title } from "@/lib/dataset";
import type { Query } from "@/lib/engine/query";
import { cosineSimilarity } from "@/lib/vector";
import { isExcludedByDefault, isFamilyUnsafe, matchesAvoid } from "@/lib/engine/filters";

export const TOP_K = 3;
export const COSINE_WEIGHT = 0.8;
export const QUALITY_WEIGHT = 0.2;
export const PREQUEL_PENALTY = 0.05; // an earlier season is in the dataset → recommend where to start
export const SHORT_SERIES_BONUS = 0.05; // only when a time budget is set
export const SHORT_SERIES_MAX_EPISODES = 13;
export const DIVERSITY_MAX_COSINE = 0.95; // skip a candidate this similar to one already picked

// Each part is already weighted; total = sum of the parts.
export type ScoreBreakdown = {
  cosine: number; // raw cosine(target, title), 0..1
  similarity: number; // cosine × COSINE_WEIGHT
  quality: number; // averageScore/100 × QUALITY_WEIGHT
  heavyPenalty: number; // ≤ 0
  prequelPenalty: number; // ≤ 0
  shortSeriesBonus: number; // ≥ 0
  total: number;
};

export type Ranked = { title: Title; score: ScoreBreakdown };

export type RankResult = {
  results: Ranked[];
  relaxed: boolean; // the time budget had to be dropped
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

export function scoreTitle(t: Title, query: Query, medianScore: number): ScoreBreakdown {
  const cosine = cosineSimilarity(query.target, t.vector);
  const parts = {
    cosine,
    similarity: cosine * COSINE_WEIGHT,
    quality: ((t.averageScore ?? medianScore) / 100) * QUALITY_WEIGHT,
    heavyPenalty: -t.vector.heavy * query.heavyPenalty,
    prequelPenalty: t.hasPrequelInDataset ? -PREQUEL_PENALTY : 0,
    shortSeriesBonus: query.timeBudgetMin != null && isShortSeries(t) ? SHORT_SERIES_BONUS : 0,
  };
  const total = parts.similarity + parts.quality + parts.heavyPenalty + parts.prequelPenalty + parts.shortSeriesBonus;
  return { ...parts, total };
}

/** Every candidate that passes the filters, best first (before diversity). */
export function scoreAll(titles: Title[], query: Query, medianScore: number, useTimeBudget = true): Ranked[] {
  const budget = useTimeBudget ? query.timeBudgetMin : null;
  return titles
    .filter((t) => passesSafetyFilters(t, query) && (budget == null || fitsTimeBudget(t, budget)))
    .map((title) => ({ title, score: scoreTitle(title, query, medianScore) }))
    .sort((a, b) => b.score.total - a.score.total);
}

/** Greedy top-K, skipping same-franchise and near-duplicate candidates. */
export function pickDiverse(sorted: Ranked[], k = TOP_K): Ranked[] {
  const picked: Ranked[] = [];
  for (const c of sorted) {
    if (picked.length >= k) break;
    const tooClose = picked.some(
      (p) =>
        p.title.franchiseId === c.title.franchiseId ||
        cosineSimilarity(p.title.vector, c.title.vector) > DIVERSITY_MAX_COSINE,
    );
    if (!tooClose) picked.push(c);
  }
  return picked;
}

export function rank(titles: Title[], query: Query, medianScore: number): RankResult {
  const strict = pickDiverse(scoreAll(titles, query, medianScore, true));
  if (strict.length >= TOP_K || query.timeBudgetMin == null) return { results: strict, relaxed: false };

  const relaxed = pickDiverse(scoreAll(titles, query, medianScore, false));
  return { results: relaxed, relaxed: true };
}
