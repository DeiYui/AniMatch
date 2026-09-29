// src/lib/engine/rank.ts
// Query → top titles: hard filters → soft constraints → score → diversity.
// If fewer than TOP_K survive, soft constraints are relaxed in order: mood floor, time budget, theme floor.
// Hard filters (safety, avoid, format, completed-only) are never relaxed.
import type { Title } from "@/lib/dataset";
import type { Query } from "@/lib/engine/query";
import { THEMES, type ThemeKey } from "@/data/themes";
import { cosineSimilarity, MOOD_DIMENSIONS } from "@/lib/vector";
import { isExcludedByDefault, isFamilyUnsafe, matchesAvoid } from "@/lib/engine/filters";

export const TOP_K = 3; // results per page; relaxation kicks in below this
export const MAX_RESULTS = 9; // 「もっと見る」 adds TOP_K at a time up to this

/**
 * Scoring mode, from what the user actually asked for (never from a default):
 *   moods          — moods (or a reference title) only
 *   moodsAndThemes — moods + themes
 *   themes         — themes, no mood: rank mainly by theme match + quality
 *   open           — nothing specific (「なんでもいい」): popular, high-rated titles
 * Each mode's weights sum to 1, then the adjustments below are added.
 *   cosine    direction: does the title have the right mix of moods?
 *   intensity strength: how much of the requested moods does it have?
 *   theme     how strongly it is about the requested themes (tag rank)
 *   quality   AniList averageScore / 100
 *   fame      popularity within the dataset (1 = most popular)
 */
export type ScoringMode = "moods" | "moodsAndThemes" | "themes" | "open";
export type Weights = { cosine: number; intensity: number; theme: number; quality: number; fame: number };
export const MODE_WEIGHTS: Record<ScoringMode, Weights> = {
  moods: { cosine: 0.5, intensity: 0.3, theme: 0, quality: 0.2, fame: 0 },
  moodsAndThemes: { cosine: 0.35, intensity: 0.2, theme: 0.3, quality: 0.15, fame: 0 },
  themes: { cosine: 0, intensity: 0, theme: 0.7, quality: 0.3, fame: 0 },
  open: { cosine: 0, intensity: 0, theme: 0, quality: 0.6, fame: 0.4 },
};
export const INTENSITY_TOP_DIMENSIONS = 2; // intensity only looks at the target's strongest dims (see intensityOf)

// Themes: a title's match for a theme is its strongest matching tag rank / 100; a matching genre counts as this.
export const THEME_GENRE_RANK = 70;
export const THEME_FLOOR = 0.5; // soft: at least one requested theme must match at least this well

export const LOW_ENERGY_HEAVY_PENALTY = 0.3; // energy low:  score -= heavy × this
export const HIGH_ENERGY_HEAVY_BONUS = 0.1; // energy high: score += heavy × this
export const PREQUEL_PENALTY = 0.15; // an earlier season is in the dataset → recommend where to start
export const SHORT_SERIES_BONUS = 0.05; // only while a time budget is being applied
export const SHORT_SERIES_MAX_EPISODES = 13;
export const LONG_SERIES_PENALTY = 0.05; // no time budget and energy not high: very long series are a big ask
export const LONG_SERIES_MIN_EPISODES = 100; // penalty applies above this many episodes

// era / popularity preferences: small bonuses, not filters.
export const REFERENCE_YEAR = new Date().getFullYear();
export const RECENT_YEARS = 5; // "recent" = year ≥ REFERENCE_YEAR − 5
export const CLASSIC_MAX_YEAR = 2010; // "classic" = year ≤ 2010
export const ERA_BONUS = 0.08;
export const FAMOUS_TOP_SHARE = 0.2; // "famous" = top 20% by popularity in the dataset
export const HIDDEN_GEM_MIN_POPULARITY_PCT = 0.5; // "hidden gem" = less popular half …
export const HIDDEN_GEM_MIN_SCORE = 78; // … with a high AniList score
export const POPULARITY_BONUS = 0.08;

export const PRIMARY_MOOD_FLOOR = 0.3; // soft: the title's value on the primary mood
export const DIVERSITY_MAX_COSINE = 0.97; // skip a candidate this similar to one already picked

// Weighted parts add up to total; the raw 0..1 values are kept for display.
export type ScoreBreakdown = {
  mode: ScoringMode;
  cosine: number; // raw, 0..1, over mood dimensions
  intensity: number; // raw, 0..1
  themeMatch: number; // raw, 0..1
  qualityRaw: number; // raw, averageScore / 100
  fame: number; // raw, 1 − popularityPct
  similarity: number; // cosine × weight
  strength: number; // intensity × weight
  themePart: number; // themeMatch × weight
  quality: number; // qualityRaw × weight
  famePart: number; // fame × weight
  energy: number; // heavy penalty (low) or bonus (high)
  prequelPenalty: number; // ≤ 0
  longSeriesPenalty: number; // ≤ 0
  shortSeriesBonus: number; // ≥ 0
  eraBonus: number; // ≥ 0
  popularityBonus: number; // ≥ 0
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

export const isMovie = (t: Pick<Title, "format">) => t.format === "MOVIE";
export const isRecent = (t: Pick<Title, "year">) => t.year != null && t.year >= REFERENCE_YEAR - RECENT_YEARS;
export const isClassic = (t: Pick<Title, "year">) => t.year != null && t.year <= CLASSIC_MAX_YEAR;
export const isFamous = (t: Pick<Title, "popularityPct">) => t.popularityPct < FAMOUS_TOP_SHARE;
export const isHiddenGem = (t: Pick<Title, "popularityPct" | "averageScore">) =>
  t.popularityPct >= HIDDEN_GEM_MIN_POPULARITY_PCT && (t.averageScore ?? 0) >= HIDDEN_GEM_MIN_SCORE;

export const matchesEra = (t: Title, era: Query["era"]) => (era === "recent" ? isRecent(t) : era === "classic" ? isClassic(t) : false);
export const matchesPopularity = (t: Title, p: Query["popularity"]) =>
  p === "famous" ? isFamous(t) : p === "hidden-gem" ? isHiddenGem(t) : false;

/**
 * Filters that are never relaxed: safe-by-default, family, avoid, the reference's franchise,
 * and the user's explicit format / completed-only choices.
 */
export function passesHardFilters(t: Title, query: Query): boolean {
  if (isExcludedByDefault(t)) return false;
  if (query.format === "movie" && !isMovie(t)) return false;
  if (query.format === "series" && isMovie(t)) return false;
  if (query.completedOnly && t.status !== "FINISHED") return false;
  if (query.family && isFamilyUnsafe(t)) return false;
  if (query.avoid.some((key) => matchesAvoid(t, key))) return false;
  if (query.reference && t.franchiseId === query.reference.franchiseId) return false;
  return true;
}

/**
 * Weighted average of the title's values on the target's top INTENSITY_TOP_DIMENSIONS mood dims (weights = target).
 * Only the top dims: with a spread-out target (e.g. a reference title), averaging over every dim rewards
 * titles that are high on everything, which brings back the "flat vector" problem.
 */
export function intensityOf(t: Title, query: Query): number {
  const top = MOOD_DIMENSIONS.filter((d) => query.target[d] > 0)
    .sort((a, b) => query.target[b] - query.target[a])
    .slice(0, INTENSITY_TOP_DIMENSIONS);
  let sum = 0;
  let weights = 0;
  for (const d of top) {
    sum += query.target[d] * t.vector[d];
    weights += query.target[d];
  }
  return weights > 0 ? sum / weights : 0;
}

/** How strongly a title is about one theme, 0..1 (strongest matching tag rank; a genre counts as THEME_GENRE_RANK). */
export function themeScore(t: Title, theme: ThemeKey): number {
  const def = THEMES[theme];
  let best = def.genres?.some((g) => t.genres.includes(g)) ? THEME_GENRE_RANK : 0;
  for (const tag of t.tags) if (def.tags?.includes(tag.name)) best = Math.max(best, tag.rank);
  return best / 100;
}

/** Average match over the requested themes (0 if none requested). */
export function themeMatch(t: Title, themes: ThemeKey[]): number {
  return themes.length ? themes.reduce((sum, th) => sum + themeScore(t, th), 0) / themes.length : 0;
}

/** The themes a title matches at least THEME_FLOOR, best first. */
export const matchedThemes = (t: Title, themes: ThemeKey[]): ThemeKey[] =>
  themes.filter((th) => themeScore(t, th) >= THEME_FLOOR).sort((a, b) => themeScore(t, b) - themeScore(t, a));

export function scoringMode(query: Query): ScoringMode {
  const hasMoodTarget = MOOD_DIMENSIONS.some((d) => query.target[d] > 0);
  const hasThemes = query.themes.length > 0;
  return hasMoodTarget ? (hasThemes ? "moodsAndThemes" : "moods") : hasThemes ? "themes" : "open";
}

export function scoreTitle(t: Title, query: Query, medianScore: number, timeActive = true): ScoreBreakdown {
  const mode = scoringMode(query);
  const w = MODE_WEIGHTS[mode];
  const cosine = cosineSimilarity(query.target, t.vector, MOOD_DIMENSIONS);
  const intensity = intensityOf(t, query);
  const theme = themeMatch(t, query.themes);
  const qualityRaw = (t.averageScore ?? medianScore) / 100;
  const fame = 1 - t.popularityPct;
  const energy =
    query.energy === "low"
      ? -t.vector.heavy * LOW_ENERGY_HEAVY_PENALTY
      : query.energy === "high"
        ? t.vector.heavy * HIGH_ENERGY_HEAVY_BONUS
        : 0;
  const parts = {
    mode,
    cosine,
    intensity,
    themeMatch: theme,
    qualityRaw,
    fame,
    similarity: cosine * w.cosine,
    strength: intensity * w.intensity,
    themePart: theme * w.theme,
    quality: qualityRaw * w.quality,
    famePart: fame * w.fame,
    energy,
    prequelPenalty: t.hasPrequelInDataset ? -PREQUEL_PENALTY : 0,
    longSeriesPenalty:
      query.timeBudgetMin == null && query.energy !== "high" && t.episodes > LONG_SERIES_MIN_EPISODES
        ? -LONG_SERIES_PENALTY
        : 0,
    shortSeriesBonus: timeActive && query.timeBudgetMin != null && isShortSeries(t) ? SHORT_SERIES_BONUS : 0,
    eraBonus: matchesEra(t, query.era) ? ERA_BONUS : 0,
    popularityBonus: matchesPopularity(t, query.popularity) ? POPULARITY_BONUS : 0,
  };
  const total =
    parts.similarity +
    parts.strength +
    parts.themePart +
    parts.quality +
    parts.famePart +
    parts.energy +
    parts.prequelPenalty +
    parts.longSeriesPenalty +
    parts.shortSeriesBonus +
    parts.eraBonus +
    parts.popularityBonus;
  return { ...parts, total };
}

type SoftConstraints = { time: boolean; floor: boolean; themeFloor: boolean };

/** Every candidate that passes the filters, best first (before diversity). */
export function scoreAll(
  titles: Title[],
  query: Query,
  medianScore: number,
  soft: SoftConstraints = { time: true, floor: true, themeFloor: true },
): Ranked[] {
  const budget = soft.time ? query.timeBudgetMin : null;
  const floorMood = soft.floor ? query.primaryMood : null;
  const floorThemes = soft.themeFloor ? query.themes : [];
  return titles
    .filter(
      (t) =>
        passesHardFilters(t, query) &&
        (budget == null || fitsTimeBudget(t, budget)) &&
        (floorMood == null || t.vector[floorMood] >= PRIMARY_MOOD_FLOOR) &&
        (floorThemes.length === 0 || floorThemes.some((th) => themeScore(t, th) >= THEME_FLOOR)),
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

/**
 * Up to `limit` results (TOP_K, or more for 「もっと見る」). Whether to relax is decided on the first TOP_K only,
 * so asking for more never changes the first page.
 */
export function rank(titles: Title[], query: Query, medianScore: number, limit = TOP_K): RankResult {
  const k = Math.min(Math.max(limit, TOP_K), MAX_RESULTS);
  const applies = { time: query.timeBudgetMin != null, floor: query.primaryMood != null, themeFloor: query.themes.length > 0 };

  // Relaxation order: the mood floor (a system heuristic) first, then the time budget, then the theme floor
  // (a theme is what the user asked the show to be about, so it goes last).
  const stages: SoftConstraints[] = [
    { ...applies },
    { ...applies, floor: false },
    { ...applies, floor: false, time: false },
    { floor: false, time: false, themeFloor: false },
  ];
  const seen = new Set<string>();
  const distinct = stages.filter((st) => !seen.has(JSON.stringify(st)) && seen.add(JSON.stringify(st)));

  let results: Ranked[] = [];
  for (const [i, stage] of distinct.entries()) {
    const timeDropped = applies.time && !stage.time;
    const all = scoreAll(titles, query, medianScore, stage);
    if (timeDropped) {
      // Titles that fit the time budget still come first, then fill. No short-series bonus from here on.
      const budget = query.timeBudgetMin!;
      const fitting = pickDiverse(all.filter((r) => fitsTimeBudget(r.title, budget)), k);
      results = pickDiverse(all.filter((r) => !fitsTimeBudget(r.title, budget)), k, fitting);
    } else {
      results = pickDiverse(all, k);
    }
    if (results.length >= TOP_K || i === distinct.length - 1) return { results, relaxed: i > 0, timeDropped };
  }
  return { results, relaxed: false, timeDropped: false };
}
