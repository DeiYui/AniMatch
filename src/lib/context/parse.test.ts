// src/lib/context/parse.test.ts
// Fallback behaviour without touching the network: no API key → the LLM path throws immediately.
// Run: npm test
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { describeError, parseContext } from "@/lib/context/parse";

describe("parseContext fallback", () => {
  before(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  it("falls back to rules when the LLM can't run, and says why", async () => {
    const r = await parseContext("仕事で疲れた。30分だけ笑えるやつ");
    assert.equal(r.parser, "rules");
    assert.equal(r.context.source, "rules");
    assert.equal(r.context.timeBudgetMin, 30);
    assert.match(r.fallbackReason ?? "", /not set/);
  });

  it("forced rules mode never calls the LLM", async () => {
    const r = await parseContext("笑えるやつ", "rules");
    assert.equal(r.parser, "rules");
    assert.equal(r.fallbackReason, "forced (parser=rules)");
  });
});

describe("describeError", () => {
  it("classifies the failure kinds", () => {
    assert.equal(describeError(Object.assign(new Error("aborted"), { name: "AbortError" })), "timeout");
    assert.equal(describeError(Object.assign(new Error('{"error":{"code":429}}'), { status: 429 })), "rate-limit (429)");
    assert.equal(describeError(new SyntaxError("Unexpected token")), "invalid JSON");
    assert.equal(describeError(z.object({ a: z.string() }).safeParse({}).error), "schema mismatch");
  });
});
