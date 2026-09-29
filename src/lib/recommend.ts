// src/lib/recommend.ts
// The whole pipeline: parse (if needed) → query → rank → explain. Used by the API route and scripts.
import { DATASET } from "@/lib/dataset";
import { parseContext } from "@/lib/context/parse";
import { contextToQuery } from "@/lib/engine/query";
import { rank, TOP_K } from "@/lib/engine/rank";
import { explain } from "@/lib/engine/explain";
import { displayTitle } from "@/lib/labels";
import type { RecommendRequest, RecommendResponse } from "@/lib/api";

export const RELAXED_NOTICE = "条件を少しゆるめました";

export async function recommend(request: RecommendRequest): Promise<RecommendResponse> {
  const context = "context" in request ? request.context : await parseContext(request.text);
  const { titles, medianScore } = DATASET;

  const query = contextToQuery(context, titles);
  const { results, relaxed } = rank(titles, query, medianScore);

  const notices = [...query.notices];
  if (relaxed) notices.push(RELAXED_NOTICE);
  if (results.length < TOP_K) notices.push(`条件に合う作品は${results.length}件でした`);

  return {
    context,
    notices,
    results: results.map((r) => ({
      id: r.title.id,
      title: displayTitle(r.title),
      subtitle: r.title.title.english ?? r.title.title.romaji,
      coverImage: r.title.coverImage,
      siteUrl: r.title.siteUrl,
      format: r.title.format,
      episodes: r.title.episodes,
      duration: r.title.duration,
      reasons: explain(r, query, relaxed),
      score: r.score,
    })),
  };
}
