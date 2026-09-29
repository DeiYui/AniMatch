// src/lib/engine/filters.ts
// Safety filters (avoid keys, family). These are never relaxed.
import type { Anime } from "@/lib/anime/schema";
import { AVOID_MAP, AVOID_MIN_TAG_RANK, FAMILY_EXCLUDE, type AvoidKey } from "@/data/avoidMap";

const hasTag = (anime: Anime, names: string[] | undefined, minRank: number) =>
  !!names && anime.tags.some((t) => t.rank >= minRank && names.includes(t.name));

const hasGenre = (anime: Anime, names: string[] | undefined) =>
  !!names && anime.genres.some((g) => names.includes(g));

export function matchesAvoid(anime: Anime, key: AvoidKey): boolean {
  const rule = AVOID_MAP[key];
  return (
    hasGenre(anime, rule.genres) ||
    hasTag(anime, rule.tags, AVOID_MIN_TAG_RANK) ||
    (rule.maxEpisodes != null && anime.episodes > rule.maxEpisodes)
  );
}

export const isFamilyUnsafe = (anime: Anime): boolean =>
  hasGenre(anime, FAMILY_EXCLUDE.genres) || hasTag(anime, FAMILY_EXCLUDE.tags, FAMILY_EXCLUDE.minTagRank);
