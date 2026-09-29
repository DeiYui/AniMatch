// src/app/page.tsx
// AniMatch (layout: docs/ui-mockup.html). The sentence is the product; quick picks are for speed; both produce the
// same Context. → what the system understood (editable sentence) → #1 hero + #2/#3, 「もっと見る」 up to 9.
// ?parser=rules forces the rule-based parser (demo without AI). ?lang=en|ja picks the UI language.
"use client";

import { useEffect, useRef, useState } from "react";
import type { RecommendRequest, RecommendResponse } from "@/lib/api";
import { MAX_INPUT_CHARS, type Context } from "@/lib/context/schema";
import { emptyContext } from "@/lib/context/quickPicks";
import { MAX_RESULTS, TOP_K } from "@/lib/engine/rank";
import { LangToggle } from "@/app/components/LangToggle";
import { QuickPicks } from "@/app/components/QuickPicks";
import { Understood } from "@/app/components/Understood";
import { ResultCard } from "@/app/components/ResultCard";
import { useLang } from "@/i18n/LangProvider";

const PLACEHOLDER_INTERVAL_MS = 3500;

export default function Home() {
  const { t } = useLang();
  const [text, setText] = useState("");
  const [submittedText, setSubmittedText] = useState<string | null>(null);
  const [data, setData] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [forceRules, setForceRules] = useState(false);
  const [limit, setLimit] = useState(TOP_K);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [echo, setEcho] = useState<string | null>(null); // the typed text behind the current results, if any
  // Picks stay tappable while a request is in flight; only the latest request's response is shown.
  const latestRequest = useRef(0);

  // Read ?parser=rules after mount (no hydration mismatch), and warm the LLM up unless it's disabled.
  useEffect(() => {
    const rulesOnly = new URLSearchParams(window.location.search).get("parser") === "rules";
    setForceRules(rulesOnly);
    if (!rulesOnly) fetch("/api/warmup", { method: "POST" }).catch(() => {});
  }, []);

  // Example sentences rotate in the placeholder; paused while the input is focused or has text.
  useEffect(() => {
    if (inputFocused || text) return;
    const id = setInterval(() => setExampleIndex((i) => i + 1), PLACEHOLDER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [inputFocused, text]);
  const examples = t.input.examples;
  const placeholder = t.input.placeholder(examples[exampleIndex % examples.length]);

  const request = async (body: RecommendRequest) => {
    const id = ++latestRequest.current;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: RecommendResponse = await res.json();
      if (id !== latestRequest.current) return; // a newer request was sent meanwhile
      // Re-ranks don't parse, so keep the last parse info (badge latency) while the source stays the same.
      setData((prev) => ({
        ...json,
        parse: json.parse ?? (prev && prev.context.source === json.context.source ? prev.parse : null),
      }));
    } catch {
      if (id === latestRequest.current) setError(true);
    } finally {
      if (id === latestRequest.current) setLoading(false);
    }
  };

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setSubmittedText(trimmed);
    setEcho(trimmed);
    setLimit(TOP_K);
    // Quick picks chosen before typing are merged with what the sentence says.
    const base = data?.context.source === "manual" ? data.context : undefined;
    request({ text: trimmed, parser: forceRules ? "rules" : "auto", base });
  };

  // Sentence tokens and quick picks re-rank on the server without parsing any text.
  const changeContext = (next: Context) => {
    setLimit(TOP_K);
    setEcho(null); // the conditions no longer come straight from the typed text
    request({ context: next });
  };

  const showMore = () => {
    if (!data) return;
    const next = Math.min(limit + TOP_K, MAX_RESULTS);
    setLimit(next);
    request({ context: data.context, limit: next });
  };

  const sendFeedback = async (animeId: number, rank: number, vote: "up" | "down") => {
    if (!data) return;
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, rank, vote, text: submittedText, context: data.context }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  };

  const results = data?.results ?? [];
  // 👍/👎 state belongs to a result list; a new context means new cards.
  const cardKey = (id: number) => `${id}:${JSON.stringify(data?.context)}`;
  const card = (i: number, variant: "hero" | "small", delay = 0) => (
    <ResultCard
      key={cardKey(results[i].id)}
      result={results[i]}
      rank={i + 1}
      variant={variant}
      delay={delay}
      onVote={(vote) => sendFeedback(results[i].id, i + 1, vote)}
    />
  );

  return (
    <main className="min-h-screen bg-night">
      <div className="mx-auto max-w-[1120px] px-4 pb-16 pt-5 sm:px-8 sm:pb-20 sm:pt-7">
        <header className="mb-8 flex items-center justify-between sm:mb-14">
          <div className="font-display text-[22px] tracking-[0.02em]">AniMatch</div>
          <LangToggle />
        </header>

        {forceRules && <p className="mb-4 text-sm text-muted">{t.header.rulesOnly}</p>}

        <h1 className="mb-[22px] mt-0 font-display text-[34px] font-normal leading-[1.15] sm:text-[clamp(34px,5vw,56px)]">
          {t.header.headline}
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
          className="flex items-center gap-2.5 rounded-card border border-line bg-panel py-2 pl-5 pr-2 focus-within:border-muted sm:pl-[22px]"
        >
          <label htmlFor="situation" className="sr-only">
            {t.input.label}
          </label>
          <input
            id="situation"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            // Don't submit while a Japanese IME is still converting.
            onKeyDown={(e) => e.key === "Enter" && e.nativeEvent.isComposing && e.preventDefault()}
            placeholder={placeholder}
            maxLength={MAX_INPUT_CHARS}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-3 text-[17px] text-paper outline-none placeholder:text-faint sm:text-xl"
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="rounded-box bg-lamp px-[18px] py-3 text-[17px] font-bold text-lamp-ink disabled:opacity-50 sm:px-[26px] sm:py-3.5"
          >
            {loading && text.trim() ? t.input.submitting : t.input.submit}
          </button>
        </form>

        <QuickPicks context={data?.context ?? emptyContext()} onChange={changeContext} />

        {error && (
          <p role="alert" className="mt-10 text-lamp">
            {t.states.error}
          </p>
        )}

        {!data && loading && <Skeleton />}

        {/* Not something we can answer (gibberish, or not about anime): say so plainly; the quick picks are right above. */}
        {data && data.intent !== "recommend" && (
          <section role="status" className="mt-10 rounded-card border border-line bg-panel px-5 py-5 sm:mt-[52px] sm:px-6">
            {echo && <p className="m-0 mb-1 text-muted">{t.understood.input(echo)}</p>}
            <p className="m-0 text-lg">{data.intent === "off_topic" ? t.intent.off_topic : t.intent.unclear}</p>
          </section>
        )}

        {data && data.intent === "recommend" && (
          <div aria-busy={loading} className={`transition-opacity ${loading ? "opacity-50" : ""}`}>
            <Understood
              context={data.context}
              parse={data.parse}
              notices={data.notices}
              open={data.mode === "open"}
              inputText={echo}
              onChange={changeContext}
            />

            {results.length === 0 ? (
              <p className="py-12 text-center text-muted">{t.states.empty}</p>
            ) : (
              <section aria-label={t.context.heading} className="grid gap-[18px]">
                <div className="grid gap-[18px] lg:grid-cols-[1.35fr_1fr]">
                  {card(0, "hero")}
                  {results.length > 1 && (
                    <div className="grid content-start gap-[18px]">
                      {results.slice(1, 3).map((_, j) => card(j + 1, "small", 0.08 * (j + 1)))}
                    </div>
                  )}
                </div>
                {results.length > 3 && (
                  <div className="grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
                    {results.slice(3).map((_, j) => card(j + 3, "small", 0.05 * (j % 3)))}
                  </div>
                )}
              </section>
            )}

            {data.hasMore && (
              <button
                type="button"
                onClick={showMore}
                disabled={loading}
                className="mx-auto mt-[26px] block rounded-full border border-line px-[22px] py-2.5 text-[15px] hover:border-muted disabled:opacity-50"
              >
                {t.states.more}
              </button>
            )}
          </div>
        )}

        <footer className="mt-[60px] border-t border-line pt-3.5 text-[13px] text-faint">
          {t.footer.data}
          <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="hover:text-muted">
            AniList
          </a>
        </footer>
      </div>
    </main>
  );
}

function Skeleton() {
  return (
    <div aria-hidden className="mt-[52px] grid animate-pulse gap-[18px] lg:grid-cols-[1.35fr_1fr]">
      <div className="h-[340px] rounded-card bg-panel" />
      <div className="grid gap-[18px]">
        <div className="h-[160px] rounded-card bg-panel" />
        <div className="h-[160px] rounded-card bg-panel" />
      </div>
    </div>
  );
}
