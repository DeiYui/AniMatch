// src/lib/recommend.ts
// The whole pipeline: parse (if needed) → finalize → query → rank → explain. Used by the API route and scripts.
// Returns language-neutral data (reason/notice keys, all title names); the UI renders it per language.
import { DATASET, type Title } from "@/lib/dataset";
import { parseContext } from "@/lib/context/parse";
import { mergeContexts } from "@/lib/context/merge";
import type { Context } from "@/lib/context/schema";
import { contextToQuery, findTitle } from "@/lib/engine/query";
import { MAX_RESULTS, rank, scoreTitle, scoringMode, TOP_K, type Ranked } from "@/lib/engine/rank";
import { explain, explainSearched, titleNames } from "@/lib/engine/explain";
import type { Recommendation, RecommendRequest, RecommendResponse } from "@/lib/api";
import type { Reason } from "@/lib/messages";

/**
 * Server-side corrections that need the dataset (so both parsers get them):
 * if the whole input is exactly a title in the dataset (「鬼滅の刃」), it's a title search — show that title
 * first, then similar ones — whatever the parser made of it.
 */
export function finalizeContext(text: string, context: Context, titles: Title[]): Context {
  const exact = findTitle(text, titles, { exactOnly: true });
  if (!exact) return context;
  return { ...context, referenceTitle: text.trim(), titleSearch: true, intent: "recommend", unmatched: [] };
}

const toRecommendation = (r: Ranked, reasons: Reason[], searched = false): Recommendation => ({
  id: r.title.id,
  titles: titleNames(r.title),
  coverImage: r.title.coverImage,
  localCover: r.title.localCover,
  coverColor: r.title.coverColor,
  year: r.title.year,
  siteUrl: r.title.siteUrl,
  format: r.title.format,
  episodes: r.title.episodes,
  duration: r.title.duration,
  reasons,
  score: r.score,
  searched,
});

export async function recommend(request: RecommendRequest): Promise<RecommendResponse> {
  const { titles, medianScore } = DATASET;
  const parse = "text" in request ? await parseContext(request.text, request.parser ?? "auto") : null;
  let context: Context;
  if ("context" in request) {
    context = request.context;
  } else {
    const parsed = finalizeContext(request.text, parse!.context, titles);
    context = request.base ? mergeContexts(parsed, request.base) : parsed;
  }
  const parseInfo = parse && { parser: parse.parser, latencyMs: parse.latencyMs, fallbackReason: parse.fallbackReason };
  const limit = request.limit ?? TOP_K;

  // Not something we can answer: say so, show nothing (the UI explains and offers the quick picks).
  if (context.intent !== "recommend") {
    return { context, parse: parseInfo, intent: context.intent, mode: "open", notices: [], results: [], hasMore: false };
  }

  const query = contextToQuery(context, titles);
  const searched = context.titleSearch ? query.reference : null;
  const { results, relaxed } = rank(titles, query, medianScore, limit);

  const notices = [...query.notices];
  let items: Recommendation[];
  let hasMore: boolean;
  if (searched) {
    // The searched title first (labelled in the UI), then similar titles from other franchises.
    const similar = results.slice(0, limit - 1);
    items = [
      toRecommendation({ title: searched, score: scoreTitle(searched, query, medianScore) }, explainSearched(searched), true),
      ...similar.map((r) => toRecommendation(r, explain(r, query))),
    ];
    hasMore = similar.length === limit - 1 && limit < MAX_RESULTS;
  } else {
    if (relaxed) notices.push({ key: "relaxed" });
    if (results.length < TOP_K) notices.push({ key: "fewResults", count: results.length });
    items = results.map((r) => toRecommendation(r, explain(r, query)));
    hasMore = results.length === limit && limit < MAX_RESULTS;
  }

  return { context, parse: parseInfo, intent: "recommend", mode: scoringMode(query), notices, results: items, hasMore };
}
