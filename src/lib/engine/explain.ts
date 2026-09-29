// src/lib/engine/explain.ts
// Reasons built only from facts: the title's data, its vector, and which constraints it satisfied.
// At most MAX_REASONS per card, most informative first. Runtime is shown on the card itself, not here.
import type { Title } from "@/lib/dataset";
import type { Query } from "@/lib/engine/query";
import type { Ranked } from "@/lib/engine/rank";
import { fitsTimeBudget } from "@/lib/engine/rank";
import { AVOID_MAP } from "@/data/avoidMap";
import { MOOD_DIMENSIONS, type Dimension } from "@/lib/vector";
import { DIMENSION_LABELS, displayTitle } from "@/lib/labels";

export const MAX_REASONS = 3;
export const MIN_LEVEL_TO_MENTION = 0.3; // don't cite a dimension the title barely has

export const level = (x: number): string => (x >= 0.6 ? "高" : x >= 0.3 ? "中" : "低");
export const heavyLevel = (x: number): string => (x < 0.25 ? "ほぼなし" : x < 0.5 ? "少なめ" : "あり");

export function formatRuntime(t: Pick<Title, "format" | "episodes" | "duration">): string {
  if (t.format === "MOVIE" || t.episodes === 1) return `映画・約${t.duration}分`;
  return `1話${t.duration}分 × ${t.episodes}話`;
}

/** Mood dimensions where target × title contributes most. */
export function topDimensions(t: Title, query: Query, n = 2): Dimension[] {
  return MOOD_DIMENSIONS.filter((d) => t.vector[d] >= MIN_LEVEL_TO_MENTION && query.target[d] > 0)
    .sort((a, b) => query.target[b] * t.vector[b] - query.target[a] * t.vector[a])
    .slice(0, n);
}

/**
 * Candidate reasons in priority order; the first MAX_REASONS are shown:
 * strongest mood → reference → constraints the user asked for → second mood → caveats → nice-to-know facts.
 */
export function explain({ title: t, score }: Ranked, query: Query): string[] {
  const [mood1, mood2] = topDimensions(t, query).map((d) => `${DIMENSION_LABELS[d]}：${level(t.vector[d])}`);
  const budget = query.timeBudgetMin;

  const candidates: (string | false | null | undefined)[] = [
    mood1,
    query.reference && `『${displayTitle(query.reference)}』に近い雰囲気`,
    budget != null && fitsTimeBudget(t, budget) && (t.episodes === 1 ? `${budget}分以内で見終わる` : `1話が${budget}分以内`),
    query.energy === "low" && `${DIMENSION_LABELS.heavy}：${heavyLevel(t.vector.heavy)}`,
    query.family && "家族で見やすい（過激な描写なし）",
    query.avoid.length > 0 && `${query.avoid.map((k) => AVOID_MAP[k].label).join("・")}なし`,
    query.energy === "high" && t.vector.heavy >= 0.5 && "見ごたえ：たっぷり",
    mood2,
    t.hasPrequelInDataset && "※続編です（前作あり）",
    score.shortSeriesBonus > 0 && `全${t.episodes}話で区切りやすい`,
    t.averageScore != null && `AniList評価 ${t.averageScore}点`,
  ];
  return candidates.filter((c): c is string => typeof c === "string").slice(0, MAX_REASONS);
}
