// src/lib/anime/schema.ts
// Shape of one title in src/data/anime.json (written by scripts/fetch-anilist.ts).
import { z } from "zod";

export const FORMATS = ["TV", "TV_SHORT", "MOVIE", "OVA", "ONA"] as const;

// Only these relation types matter for franchise grouping / "start from season 1".
export const RELATION_TYPES = ["SEQUEL", "PREQUEL", "PARENT", "SIDE_STORY"] as const;

export const AnimeTagSchema = z.object({
  name: z.string(),
  rank: z.number().int().min(0).max(100),
  // Spoiler tags still shape the vector, but are never shown in explanations.
  spoiler: z.boolean(),
});

export const AnimeSchema = z.object({
  id: z.number().int(),
  title: z.object({
    native: z.string().nullable(),
    romaji: z.string().nullable(),
    english: z.string().nullable(),
  }),
  synonyms: z.array(z.string()),
  genres: z.array(z.string()).min(1),
  tags: z.array(AnimeTagSchema).min(1),
  format: z.enum(FORMATS),
  episodes: z.number().int().positive(),
  duration: z.number().int().positive(), // minutes per episode
  averageScore: z.number().int().nullable(),
  popularity: z.number().int(),
  coverImage: z.string().url(),
  siteUrl: z.string().url(),
  relations: z.array(z.object({ type: z.enum(RELATION_TYPES), id: z.number().int() })),
});

export type AnimeTag = z.infer<typeof AnimeTagSchema>;
export type Anime = z.infer<typeof AnimeSchema>;
