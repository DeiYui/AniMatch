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

The old `src/data/animeList.ts` and slider UI were removed in the final step (see Decision 20).

## Non-goals (for now)

No database / pgvector, no user accounts, no learning from feedback, no LLM-written explanations.

## Decisions

Resolved open questions. These refine the sections above. Where they differ, this section wins. All numbers are named constants and can be tuned.

### Data & vectors

1. **Franchise.** Fetch `relations` (SEQUEL, PREQUEL, PARENT, SIDE_STORY) and `synonyms`. Group related titles within the dataset into a `franchiseId`. If a title has a PREQUEL that is in the dataset, apply a penalty (−0.15), so we recommend where to start instead of season 3. About 27% of titles get this penalty. It started at −0.05, but scores are clustered within about 0.1 of each other, so −0.05 changed nothing: two of the three 「家族・ワクワク」 results were still sequels.
2. **Genres** count as rank 60, so broad genres don't overpower specific tags.
3. **`heavy`** = 70% tags + 30% runtime component (episodes × duration), computed in `vectorize.ts`. Constants go at the top of the file.
4. **Vector computation:**
   - Ignore tags with rank < 40.
   - Don't clamp while summing.
   - After all titles are computed, divide each dimension by its dataset 99th percentile, then clamp to 0..1. (p95 was tried first, but it left ~50 titles per dimension tied at 1.0.)
   - Diversity threshold: cosine > 0.97 counts as a near-duplicate. It started at 0.95 (1.7% of cross-franchise pairs were above that), but 0.95 dropped Your lie in April as a "duplicate" of 聲の形 (cosine 0.961). Two strong crying films are not duplicates.
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
9. **energy.** `heavy` is never part of the target or the cosine (see "Scoring, revised" below). Energy acts only through a separate term:
   - `low` → `score -= heavy × 0.3`.
   - `mid` → nothing.
   - `high` → `score += heavy × 0.1` (small bonus).
10. **referenceTitle:**
    - Normalize (NFKC, lowercase, strip spaces/punctuation) and match against native/romaji/english/synonyms. Exact match first, then substring. No fuzzy library.
    - Target = 0.5 moods + 0.5 reference, or 0.8 reference if moods are only the default.
    - Not found → ignore it and show a chip 「『X』が見つかりませんでした」.
    - Exclude the reference title and its whole franchise from results.
11. **averageScore** is divided by 100. `null` → dataset median.
12. **Fewer than 3 results after filters.**
    - Never relax safety filters (safe-by-default, family, avoid, the reference's franchise).
    - The time filter is "a movie fits, or one episode of a series fits" (the rule from the Ranking section).
    - Relax soft constraints in this order:
      1. The primary-mood floor (a system heuristic, so it goes before anything the user said).
      2. The time budget. Titles that fit are still ranked first, then the rest fill the remaining slots.
    - If still fewer than 3, show fewer results.
    - Whenever relaxed, show 「条件を少しゆるめました」.
13. **Short series bonus.** +0.05 when a time budget is being applied and the title is a series with ≤ 13 episodes. No bonus for movies. No bonus once the time budget has been dropped.
14. **Safe by default.** The Ecchi genre is excluded from every result set, whatever the Context says, because the demo audience is managers. Like the other safety filters, it is never relaxed. Configured as `DEFAULT_EXCLUDE_GENRES` in `avoidMap.ts`.
15. **Family filter.** Exclude titles where Gore, Nudity, Sexual Content (or similar AniList tags) have rank ≥ 50, plus the Ecchi and Horror genres. The list lives in `avoidMap.ts`.

### Scoring, revised after the first real results

The first run showed that the cosine rewards *well-aligned but weak* titles. For 「泣ける」, a title with only cry 0.29 beat Your lie in April (cry 1.0), because extra dimensions such as romance lower the cosine. `heavy` in the target made up about 1/3 of its direction. Fixes:

- **heavy out of the cosine.** The cosine is computed over the 7 mood dimensions only. `heavy` only enters through the energy term (Decision 9).
- **Intensity term**, so strong titles win and not just aligned ones:
  - `intensity` = weighted average of the title's values on the target's mood dimensions, weighted by the target. Without a reference, the target equals the context mood weights. With a reference, it is the blended target.
  - **Intensity uses only the target's top 2 dimensions** (by target weight). Over all dimensions, a spread-out target (a reference title such as 進撃の巨人 has 4–5 non-zero dims) rewarded titles that are high on *everything*. That brought back the "flat vector" problem: ONE PIECE jumped to #1 for 「進撃の巨人みたいな」. With the top 2, intensity measures "strong on what matters most" and leaves the fine-grained match to the cosine. For 1–2 moods it is the same as before.
  - `score = 0.5 × cosine + 0.3 × intensity + 0.2 × quality`, then the energy, prequel, long-series and short-series adjustments. The constants are at the top of `rank.ts`.
- **Long-series penalty.** −0.05 for titles with more than 100 episodes, when there is no time budget and energy is not `high`. Only 一気見-type requests should get 100+ episode shows without a penalty.
- **Primary-mood floor (soft).** The title's value on `moods[0]` must be ≥ 0.3. It doesn't apply when moods are only the default. It is relaxed first when fewer than 3 results remain (Decision 12).
- **Reasons.** At most 3 per card, taken in priority order:
  1. Strongest mood
  2. Reference
  3. The user's constraints (time fit, 重い展開 when energy is low, family, avoid, 見ごたえ when energy is high)
  4. Second mood
  5. Sequel caveat
  6. Short series
  7. AniList score

  Runtime (「1話24分 × 12話」) is shown on the card itself, not as a reason.
- **Benchmark.** `npm run showcase [-- "label"]` runs the 6 fixed sentences and appends the output, with the date and git commit, to `docs/showcase-log.md`. Compare against the previous run after every scoring or mapping change.

### Quick picks, new conditions, covers

21. **Text first, picks for speed.** Typing is for nuance; quick picks are for speed. Both produce the same `Context`.
    - The panel under the input has 5 rows: mood / time / with / filters / avoid.
      - The 4 most common avoid keys are shown (horror, gore, tragedy, long-series). The rest are behind 「もっと」. Ecchi is already excluded by default.
      - Rows scroll sideways on a phone and wrap on wide screens.
    - A tap edits the `Context` directly (`context/quickPicks.ts`) and re-ranks without calling the LLM. Selected picks are highlighted, based on the current `Context`.
    - Picks before any text start from an empty `Context` with `source: "manual"` (badge 「クイック選択」).
    - If the user then types, the request sends `{ text, base }`, and `context/merge.ts` combines them. What the sentence says wins. Picks fill in what it didn't mention. Moods and avoid keys are combined.
    - Typing a new sentence after a text search replaces the conditions. Picks after a search edit them.
22. **New conditions** in `Context`: `format` (movie / series / any), `completedOnly`, `era` (recent / classic / any), `popularity` (famous / hidden-gem / any).
    - They are supported in the LLM prompt, rules (JA + EN), chips, quick picks and reasons.
    - **Hard filters (never relaxed):** `format`, `completedOnly` (status must be FINISHED).
    - **Soft (bonuses in `rank.ts`):**
      - `era`: +0.08. recent = year ≥ current year − 5; classic = year ≤ 2010.
      - `popularity`: +0.08. famous = top 20% by popularity in the dataset; hidden-gem = the less popular half with averageScore ≥ 78.
    - 週末一気見 / 一気見 / binge / marathon imply `completedOnly = true`, as well as high energy.
    - Rules: 最近 alone often means "lately" (最近落ち込んでる), so only 最近の counts as recent. 名作 alone is neither famous nor hidden-gem. "finished" alone is not completed-only ("I just finished work").
    - Data: `status` and `year` (seasonYear, else startDate.year) were added. `npm run fetch:anilist -- --keep-ids` re-fetched the same 1000 titles in the same order, so showcase runs stay comparable.
    - In this dataset 997/1000 titles are FINISHED, so `completedOnly` rarely removes anything. It matters more if the dataset grows.
23. **「もっと見る」.** `limit` 3 → 6 → 9, with the same diversity rules. Whether to relax constraints is decided on the first 3 only, so asking for more never changes the first page. The API returns `hasMore`.
24. **Covers.** `npm run fetch:covers` downloads every cover as `public/covers/<id>.webp` (sharp, quality 80). It uses 8 at a time, 4 attempts with backoff, and skips existing files.
    - The UI tries the local file, then the AniList CDN, then a placeholder.
    - Diagnosis: at 17:40 on 2026-09-29, TLS connections to `s4.anilist.co` were reset ("Connection reset by peer"). By 22:00, 39/39 sampled URLs returned 200. So the failure was intermittent, not a permanent block. Local files remove the dependency during a demo.
    - The first run downloaded 1000/1000 files, 17.3 MB, in about 10 s.
    - `public/covers/` is gitignored: the cover art belongs to the rights holders, and a script can regenerate it in seconds.

25. **UI redesign** following `docs/ui-mockup.html`:
    - Tokens: night / panel / line / paper / muted, and one fixed accent "lamp" (#f2b84b) for actions and selection.
    - Fonts: Dela Gothic One for the logo and headline only; Zen Kaku Gothic New for everything else (`next/font`).
    - The example-sentence chips were removed. Examples rotate in the input placeholder every 3.5 s, and rotation pauses while the input is focused or has text.
    - Quick picks: mood pills with icons; time and "with" as segmented controls on one row. Format / completed / era / popularity / avoid are behind 「こだわり条件」, which shows an active-count badge and opens as a popover on desktop or a bottom sheet on a phone.
    - The understood Context is shown as a sentence with editable tokens: ✎ opens a native select (swap a mood, change the time…, or remove), × removes, ＋ adds.
      - Word order is per language (`composeUnderstood`); every word comes from the dictionaries.
    - Results: #1 is a hero card, with #2 and #3 beside it (stacked on a phone). #4–9 from 「もっと見る」 appear as small cards below.
    - Each card is tinted by AniList `coverImage.color` (929/1000 titles have one). Dark colours are lightened for legibility (`lib/color.ts`); missing ones use the neutral muted colour.
    - The card's "一致度" is `min(100, total × 100)`. It is a score, not a probability.
    - Picks and tokens stay enabled during a request, so keyboard focus isn't lost. Stale responses are ignored instead.

### Robustness: themes, intent, honest fallbacks

Trigger: typing "cooking" returned default relax picks labelled "Anything goes." The system had no concept of subject, and it pretended to understand when it didn't. The fixes below are organised by case, not as one-off patches.

26. **Themes** say what a show is ABOUT (subject, setting, positive genre); moods say how it should FEEL.
    - `src/data/themes.ts` holds 115 themes, curated from the real AniList genres and tags in `anime.json`: cooking, sports, space, vampires, isekai, mecha, detective, workplace…
    - Excluded: technical tags (CGI), meta, cast make-up (Male Protagonist…), spoiler and sexual tags, and harem.
    - Each theme has JA + EN labels, the genres/tags it maps to, and JA + EN keywords for the rules parser. The file is reviewed by the human.
    - A test checks that every theme maps to real tags and matches at least 3 titles.
    - `Context.themes` holds `ThemeKey[]`.
      - The LLM gets the list in the prompt. Anything outside the list is dropped (`sanitize`), rather than failing the parse.
      - Gemini rejects a 115-value enum in `responseJsonSchema` (400 INVALID_ARGUMENT), so the schema sent to Gemini types themes as plain strings. Zod then validates the real enum.
    - Mystery / detective / psychological / horror moved from mood keywords to themes. 怖い / scary stay as the dark mood.
    - **Theme match** for a title is its strongest matching tag rank / 100; a matching genre counts as rank 70.
    - **Theme floor (soft):** at least one requested theme must match at least 0.5. It is relaxed last: mood floor, then time, then theme floor.
    - Rules parse themes longest-keyword-first (so 魔法少女 isn't also 魔法), before company (so 家族もの / 子ども向け are themes, not "watching with family").
    - Keywords avoid everyday words: 仕事 in 「仕事で疲れた」 and "work" in "tired from work" are not workplace.
27. **Scoring modes** replace the fake default mood. `DEFAULT_MOODS` (relax 0.5) is now only a sentinel for "no mood stated", and the mood target is zero for it. Weights (top of `rank.ts`, each sums to 1):

    | Mode | When | Weights |
    |---|---|---|
    | moods | moods or a reference, no themes | 0.5 cosine + 0.3 intensity + 0.2 quality |
    | moodsAndThemes | moods + themes | 0.35 cosine + 0.2 intensity + 0.3 theme + 0.15 quality |
    | themes | themes, no mood | 0.7 theme + 0.3 quality |
    | open | nothing specific | 0.6 quality + 0.4 fame (popularity in the dataset) |

    - A reference title with no stated mood is now the whole target (it was 0.8 reference + 0.2 relax).
    - Open requests (「なんでもいい」, or only a time / company) are labelled 「人気・高評価の作品」 / "Popular, highly rated picks". Their reasons lead with 「人気上位N%」 and the score. "Anything goes." is gone.
28. **Intent.** `Context.intent` is "recommend" | "unclear" | "off_topic".
    - unclear (gibberish, too garbled) and off_topic (weather, coding, instructions to the model…) return no results. The UI shows a short message saying what AniMatch can do; the quick picks stay right above it.
    - Rules fallback: if nothing at all is recognised, the intent is off_topic (known off-topic words) or unclear. The exception is a valid "anything" request (なんでもいい, おすすめ, anything), which is recommend. Rules no longer default to a relax mood.
    - Picks chosen before typing make an unclear sentence answerable (merge).
29. **Prompt injection and limits.**
    - The input is at most 200 characters (`MAX_INPUT_CHARS`, enforced by the API and the input field).
    - The user text is sent delimited, and the prompt states that it is data, never instructions. A message trying to change the task is off_topic.
    - The output is schema-only. The model can't produce free text anywhere: `unmatched` is capped at 3 × 40 characters and only displayed.
30. **References.**
    - Non-anime references (「ハリー・ポッターみたいな」) are mapped by the LLM to moods + themes, never to a `referenceTitle`. The rules parser can't know the difference: it keeps the reference, the reference isn't found, and the notice says so.
    - **Exact title:** if the whole input is exactly a title in the dataset (normalised: NFKC, case, punctuation), `finalizeContext()` (server, both parsers) sets `titleSearch`. That title is shown first, labelled 「検索した作品」 with no match %, followed by similar titles from other franchises.
31. **Honest UI.**
    - The understood sentence is prefixed by what was typed (「cooking」 → 料理・グルメの作品。).
    - Themes appear as tokens.
    - `unmatched` parts are listed (「読み取れなかった部分」).
    - Echoing stops once the user edits tokens, because the conditions no longer come straight from the text.
32. **Eval** grew to 68 cases in 14 categories: mood, situation, negation, reference, filters, theme, genre, non-anime reference, exact title, vague, off-topic, gibberish / injection, mixed JA/EN, Vietnamese.
    - Strict cases score every field (unlisted = neutral). Non-strict cases score only the listed fields; `themesInclude` means "must contain".
    - The report shows accuracy per category for both parsers, including intent.

### LLM, UI, eval, ops

16. **Language (revised).** The UI supports Japanese and English, switchable. Input can be either language in either mode. (Originally: UI always Japanese.)
    - **Switch:** a JA / EN toggle in the header. Default JA. The choice is remembered in localStorage, and `?lang=en` / `?lang=ja` in the URL overrides it. `LangProvider` reads this with `useSyncExternalStore`: the server renders JA, so there is no hydration mismatch.
    - **Strings:** every string the user sees lives in `src/i18n/ja.ts` / `en.ts`. Both have the same shape (type `Dict`), and a test checks that their keys match. Components contain no hard-coded text.
    - **Language-neutral server output:** `explain.ts` returns reason keys and values (`Reason` in `src/lib/messages.ts`). Notices and chip labels work the same way. The API returns all title names. The UI renders everything in the current language, so switching the language re-renders instantly without a refetch.
    - **Titles:** JA mode shows the native title, with the English (or romaji) name as the subtitle. EN mode shows the English title (falling back to romaji), with the native title as the subtitle.
    - **Rules parser:** English keywords and negation (no / not / without / nothing / don't want X) are handled before mood detection, like 〜は嫌. It also reads English time phrases ("30 min", "half an hour", "an hour and a half") and "something like X" / "similar to X". ASCII keywords match whole words, so "cry" doesn't match "crystal".
    - **Eval and showcase:** 6 English eval sentences are written differently from the test and showcase sentences, and results are reported per language. The showcase has 6 English sentences after the Japanese ones and prints each in its own language.
17. **LLM timeout** comes from `LLM_TIMEOUT_MS` (default 4000; it was 3000 until the UI step). Use the lowest thinking level the model supports. Pick the final value from eval latency.
    - `gemini-flash-lite-latest` (which currently resolves to `gemini-3.5-flash-lite`) accepts `thinkingLevel: MINIMAL` and returns 0 thought tokens. It rejects `thinkingBudget: 0`.
    - First eval: average 1.2s, max 1.6s, 0/20 calls over 3000ms. But a single cold call during setup took 3.1s, so the default was raised to 4000ms. The page also POSTs `/api/warmup` on load: one cheap call, at most once per 5 minutes per server process, so reloads don't spend free-tier quota.
    - The prompt gets the mood list, the avoid enum with labels, and a JSON schema generated from the Zod `Context` schema (`z.toJSONSchema`). The response is validated with the same schema.
    - Vague short time (少しだけ, ちょっとだけ) means 30 minutes. The LLM prompt says so. The rules parser only reads explicit numbers.
    - Moods are never inferred from a reference title: 「進撃の巨人みたいな」 keeps the default moods, so the reference gets its 0.8 share.
    - **Demo switch.** `/v2?parser=rules` (API: `{ text, parser: "rules" }`) forces the rules parser. The API response includes `parse: { parser, latencyMs, fallbackReason }`, and the UI shows 「AI解析」 or 「ルール解析」 with the latency.
    - `npm run showcase` always uses the rules parser, so the log compares ranking changes and not LLM variance.
18. **Eval scoring:**
    - moods: correct if the primary mood matches, and also report Jaccard for the mood set. Ignore weights.
    - energy, company, timeBudgetMin: exact match.
    - avoid: set match.
19. **Ops.** No deploy for now, the demo runs locally. 👍/👎 is logged to a local JSONL file behind a small logger interface so it can be swapped later: `lib/feedback.ts` → `logs/feedback.jsonl` (gitignored). Each line holds the title, the vote, the rank, the sentence, and the Context at the time of the vote.
20. **Final UI (step 9/11).** The v1 slider UI, `animeList.ts`, `src/types` and `src/utils` were removed, and the v2 UI now lives at `/`.
    - Chips can be edited in place: time, energy and company are selects.
    - 「＋ 条件を追加」 adds a mood, energy, time, company, or avoid key.
    - The large type sizes are meant for a projector, and the layout was checked at a 390px phone width.
    - Covers load directly from the AniList CDN (`unoptimized`). If a cover fails, the card shows a placeholder instead of a broken image.

### Implementation notes

- `anime.json` stores the validated AniList data only. Vectors and `franchiseId` are computed from it at load time (`src/lib/dataset.ts`), so tuning `tagMapping.ts` / `avoidMap.ts` never needs a re-fetch.
- `npm run report:vectors` prints the top 10 titles per dimension for reviewing `tagMapping.ts`.