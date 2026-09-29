// src/i18n/i18n.test.ts
// Run: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dictionaries, renderChipLabel, renderNotice, renderReason, renderRuntime, subtitleFor, titleFor } from "@/i18n";
import type { Reason } from "@/lib/messages";

const names = { native: "進撃の巨人", romaji: "Shingeki no Kyojin", english: "Attack on Titan" };

describe("i18n", () => {
  it("JA and EN dictionaries have exactly the same keys", () => {
    const keys = (o: object, prefix = ""): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
      );
    assert.deepEqual(keys(dictionaries.en).sort(), keys(dictionaries.ja).sort());
    assert.equal(dictionaries.en.input.examples.length, dictionaries.ja.input.examples.length);
  });

  it("picks titles by language, with fallbacks", () => {
    assert.equal(titleFor(names, "ja"), "進撃の巨人");
    assert.equal(titleFor(names, "en"), "Attack on Titan");
    assert.equal(titleFor({ ...names, english: null }, "en"), "Shingeki no Kyojin");
    assert.equal(subtitleFor(names, "ja"), "Attack on Titan");
    assert.equal(subtitleFor(names, "en"), "進撃の巨人");
  });

  it("renders the same reasons in both languages", () => {
    const reasons: Reason[] = [
      { key: "mood", dim: "laugh", level: "high" },
      { key: "fitsTime", minutes: 30, whole: false },
      { key: "heavy", level: "none" },
      { key: "reference", titles: names },
      { key: "avoid", keys: ["horror", "gore"] },
    ];
    assert.deepEqual(
      reasons.map((r) => renderReason(r, "ja")),
      ["笑い度：高", "1話が30分以内", "重い展開：ほぼなし", "『進撃の巨人』に近い雰囲気", "ホラー・グロなし"],
    );
    assert.deepEqual(
      reasons.map((r) => renderReason(r, "en")),
      ["Comedy: high", "Each episode fits in 30 min", "Heavy themes: almost none", "Similar vibe to Attack on Titan", "No horror, gore"],
    );
  });

  it("renders notices, chips and runtime", () => {
    assert.equal(renderNotice({ key: "relaxed" }, "en"), "Relaxed some conditions");
    assert.equal(renderNotice({ key: "fewResults", count: 1 }, "en"), "Only 1 title matches");
    assert.equal(renderChipLabel({ kind: "avoid", key: "horror" }, "ja"), "ホラーなし");
    assert.equal(renderChipLabel({ kind: "time", minutes: 30 }, "en"), "30 min");
    assert.equal(renderRuntime({ format: "TV", episodes: 12, duration: 24 }, "ja"), "TVアニメ・1話24分 × 12話");
    assert.equal(renderRuntime({ format: "MOVIE", episodes: 1, duration: 107 }, "en"), "Movie · 107 min");
  });
});
