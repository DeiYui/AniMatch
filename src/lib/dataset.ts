// src/lib/dataset.ts
// Loads src/data/anime.json once and derives everything the engine needs:
// vectors, franchise groups, "has an earlier season in the dataset", median score.
// Import only from server code (route handlers, scripts): the JSON is ~1.7MB.
import { existsSync } from "node:fs";
import { join } from "node:path";
import rawData from "@/data/anime.json";
import { AnimeSchema, type Anime } from "@/lib/anime/schema";
import { vectorizeAll } from "@/lib/vectorize";
import type { Vector } from "@/lib/vector";

export type Title = Anime & {
  vector: Vector;
  franchiseId: number; // smallest AniList id in the related group (within the dataset)
  hasPrequelInDataset: boolean;
  popularityPct: number; // 0 = most popular title in the dataset, → 1 = least popular
  localCover: string | null; // "/covers/<id>.webp" if `npm run fetch:covers` saved it
};

const localCoverPath = (id: number): string | null =>
  existsSync(join(process.cwd(), "public", "covers", `${id}.webp`)) ? `/covers/${id}.webp` : null;

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

  const byPopularity = [...list].sort((a, b) => b.popularity - a.popularity).map((a) => a.id);
  const popularityRank = new Map(byPopularity.map((id, i) => [id, i]));

  const titles = list.map((a, i) => ({
    ...a,
    vector: vectors[i],
    franchiseId: franchise.get(a.id)!,
    hasPrequelInDataset: a.relations.some((r) => r.type === "PREQUEL" && ids.has(r.id)),
    popularityPct: list.length > 1 ? popularityRank.get(a.id)! / (list.length - 1) : 0,
    localCover: localCoverPath(a.id),
  }));

  const scores = list.flatMap((a) => (a.averageScore == null ? [] : [a.averageScore])).sort((a, b) => a - b);
  const medianScore = scores.length ? scores[Math.floor(scores.length / 2)] : 70;

  return { titles, medianScore };
}

// Re-validate the committed file so a hand edit or schema change fails loudly at startup.
export const DATASET = buildDataset(AnimeSchema.array().parse(rawData));
