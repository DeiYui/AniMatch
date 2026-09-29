// src/lib/dataset.ts
// Loads src/data/anime.json once and derives everything the engine needs:
// vectors, franchise groups, "has an earlier season in the dataset", median score.
// Import only from server code (route handlers, scripts): the JSON is ~1.7MB.
import rawData from "@/data/anime.json";
import { AnimeSchema, type Anime } from "@/lib/anime/schema";
import { vectorizeAll } from "@/lib/vectorize";
import type { Vector } from "@/lib/vector";

export type Title = Anime & {
  vector: Vector;
  franchiseId: number; // smallest AniList id in the related group (within the dataset)
  hasPrequelInDataset: boolean;
};

/** Groups titles connected by SEQUEL/PREQUEL/PARENT/SIDE_STORY edges (union-find). */
export function franchiseIds(list: Anime[]): Map<number, number> {
  const ids = new Set(list.map((a) => a.id));
  const parent = new Map<number, number>(list.map((a) => [a.id, a.id]));
  const find = (x: number): number => {
    while (parent.get(x) !== x) {
      const up = parent.get(parent.get(x)!)!;
      parent.set(x, up);
      x = up;
    }
    return x;
  };
  for (const a of list) {
    for (const rel of a.relations) {
      if (!ids.has(rel.id)) continue;
      const [ra, rb] = [find(a.id), find(rel.id)];
      if (ra !== rb) parent.set(Math.max(ra, rb), Math.min(ra, rb));
    }
  }
  return new Map(list.map((a) => [a.id, find(a.id)]));
}

export function buildDataset(list: Anime[]): { titles: Title[]; medianScore: number } {
  const ids = new Set(list.map((a) => a.id));
  const { vectors } = vectorizeAll(list);
  const franchise = franchiseIds(list);

  const titles = list.map((a, i) => ({
    ...a,
    vector: vectors[i],
    franchiseId: franchise.get(a.id)!,
    hasPrequelInDataset: a.relations.some((r) => r.type === "PREQUEL" && ids.has(r.id)),
  }));

  const scores = list.flatMap((a) => (a.averageScore == null ? [] : [a.averageScore])).sort((a, b) => a - b);
  const medianScore = scores.length ? scores[Math.floor(scores.length / 2)] : 70;

  return { titles, medianScore };
}

// Re-validate the committed file so a hand edit or schema change fails loudly at startup.
export const DATASET = buildDataset(AnimeSchema.array().parse(rawData));
