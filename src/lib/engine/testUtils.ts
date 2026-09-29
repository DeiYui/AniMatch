// src/lib/engine/testUtils.ts
// Test-only helpers: hand-built titles and contexts, so tests don't depend on anime.json.
import type { Title } from "@/lib/dataset";
import type { Context } from "@/lib/context/schema";
import { zeroVector, type Vector } from "@/lib/vector";

let nextId = 1;

export function makeTitle(over: Partial<Omit<Title, "vector">> & { vector?: Partial<Vector> } = {}): Title {
  const id = over.id ?? nextId++;
  const { vector, ...rest } = over;
  return {
    id,
    title: { native: `作品${id}`, romaji: `Title ${id}`, english: null },
    synonyms: [],
    genres: ["Comedy"],
    tags: [],
    format: "TV",
    episodes: 12,
    duration: 24,
    averageScore: 70,
    popularity: 1000,
    coverImage: "https://s4.anilist.co/x.jpg",
    siteUrl: `https://anilist.co/anime/${id}`,
    relations: [],
    franchiseId: id,
    hasPrequelInDataset: false,
    ...rest,
    vector: { ...zeroVector(), ...vector },
  };
}

export function makeContext(over: Partial<Context> = {}): Context {
  return {
    moods: [{ type: "laugh", weight: 1 }],
    energy: "mid",
    timeBudgetMin: null,
    company: null,
    avoid: [],
    referenceTitle: null,
    source: "rules",
    ...over,
  };
}
