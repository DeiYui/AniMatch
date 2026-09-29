// src/lib/vectorize.ts
// Title → vector, using the mapping table in src/data/tagMapping.ts.
import type { Anime } from "@/lib/anime/schema";
import { GENRE_WEIGHTS, TAG_WEIGHTS } from "@/data/tagMapping";
import { DIMENSIONS, zeroVector, type Vector } from "@/lib/vector";

export const GENRE_RANK = 60; // genres have no rank; keep broad genres below strong tags
export const MIN_TAG_RANK = 40; // weaker tags are noise
export const NORMALIZE_PERCENTILE = 0.99; // each dim is divided by this percentile over the dataset

// heavy = tags + runtime
export const HEAVY_TAG_SHARE = 0.7;
export const HEAVY_RUNTIME_SHARE = 0.3;
export const HEAVY_RUNTIME_CAP_MIN = 900; // ≈ 3 cours; total runtime at or above this counts as fully heavy

/** Unnormalized sum of weights × rank/100. Not clamped; can be negative. */
export function rawVector(anime: Anime): Vector {
  const v = zeroVector();
  const add = (weights: Partial<Vector> | undefined, rank: number) => {
    if (!weights) return;
    for (const [dim, w] of Object.entries(weights) as [keyof Vector, number][]) {
      v[dim] += w * (rank / 100);
    }
  };
  for (const genre of anime.genres) add(GENRE_WEIGHTS[genre], GENRE_RANK);
  for (const tag of anime.tags) {
    if (tag.rank >= MIN_TAG_RANK) add(TAG_WEIGHTS[tag.name], tag.rank);
  }
  return v;
}

/** 0..1, linear in total minutes, capped. */
export const runtimeHeaviness = (anime: Anime): number =>
  Math.min(1, (anime.episodes * anime.duration) / HEAVY_RUNTIME_CAP_MIN);

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Vectors for the whole dataset (normalization needs every title).
 * Returns vectors in the same order as `list`, plus the per-dim scale used.
 */
export function vectorizeAll(list: Anime[]): { vectors: Vector[]; scale: Vector } {
  const raws = list.map(rawVector);

  const scale = zeroVector();
  for (const dim of DIMENSIONS) {
    const p = percentile(raws.map((r) => r[dim]), NORMALIZE_PERCENTILE);
    scale[dim] = p > 0 ? p : 1;
  }

  const vectors = raws.map((raw, i) => {
    const v = zeroVector();
    for (const dim of DIMENSIONS) v[dim] = clamp01(raw[dim] / scale[dim]);
    v.heavy = HEAVY_TAG_SHARE * v.heavy + HEAVY_RUNTIME_SHARE * runtimeHeaviness(list[i]);
    return v;
  });

  return { vectors, scale };
}
