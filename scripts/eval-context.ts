// scripts/eval-context.ts
// Runs both parsers on eval/context-cases.json and prints accuracy per category and per field (Markdown).
// Both parsers go through finalizeContext() (exact-title detection), exactly like the app.
// The LLM is called directly (no fallback) with a generous timeout, so its real latency and failures are measured.
//
// Case format: { category, text, strict?, note?, expected }
//   strict (default true): every field not listed must be at its neutral value (no mood, no themes, mid energy…).
//   strict false: only the listed fields are scored.
//   expected.moods: the stated moods in order ([] = none stated). expected.intent: a value or a list of accepted values
//   (default "recommend"). expected.themesInclude: themes that must be present (others allowed).
// Run: npm run eval:context   (throttled for the free tier: EVAL_INTERVAL_MS, default 4500)
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { loadLocalEnv } from "./env";
import { parseRules } from "../src/lib/context/rules";
import { describeError, llmTimeoutMs, llmWithTimeout } from "../src/lib/context/parse";
import { AvoidKeySchema, INTENTS, MoodSchema, ThemeKeySchema, type Context } from "../src/lib/context/schema";
import { normalizeName, isDefaultMoods } from "../src/lib/engine/query";
import { finalizeContext } from "../src/lib/recommend";
import { DATASET } from "../src/lib/dataset";

const EVAL_LLM_TIMEOUT_MS = 20000;
const INTERVAL_MS = Number(process.env.EVAL_INTERVAL_MS) || 4500; // ≈13 requests/min
const RATE_LIMIT_RETRIES = 2;
const RATE_LIMIT_WAIT_MS = 30000;

const Intent = z.enum(INTENTS);
const ExpectedSchema = z.object({
  moods: z.array(MoodSchema).optional(),
  energy: z.enum(["low", "mid", "high"]).optional(),
  timeBudgetMin: z.number().nullable().optional(),
  company: z.enum(["alone", "partner", "friends", "family"]).nullable().optional(),
  avoid: z.array(AvoidKeySchema).optional(),
  referenceTitle: z.string().nullable().optional(),
  format: z.enum(["any", "movie", "series"]).optional(),
  completedOnly: z.boolean().optional(),
  era: z.enum(["any", "recent", "classic"]).optional(),
  popularity: z.enum(["any", "famous", "hidden-gem"]).optional(),
  themes: z.array(ThemeKeySchema).optional(),
  themesInclude: z.array(ThemeKeySchema).optional(),
  titleSearch: z.boolean().optional(),
  intent: z.union([Intent, z.array(Intent)]).optional(),
});
const CaseSchema = z.object({
  category: z.string(),
  text: z.string(),
  strict: z.boolean().default(true),
  note: z.string().optional(),
  expected: ExpectedSchema,
});
type Case = z.infer<typeof CaseSchema>;
type Expected = z.infer<typeof ExpectedSchema>;

// Neutral values assumed for strict cases when a field isn't listed.
const NEUTRAL: Required<Omit<Expected, "themesInclude" | "intent" | "titleSearch">> = {
  moods: [],
  energy: "mid",
  timeBudgetMin: null,
  company: null,
  avoid: [],
  referenceTitle: null,
  format: "any",
  completedOnly: false,
  era: "any",
  popularity: "any",
  themes: [],
};

const FIELDS = [
  "intent",
  "primaryMood",
  "moods",
  "themes",
  "energy",
  "timeBudgetMin",
  "company",
  "avoid",
  "referenceTitle",
  "titleSearch",
  "format",
  "completedOnly",
  "era",
  "popularity",
] as const;
type Field = (typeof FIELDS)[number];
type Result = Partial<Record<Field, boolean>>; // only the fields scored for this case

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const sameSet = <T>(a: T[], b: T[]) => a.length === b.length && a.every((x) => b.includes(x));
const sameTitle = (a: string | null, b: string | null) => (a == null || b == null ? a === b : normalizeName(a) === normalizeName(b));
const statedMoods = (c: Context) => (isDefaultMoods(c.moods) ? [] : [...new Set(c.moods.map((m) => m.type))]);

function score(c: Context, cs: Case): Result {
  const e: Expected = cs.strict ? { ...NEUTRAL, ...cs.expected } : cs.expected;
  const r: Result = {};
  const intents = [e.intent ?? "recommend"].flat();
  r.intent = intents.includes(c.intent);
  const moods = statedMoods(c);
  if (e.moods) {
    r.primaryMood = (moods[0] ?? null) === (e.moods[0] ?? null);
    r.moods = sameSet(moods, e.moods);
  }
  if (e.themes) r.themes = sameSet(c.themes, e.themes);
  if (e.themesInclude) r.themes = e.themesInclude.every((t) => c.themes.includes(t));
  if (e.energy !== undefined) r.energy = c.energy === e.energy;
  if (e.timeBudgetMin !== undefined) r.timeBudgetMin = c.timeBudgetMin === e.timeBudgetMin;
  if (e.company !== undefined) r.company = c.company === e.company;
  if (e.avoid) r.avoid = sameSet(c.avoid, e.avoid);
  if (e.referenceTitle !== undefined) r.referenceTitle = sameTitle(c.referenceTitle, e.referenceTitle);
  if (e.titleSearch !== undefined) r.titleSearch = c.titleSearch === e.titleSearch;
  if (e.format !== undefined) r.format = c.format === e.format;
  if (e.completedOnly !== undefined) r.completedOnly = c.completedOnly === e.completedOnly;
  if (e.era !== undefined) r.era = c.era === e.era;
  if (e.popularity !== undefined) r.popularity = c.popularity === e.popularity;
  return r;
}

const allRight = (r: Result) => Object.values(r).every(Boolean);

type LlmRun = { context: Context | null; latencyMs: number; error: string | null };

async function runLlm(text: string): Promise<LlmRun> {
  for (let retries = 0; ; retries++) {
    const start = performance.now();
    try {
      const context = await llmWithTimeout(text, EVAL_LLM_TIMEOUT_MS);
      return { context, latencyMs: performance.now() - start, error: null };
    } catch (err) {
      const error = describeError(err);
      // 429 and 503 ("high demand") are transient: wait and retry, so the eval measures parsing, not load.
      if ((error.startsWith("rate-limit") || /\b503\b|UNAVAILABLE/.test(error)) && retries < RATE_LIMIT_RETRIES) {
        console.error(`  ${error.slice(0, 20)}…, waiting ${RATE_LIMIT_WAIT_MS / 1000}s…`);
        await sleep(RATE_LIMIT_WAIT_MS);
        continue;
      }
      return { context: null, latencyMs: performance.now() - start, error };
    }
  }
}

const brief = (c: Context | null) =>
  c
    ? JSON.stringify({
        intent: c.intent,
        moods: statedMoods(c),
        themes: c.themes,
        ...(c.energy !== "mid" && { energy: c.energy }),
        ...(c.timeBudgetMin != null && { time: c.timeBudgetMin }),
        ...(c.company && { company: c.company }),
        ...(c.avoid.length && { avoid: c.avoid }),
        ...(c.referenceTitle && { ref: c.referenceTitle }),
        ...(c.titleSearch && { titleSearch: true }),
        ...(c.format !== "any" && { format: c.format }),
        ...(c.completedOnly && { completed: true }),
        ...(c.era !== "any" && { era: c.era }),
        ...(c.popularity !== "any" && { popularity: c.popularity }),
        ...(c.unmatched.length && { unmatched: c.unmatched }),
      })
    : "(failed)";

const pct = (x: number) => (Number.isNaN(x) ? "—" : `${Math.round(x * 100)}%`);
const ms = (x: number) => `${Math.round(x)}ms`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

type Row = { c: Case; rules: Context; rulesMs: number; rulesScore: Result; llm: LlmRun; llmScore: Result | null };

async function main() {
  loadLocalEnv();
  const cases = CaseSchema.array().parse(JSON.parse(readFileSync(resolve(__dirname, "../eval/context-cases.json"), "utf8")));
  const { titles } = DATASET;
  console.error(`Evaluating ${cases.length} cases (model ${process.env.GEMINI_MODEL}, interval ${INTERVAL_MS}ms)…`);

  const rows: Row[] = [];
  for (const [i, c] of cases.entries()) {
    const t = performance.now();
    const rules = finalizeContext(c.text, parseRules(c.text), titles);
    const rulesMs = performance.now() - t;

    const started = Date.now();
    const raw = await runLlm(c.text);
    const llm = { ...raw, context: raw.context && finalizeContext(c.text, raw.context, titles) };
    console.error(`  ${i + 1}/${cases.length} ${llm.error ? `LLM failed: ${llm.error}` : ms(llm.latencyMs)}`);

    rows.push({ c, rules, rulesMs, rulesScore: score(rules, c), llm, llmScore: llm.context ? score(llm.context, c) : null });
    if (i < cases.length - 1) await sleep(Math.max(0, INTERVAL_MS - (Date.now() - started)));
  }

  const llmOk = (r: Row) => r.llmScore != null && allRight(r.llmScore);
  const llmIntent = (r: Row) => r.llmScore?.intent === true;

  console.log(`# Context parser eval — ${new Date().toLocaleString("sv-SE")}\n`);
  console.log(`${cases.length} cases · model \`${process.env.GEMINI_MODEL}\` · app timeout ${llmTimeoutMs()}ms · LLM failures count as wrong\n`);

  console.log("## Per category (all scored fields correct / intent correct)\n");
  console.log("| Category | n | LLM all | Rules all | LLM intent | Rules intent |\n|---|---|---|---|---|---|");
  const categories = [...new Set(rows.map((r) => r.c.category))];
  for (const cat of [...categories, "ALL"]) {
    const rs = cat === "ALL" ? rows : rows.filter((r) => r.c.category === cat);
    const n = rs.length;
    const frac = (f: (r: Row) => boolean) => `${rs.filter(f).length}/${n}`;
    const label = cat === "ALL" ? "**all**" : cat;
    console.log(`| ${label} | ${n} | ${frac(llmOk)} | ${frac((r) => allRight(r.rulesScore))} | ${frac(llmIntent)} | ${frac((r) => r.rulesScore.intent === true)} |`);
  }

  console.log("\n## Per field (over the cases where the field is scored)\n");
  console.log("| Field | cases | LLM | Rules |\n|---|---|---|---|");
  for (const f of FIELDS) {
    const scored = rows.filter((r) => f in r.rulesScore);
    if (!scored.length) continue;
    const llm = avg(scored.map((r) => (r.llmScore?.[f] ? 1 : 0)));
    const rules = avg(scored.map((r) => (r.rulesScore[f] ? 1 : 0)));
    console.log(`| ${f} | ${scored.length} | ${pct(llm)} | ${pct(rules)} |`);
  }

  const lat = rows.filter((r) => r.llm.context).map((r) => r.llm.latencyMs);
  const sorted = [...lat].sort((a, b) => a - b);
  console.log("\n## Latency\n");
  console.log(
    `LLM avg ${ms(avg(lat))}, p50 ${ms(sorted[Math.floor(sorted.length / 2)] ?? NaN)}, max ${ms(Math.max(...lat))}; ` +
      `over app timeout: ${lat.filter((x) => x > llmTimeoutMs()).length}/${lat.length}; LLM failures: ${rows.filter((r) => r.llm.error).length}` +
      ` · rules avg ${avg(rows.map((r) => r.rulesMs)).toFixed(2)}ms`,
  );

  console.log("\n## Cases with any wrong field\n");
  for (const r of rows) {
    const wrong = (s: Result | null) => (s ? Object.entries(s).filter(([, ok]) => !ok).map(([f]) => f) : ["(LLM failed)"]);
    const lw = wrong(r.llmScore);
    const rw = wrong(r.rulesScore);
    if (!lw.length && !rw.length) continue;
    console.log(`- [${r.c.category}] 「${r.c.text}」${r.c.note ? ` (${r.c.note})` : ""}`);
    console.log(`  - LLM wrong on: ${lw.join(", ") || "—"} · rules wrong on: ${rw.join(", ") || "—"}`);
    console.log(`  - expected: ${JSON.stringify(r.c.expected)}`);
    console.log(`  - LLM:      ${brief(r.llm.context)}`);
    console.log(`  - rules:    ${brief(r.rules)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
