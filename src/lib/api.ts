// src/lib/api.ts
// Request/response contract of POST /api/recommend. Safe to import from client code.
import { z } from "zod";
import { ContextSchema, type Context } from "@/lib/context/schema";
import type { ScoreBreakdown } from "@/lib/engine/rank";
import type { FORMATS } from "@/lib/anime/schema";

// { text } runs the parser; { context } (edited chips) skips it.
export const RecommendRequestSchema = z.union([
  z.object({ text: z.string().trim().min(1).max(500) }),
  z.object({ context: ContextSchema }),
]);

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;

export type Recommendation = {
  id: number;
  title: string; // Japanese title when available
  subtitle: string | null; // English or romaji
  coverImage: string;
  siteUrl: string;
  format: (typeof FORMATS)[number];
  episodes: number;
  duration: number;
  reasons: string[];
  score: ScoreBreakdown;
};

export type RecommendResponse = {
  context: Context;
  notices: string[]; // e.g. 「条件を少しゆるめました」
  results: Recommendation[];
};
