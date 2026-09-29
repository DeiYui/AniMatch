// src/lib/invariants.test.ts
// Property tests on the REAL dataset: hundreds of random Contexts (seeded, reproducible) through the whole
// pipeline, checking invariants that must always hold. Unit tests cover single rules; these catch the combinations.
// Run: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DATASET } from "@/lib/dataset";
import { AVOID_KEYS } from "@/data/avoidMap";
import { THEME_KEYS } from "@/data/themes";
import {
  COMPANIES,
  ContextSchema,
  ERAS,
  FORMAT_PREFS,
  MOODS,
  POPULARITIES,
  type Context,
} from "@/lib/context/schema";
import { contextToQuery } from "@/lib/engine/query";
import { fitsTimeBudget, MAX_RESULTS, rank, THEME_FLOOR, themeScore, TOP_K } from "@/lib/engine/rank";
import { explain } from "@/lib/engine/explain";
import { isExcludedByDefault, isFamilyUnsafe, matchesAvoid } from "@/lib/engine/filters";
import { addOptions, contextToChips } from "@/lib/context/chips";
import { QUICK_PICKS } from "@/lib/context/quickPicks";
import { mergeContexts } from "@/lib/context/merge";
import { parseRules } from "@/lib/context/rules";
import {
  composeUnderstood,
  LANGS,
  reasonKey,
  renderChipLabel,
  renderNotice,
  renderPickLabel,
  renderReason,
  renderRuntime,
  subtitleFor,
  titleFor,
} from "@/i18n";

const CASES = 400;
const { titles, medianScore } = DATASET;

// mulberry32: small seeded PRNG so failures are reproducible.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomContext(r: () => number): Context {
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const maybe = <T,>(p: number, v: () => T, otherwise: T) => (r() < p ? v() : otherwise);
  const moodCount = Math.floor(r() * 4); // 0 → default moods
  const moods = [...new Set(Array.from({ length: moodCount }, () => pick(MOODS)))].map((type) => ({ type, weight: r() < 0.7 ? 1 : 0.5 }));
  const refTitle = titles[Math.floor(r() * titles.length)];
  return ContextSchema.parse({
    moods: moods.length ? moods : undefined,
    energy: pick(["low", "mid", "high"] as const),
    timeBudgetMin: maybe(0.4, () => pick([3, 5, 15, 24, 30, 60, 90, 120]), null),
    company: maybe(0.4, () => pick(COMPANIES), null),
    avoid: [...new Set(Array.from({ length: Math.floor(r() * 4) }, () => pick(AVOID_KEYS)))],
    referenceTitle: maybe(0.15, () => pick([refTitle.title.native, refTitle.title.english, "存在しない作品"].filter(Boolean) as string[]), null),
    format: pick(FORMAT_PREFS),
    completedOnly: r() < 0.3,
    era: pick(ERAS),
    popularity: pick(POPULARITIES),
    themes: [...new Set(Array.from({ length: r() < 0.4 ? 1 + Math.floor(r() * 2) : 0 }, () => pick(THEME_KEYS)))],
    source: pick(["llm", "rules", "manual"] as const),
  });
}

const BAD_TEXT = /undefined|NaN|null|\[object/;
const assertText = (s: string, what: string) => {
  assert.ok(s.trim().length > 0, `${what}: empty`);
  assert.doesNotMatch(s, BAD_TEXT, `${what}: "${s}"`);
};

const contexts = (() => {
  const r = rng(20260929);
  return Array.from({ length: CASES }, () => randomContext(r));
})();

describe(`pipeline invariants over ${CASES} random contexts (real dataset)`, () => {
  it("ranking: bounded, unique, finite, hard filters respected, stable first page", () => {
    for (const [n, ctx] of contexts.entries()) {
      const where = `case ${n}: ${JSON.stringify(ctx)}`;
      const q = contextToQuery(ctx, titles);
      const page9 = rank(titles, q, medianScore, MAX_RESULTS);
      const page3 = rank(titles, q, medianScore, TOP_K);
      const ids = page9.results.map((x) => x.title.id);

      assert.ok(page9.results.length <= MAX_RESULTS, where);
      assert.equal(new Set(ids).size, ids.length, `duplicate titles — ${where}`);
      assert.equal(new Set(page9.results.map((x) => x.title.franchiseId)).size, ids.length, `duplicate franchise — ${where}`);
      assert.deepEqual(page3.results.map((x) => x.title.id), ids.slice(0, TOP_K), `first page changed with limit — ${where}`);

      for (const { title: t, score } of page9.results) {
        for (const [k, v] of Object.entries(score)) if (typeof v === "number") assert.ok(Number.isFinite(v), `score.${k}=${v} — ${where}`);
        if (q.themes.length && !page9.relaxed) {
          assert.ok(q.themes.some((th) => themeScore(t, th) >= THEME_FLOOR), `theme floor violated by ${t.id} — ${where}`);
        }
        assert.ok(!isExcludedByDefault(t), `ecchi shown — ${where}`);
        if (q.family) assert.ok(!isFamilyUnsafe(t), `family-unsafe shown — ${where}`);
        for (const k of q.avoid) assert.ok(!matchesAvoid(t, k), `avoid ${k} violated by ${t.id} — ${where}`);
        if (q.format === "movie") assert.equal(t.format, "MOVIE", where);
        if (q.format === "series") assert.notEqual(t.format, "MOVIE", where);
        if (q.completedOnly) assert.equal(t.status, "FINISHED", where);
        if (q.reference) assert.notEqual(t.franchiseId, q.reference.franchiseId, `reference franchise shown — ${where}`);
        if (q.timeBudgetMin != null && !page9.relaxed) assert.ok(fitsTimeBudget(t, q.timeBudgetMin), `time budget — ${where}`);
      }
    }
  });

  it("reasons: at most 3, unique React keys, render in both languages", () => {
    for (const ctx of contexts) {
      const q = contextToQuery(ctx, titles);
      for (const ranked of rank(titles, q, medianScore, MAX_RESULTS).results) {
        const reasons = explain(ranked, q);
        assert.ok(reasons.length <= 3);
        const keys = reasons.map(reasonKey);
        assert.equal(new Set(keys).size, keys.length, `duplicate reason keys ${keys.join(",")}`);
        for (const lang of LANGS) {
          for (const r of reasons) assertText(renderReason(r, lang), `reason ${JSON.stringify(r)} (${lang})`);
          assertText(renderRuntime(ranked.title, lang), `runtime (${lang})`);
          assertText(titleFor(ranked.title.title, lang), `title (${lang})`);
          const sub = subtitleFor(ranked.title.title, lang);
          if (sub != null) assertText(sub, `subtitle (${lang})`);
        }
      }
      for (const lang of LANGS) for (const n of q.notices) assertText(renderNotice(n, lang), `notice (${lang})`);
    }
  });

  it("understood sentence: every token is editable, no broken text, unique token ids", () => {
    for (const ctx of contexts) {
      const chips = new Map(contextToChips(ctx).map((c) => [c.id, c]));
      assert.equal(chips.size, contextToChips(ctx).length, "duplicate chip ids");
      for (const lang of LANGS) {
        const segments = composeUnderstood(ctx, lang);
        assert.ok(segments.length > 0);
        const tokenIds = segments.flatMap((s) => (s.kind === "token" ? [s.id] : []));
        assert.equal(new Set(tokenIds).size, tokenIds.length, `duplicate tokens ${tokenIds.join(",")} (${lang})`);
        for (const s of segments) {
          if (s.kind === "token") {
            assert.ok(chips.has(s.id), `token ${s.id} has no chip (${lang}) — ${JSON.stringify(ctx)}`);
            assertText(s.label, `token ${s.id} (${lang})`);
          } else {
            assert.doesNotMatch(s.text, BAD_TEXT, `text "${s.text}" (${lang})`);
          }
        }
        // Every chip is visible as a token (nothing the parser understood is hidden).
        for (const id of chips.keys()) assert.ok(tokenIds.includes(id), `chip ${id} missing from sentence (${lang}) — ${JSON.stringify(ctx)}`);
      }
    }
  });

  it("every edit (token choice, remove, add, quick pick, merge) yields a valid Context", () => {
    for (const ctx of contexts.slice(0, 120)) {
      const edits: Context[] = [];
      for (const chip of contextToChips(ctx)) {
        edits.push(chip.remove(ctx));
        for (const c of chip.choices ?? []) edits.push(c.apply(ctx));
        for (const lang of LANGS) {
          assertText(renderChipLabel(chip.label, lang), `chip ${chip.id} (${lang})`);
          for (const c of chip.choices ?? []) assertText(renderChipLabel(c.label, lang), `choice ${chip.id}/${c.value} (${lang})`);
        }
        if (chip.choices && chip.value != null) {
          assert.ok(chip.choices.some((c) => c.value === chip.value), `chip ${chip.id} value ${chip.value} not among its choices`);
        }
      }
      for (const o of addOptions(ctx)) {
        edits.push(o.apply(ctx));
        for (const lang of LANGS) assertText(renderChipLabel(o.label, lang), `add ${o.id} (${lang})`);
      }
      for (const p of QUICK_PICKS) {
        const once = p.toggle(ctx);
        edits.push(once);
        assert.notEqual(p.selected(once), p.selected(ctx), `pick ${p.id} didn't toggle — ${JSON.stringify(ctx)}`);
        for (const lang of LANGS) assertText(renderPickLabel(p.label, lang), `pick ${p.id} (${lang})`);
      }
      edits.push(mergeContexts(ctx, contexts[(contexts.indexOf(ctx) + 1) % contexts.length]));
      for (const e of edits) {
        const parsed = ContextSchema.safeParse(e);
        assert.ok(parsed.success, `invalid edit ${JSON.stringify(e)}: ${parsed.error?.message}`);
        const moodTypes = e.moods.map((m) => m.type);
        assert.equal(new Set(moodTypes).size, moodTypes.length, `duplicate moods ${moodTypes}`);
        assert.equal(new Set(e.avoid).size, e.avoid.length, `duplicate avoid ${e.avoid}`);
      }
    }
  });
});

describe("rules parser never throws", () => {
  const words = [
    "笑える", "泣ける", "は嫌", "以外", "なし", "じゃない", "30分", "1時間半", "家族", "恋人", "みたいな", "進撃の巨人", "最近の",
    "昔", "隠れた名作", "有名", "映画", "シリーズ", "一気見", "完結", "no", "not", "without", "something like", "Attack on Titan",
    "funny", "binge", "half an hour", "with my family", "hidden gem", "movie", "、", "。", ",", ".", "!", " ", "?", "「", "」",
  ];
  it(`accepts ${CASES} random word salads and always returns a valid Context`, () => {
    const r = rng(7);
    for (let i = 0; i < CASES; i++) {
      const text = Array.from({ length: 1 + Math.floor(r() * 10) }, () => words[Math.floor(r() * words.length)]).join("");
      const c = parseRules(text);
      assert.ok(ContextSchema.safeParse(c).success, text);
      assert.equal(new Set(c.moods.map((m) => m.type)).size, c.moods.length, `duplicate moods for "${text}"`);
    }
  });
});
