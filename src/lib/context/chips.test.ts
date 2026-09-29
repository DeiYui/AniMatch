// src/lib/context/chips.test.ts
// Run: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addOptions, contextToChips } from "@/lib/context/chips";
import { DEFAULT_MOODS } from "@/lib/context/schema";
import { makeContext } from "@/lib/engine/testUtils";

const chip = (id: string, c = makeContext()) => contextToChips(c).find((x) => x.id === id)!;

describe("chips", () => {
  it("hides default moods and shows stated ones", () => {
    assert.equal(contextToChips(makeContext({ moods: DEFAULT_MOODS })).length, 0);
    assert.deepEqual(contextToChips(makeContext()).map((c) => c.label), [{ kind: "mood", mood: "laugh" }]);
  });

  it("removing the last mood restores the default", () => {
    assert.deepEqual(chip("mood:laugh").remove(makeContext()).moods, DEFAULT_MOODS);
  });

  it("edits the time budget in place", () => {
    const c = makeContext({ timeBudgetMin: 30 });
    const time = chip("time", c);
    assert.equal(time.value, "30");
    assert.equal(time.choices!.find((x) => x.value === "60")!.apply(c).timeBudgetMin, 60);
  });

  it("keeps an unusual time value selectable", () => {
    assert.ok(chip("time", makeContext({ timeBudgetMin: 25 })).choices!.some((x) => x.value === "25"));
  });

  it("adding a mood replaces the default moods", () => {
    const c = makeContext({ moods: DEFAULT_MOODS });
    const add = addOptions(c).find((o) => o.id === "mood:cry")!;
    assert.deepEqual(add.apply(c).moods, [{ type: "cry", weight: 1 }]);
  });

  it("only offers conditions that aren't set yet", () => {
    const ids = addOptions(makeContext({ timeBudgetMin: 30, avoid: ["horror"] })).map((o) => o.id);
    assert.ok(!ids.some((id) => id.startsWith("time:")));
    assert.ok(!ids.includes("avoid:horror"));
    assert.ok(!ids.includes("mood:laugh"));
    assert.ok(ids.includes("company:family"));
  });
});
