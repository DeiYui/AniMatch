// src/lib/engine/engine.test.ts
// Run: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contextToQuery, findTitle } from "@/lib/engine/query";
import {
  rank,
  scoreTitle,
  pickDiverse,
  scoreAll,
  HIGH_ENERGY_HEAVY_BONUS,
  LONG_SERIES_PENALTY,
  LOW_ENERGY_HEAVY_PENALTY,
  PREQUEL_PENALTY,
  SHORT_SERIES_BONUS,
  ERA_BONUS,
  POPULARITY_BONUS,
  REFERENCE_YEAR,
  MAX_RESULTS,
} from "@/lib/engine/rank";
import { explain, MAX_REASONS } from "@/lib/engine/explain";
import { cosineSimilarity } from "@/lib/vector";
import { makeContext, makeTitle } from "@/lib/engine/testUtils";

const MEDIAN = 70;
const funny = { laugh: 1 };
const ids = (r: { results: { title: { id: number } }[] }) => r.results.map((x) => x.title.id);

describe("contextToQuery", () => {
  it("maps moods to dimensions; heavy never enters the target", () => {
    for (const energy of ["low", "mid", "high"] as const) {
      const q = contextToQuery(makeContext({ moods: [{ type: "cry", weight: 0.7 }], energy }), []);
      assert.equal(q.target.cry, 0.7);
      assert.equal(q.target.laugh, 0);
      assert.equal(q.target.heavy, 0);
      assert.equal(q.primaryMood, "cry");
    }
  });

  it("has no primary mood (no floor) when moods are only the default", () => {
    assert.equal(contextToQuery(makeContext({ moods: [{ type: "relax", weight: 0.5 }] }), []).primaryMood, null);
  });

  it("keeps heavy out of the target even with a heavy reference", () => {
    const ref = makeTitle({ title: { native: "R", romaji: "Ref", english: null }, vector: { dark: 1, heavy: 1 } });
    assert.equal(contextToQuery(makeContext({ referenceTitle: "Ref" }), [ref]).target.heavy, 0);
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
    assert.deepEqual(q.notices, [{ key: "referenceNotFound", title: "存在しない作品" }]);
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
    assert.equal(r.timeDropped, true);
    assert.equal(r.results.length, 3);
  });

  it("after dropping the budget, titles that fit still come first, without the short-series bonus", () => {
    // series24 fits but scores lower than the two that don't fit.
    const weakFit = makeTitle({ duration: 24, vector: { laugh: 0.3, relax: 0.3 }, averageScore: 50 });
    const strong1 = makeTitle({ duration: 45, vector: { laugh: 1, cry: 0.6 }, averageScore: 90 });
    const strong2 = makeTitle({ format: "MOVIE", episodes: 1, duration: 90, vector: { laugh: 1, thrill: 0.8 }, averageScore: 90 });
    const titles = [strong1, strong2, weakFit];
    const r = rank(titles, contextToQuery(makeContext({ timeBudgetMin: 30 }), titles), MEDIAN);
    assert.equal(r.results[0].title.id, weakFit.id);
    assert.ok(r.results.every((x) => x.score.shortSeriesBonus === 0));
  });

  it("does not relax when enough titles fit", () => {
    const titles = [series24, short5, makeTitle({ duration: 24, vector: { laugh: 1, romance: 0.3 } }), movie90];
    const r = rank(titles, contextToQuery(makeContext({ timeBudgetMin: 30 }), titles), MEDIAN);
    assert.equal(r.relaxed, false);
    assert.ok(!ids(r).includes(movie90.id));
  });
});

describe("rank: primary mood floor (soft)", () => {
  const q = () => contextToQuery(makeContext({ moods: [{ type: "cry", weight: 1 }] }), []);

  it("excludes titles below the floor when enough remain", () => {
    const strong = [0.9, 0.7, 0.5].map((cry, i) => makeTitle({ vector: { cry, [["laugh", "thrill", "think"][i]]: 0.8 } }));
    const weak = makeTitle({ vector: { cry: 0.2 }, averageScore: 99 });
    const r = rank([...strong, weak], q(), MEDIAN);
    assert.equal(r.relaxed, false);
    assert.ok(!ids(r).includes(weak.id));
  });

  it("is relaxed (with a notice flag) when fewer than 3 pass it", () => {
    const titles = [makeTitle({ vector: { cry: 0.9 } }), makeTitle({ vector: { cry: 0.2, laugh: 1 } }), makeTitle({ vector: { cry: 0.1, thrill: 1 } })];
    const r = rank(titles, q(), MEDIAN);
    assert.equal(r.relaxed, true);
    assert.equal(r.timeDropped, false);
    assert.equal(r.results.length, 3);
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
    assert.ok(Math.abs(scoreTitle(heavy, q, MEDIAN).energy + 0.9 * LOW_ENERGY_HEAVY_PENALTY) < 1e-9);
    assert.ok(scoreTitle(light, q, MEDIAN).total > scoreTitle(heavy, q, MEDIAN).total);
  });

  it("high energy gives a small bonus to heavy titles; mid gives nothing", () => {
    const heavy = makeTitle({ vector: { laugh: 1, heavy: 0.8 } });
    const high = contextToQuery(makeContext({ energy: "high" }), []);
    assert.ok(Math.abs(scoreTitle(heavy, high, MEDIAN).energy - 0.8 * HIGH_ENERGY_HEAVY_BONUS) < 1e-9);
    assert.equal(scoreTitle(heavy, contextToQuery(makeContext(), []), MEDIAN).energy, 0);
  });

  it("heavy does not affect the cosine", () => {
    const q = contextToQuery(makeContext(), []);
    const a = scoreTitle(makeTitle({ vector: { laugh: 1, heavy: 0 } }), q, MEDIAN);
    const b = scoreTitle(makeTitle({ vector: { laugh: 1, heavy: 1 } }), q, MEDIAN);
    assert.equal(a.cosine, b.cosine);
  });

  it("intensity lets a strong title beat a weak but perfectly aligned one", () => {
    const q = contextToQuery(makeContext({ moods: [{ type: "cry", weight: 1 }] }), []);
    const weak = makeTitle({ vector: { cry: 0.3 } }); // cosine 1.0
    const strong = makeTitle({ vector: { cry: 1, romance: 0.8 } }); // cosine ≈ 0.78
    const w = scoreTitle(weak, q, MEDIAN);
    const s = scoreTitle(strong, q, MEDIAN);
    assert.ok(w.cosine > s.cosine);
    assert.equal(s.intensity, 1);
    assert.ok(s.total > w.total);
  });

  it("intensity ignores target dims beyond the top 2, so flat titles don't win", () => {
    const q = contextToQuery(
      makeContext({ moods: [{ type: "thrill", weight: 1 }, { type: "dark", weight: 0.8 }, { type: "laugh", weight: 0.3 }] }),
      [],
    );
    const t = makeTitle({ vector: { thrill: 0.5, dark: 0.5, laugh: 1 } });
    assert.ok(Math.abs(scoreTitle(t, q, MEDIAN).intensity - 0.5) < 1e-9, "laugh (3rd dim) is not counted");
  });

  it("penalizes 100+ episode series only without a time budget and when energy isn't high", () => {
    const long = makeTitle({ episodes: 101 });
    const hundred = makeTitle({ episodes: 100 });
    assert.equal(scoreTitle(long, contextToQuery(makeContext(), []), MEDIAN).longSeriesPenalty, -LONG_SERIES_PENALTY);
    assert.equal(scoreTitle(long, contextToQuery(makeContext({ energy: "low" }), []), MEDIAN).longSeriesPenalty, -LONG_SERIES_PENALTY);
    assert.equal(scoreTitle(hundred, contextToQuery(makeContext(), []), MEDIAN).longSeriesPenalty, 0);
    assert.equal(scoreTitle(long, contextToQuery(makeContext({ energy: "high" }), []), MEDIAN).longSeriesPenalty, 0);
    assert.equal(scoreTitle(long, contextToQuery(makeContext({ timeBudgetMin: 30 }), []), MEDIAN).longSeriesPenalty, 0);
  });

  it("intensity is the target-weighted average of the requested moods", () => {
    const q = contextToQuery(makeContext({ moods: [{ type: "laugh", weight: 1 }, { type: "relax", weight: 0.5 }] }), []);
    const t = makeTitle({ vector: { laugh: 0.6, relax: 0.9, dark: 1 } });
    assert.ok(Math.abs(scoreTitle(t, q, MEDIAN).intensity - (1 * 0.6 + 0.5 * 0.9) / 1.5) < 1e-9);
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
    const similarButDistinct = makeTitle({ vector: { laugh: 1, cry: 0.3 } }); // cosine ≈ 0.958, below 0.97
    const different = makeTitle({ vector: { laugh: 1, thrill: 1 } });
    const q = contextToQuery(makeContext(), []);
    const sorted = [a, sameFranchise, nearDup, similarButDistinct, different].map((title) => ({ title, score: scoreTitle(title, q, MEDIAN) }));
    assert.deepEqual(pickDiverse(sorted).map((r) => r.title.id), [a.id, similarButDistinct.id, different.id]);
  });
});

describe("explain", () => {
  it("shows the 3 most informative reasons: strongest mood, then the user's constraints", () => {
    const t = makeTitle({ vector: { laugh: 0.9, relax: 0.5, heavy: 0.1 }, hasPrequelInDataset: true, averageScore: 81 });
    const q = contextToQuery(makeContext({ moods: [{ type: "laugh", weight: 1 }, { type: "relax", weight: 1 }], energy: "low", timeBudgetMin: 30 }), []);
    const reasons = explain({ title: t, score: scoreTitle(t, q, MEDIAN) }, q);
    assert.equal(reasons.length, MAX_REASONS);
    assert.deepEqual(reasons, [
      { key: "mood", dim: "laugh", level: "high" },
      { key: "fitsTime", minutes: 30, whole: false },
      { key: "heavy", level: "none" },
    ]);
  });

  it("falls back to second mood, caveats and facts when no constraints apply", () => {
    const t = makeTitle({ vector: { laugh: 0.9, relax: 0.5 }, hasPrequelInDataset: true, averageScore: 81 });
    const q = contextToQuery(makeContext({ moods: [{ type: "laugh", weight: 1 }, { type: "relax", weight: 1 }] }), []);
    assert.deepEqual(explain({ title: t, score: scoreTitle(t, q, MEDIAN) }, q), [
      { key: "mood", dim: "laugh", level: "high" },
      { key: "mood", dim: "relax", level: "mid" },
      { key: "sequel" },
    ]);
  });
});

describe("rank: format / completed (hard) and era / popularity (soft)", () => {
  const ctx = (over: Parameters<typeof makeContext>[0]) => contextToQuery(makeContext(over), []);

  it("format and completed-only filter, and are never relaxed", () => {
    const movie = makeTitle({ format: "MOVIE", episodes: 1, duration: 100, vector: funny });
    const series = makeTitle({ vector: { laugh: 1, cry: 0.6 } });
    const airing = makeTitle({ status: "RELEASING", vector: { laugh: 1, thrill: 0.8 } });
    const titles = [movie, series, airing];
    assert.deepEqual(ids(rank(titles, ctx({ format: "movie" }), MEDIAN)), [movie.id]);
    assert.deepEqual(ids(rank(titles, ctx({ format: "series" }), MEDIAN)).sort(), [series.id, airing.id].sort());
    // Only 2 titles remain, so soft constraints get relaxed — but the airing title must still be excluded.
    const done = rank(titles, ctx({ completedOnly: true }), MEDIAN);
    assert.deepEqual(ids(done).sort(), [movie.id, series.id].sort());
  });

  it("era and popularity are small bonuses, not filters", () => {
    const recent = makeTitle({ year: REFERENCE_YEAR - 1, vector: funny });
    const old = makeTitle({ year: 2005, vector: { laugh: 1, cry: 0.6 } }); // distinct enough for diversity
    const q = ctx({ era: "recent" });
    assert.equal(scoreTitle(recent, q, MEDIAN).eraBonus, ERA_BONUS);
    assert.equal(scoreTitle(old, q, MEDIAN).eraBonus, 0);
    assert.equal(scoreTitle(old, ctx({ era: "classic" }), MEDIAN).eraBonus, ERA_BONUS);
    assert.equal(rank([recent, old], q, MEDIAN).results.length, 2, "old titles are still candidates");

    const gem = makeTitle({ popularityPct: 0.8, averageScore: 82, vector: funny });
    const famous = makeTitle({ popularityPct: 0.05, averageScore: 82, vector: funny });
    const obscureButWeak = makeTitle({ popularityPct: 0.8, averageScore: 60, vector: funny });
    assert.equal(scoreTitle(gem, ctx({ popularity: "hidden-gem" }), MEDIAN).popularityBonus, POPULARITY_BONUS);
    assert.equal(scoreTitle(obscureButWeak, ctx({ popularity: "hidden-gem" }), MEDIAN).popularityBonus, 0);
    assert.equal(scoreTitle(famous, ctx({ popularity: "famous" }), MEDIAN).popularityBonus, POPULARITY_BONUS);
    assert.equal(scoreTitle(famous, ctx({ popularity: "hidden-gem" }), MEDIAN).popularityBonus, 0);
  });

  it("explains era / popularity / completed only when requested and satisfied", () => {
    const t = makeTitle({ year: REFERENCE_YEAR - 2, popularityPct: 0.7, averageScore: 85, vector: funny });
    const q = ctx({ era: "recent", popularity: "hidden-gem", completedOnly: true });
    const reasons = explain({ title: t, score: scoreTitle(t, q, MEDIAN) }, q);
    assert.deepEqual(reasons, [
      { key: "mood", dim: "laugh", level: "high" },
      { key: "completed" },
      { key: "era", era: "recent", year: REFERENCE_YEAR - 2 },
    ]);
  });
});

describe("rank: more results (limit)", () => {
  const titles = Array.from({ length: 12 }, (_, i) =>
    makeTitle({ vector: { laugh: 1, [["cry", "thrill", "relax", "think", "romance", "dark"][i % 6]]: 0.3 + 0.1 * Math.floor(i / 6) } }),
  );
  const q = contextToQuery(makeContext(), []);

  it("returns up to `limit`, and the first page never changes", () => {
    const page1 = ids(rank(titles, q, MEDIAN));
    const page2 = ids(rank(titles, q, MEDIAN, 6));
    assert.equal(page1.length, 3);
    assert.equal(page2.length, 6);
    assert.deepEqual(page2.slice(0, 3), page1);
    assert.ok(rank(titles, q, MEDIAN, 100).results.length <= MAX_RESULTS);
  });
});

