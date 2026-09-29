// src/lib/context/quickPicks.test.ts
// Run: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { activePrefCount, clearPrefs, emptyContext, QUICK_PICKS } from "@/lib/context/quickPicks";
import { mergeContexts } from "@/lib/context/merge";
import { DEFAULT_MOODS } from "@/lib/context/schema";
import { makeContext } from "@/lib/engine/testUtils";

const pick = (id: string) => QUICK_PICKS.find((p) => p.id === id)!;

describe("quick picks", () => {
  it("start from an empty manual context", () => {
    const c = emptyContext();
    assert.equal(c.source, "manual");
    assert.deepEqual(c.moods, DEFAULT_MOODS);
    assert.ok(QUICK_PICKS.every((p) => !p.selected(c)));
  });

  it("toggle moods on and off, replacing the default mood", () => {
    const a = pick("mood:laugh").toggle(emptyContext());
    assert.deepEqual(a.moods, [{ type: "laugh", weight: 1 }]);
    const b = pick("mood:cry").toggle(a);
    assert.deepEqual(b.moods.map((m) => m.type), ["laugh", "cry"]);
    assert.deepEqual(pick("mood:laugh").toggle(pick("mood:cry").toggle(b)).moods, DEFAULT_MOODS);
  });

  it("weekend binge = no time limit + high energy + completed only; picking a time ends it", () => {
    const binge = pick("time:binge").toggle(makeContext({ timeBudgetMin: 30 }));
    assert.equal(binge.timeBudgetMin, null);
    assert.equal(binge.energy, "high");
    assert.equal(binge.completedOnly, true);
    assert.ok(pick("time:binge").selected(binge));
    const thirty = pick("time:30").toggle(binge);
    assert.equal(thirty.timeBudgetMin, 30);
    assert.ok(!pick("time:binge").selected(thirty));
  });

  it("single-choice groups switch, and tapping the selected one clears it", () => {
    const fam = pick("company:family").toggle(makeContext());
    assert.equal(pick("company:friends").toggle(fam).company, "friends");
    assert.equal(pick("company:family").toggle(fam).company, null);
    assert.equal(pick("era:classic").toggle(pick("era:recent").toggle(makeContext())).era, "classic");
  });

  it("counts and clears the 「こだわり条件」 picks only", () => {
    const c = makeContext({ format: "movie", avoid: ["horror", "gore"], company: "family", timeBudgetMin: 30 });
    assert.equal(activePrefCount(c), 3);
    const cleared = clearPrefs(c);
    assert.equal(activePrefCount(cleared), 0);
    assert.equal(cleared.company, "family", "time / with are not preferences");
    assert.equal(cleared.timeBudgetMin, 30);
  });
});

describe("mergeContexts (typed text + picks chosen before typing)", () => {
  it("text wins where it says something; picks fill the rest; lists are combined", () => {
    const picks = makeContext({ moods: [{ type: "cry", weight: 1 }], company: "family", avoid: ["horror"], era: "recent" });
    const parsed = makeContext({ moods: [{ type: "laugh", weight: 1 }], timeBudgetMin: 30, avoid: ["gore"], source: "llm" });
    const m = mergeContexts(parsed, picks);
    assert.deepEqual(m.moods.map((x) => x.type), ["laugh", "cry"]);
    assert.equal(m.timeBudgetMin, 30);
    assert.equal(m.company, "family");
    assert.deepEqual(m.avoid, ["gore", "horror"]);
    assert.equal(m.era, "recent");
    assert.equal(m.source, "llm");
  });

  it("default moods in the text keep the picked moods", () => {
    const m = mergeContexts(makeContext({ moods: DEFAULT_MOODS }), makeContext({ moods: [{ type: "dark", weight: 1 }] }));
    assert.deepEqual(m.moods, [{ type: "dark", weight: 1 }]);
  });
});
