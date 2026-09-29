// src/lib/themesIntent.test.ts
// Themes, intent and honest fallbacks. Run: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { THEME_KEYS, THEMES } from "@/data/themes";
import { parseRules } from "@/lib/context/rules";
import { sanitize } from "@/lib/context/llm";
import { contextToQuery } from "@/lib/engine/query";
import { rank, scoreTitle, scoringMode, THEME_FLOOR, themeScore } from "@/lib/engine/rank";
import { explain } from "@/lib/engine/explain";
import { composeUnderstood } from "@/i18n";
import { finalizeContext, recommend } from "@/lib/recommend";
import { DATASET } from "@/lib/dataset";
import { DEFAULT_MOODS } from "@/lib/context/schema";
import { makeContext, makeTitle } from "@/lib/engine/testUtils";

const MEDIAN = 70;
const text = (segs: ReturnType<typeof composeUnderstood>) => segs.map((s) => (s.kind === "text" ? s.text : s.label)).join("");

describe("themes.ts", () => {
  it("every theme maps to real genres/tags with at least 3 titles, and has labels + keywords in both languages", () => {
    const names = new Set(DATASET.titles.flatMap((t) => [...t.genres, ...t.tags.map((x) => x.name)]));
    for (const k of THEME_KEYS) {
      const th = THEMES[k];
      for (const n of [...(th.genres ?? []), ...(th.tags ?? [])]) assert.ok(names.has(n), `${k}: unknown genre/tag ${n}`);
      const n = DATASET.titles.filter((t) => themeScore(t, k) >= THEME_FLOOR).length;
      assert.ok(n >= 3, `${k}: only ${n} titles`);
      assert.ok(th.ja && th.en && th.kwJa.length && th.kwEn.length, `${k}: missing label or keywords`);
    }
  });
});

describe("rules: themes and intent", () => {
  it("reads themes in both languages, longest keyword first", () => {
    assert.deepEqual(parseRules("cooking").themes, ["cooking"]);
    assert.deepEqual(parseRules("スポーツもので熱くなりたい").themes, ["sports"]);
    assert.deepEqual(parseRules("スポーツもので熱くなりたい").moods, [{ type: "thrill", weight: 1 }]);
    assert.deepEqual(parseRules("子ども向けの魔法少女もの").themes, ["kids", "magical-girl"], "魔法少女 is not also 魔法");
  });

  it("everyday words don't become themes", () => {
    assert.deepEqual(parseRules("仕事で疲れた。寝る前に30分だけ笑えるやつ").themes, [], "仕事 ≠ workplace");
    assert.deepEqual(parseRules("Tired from work. Something funny").themes, [], "work ≠ workplace");
    assert.equal(parseRules("家族で見られる、ワクワクするもの").company, "family");
    assert.deepEqual(parseRules("家族で見られる、ワクワクするもの").themes, [], "家族で ≠ family drama");
  });

  it("negated subjects are avoided, not requested", () => {
    const c = parseRules("ホラー以外なら何でもいい");
    assert.deepEqual(c.avoid, ["horror"]);
    assert.deepEqual(c.themes, []);
  });

  it("is honest when nothing is recognised", () => {
    assert.equal(parseRules("asdfgh").intent, "unclear");
    assert.equal(parseRules("今日の天気は？").intent, "off_topic");
    assert.equal(parseRules("なんでもいい").intent, "recommend", "vague but valid");
    assert.equal(parseRules("おすすめある？").intent, "recommend");
    assert.equal(parseRules("cooking").intent, "recommend");
  });
});

describe("LLM output sanitising", () => {
  it("drops themes outside the list instead of failing the whole parse", () => {
    const out = sanitize({ themes: ["cooking", "lighthouses", "cooking"], unmatched: ["灯台", "", 3] }) as { themes: string[]; unmatched: string[] };
    assert.deepEqual(out.themes, ["cooking"]);
    assert.deepEqual(out.unmatched, ["灯台"]);
  });
});

describe("ranking modes", () => {
  it("picks the mode from what was asked, never from the default mood", () => {
    assert.equal(scoringMode(contextToQuery(makeContext(), [])), "moods");
    assert.equal(scoringMode(contextToQuery(makeContext({ themes: ["cooking"] }), [])), "moodsAndThemes");
    assert.equal(scoringMode(contextToQuery(makeContext({ moods: DEFAULT_MOODS, themes: ["cooking"] }), [])), "themes");
    assert.equal(scoringMode(contextToQuery(makeContext({ moods: DEFAULT_MOODS }), [])), "open");
  });

  it("themes-only: a strong theme match beats a better-scored title that isn't about it", () => {
    const cooking = makeTitle({ tags: [{ name: "Food", rank: 90, spoiler: false }], averageScore: 70, vector: { relax: 1 } });
    const other = makeTitle({ averageScore: 90, vector: { laugh: 1 } });
    const q = contextToQuery(makeContext({ moods: DEFAULT_MOODS, themes: ["cooking"] }), []);
    assert.ok(scoreTitle(cooking, q, MEDIAN).total > scoreTitle(other, q, MEDIAN).total);
    assert.deepEqual(explain({ title: cooking, score: scoreTitle(cooking, q, MEDIAN) }, q)[0], { key: "theme", themes: ["cooking"] });
  });

  it("the theme floor is soft: relaxed (last) when fewer than 3 titles match", () => {
    const titles = [
      makeTitle({ tags: [{ name: "Food", rank: 80, spoiler: false }], vector: { relax: 1 } }),
      makeTitle({ vector: { laugh: 1 } }),
      makeTitle({ vector: { thrill: 1 } }),
    ];
    const r = rank(titles, contextToQuery(makeContext({ moods: DEFAULT_MOODS, themes: ["cooking"] }), []), MEDIAN);
    assert.equal(r.results.length, 3);
    assert.equal(r.relaxed, true);
    assert.equal(r.results[0].title.id, titles[0].id, "the matching title still comes first");
  });

  it("open requests rank by quality and popularity, and say so", () => {
    const popularGood = makeTitle({ averageScore: 88, popularityPct: 0.01, vector: { relax: 1 } });
    const obscure = makeTitle({ averageScore: 88, popularityPct: 0.9, vector: { laugh: 1 } });
    const q = contextToQuery(makeContext({ moods: DEFAULT_MOODS }), []);
    assert.ok(scoreTitle(popularGood, q, MEDIAN).total > scoreTitle(obscure, q, MEDIAN).total);
    const reasons = explain({ title: popularGood, score: scoreTitle(popularGood, q, MEDIAN) }, q);
    assert.deepEqual(reasons.slice(0, 2), [{ key: "popular", topPct: 1 }, { key: "score", score: 88 }]);
    assert.match(text(composeUnderstood(makeContext({ moods: DEFAULT_MOODS }), "ja", { open: true })), /人気・高評価/);
    assert.doesNotMatch(text(composeUnderstood(makeContext({ moods: DEFAULT_MOODS }), "en", { open: true })), /Anything goes/);
  });
});

describe("exact title and intent through the whole pipeline (rules parser, real dataset)", () => {
  it("a bare title becomes a title search", () => {
    const c = finalizeContext("鬼滅の刃", parseRules("鬼滅の刃"), DATASET.titles);
    assert.equal(c.titleSearch, true);
    assert.equal(c.intent, "recommend");
    assert.equal(finalizeContext("鬼滅の刃みたいな", parseRules("鬼滅の刃みたいな"), DATASET.titles).titleSearch, false);
  });

  it("shows the searched title first, then similar titles from other franchises", async () => {
    const res = await recommend({ text: "鬼滅の刃", parser: "rules" });
    assert.equal(res.results[0].searched, true);
    assert.equal(res.results[0].titles.native, "鬼滅の刃");
    assert.equal(res.results.length, 3);
    assert.ok(res.results.slice(1).every((r) => !r.searched && r.titles.native !== "鬼滅の刃"));
  });

  it("returns no results for unclear or off-topic input", async () => {
    for (const [input, intent] of [["asdfgh", "unclear"], ["今日の天気は？", "off_topic"]] as const) {
      const res = await recommend({ text: input, parser: "rules" });
      assert.equal(res.intent, intent);
      assert.deepEqual(res.results, []);
    }
  });

  it("「cooking」 returns cooking titles, labelled with the theme", async () => {
    const res = await recommend({ text: "cooking", parser: "rules" });
    assert.equal(res.mode, "themes");
    assert.ok(res.results.length >= 3);
    for (const r of res.results) assert.deepEqual(r.reasons[0], { key: "theme", themes: ["cooking"] });
  });
});
