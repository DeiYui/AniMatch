# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Read `docs/DESIGN.md` before every task.** It is the source of truth, and its "Decisions" section records every tuning choice and why it was made. If a request conflicts with it, ask before deviating.

AniMatch: one free-text sentence (Japanese or English) → validated `Context` → deterministic ranking over 1000 AniList titles → 3 results with reasons. The UI is JA/EN switchable.

## Commands

```bash
npm run dev     # http://localhost:3000  (?parser=rules forces the rule-based parser; ?lang=en|ja)
npm run build   # production build (also type-checks)
npm run lint
npm run typecheck
npm test        # node:test via tsx, all src/**/*.test.ts
npx tsx --test src/lib/context/rules.test.ts   # a single test file
npm run try -- [--llm] "仕事で疲れた。30分だけ笑えるやつ"  # full pipeline in the terminal (rules parser unless --llm)
npm run showcase [-- "label"]   # 6 fixed sentences (rules parser); appends to docs/showcase-log.md
npm run eval:context     # LLM vs rules accuracy/latency on eval/context-cases.json (calls Gemini, ~2 min, throttled)
npm run report:vectors   # review aid for tagMapping.ts / avoidMap.ts (top 10 per dimension, filter counts)
npm run fetch:anilist -- --keep-ids   # refresh the same 1000 titles (new fields/scores), keeps showcase comparable
npm run fetch:covers     # download covers to public/covers/<id>.webp (gitignored; ~10 s, safe to rerun)
```

- Vectors and franchise groups are computed from `anime.json` at load time. After editing `tagMapping.ts` / `avoidMap.ts`, rerun the report; no re-fetch is needed.
- Scripts import `src/` through the `@/` alias (`@/*` → `src/*`), which tsx resolves.
- After any scoring or mapping change, run `npm run showcase -- "what changed"` and compare the result with the previous run in `docs/showcase-log.md`.

## Architecture (the flow spans several files)

`src/lib/recommend.ts` is the whole pipeline. The API route and the scripts both call it.

1. **Parse**: `context/parse.ts` tries `context/llm.ts` (Gemini) with a timeout. On any failure it falls back to `context/rules.ts`. Both produce the Zod `Context` from `context/schema.ts`, including `themes` (`data/themes.ts`) and `intent` (recommend / unclear / off_topic).
   - Then `finalizeContext()` in `recommend.ts` runs for both parsers: a bare exact title becomes a `titleSearch`.
   - `intent` other than recommend returns no results.
2. **Query**: `engine/query.ts` maps `Context` to a target vector over the 7 mood dims plus constraints.
   - heavy is never in the target.
   - Default moods (relax 0.5) are a sentinel for "none stated", which gives a zero target. A reference with no mood becomes the whole target.
   - It also resolves `referenceTitle`.
3. **Rank**: `engine/rank.ts` runs in this order:
   - Hard filters (`engine/filters.ts`: Ecchi by default, family, avoid, the reference's franchise, format, completedOnly). Never relaxed.
   - Soft floors: mood floor → time budget → theme floor, relaxed in that order.
   - The score, with weights by **scoring mode**: moods / moodsAndThemes / themes / open (popular + high-rated).
   - Diversity.
4. **Explain**: `engine/explain.ts` returns up to 3 reasons in a fixed priority order, built only from data. They are language-neutral `Reason` objects (`lib/messages.ts`).
5. **Render**: the UI renders reasons, notices, chip labels, runtimes and titles through `src/i18n/` (`ja.ts` / `en.ts` dictionaries, render functions in `index.ts`, and the current language in `LangProvider`).

Other pieces:
- `dataset.ts` loads `anime.json` (server-only; ~1.7MB) and adds vectors (`vectorize.ts`), `franchiseId` (union-find over relations), and `hasPrequelInDataset`.
- UI (layout and design tokens from `docs/ui-mockup.html`; tokens live in `globals.css`): `src/app/page.tsx` plus these components:
  - `QuickPicks.tsx`: mood pills, time / with segmented controls, and the 「こだわり条件」 popover (desktop) or bottom sheet (phone).
  - `Understood.tsx`: the understood Context as a sentence with editable tokens. The sentence comes from `composeUnderstood` in `i18n/index.ts`, which has per-language word order.
  - `ResultCard.tsx`: `hero` / `small` variants, tinted by `coverColor` via `lib/color.ts`.
  - `LangToggle.tsx`.
  - Quick picks (`context/quickPicks.ts`) and tokens (`context/chips.ts`) both edit the `Context` directly. Picks made before typing are sent as `base` and merged with the parsed text (`context/merge.ts`).
  - Picks stay enabled while a request is in flight; `page.tsx` shows only the latest response.
  - Radius tokens are `rounded-tag` / `rounded-box` / `rounded-card`. `rounded-s` is already a built-in Tailwind v4 utility (start corners).
  - After renaming `@theme` tokens, the dev server can keep serving stale CSS. `npm run build` is the source of truth.
  - Hard filters include `format` / `completedOnly`. `era` / `popularity` are soft bonuses. `limit` (3/6/9) backs 「もっと見る」.
  - Token edits come from `context/chips.ts` (pure) and POST `{ context }`, which skips parsing.
  - The page POSTs `/api/warmup` on load, and 👍/👎 go to `/api/feedback`, which writes `logs/feedback.jsonl` (gitignored) via `lib/feedback.ts`.
- `lib/api.ts` is the request/response contract and is safe to import from the client.

## Rules that aren't obvious from the code

- **Never pretend to understand.** When nothing is recognised, rules return intent unclear / off_topic; they don't fall back to a default mood. Open requests are labelled "popular, high-rated", never "anything goes".
- **Themes are only chosen from `data/themes.ts`.** LLM output outside the list is dropped (`sanitize`). Gemini can't take the 115-key enum in its response schema, so themes are plain strings there and Zod validates afterwards. Add every new theme keyword in JA + EN. Avoid everyday words (仕事, work, 家族で…).
- **User text is data.** Keep it delimited in the LLM call, keep the prompt's injection rule, and keep `MAX_INPUT_CHARS` (200).

- **The LLM only parses language.** It never picks or explains titles.
- **The app must never break because of the LLM.** Any failure (timeout `LLM_TIMEOUT_MS` default 4000, 429, invalid JSON, schema mismatch, missing key) falls back to rules.
- **Provider code lives only in `llm.ts`.** It uses temperature 0 and `thinkingLevel: MINIMAL`, and the model id comes from `GEMINI_MODEL`.
- **Human judgment lives only in `src/data/tagMapping.ts` and `src/data/avoidMap.ts`.** No per-title scores and no hand-picked title rules. Keep these files short and commented; the user reviews them.
- **Ranking constants are named at the top of `rank.ts` / `query.ts` / `vectorize.ts`.** Change them only with a showcase run, and record the decision in DESIGN.md.
- **No user-facing text in components or server code.** Add every string to both `src/i18n/ja.ts` and `en.ts` (a test checks that their keys match). The server returns keys and values, never display strings.
- **Input can be Japanese or English in either UI mode.** When you add rules keywords, add both languages.
- Keep the dark visual style, and keep text large enough for a projector and usable on a phone.
- Non-goals: database/pgvector, user accounts, learning from feedback, LLM-written explanations.
