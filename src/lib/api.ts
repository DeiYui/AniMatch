// src/lib/api.ts
// Request/response contract of POST /api/recommend. Safe to import from client code.
import { z } from "zod";
import { ContextSchema, MAX_INPUT_CHARS, type Context } from "@/lib/context/schema";
import { MAX_RESULTS, TOP_K, type ScoreBreakdown, type ScoringMode } from "@/lib/engine/rank";
import type { FORMATS } from "@/lib/anime/schema";
import type { Notice, Reason, TitleNames } from "@/lib/messages";

// { text } runs the parser; { context } (edited chips, quick picks) skips it.
// parser: "rules" forces the rule-based fallback (live demo without AI).
// base: quick picks chosen before typing; merged with the parsed text (the text wins where it says something).
// limit: 3, 6 or 9 (「もっと見る」).
const LimitSchema = z.number().int().min(TOP_K).max(MAX_RESULTS).optional();
export const RecommendRequestSchema = z.union([
  z.object({
    text: z.string().trim().min(1).max(MAX_INPUT_CHARS),
    parser: z.enum(["auto", "rules"]).optional(),
    base: ContextSchema.optional(),
    limit: LimitSchema,
  }),
  z.object({ context: ContextSchema, limit: LimitSchema }),
]);

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;

export type Recommendation = {
  id: number;
  titles: TitleNames; // the UI picks by language
  coverImage: string; // AniList CDN
  localCover: string | null; // /covers/<id>.webp when downloaded (npm run fetch:covers); tried first
  coverColor: string | null; // AniList's dominant cover colour (#rrggbb); tints the card
  year: number | null;
  siteUrl: string;
  format: (typeof FORMATS)[number];
  episodes: number;
  duration: number;
  reasons: Reason[]; // at most 3, language-neutral
  score: ScoreBreakdown;
  searched: boolean; // the title the user typed by name (shown first, labelled)
};

export type ParseInfo = {
  parser: Context["source"];
  latencyMs: number;
  fallbackReason: string | null; // why the LLM wasn't used, if it wasn't
};

export type RecommendResponse = {
  context: Context;
  parse: ParseInfo | null; // null when the request sent a context (no parsing)
  intent: Context["intent"]; // unclear / off_topic → no results
  mode: ScoringMode; // "open" = nothing specific asked → popular, high-rated picks
  notices: Notice[]; // e.g. relaxed conditions, reference not found
  results: Recommendation[];
  hasMore: boolean; // 「もっと見る」 can add more results
};
