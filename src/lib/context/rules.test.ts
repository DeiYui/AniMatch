// src/lib/context/rules.test.ts
// Run: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseRules } from "@/lib/context/rules";

const moodTypes = (text: string) => parseRules(text).moods.map((m) => m.type);

describe("parseRules", () => {
  it("tired, 30 minutes, laugh", () => {
    const c = parseRules("仕事で疲れた。寝る前に30分だけ笑えるやつ");
    assert.equal(c.energy, "low");
    assert.equal(c.timeBudgetMin, 30);
    assert.deepEqual(moodTypes("仕事で疲れた。寝る前に30分だけ笑えるやつ"), ["laugh"]);
    assert.equal(c.source, "rules");
  });

  it("weekend binge, cry → high energy, no time limit", () => {
    const c = parseRules("週末に一気見できる、泣ける作品");
    assert.equal(c.energy, "high");
    assert.equal(c.timeBudgetMin, null);
    assert.deepEqual(c.moods, [{ type: "cry", weight: 1 }]);
  });

  it("family + thrill", () => {
    const c = parseRules("家族で見られる、ワクワクするもの");
    assert.equal(c.company, "family");
    assert.deepEqual(moodTypes("家族で見られる、ワクワクするもの"), ["thrill"]);
  });

  it("negated 重い → low energy, not an avoid key, romance kept", () => {
    const c = parseRules("恋愛ものが見たい、でも重いのは嫌");
    assert.equal(c.energy, "low");
    assert.deepEqual(c.avoid, []);
    assert.deepEqual(moodTypes("恋愛ものが見たい、でも重いのは嫌"), ["romance"]);
  });

  it("reference title, default moods", () => {
    const c = parseRules("進撃の巨人みたいなやつ");
    assert.equal(c.referenceTitle, "進撃の巨人");
    assert.deepEqual(c.moods, [{ type: "relax", weight: 0.5 }]);
  });

  it("time only → defaults for everything else", () => {
    const c = parseRules("5分だけ時間ある");
    assert.equal(c.timeBudgetMin, 5);
    assert.equal(c.energy, "mid");
    assert.equal(c.company, null);
  });

  it("negation goes to avoid and is removed before mood detection", () => {
    const c = parseRules("泣けるのは嫌");
    assert.deepEqual(c.avoid, ["tragedy"]);
    assert.deepEqual(c.moods, [{ type: "relax", weight: 0.5 }], "泣 inside the negated span is not a cry mood");
  });

  it("only the part after a conjunction is negated", () => {
    const c = parseRules("笑えるけどグロいのは嫌");
    assert.deepEqual(c.avoid, ["gore"]);
    assert.deepEqual(moodTypes("笑えるけどグロいのは嫌"), ["laugh"]);
  });

  it("handles several negation forms", () => {
    assert.deepEqual(parseRules("ホラー以外で").avoid, ["horror"]);
    assert.deepEqual(parseRules("ロボットじゃないやつ").avoid, ["mecha"]);
    assert.deepEqual(parseRules("異世界はいや").avoid, ["isekai"]);
    assert.deepEqual(parseRules("お色気なしで").avoid, ["ecchi"]);
  });

  it("恋人 is company, not a romance mood", () => {
    const c = parseRules("恋人と見る");
    assert.equal(c.company, "partner");
    assert.deepEqual(c.moods, [{ type: "relax", weight: 0.5 }]);
  });

  it("orders moods by position (first = primary)", () => {
    assert.deepEqual(moodTypes("感動して笑える"), ["cry", "laugh"]);
  });

  it("parses hours, half hours and full-width digits", () => {
    assert.equal(parseRules("1時間半くらい").timeBudgetMin, 90);
    assert.equal(parseRules("２時間").timeBudgetMin, 120);
    assert.equal(parseRules("1時間30分").timeBudgetMin, 90);
  });

  it("never throws on empty or unrelated input", () => {
    assert.equal(parseRules("").source, "rules");
    assert.equal(parseRules("hello").energy, "mid");
  });
});

describe("parseRules (English)", () => {
  it("tired, 30 minutes, funny", () => {
    const c = parseRules("Tired from work. Something funny for 30 minutes before bed");
    assert.equal(c.energy, "low");
    assert.equal(c.timeBudgetMin, 30);
    assert.deepEqual(c.moods, [{ type: "laugh", weight: 1 }]);
  });

  it("binge + tearjerker → cry, high energy, no time limit", () => {
    const c = parseRules("A tearjerker I can binge this weekend");
    assert.deepEqual(c.moods, [{ type: "cry", weight: 1 }]);
    assert.equal(c.energy, "high");
    assert.equal(c.timeBudgetMin, null);
  });

  it("with my family + exciting", () => {
    const c = parseRules("Something exciting to watch with my family");
    assert.equal(c.company, "family");
    assert.deepEqual(c.moods, [{ type: "thrill", weight: 1 }]);
  });

  it("'nothing too heavy' → low energy, romance kept", () => {
    const c = parseRules("Romance, but nothing too heavy");
    assert.equal(c.energy, "low");
    assert.deepEqual(c.avoid, []);
    assert.deepEqual(c.moods, [{ type: "romance", weight: 1 }]);
  });

  it("'something like X' + 'no Y'", () => {
    const c = parseRules("Something like Attack on Titan but no gore");
    assert.equal(c.referenceTitle, "Attack on Titan");
    assert.deepEqual(c.avoid, ["gore"]);
    assert.deepEqual(c.moods, [{ type: "relax", weight: 0.5 }]);
  });

  it("negated words don't become moods", () => {
    const c = parseRules("no horror, not sad, something relaxing");
    assert.deepEqual(c.avoid.sort(), ["horror", "tragedy"]);
    assert.deepEqual(c.moods, [{ type: "relax", weight: 1 }], "horror/sad were negated, so no dark/cry mood");
  });

  it("parses English time phrases", () => {
    assert.equal(parseRules("I have half an hour").timeBudgetMin, 30);
    assert.equal(parseRules("about an hour and a half").timeBudgetMin, 90);
    assert.equal(parseRules("2 hours free").timeBudgetMin, 120);
    assert.equal(parseRules("20min").timeBudgetMin, 20);
    assert.equal(parseRules("an hour tonight").timeBudgetMin, 60);
  });

  it("'I'd like…' is not a reference; whole words only", () => {
    const c = parseRules("I'd like something funny with my girlfriend");
    assert.equal(c.referenceTitle, null);
    assert.equal(c.company, "partner");
    assert.deepEqual(parseRules("crystal clear visuals").moods, [{ type: "relax", weight: 0.5 }], "'cry' must not match 'crystal'");
  });

  it("strips quotes from a reference title", () => {
    assert.equal(parseRules('anime similar to "Frieren", please').referenceTitle, "Frieren");
  });
});


describe("parseRules: format / completed / era / popularity", () => {
  it("最近の完結済みで、隠れた名作の泣けるアニメ", () => {
    const c = parseRules("最近の完結済みで、隠れた名作の泣けるアニメ");
    assert.equal(c.era, "recent");
    assert.equal(c.completedOnly, true);
    assert.equal(c.popularity, "hidden-gem");
    assert.deepEqual(c.moods, [{ type: "cry", weight: 1 }]);
  });

  it("映画で、昔の名作が見たい → movie + classic (名作 alone is not a popularity)", () => {
    const c = parseRules("映画で、昔の名作が見たい");
    assert.equal(c.format, "movie");
    assert.equal(c.era, "classic");
    assert.equal(c.popularity, "any");
  });

  it("一気見 implies completed only (and high energy)", () => {
    const c = parseRules("週末に一気見できる、泣ける作品");
    assert.equal(c.completedOnly, true);
    assert.equal(c.energy, "high");
  });

  it("最近 meaning 'lately' is not an era", () => {
    assert.equal(parseRules("最近落ち込んでるから、元気が出るやつ").era, "any");
  });

  it("English: underrated recent romance movie", () => {
    const c = parseRules("An underrated recent romance movie");
    assert.equal(c.popularity, "hidden-gem");
    assert.equal(c.era, "recent");
    assert.equal(c.format, "movie");
    assert.deepEqual(c.moods, [{ type: "romance", weight: 1 }]);
  });

  it("English: 'finished work' is not completed-only; 'binge' is", () => {
    assert.equal(parseRules("I just finished work, something funny").completedOnly, false);
    assert.equal(parseRules("something famous to binge").completedOnly, true);
    assert.equal(parseRules("something famous to binge").popularity, "famous");
  });
});
