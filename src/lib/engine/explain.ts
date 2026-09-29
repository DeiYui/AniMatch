// src/lib/engine/explain.ts
// Reasons built only from facts: the title's data, its vector, and which constraints it satisfied.
import type { Title } from "@/lib/dataset";
import type { Query } from "@/lib/engine/query";
import type { Ranked } from "@/lib/engine/rank";
import { fitsTimeBudget } from "@/lib/engine/rank";
import { AVOID_MAP } from "@/data/avoidMap";
import { DIMENSIONS, type Dimension } from "@/lib/vector";
import { DIMENSION_LABELS, displayTitle } from "@/lib/labels";

export const REASON_DIMENSIONS = 2; // how many "top contributing dimension" reasons to show
export const MIN_LEVEL_TO_MENTION = 0.3; // don't cite a dimension the title barely has

export const level = (x: number): string => (x >= 0.6 ? "高" : x >= 0.3 ? "中" : "低");
export const heavyLevel = (x: number): string => (x < 0.25 ? "ほぼなし" : x < 0.5 ? "少なめ" : "あり");

export function formatRuntime(t: Title): string {
  if (t.format === "MOVIE" || t.episodes === 1) return `映画・約${t.duration}分`;
  return `1話${t.duration}分 × ${t.episodes}話`;
}

/** Dimensions (excluding heavy) where target × title contributes most. */
export function topDimensions(t: Title, query: Query, n = REASON_DIMENSIONS): Dimension[] {
  return DIMENSIONS.filter((d) => d !== "heavy" && t.vector[d] >= MIN_LEVEL_TO_MENTION && query.target[d] > 0)
    .sort((a, b) => query.target[b] * t.vector[b] - query.target[a] * t.vector[a])
    .slice(0, n);
}

export function explain({ title: t, score }: Ranked, query: Query, relaxed: boolean): string[] {
  const reasons = [formatRuntime(t)];

  for (const d of topDimensions(t, query)) reasons.push(`${DIMENSION_LABELS[d]}：${level(t.vector[d])}`);

  if (query.heavyPenalty > 0) reasons.push(`${DIMENSION_LABELS.heavy}：${heavyLevel(t.vector.heavy)}`);
  if (query.reference) reasons.push(`『${displayTitle(query.reference)}』に近い雰囲気`);
  if (query.timeBudgetMin != null && !relaxed && fitsTimeBudget(t, query.timeBudgetMin)) {
    reasons.push(t.episodes === 1 ? `${query.timeBudgetMin}分以内で見終わる` : `1話が${query.timeBudgetMin}分以内`);
  }
  if (score.shortSeriesBonus > 0) reasons.push(`全${t.episodes}話で区切りやすい`);
  if (query.family) reasons.push("家族で見やすい（過激な描写なし）");
  if (query.avoid.length) reasons.push(`${query.avoid.map((k) => AVOID_MAP[k].label).join("・")}なし`);
  if (t.averageScore != null) reasons.push(`AniList評価 ${t.averageScore}点`);
  if (t.hasPrequelInDataset) reasons.push("※続編です（前作あり）");

  return reasons;
}
