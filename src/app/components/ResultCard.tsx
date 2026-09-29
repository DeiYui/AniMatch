// src/app/components/ResultCard.tsx
// One recommendation. "hero" = #1 (large); "small" = the others. Each card is tinted by its own cover colour.
"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import type { Recommendation } from "@/lib/api";
import { readableAccent } from "@/lib/color";
import { MODE_WEIGHTS } from "@/lib/engine/rank";
import { reasonKey, renderReason, renderRuntime, titleFor } from "@/i18n";
import { useLang } from "@/i18n/LangProvider";

type Vote = "up" | "down";

type Props = {
  result: Recommendation;
  rank: number; // 1-based
  variant: "hero" | "small";
  onVote: (vote: Vote) => Promise<void>;
  delay?: number; // entrance animation stagger, seconds
};

const f2 = (x: number) => x.toFixed(2);

export function ResultCard({ result: r, rank, variant, onVote, delay = 0 }: Props) {
  const { lang, t } = useLang();
  const [vote, setVote] = useState<Vote | null>(null);
  // Cover: local file (npm run fetch:covers) → AniList CDN → the tinted gradient behind it.
  const sources = [r.localCover, r.coverImage].filter((s): s is string => !!s);
  const [coverIndex, setCoverIndex] = useState(0);
  const cover = sources[coverIndex] ?? null;

  const hero = variant === "hero";
  const title = titleFor(r.titles, lang);
  const meta = [renderRuntime(r, lang), r.year != null ? t.card.year(r.year) : null].filter(Boolean).join("　");
  const match = Math.min(100, Math.round(r.score.total * 100));
  const style = { "--c": readableAccent(r.coverColor), animationDelay: `${delay}s` } as CSSProperties;

  const send = async (v: Vote) => {
    setVote(v);
    try {
      await onVote(v);
    } catch {
      setVote(null); // let them try again
    }
  };

  // Bars for the weighted parts this scoring mode uses (raw 0..1 values); adjustments as signed numbers.
  // Rows are keyed by id, not label (two labels can read the same in one language).
  const parts = t.card.parts;
  const w = MODE_WEIGHTS[r.score.mode];
  const bars: [string, string, number, number][] = (
    [
      ["similarity", parts.similarity, r.score.cosine, w.cosine],
      ["strength", parts.strength, r.score.intensity, w.intensity],
      ["theme", parts.theme, r.score.themeMatch, w.theme],
      ["quality", parts.quality, r.score.qualityRaw, w.quality],
      ["fame", parts.fame, r.score.fame, w.fame],
    ] as [string, string, number, number][]
  ).filter(([, , , weight]) => weight > 0);
  const adjustments: [string, string, number][] = (
    [
      ["energy", parts.energy, r.score.energy],
      ["prequel", parts.prequel, r.score.prequelPenalty],
      ["longSeries", parts.longSeries, r.score.longSeriesPenalty],
      ["shortSeries", parts.shortSeries, r.score.shortSeriesBonus],
      ["era", parts.era, r.score.eraBonus],
      ["popularity", parts.popularity, r.score.popularityBonus],
    ] as [string, string, number][]
  ).filter(([, , v]) => Math.abs(v) >= 0.005);
  const formula = t.card.formula(bars.map(([, label, , weight]) => [label, weight]));

  return (
    <article
      style={style}
      className={`card-tint rise relative grid overflow-hidden rounded-card bg-panel ${
        hero ? "grid-cols-[120px_1fr] gap-4 p-4 sm:grid-cols-[230px_1fr] sm:gap-6 sm:p-[22px]" : "grid-cols-[104px_1fr] gap-4 p-4"
      }`}
    >
      <a
        href={r.siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden
        className="poster-fallback relative aspect-[2/3] self-start overflow-hidden rounded-box"
      >
        {cover && (
          <Image
            key={cover}
            src={cover}
            alt=""
            fill
            unoptimized
            onError={() => setCoverIndex((i) => i + 1)}
            className="object-cover"
          />
        )}
      </a>

      <div className="min-w-0">
        {r.searched ? (
          <p className="m-0 inline-block rounded-full border border-[var(--c)] px-2 text-xs font-bold text-[var(--c)]">{t.card.searched}</p>
        ) : (
          <p className="m-0 font-display text-[15px] text-[var(--c)]">{rank}</p>
        )}
        <h3 className={`mb-1 mt-0.5 font-bold leading-tight ${hero ? "text-[22px] sm:text-[30px]" : "text-[19px]"}`}>{title}</h3>
        <p className={`m-0 text-sm text-muted ${hero ? "mb-4" : "mb-3"}`}>{meta}</p>

        <ul className={`m-0 grid list-none p-0 ${hero ? "mb-[18px] gap-2" : "mb-2.5 gap-1"}`}>
          {r.reasons.map((reason) => (
            <li key={reasonKey(reason)} className={`flex items-baseline gap-2.5 ${hero ? "text-base" : "text-sm"}`}>
              <span aria-hidden className="h-1.5 w-1.5 flex-none -translate-y-0.5 rounded-[2px] bg-[var(--c)]" />
              {renderReason(reason, lang)}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* The searched title isn't a "match" for itself, so no percentage. */}
          <span className="mr-auto text-sm text-muted">
            {!r.searched && (
              <>
                {t.card.match} <b className="text-lg text-paper">{match}%</b>
              </>
            )}
          </span>
          <div role="group" aria-label={t.card.rateGroup} className="flex gap-2.5">
            {(["up", "down"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => send(v)}
                disabled={vote !== null}
                aria-pressed={vote === v}
                aria-label={v === "up" ? t.card.voteUp : t.card.voteDown}
                className="h-[34px] w-[38px] rounded-tag border border-line aria-pressed:border-lamp aria-pressed:bg-lamp/15 disabled:cursor-default disabled:[&:not([aria-pressed=true])]:opacity-40"
              >
                {v === "up" ? "👍" : "👎"}
              </button>
            ))}
          </div>
          {hero && (
            <a href={r.siteUrl} target="_blank" rel="noopener noreferrer" className="border-b border-line text-sm text-paper hover:border-paper">
              {t.card.anilist}
            </a>
          )}
        </div>
        {vote && (
          <p role="status" className="mt-1.5 text-xs text-muted">
            {t.card.thanks}
          </p>
        )}

        <details className="mt-3.5 text-[13px] text-muted">
          <summary className="cursor-pointer select-none hover:text-paper">{t.card.breakdown}</summary>
          <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 tabular-nums">
            {bars.map(([id, label, v]) => (
              <div key={id} className="contents">
                <span>{label}</span>
                <span className="h-1.5 overflow-hidden rounded-[3px] bg-line">
                  <i className="block h-full bg-[var(--c)]" style={{ width: `${Math.round(Math.min(1, v) * 100)}%` }} />
                </span>
                <span>{f2(v)}</span>
              </div>
            ))}
            {adjustments.map(([id, label, v]) => (
              <div key={id} className="contents">
                <span>{label}</span>
                <span />
                <span>
                  {v > 0 ? "+" : ""}
                  {f2(v)}
                </span>
              </div>
            ))}
            <span className="pt-1 text-paper">{parts.total}</span>
            <span />
            <span className="pt-1 text-paper">{f2(r.score.total)}</span>
          </div>
          <p className="mt-1.5 text-xs text-faint">{formula}</p>
        </details>
      </div>
    </article>
  );
}
