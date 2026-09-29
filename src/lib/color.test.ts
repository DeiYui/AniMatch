// src/lib/color.test.ts
// Run: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { luminance, NEUTRAL_ACCENT, readableAccent } from "@/lib/color";

describe("readableAccent", () => {
  it("falls back to a neutral colour", () => {
    assert.equal(readableAccent(null), NEUTRAL_ACCENT);
    assert.equal(readableAccent("red"), NEUTRAL_ACCENT);
  });
  it("keeps light colours and lightens dark ones", () => {
    assert.equal(readableAccent("#f1a143"), "#f1a143");
    const dark = readableAccent("#1a1a35");
    assert.notEqual(dark, "#1a1a35");
    assert.ok(luminance(dark) > luminance("#1a1a35"));
  });
});
