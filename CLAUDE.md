# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state: v1 → v2 rebuild

**Read `docs/DESIGN.md` before every task.** It is the source of truth for the in-progress v2 rebuild. If a request conflicts with it, ask before deviating.

- **v1 (current code):** slider UI. The user sets 5 hand-scored dimensions and gets top 3 by cosine similarity.
- **v2 (target):** free-text input (Japanese first) → validated `Context` → deterministic ranking → template explanations. Data comes from AniList, and vectors are computed from tags.

The v1 files (`src/data/animeList.ts`, the slider UI in `src/app/page.tsx`) stay until the final step of the rebuild. Don't delete them earlier.

## Commands

```bash
npm run dev     # dev server at http://localhost:3000
npm run build   # production build (also type-checks)
npm run lint    # ESLint (next core-web-vitals + typescript configs)
npx tsc --noEmit  # type-check only
```

There is no test runner yet. v2 plans `scripts/eval-context.ts` + `eval/context-cases.json` for parser accuracy and latency evaluation.

## v1 architecture (what exists now)

- `src/types/index.ts`: `AnimeFeatures` is the 5-dim vector `romance, action, drama, complexity, visuals` (0..1). `UserPreference` is the same type.
- `src/utils/engine.ts`: pure math. `cosineSimilarity` returns 0 for a zero vector. `getRecommendations` does an O(N) scan, sorts, and returns the top K with `score`.
- `src/data/animeList.ts`: about 43 hand-scored titles. Cover images are hot-linked from the MyAnimeList CDN.
- `src/app/page.tsx`: a single client component holding all state and UI. Sliders are quantized to 0.25 steps on purpose (see README, "Input Quantization"). Title vectors are not quantized.

Path alias: `@/*` → `src/*`.

## v2 rules that aren't obvious from the code (details in DESIGN.md)

- **The LLM only parses language.** It turns free text into a `Context` object and never picks or explains recommendations. Ranking and explanations are deterministic and built from the engine's own numbers.
- **The app must never break because of the LLM.** Any LLM failure (Zod validation error, 3s timeout, 429, anything else) falls back to the rule-based Japanese keyword parser, which produces the same `Context` shape. Log which parser was used (`source: "llm" | "rules"`).
- **Zod schema is the single definition** of `Context` (`src/lib/context/schema.ts`). Derive the TS type from it.
- **LLM calls are server-side only** (route handler). Read `GEMINI_API_KEY` and `GEMINI_MODEL` from `.env.local` and never hard-code the model id. Use temperature 0. Keep the provider behind one small interface in `llm.ts` so it can be swapped by editing only that file.
- **No hand-scored titles in v2.** Vector dims (fixed order): `laugh, cry, thrill, relax, think, romance, dark, heavy`. They are computed only through `src/data/tagMapping.ts`, which is the one place human judgment lives. Keep it short and commented, because the user reviews and tunes it.
- **AniList data is fetched offline** by `scripts/fetch-anilist.ts` (throttle, retry on 429), validated with Zod, and written to `src/data/anime.json` (committed). Never fetch it at runtime.
- **Ranking constants** (cosine 0.8 / averageScore 0.2, diversity cutoff cosine > 0.95) should be named constants that are easy to tune.
- Editing an "understood context" (理解した内容) chip in the UI re-ranks **without** calling the LLM again.
- Keep the existing dark visual style.
- Non-goals: database/pgvector, user accounts, learning from feedback, LLM-written explanations.
   Before any task, read docs/DESIGN.md. It is the source of truth for the v2 rebuild.
