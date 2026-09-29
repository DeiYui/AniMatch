# AniMatch - Explainable Anime Recommender
**English** | [日本語](./README.ja.md)

![Status](https://img.shields.io/badge/Status-Demo-blue) ![Tech](https://img.shields.io/badge/Tech-Next.js_TypeScript-black) ![LLM](https://img.shields.io/badge/LLM-Gemini_(parsing_only)-purple) ![Data](https://img.shields.io/badge/Data-AniList_1000_titles-02a9ff)

## 📖 Overview
You describe your situation in one sentence, and AniMatch recommends 3 anime, each with short, factual reasons. The UI switches between **Japanese and English** (JA / EN toggle), and you can type in either language in either mode:

> 「仕事で疲れた。寝る前に30分だけ笑えるやつ」
> *(Tired from work. Something funny, just 30 minutes before bed.)*

For speed, **quick picks** under the input do the same without typing. Moods are the primary pills. Time (15 min … binge) and who you're watching with are compact segmented controls. Everything else sits behind one **Preferences** button with a count of active choices: movie / series, completed only, recent / classic, famous / hidden gem, and things you don't want. It opens as a popover on desktop and a bottom sheet on a phone. Typing and picks produce the same conditions and can be combined.

AniMatch shows **what it understood** as a sentence with editable tokens, for example "Something **light**, **funny** for **30 min**." (JA: 「**30分**で**軽く**見られる、**笑える**作品。」). Tap a ✎ token to change it, × to remove it, or + to add a condition. It then shows 3 picks, with #1 as a large card and #2/#3 beside it. Each card is tinted with its cover's colour and gives reasons such as "Comedy: high", "Each episode fits in 30 min" and "Heavy themes: almost none" (JA: 「笑い度：高」「1話が30分以内」「重い展開：ほぼなし」).

### Core principle
**The LLM only understands language. It never decides what to recommend.**

- The LLM turns free text into a small, validated `Context` object. That is its only job.
- Deterministic code turns `Context` into filters and a target vector, then ranks titles and builds explanations from its own numbers.
- If the LLM fails (timeout, rate limit, invalid output), a rule-based Japanese/English parser produces the same `Context`. **The app never breaks because of the LLM.**

That makes every result explainable, which matters because the demo audience is non-engineers.

---

## 🚀 How It Works

```
text
 → [1] parse:   Gemini → JSON → Zod validation      (any failure → rule-based parser, same shape)
 → [2] query:   Context → target vector + filters   (fixed mapping, no LLM)
 → [3] rank:    safety filters → soft constraints → score → diversity → top 3
 → [4] explain: up to 3 reasons from the score's own facts, as language-neutral keys
 → UI: "What I understood" sentence (edit a token → re-rank without calling the LLM) + 3 result cards,
       rendered in Japanese or English from one dictionary per language
```

**Vectors.** Every title is a vector over 8 dimensions: `laugh, cry, thrill, relax, think, romance, dark, heavy`.
- Nothing is hand-scored per title. Vectors are computed from AniList genres and community tags (weighted by tag rank) through one short, reviewable mapping table ([`tagMapping.ts`](src/data/tagMapping.ts)).
- Each dimension is normalized by its dataset 99th percentile.

**Themes.** Moods say how a show should *feel*; themes say what it should be *about*.
- There are 115 themes (cooking, sports, space, vampires, isekai…), curated from the real AniList tags in [`themes.ts`](src/data/themes.ts).
- A title's theme match is its strongest matching tag rank.

**Score.** The weights depend on what was actually asked:

| Asked for | Score |
|---|---|
| moods (or a reference title) | 0.5 × cosine + 0.3 × intensity + 0.2 × quality |
| moods + themes | 0.35 × cosine + 0.2 × intensity + 0.3 × theme + 0.15 × quality |
| themes only ("cooking") | 0.7 × theme + 0.3 × quality |
| nothing specific (「なんでもいい」) | 0.6 × quality + 0.4 × popularity, labelled "popular, highly rated picks" |

Then adjustments are added. The parts:
- **cosine** (over the 7 mood dimensions): does the title have the right *mix*?
- **intensity**: does it have *a lot* of the 2 moods that matter most? Without this term, weak but well-aligned titles won.
- **quality**: AniList averageScore / 100.
- **adjustments**:
  - Energy: tired → penalize heavy titles; binge → small bonus.
  - Sequel penalty: recommend where to start, not season 3.
  - Long-series penalty.
  - Short-series bonus when time is limited.

**Filters.**
- **Never relaxed:** Ecchi is excluded by default. Also 家族向け (family), the user's "avoid" list, and the explicit movie / series and completed-only choices.
- **Small bonuses, not filters:** recent / classic, and famous / hidden gem.
- **Relaxed only if fewer than 3 results remain:** a primary-mood floor, then the time budget, then the theme floor. The UI then says 「条件を少しゆるめました」.

**Honest about what it didn't understand.**
- Gibberish and off-topic requests (weather, coding, "ignore your instructions…") get a short message and no results, instead of a default mood.
- A bare title (「鬼滅の刃」) shows that title first, labelled as your search, then similar titles.
- A non-anime reference (「ハリー・ポッターみたいな」) is turned into moods and themes.
- The understood sentence starts from what you typed (「cooking」 → 料理・グルメの作品。) and lists any part it couldn't read.

---

## 💡 Key Engineering Decisions

### 1. LLM as a parser, with a guaranteed fallback
- **Why:** An LLM that picks titles can't explain its choices, and it can make up facts. Here it only fills a Zod-validated schema. The same schema drives the rule-based parser, so both paths return an identical shape.
- **Demo switch:** open `/?parser=rules` to show the system still works with the AI switched off. A badge shows 「AI解析」 or 「ルール解析」 with the parse latency.
- **Speed:** the LLM call runs at temperature 0 with the lowest thinking level. A warm-up call on page load avoids a slow first request.

### 2. No hand-scored titles
All human judgment lives in two short files that I reviewed with a "top 10 per dimension" report (`npm run report:vectors`):
- [`tagMapping.ts`](src/data/tagMapping.ts): tag → dimensions.
- [`avoidMap.ts`](src/data/avoidMap.ts): the "avoid" vocabulary and the family filter.

Some examples of decisions made in these files:
- Harem and ecchi tags never add to "laugh" or "romance".
- Very common tags (e.g. `Tragedy`, found on ~37% of titles) get moderate weights.

### 3. Measured, not guessed
Every scoring change was checked against a fixed benchmark of 6 sentences (`npm run showcase`). The results are logged with the commit hash in [`docs/showcase-log.md`](docs/showcase-log.md). The log shows how each problem was found and fixed, for example:
- Weak-but-aligned titles won → added the intensity term.
- A reference title pulled in "high on everything" titles → intensity limited to the top 2 dimensions.

Every decision and its reason is recorded in [`docs/DESIGN.md`](docs/DESIGN.md).

### 4. Explainable by construction
- Reasons are built only from data: the title's vector, runtime, AniList score, and the constraints it satisfied.
- Each card has a collapsed "Score breakdown" (「スコア内訳」) with the exact numbers.

### 5. Bilingual without duplicating logic
- The server never returns display text. Reasons, notices and chips are keys with values (e.g. `{ key: "fitsTime", minutes: 30 }`). The UI renders them with `src/i18n/ja.ts` or `en.ts`, so switching language is instant and needs no new request.
- Titles follow the language: the native title in JA mode, and the English title (or romaji) in EN mode.
- The rule-based fallback understands English too, including negation ("no horror", "nothing too heavy") and "something like X".

---

## 📊 Parser Evaluation

`npm run eval:context` runs 24 Japanese and 8 English test sentences through both parsers, and reports each language separately. The set includes tricky cases: negation, reference titles, vague moods, time phrases like 寝る前に少しだけ or "an hour and a half", and the format / completed / era / popularity conditions.

| Field | JA · LLM | JA · Rules | EN · LLM | EN · Rules |
|---|---|---|---|---|
| primary mood | 100% | 96% | 88% | 100% |
| energy | 92% | 96% | 100% | 88% |
| time budget | 100% | 96% | 100% | 100% |
| company | 100% | 100% | 88% | 100% |
| completed only | 96% | 100% | 100% | 100% |
| avoid / reference / format / era / popularity | 100% | 100% | 100% | 100% |
| **all fields correct** | **21/24** | **22/24** | **6/8** | **7/8** |
| median latency | ~1.4 s | < 2 ms | ~1.3 s | < 2 ms |

One English LLM call took 18 s. In the app it would have fallen back to rules after the 4 s timeout.

The two parsers fail on *different* sentences:
- The LLM handles vague phrasing (少しだけ → 30分, 元気が出る → laugh).
- The rules are instant and never fail.
- The LLM sometimes adds things that weren't said, e.g. "alone" or a mood inferred from a reference title.

*Caveat: I wrote the test sentences, the prompt, and the rules myself, so these numbers are optimistic. The English set is only 8 sentences. Sentences written by other people would be a fairer test.*

---

## 🛠️ Tech Stack & Architecture

* **Language:** TypeScript (strict), with Zod as the single source of truth for data contracts.
* **App:** Next.js (App Router) + Tailwind CSS. Ranking runs server-side in a route handler. Fonts: Dela Gothic One for the logo and headline, Zen Kaku Gothic New for everything else (via `next/font`). The layout follows [`docs/ui-mockup.html`](docs/ui-mockup.html).
* **LLM:** Gemini via `@google/genai`, behind one small interface ([`llm.ts`](src/lib/context/llm.ts)), so the provider can be swapped by editing one file.
* **Data:** 1000 popular titles fetched once from the AniList GraphQL API into [`anime.json`](src/data/anime.json). No database.
* **Tests:** `node:test` via `tsx`.

### Project Structure
```bash
src/
├── app/                 # UI (page + components) and API routes: /api/recommend, /api/warmup, /api/feedback
├── i18n/                # ja.ts / en.ts dictionaries, render functions, LangProvider (JA/EN switch)
├── data/                # anime.json (AniList), tagMapping.ts, avoidMap.ts, themes.ts ← the human judgment
└── lib/
    ├── context/         # schema.ts (Zod), llm.ts, rules.ts, parse.ts (LLM → fallback), chips.ts, quickPicks.ts, merge.ts
    ├── engine/          # query.ts, rank.ts, explain.ts, filters.ts
    ├── messages.ts      # language-neutral Reason / Notice / chip label types
    ├── vectorize.ts     # tags → vectors
    ├── dataset.ts       # load + vectors + franchise groups
    └── recommend.ts     # the whole pipeline
scripts/                 # fetch-anilist, report-vectors, showcase, eval-context, try
eval/                    # context-cases.json (parser test set)
docs/                    # DESIGN.md (all decisions), showcase-log.md (before/after history)
```

---

## 🏃‍♂️ How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure the LLM (optional).** Without a key, every request falls back to the rule-based parser. Create `.env.local` with:
   ```bash
   GEMINI_API_KEY=your-key
   GEMINI_MODEL=gemini-flash-lite-latest
   # LLM_TIMEOUT_MS=4000   # optional, default 4000
   ```
3. **Download the cover images (recommended for demos):**
   ```bash
   npm run fetch:covers   # ~10 s, 17 MB of webp in public/covers/ (gitignored); safe to rerun
   ```
   The UI uses the local file first, then the AniList CDN, then a placeholder, so a demo doesn't depend on the CDN.
4. **Start the app:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).
   - [`/?lang=en`](http://localhost:3000/?lang=en) or `/?lang=ja` opens a specific language. Otherwise the toggle's last choice is remembered.
   - [`/?parser=rules`](http://localhost:3000/?parser=rules) forces the rules-only mode.
   - The parameters can be combined: `/?lang=en&parser=rules`.

### Other commands
```bash
npm test                 # unit tests (engine, JA/EN rules parser, fallback, chips, i18n)
npm run showcase         # 8 JA + 6 EN fixed sentences → table; appends to docs/showcase-log.md
npm run eval:context     # LLM vs rules accuracy + latency (calls Gemini, ~2 min, throttled for the free tier)
npm run try -- "文"      # run one sentence through the pipeline (add --llm to use Gemini)
npm run report:vectors   # review aid for tagMapping.ts / avoidMap.ts
npm run fetch:anilist -- --keep-ids   # refresh the same 1000 titles from AniList (rarely needed)
npm run build && npm run lint
```

👍/👎 on result cards are appended to `logs/feedback.jsonl` (local only, not used for learning yet).

---

## ⚠️ Limitations
1. **Hand-tuned mapping.** The tag → dimension weights are my judgment, reviewed against real data but not learned. Feedback logs could be used to tune them later.
2. **Small evaluation set.** 32 sentences (24 JA, 8 EN) written by the author (see the caveat above).
3. **Dataset size.** 1000 popular titles and an O(N) scan. That's fine at this size. Much larger catalogs would need a vector index.
4. **Covers** come from local files when downloaded, else from the AniList CDN, else a placeholder. They are not committed: the art belongs to its rights holders.
5. **"Completed only"** barely filters this dataset: 997 of the 1000 popular titles have finished airing.

Anime data and cover images: [AniList](https://anilist.co).
