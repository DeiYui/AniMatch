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
