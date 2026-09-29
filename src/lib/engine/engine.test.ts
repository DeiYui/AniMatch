// src/lib/engine/engine.test.ts
// Run: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contextToQuery, findTitle, HEAVY_TARGET, LOW_ENERGY_HEAVY_PENALTY } from "@/lib/engine/query";
import { rank, scoreTitle, pickDiverse, scoreAll, PREQUEL_PENALTY, SHORT_SERIES_BONUS } from "@/lib/engine/rank";
import { explain, formatRuntime } from "@/lib/engine/explain";
import { cosineSimilarity } from "@/lib/vector";
import { makeContext, makeTitle } from "@/lib/engine/testUtils";

const MEDIAN = 70;
const funny = { laugh: 1 };
const ids = (r: { results: { title: { id: number } }[] }) => r.results.map((x) => x.title.id);

describe("contextToQuery", () => {
  it("maps moods to dimensions and energy to the heavy target", () => {
    const q = contextToQuery(makeContext({ moods: [{ type: "cry", weight: 0.7 }], energy: "high" }), []);
    assert.equal(q.target.cry, 0.7);
    assert.equal(q.target.laugh, 0);
    assert.equal(q.target.heavy, HEAVY_TARGET.high);
    assert.equal(q.heavyPenalty, 0);
  });

  it("low energy → heavy target 0 and an explicit penalty", () => {
    const q = contextToQuery(makeContext({ energy: "low" }), []);
    assert.equal(q.target.heavy, 0);
    assert.equal(q.heavyPenalty, LOW_ENERGY_HEAVY_PENALTY);
  });

  it("blends a found reference title into the target", () => {
    const ref = makeTitle({ title: { native: "進撃の巨人", romaji: "Shingeki no Kyojin", english: "Attack on Titan" }, vector: { thrill: 1, dark: 1 } });
    const q = contextToQuery(makeContext({ referenceTitle: "進撃の巨人" }), [ref]);
    assert.equal(q.reference?.id, ref.id);
    assert.deepEqual(q.notices, []);
    assert.ok(q.target.thrill > 0 && q.target.laugh > 0, "both moods and reference contribute");
  });

  it("trusts the reference more when moods are only the default", () => {
    const ref = makeTitle({ title: { native: "X", romaji: "Ref", english: null }, vector: { dark: 1 } });
    const withMood = contextToQuery(makeContext({ referenceTitle: "Ref" }), [ref]);
    const defaultMood = contextToQuery(makeContext({ moods: [{ type: "relax", weight: 0.5 }], referenceTitle: "Ref" }), [ref]);
    assert.ok(cosineSimilarity(defaultMood.target, ref.vector) > cosineSimilarity(withMood.target, ref.vector));
  });

  it("reports a reference that isn't in the dataset", () => {
    const q = contextToQuery(makeContext({ referenceTitle: "存在しない作品" }), [makeTitle()]);
    assert.equal(q.reference, null);
    assert.deepEqual(q.notices, ["『存在しない作品』が見つかりませんでした"]);
  });
});

describe("findTitle", () => {
  const s1 = makeTitle({ title: { native: "進撃の巨人", romaji: "Shingeki no Kyojin", english: "Attack on Titan" } });
  const s2 = makeTitle({
    title: { native: "進撃の巨人 Season 2", romaji: "Shingeki no Kyojin 2", english: null },
    hasPrequelInDataset: true,
    popularity: 99999,
  });

  it("prefers an exact match", () => assert.equal(findTitle("進撃の巨人", [s2, s1])?.id, s1.id));
  it("normalizes width, case, spaces and punctuation", () => assert.equal(findTitle("ＡＴＴＡＣＫ ON titan!", [s1])?.id, s1.id));
  it("falls back to substring, preferring the franchise start", () =>
    assert.equal(findTitle("shingeki", [s2, s1])?.id, s1.id));
  it("returns null when nothing matches", () => assert.equal(findTitle("Frieren", [s1, s2]), null));
});

describe("rank: time budget and relaxation", () => {
  const movie90 = makeTitle({ format: "MOVIE", episodes: 1, duration: 90, vector: funny });
  const series24 = makeTitle({ duration: 24, vector: { laugh: 1, relax: 0.5 } });
  const short5 = makeTitle({ format: "ONA", duration: 5, vector: { laugh: 1, think: 0.6 } });
  // Vectors differ enough (cosine < 0.95) that diversity keeps all of them.
  const series45 = makeTitle({ duration: 45, vector: { laugh: 1, cry: 0.6 } });

  it("keeps a series whose episode fits and drops a movie that doesn't", () => {
    const titles = [movie90, series24, short5];
    const q = contextToQuery(makeContext({ timeBudgetMin: 30 }), titles);
    const all = scoreAll(titles, q, MEDIAN);
    assert.deepEqual(all.map((r) => r.title.id).sort(), [series24.id, short5.id].sort());
  });

  it("drops the time budget when fewer than 3 fit, and says so", () => {
    const titles = [movie90, series24, series45];
    const r = rank(titles, contextToQuery(makeContext({ timeBudgetMin: 30 }), titles), MEDIAN);
    assert.equal(r.relaxed, true);
    assert.equal(r.results.length, 3);
  });

  it("does not relax when enough titles fit", () => {
    const titles = [series24, short5, makeTitle({ duration: 24, vector: { laugh: 1, romance: 0.3 } }), movie90];
    const r = rank(titles, contextToQuery(makeContext({ timeBudgetMin: 30 }), titles), MEDIAN);
    assert.equal(r.relaxed, false);
    assert.ok(!ids(r).includes(movie90.id));
  });
});

describe("rank: safety filters are never relaxed", () => {
  it("family excludes Horror genre and Gore ≥ 50, keeps Gore 49", () => {
    const horror = makeTitle({ genres: ["Horror"], vector: funny });
    const gore50 = makeTitle({ tags: [{ name: "Gore", rank: 50, spoiler: false }], vector: funny });
    const gore49 = makeTitle({ tags: [{ name: "Gore", rank: 49, spoiler: false }], vector: funny });
    const titles = [horror, gore50, gore49];
    const r = rank(titles, contextToQuery(makeContext({ company: "family", timeBudgetMin: 30 }), titles), MEDIAN);
    assert.deepEqual(ids(r), [gore49.id], "shows fewer than 3 rather than relaxing safety");
  });

  it("avoid keys use their own tag thresholds (tragedy: 70)", () => {
    const t69 = makeTitle({ tags: [{ name: "Tragedy", rank: 69, spoiler: false }], vector: funny });
    const t70 = makeTitle({ tags: [{ name: "Tragedy", rank: 70, spoiler: false }], vector: funny });
    const romance = makeTitle({ genres: ["Romance"], vector: funny });
    const titles = [t69, t70, romance];
    const r = rank(titles, contextToQuery(makeContext({ avoid: ["tragedy", "romance"] }), titles), MEDIAN);
    assert.deepEqual(ids(r), [t69.id]);
  });

  it("excludes the Ecchi genre by default", () => {
    const ecchi = makeTitle({ genres: ["Comedy", "Ecchi"], vector: funny, averageScore: 99 });
    const r = rank([ecchi], contextToQuery(makeContext(), [ecchi]), MEDIAN);
    assert.deepEqual(r.results, []);
  });

  it("excludes the reference title and its whole franchise", () => {
    const ref = makeTitle({ id: 500, title: { native: "参照", romaji: "Ref", english: null }, franchiseId: 500, vector: funny });
    const sequel = makeTitle({ franchiseId: 500, vector: funny });
    const other = makeTitle({ vector: funny });
    const titles = [ref, sequel, other];
    const r = rank(titles, contextToQuery(makeContext({ referenceTitle: "Ref" }), titles), MEDIAN);
    assert.deepEqual(ids(r), [other.id]);
  });
});

describe("rank: scoring", () => {
  it("penalizes a title whose prequel is in the dataset", () => {
    const first = makeTitle({ vector: funny });
    const sequel = makeTitle({ vector: funny, hasPrequelInDataset: true });
    const q = contextToQuery(makeContext(), [first, sequel]);
    assert.equal(scoreTitle(sequel, q, MEDIAN).prequelPenalty, -PREQUEL_PENALTY);
    assert.ok(scoreTitle(first, q, MEDIAN).total > scoreTitle(sequel, q, MEDIAN).total);
  });

  it("low energy penalizes heavy titles", () => {
    const light = makeTitle({ vector: { laugh: 1, heavy: 0.1 } });
    const heavy = makeTitle({ vector: { laugh: 1, heavy: 0.9 } });
    const q = contextToQuery(makeContext({ energy: "low" }), []);
    assert.ok(Math.abs(scoreTitle(heavy, q, MEDIAN).heavyPenalty + 0.9 * LOW_ENERGY_HEAVY_PENALTY) < 1e-9);
    assert.ok(scoreTitle(light, q, MEDIAN).total > scoreTitle(heavy, q, MEDIAN).total);
  });

  it("gives the short-series bonus only with a time budget and ≤ 13 episodes", () => {
    const short = makeTitle({ episodes: 12 });
    const long = makeTitle({ episodes: 24 });
    const movie = makeTitle({ format: "MOVIE", episodes: 1, duration: 20 });
    const withBudget = contextToQuery(makeContext({ timeBudgetMin: 30 }), []);
    assert.equal(scoreTitle(short, withBudget, MEDIAN).shortSeriesBonus, SHORT_SERIES_BONUS);
    assert.equal(scoreTitle(long, withBudget, MEDIAN).shortSeriesBonus, 0);
    assert.equal(scoreTitle(movie, withBudget, MEDIAN).shortSeriesBonus, 0);
    assert.equal(scoreTitle(short, contextToQuery(makeContext(), []), MEDIAN).shortSeriesBonus, 0);
  });

  it("uses the dataset median when averageScore is null", () => {
    const q = contextToQuery(makeContext(), []);
    assert.equal(scoreTitle(makeTitle({ averageScore: null }), q, 80).quality, scoreTitle(makeTitle({ averageScore: 80 }), q, 80).quality);
  });
});

describe("pickDiverse", () => {
  it("skips same-franchise and near-duplicate candidates", () => {
    const a = makeTitle({ vector: { laugh: 1 } });
    const sameFranchise = makeTitle({ franchiseId: a.franchiseId, vector: { laugh: 1, cry: 0.5 } });
    const nearDup = makeTitle({ vector: { laugh: 1, relax: 0.05 } }); // cosine ≈ 0.999
    const different = makeTitle({ vector: { laugh: 1, thrill: 1 } });
    const q = contextToQuery(makeContext(), []);
    const sorted = [a, sameFranchise, nearDup, different].map((title) => ({ title, score: scoreTitle(title, q, MEDIAN) }));
    assert.deepEqual(pickDiverse(sorted).map((r) => r.title.id), [a.id, different.id]);
  });
});

describe("explain", () => {
  it("formats runtime for movies and series", () => {
    assert.equal(formatRuntime(makeTitle({ format: "MOVIE", episodes: 1, duration: 107 })), "映画・約107分");
    assert.equal(formatRuntime(makeTitle({ episodes: 12, duration: 24 })), "1話24分 × 12話");
  });

  it("cites the top dimensions, satisfied constraints and facts only", () => {
    const t = makeTitle({ vector: { laugh: 0.9, relax: 0.5, heavy: 0.1 }, hasPrequelInDataset: true, averageScore: 81 });
    const q = contextToQuery(makeContext({ moods: [{ type: "laugh", weight: 1 }, { type: "relax", weight: 1 }], energy: "low", timeBudgetMin: 30 }), []);
    const reasons = explain({ title: t, score: scoreTitle(t, q, MEDIAN) }, q, false);
    assert.deepEqual(reasons, [
      "1話24分 × 12話",
      "笑い度：高",
      "癒やし度：中",
      "重い展開：ほぼなし",
      "1話が30分以内",
      "全12話で区切りやすい",
      "AniList評価 81点",
      "※続編です（前作あり）",
    ]);
  });
});
