# AniMatch v2 — Design Spec

Source of truth for the rebuild. Read this before every task. If a request conflicts with this file, ask before deviating.

## Goal

The user types a free-text sentence about their current situation (Japanese first, English OK), e.g.
「仕事で疲れた。寝る前に30分だけ、何も考えずに笑えるやつ」
and gets 3 anime recommendations, each with a short, factual reason.

This replaces the old slider UI. The audience for the demo is managers, so every result must be explainable.

## Core principle

**The LLM only understands language. It never decides what to recommend.**

- LLM: free text → a fixed, validated `Context` object. Nothing else.
- Deterministic code: `Context` → filters + target vector → ranking → explanation.
- Explanations are generated from the engine's own numbers, never written by the LLM.
- If the LLM fails, a rule-based parser produces the same `Context` shape. The app must never break because of the LLM.

## Pipeline

```
text
 → [1] parseContext(): LLM → JSON → Zod validate
        on error / timeout (3s) / invalid → rule-based parser
 → [2] contextToQuery(): Context → { targetVector, hardFilters }   (fixed mapping, no LLM)
 → [3] rank(): hard filters → cosine similarity → quality bonus → diversity → top 3
 → [4] explain(): reasons built from dimension contributions + satisfied constraints
 → UI: show "what the system understood" (editable chips) + 3 results
```

## Context schema (Zod is the single definition)

```ts
type Mood = "laugh" | "cry" | "thrill" | "relax" | "think" | "romance" | "dark";

type Context = {
  moods: { type: Mood; weight: number }[];  // weight 0..1, at least one
  energy: "low" | "mid" | "high";           // low → penalize heavy/complex titles
  timeBudgetMin: number | null;             // "30分" → 30, "週末" → null (no limit)
  company: "alone" | "partner" | "friends" | "family" | null;
  avoid: string[];                          // normalized genre/tag names to exclude
  referenceTitle: string | null;            // 「〇〇みたいな」 → use that title's vector as target
  source: "llm" | "rules";                  // which parser produced it
};
```

Defaults when missing: `moods = [{ type: "relax", weight: 0.5 }]`, `energy = "mid"`, others null / empty.

## Data

- Source: AniList GraphQL API. Fetch ~1000 titles by popularity, via a one-off script (`scripts/fetch-anilist.ts`), not at runtime.
- Fields: id, title (native, romaji, english), genres, tags (name + rank %), format (TV/MOVIE/OVA/ONA), episodes, duration (min/episode), averageScore, popularity, isAdult, coverImage, siteUrl.
- Validate every item with Zod. Drop items missing genres/tags/duration. Drop `isAdult`.
- Respect AniList rate limits (throttle + retry on 429).
- Output: `src/data/anime.json` (generated, committed). No database for now.

## Vectors — no hand-scored titles

Dimensions (order fixed): `laugh, cry, thrill, relax, think, romance, dark, heavy`

- `heavy` = how demanding the title is (complex plot, long runtime, grim tone). Used with `energy`.
- Vectors are computed by a single, readable mapping table in `src/data/tagMapping.ts`:
  genre/tag name → partial weights per dimension. Title vector = sum(weight × tag.rank/100), then clamp to 0..1.
- This table is the ONE place where human judgment lives. Keep it short, commented, and reviewable. The human (me) will review and tune it.

## Ranking

1. Hard filters:
   - `timeBudgetMin` → allow a movie whose duration fits, or a series where one episode fits (and prefer short series).
   - `company === "family"` → exclude dark/gore/ecchi tags.
   - `avoid` → exclude matching genres/tags.
2. Target vector from `moods` (+ `energy`: low → target `heavy` near 0, high → allow it).
   If `referenceTitle` matches a title, blend its vector into the target.
3. Score = cosine(target, title) × 0.8 + normalized averageScore × 0.2 (weights as constants, easy to tune).
4. Diversity: skip a candidate if it's too similar (cosine > 0.95) to an already-picked one, or the same franchise.
5. Return top 3 with their score breakdown.

## Explanation

Built from facts only, via templates. Examples:
- 「映画・約90分」 / 「1話24分 × 12話」
- 「笑い度：高」「重い展開：ほぼなし」
- 「『〇〇』に近い雰囲気」
Pick the top 2 contributing dimensions + any satisfied constraint.

## Rule-based fallback (`src/lib/context/rules.ts`)

Japanese keyword dictionary, e.g.:
- 疲れ / だるい → energy low
- 笑 / 笑える / 明るい → laugh;  泣 / 泣ける / 感動 → cry;  癒 / ほっこり → relax
- ワクワク / 熱い / バトル → thrill;  考察 / 伏線 / 頭を使う → think;  恋 / 恋愛 → romance
- N分 / N時間 → timeBudgetMin
- 家族 / 子ども → family;  彼女 / 彼氏 → partner;  友達 → friends
- 〜は嫌 / 〜以外 / 〜なし → avoid

## LLM call

- Server-side only (Next.js route handler). API key in `.env.local`, never exposed to the client.
- Provider: Gemini API, free tier, Flash model. Key from `GEMINI_API_KEY`, model id from `GEMINI_MODEL` (never hard-coded).
- Temperature 0.
- Prompt returns JSON only, matching the schema. Validate with Zod; on any failure → rules.
- Timeout 3s → rules. Rate-limit errors (429) → rules, same as any other failure. Log which parser was used.
- Keep the provider behind one small interface in llm.ts so it can be swapped (e.g. to Claude) by changing only that file.

## UI

- One text input + 3–4 clickable example sentences (an empty box is intimidating).
- After submit, show "理解した内容" as chips (e.g. 疲れ気味 / 30分 / 笑い). User can remove or edit a chip → re-rank without calling the LLM again.
- 3 result cards: cover, title, format + runtime, reasons, link to AniList.
- 👍 / 👎 on each card, logged (console or local file for now). Not used for learning yet.
- Keep the existing dark visual style.

## Evaluation (needed for the presentation)

- `eval/context-cases.json`: ~20 test sentences with expected `Context` fields.
- `scripts/eval-context.ts`: run both parsers on every case, print per-field accuracy and average latency for LLM vs rules. Throttle calls to stay within free-tier rate limits.

## Suggested layout

```
scripts/fetch-anilist.ts
scripts/eval-context.ts
eval/context-cases.json
src/data/anime.json            (generated)
src/data/tagMapping.ts
src/lib/vectorize.ts
src/lib/context/schema.ts      (Zod, single source of the Context type)
src/lib/context/llm.ts
src/lib/context/rules.ts
src/lib/context/parse.ts       (LLM → fallback orchestration)
src/lib/engine/query.ts        (contextToQuery)
src/lib/engine/rank.ts
src/lib/engine/explain.ts
src/app/api/recommend/route.ts
```

The old `src/data/animeList.ts` and slider UI are removed only in the final step.

## Non-goals (for now)

No database / pgvector, no user accounts, no learning from feedback, no LLM-written explanations.

## Decisions

Resolved open questions. These refine the sections above. Where they differ, this section wins. All numbers are named constants and can be tuned.

### Data & vectors

1. **Franchise.** Fetch `relations` (SEQUEL, PREQUEL, PARENT, SIDE_STORY) and `synonyms`. Group related titles within the dataset into a `franchiseId`. If a title has a PREQUEL that is in the dataset, apply a small penalty (-0.05), so we recommend where to start instead of season 3. About 27% of titles get this penalty.
2. **Genres** count as rank 60, so broad genres don't overpower specific tags.
3. **`heavy`** = 70% tags + 30% runtime component (episodes × duration), computed in `vectorize.ts`. Constants go at the top of the file.
4. **Vector computation:**
   - Ignore tags with rank < 40.
   - Don't clamp while summing.
   - After all titles are computed, divide each dimension by its dataset 99th percentile, then clamp to 0..1. (p95 was tried first, but it left ~50 titles per dimension tied at 1.0.)
   - Diversity threshold: start at cosine > 0.95. In the first dataset, 1.7% of cross-franchise pairs were above it.
   - `Tragedy` is on ~37% of titles, so it gets moderate weights (cry 0.5, dark 0.5).
   - Ecchi / harem / sexual tags are not mapped, so they never raise `laugh` or `romance`.

### Context & avoid

5. **avoid vocabulary** is a fixed list of about 12–15 keys (horror, gore, ecchi, tragedy, romance, sports, mecha, long-series, …) in `src/data/avoidMap.ts`, next to `tagMapping.ts`.
   - Each key maps to AniList genres/tags.
   - `Context.avoid` is a Zod enum of these keys, and the enum list goes into the LLM prompt.
   - The rules parser's JP keyword → key dictionary lives in the same file.
   - A tag counts from rank 40 by default. Keys whose tags AniList applies loosely use a higher threshold: gore 60, harem 60, tragedy 70. `cgi` uses only `Full CGI`.
   - Reviewed by the human together with `tagMapping.ts`.
6. **Rules parser.** Detect negation patterns first (〜は嫌, 〜はいや, 〜なし, 〜以外, 〜じゃない). Send matches to `avoid` and remove those spans before mood detection. Mood weight is fixed at 1.0.
7. **company.** Only `family` affects ranking in v2. `partner`/`friends` appear in chips and explanations only.

### Ranking

8. **Re-rank on the server.** `POST /api/recommend` accepts either `{ text }` or `{ context }`. Editing chips sends `{ context }` and skips parsing.
9. **energy:**
   - `low` → heavy target 0, plus an explicit penalty `score -= heavy × 0.3`.
   - `mid` → heavy target 0.4, no penalty.
   - `high` → heavy target 0.7, no penalty.
10. **referenceTitle:**
    - Normalize (NFKC, lowercase, strip spaces/punctuation) and match against native/romaji/english/synonyms. Exact match first, then substring. No fuzzy library.
    - Target = 0.5 moods + 0.5 reference, or 0.8 reference if moods are only the default.
    - Not found → ignore it and show a chip 「『X』が見つかりませんでした」.
    - Exclude the reference title and its whole franchise from results.
11. **averageScore** is divided by 100. `null` → dataset median.
12. **Fewer than 3 results after filters.**
    - Never relax safety filters (family, avoid).
    - Relax only the time budget: first allow series where one episode fits, then drop the budget entirely.
    - If still fewer than 3, show fewer results.
    - Whenever relaxed, show 「条件を少しゆるめました」.
13. **Short series bonus.** +0.05 when `timeBudgetMin` is set and episodes ≤ 13.
14. **Safe by default.** The Ecchi genre is excluded from every result set, whatever the Context says, because the demo audience is managers. Like the other safety filters, it is never relaxed. Configured as `DEFAULT_EXCLUDE_GENRES` in `avoidMap.ts`.
15. **Family filter.** Exclude titles where Gore, Nudity, Sexual Content (or similar AniList tags) have rank ≥ 50, plus the Ecchi and Horror genres. The list lives in `avoidMap.ts`.

### LLM, UI, eval, ops

16. **Language.** UI, chips and reasons are always Japanese. Input can be any language.
17. **LLM timeout** comes from `LLM_TIMEOUT_MS` (default 3000). Use the lowest thinking level the model supports. Pick the final value from eval latency.
18. **Eval scoring:**
    - moods: correct if the primary mood matches, and also report Jaccard for the mood set. Ignore weights.
    - energy, company, timeBudgetMin: exact match.
    - avoid: set match.
19. **Ops.** No deploy for now, the demo runs locally. 👍/👎 is logged to a local JSONL file behind a small logger interface so it can be swapped later.

### Implementation notes

- `anime.json` stores the validated AniList data only. Vectors and `franchiseId` are computed from it at load time (`src/lib/dataset.ts`), so tuning `tagMapping.ts` / `avoidMap.ts` never needs a re-fetch.
- `npm run report:vectors` prints the top 10 titles per dimension for reviewing `tagMapping.ts`.