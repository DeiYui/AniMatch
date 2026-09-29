// src/app/components/QuickPicks.tsx
// Quick picks under the input. Mood is primary (pills with icons); time and "with" are compact segmented
// controls on one row; everything else is behind 「こだわり条件」 (popover on desktop, bottom sheet on phone).
// Each tap edits the Context directly (no LLM) and re-ranks.
"use client";

import { useEffect, useRef, useState } from "react";
import type { Context, Mood } from "@/lib/context/schema";
import type { PickGroup } from "@/lib/messages";
import { activePrefCount, clearPrefs, QUICK_PICKS, type QuickPick } from "@/lib/context/quickPicks";
import { renderPickLabel } from "@/i18n";
import { useLang } from "@/i18n/LangProvider";

const MOOD_ICONS: Record<Mood, string> = { laugh: "😂", cry: "😢", thrill: "🔥", relax: "🍵", think: "🧩", romance: "💞", dark: "🌑" };

type Props = { context: Context; onChange: (next: Context) => void };

const picksIn = (group: PickGroup) => QUICK_PICKS.filter((p) => p.group === group);

export function QuickPicks({ context, onChange }: Props) {
  const { lang, t } = useLang();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const prefsButton = useRef<HTMLButtonElement>(null);
  const active = activePrefCount(context);
  const toggle = (p: QuickPick) => onChange(p.toggle(context));

  const segmented = (group: "time" | "company") => (
    <div className="flex items-center gap-2.5">
      <span className="text-[13px] text-muted">{t.picks.groups[group]}</span>
      <div role="group" aria-label={t.picks.groups[group]} className="flex overflow-hidden rounded-tag border border-line">
        {picksIn(group).map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.selected(context)}
            onClick={() => toggle(p)}
            className="border-r border-line px-3 py-[7px] text-sm text-soft last:border-r-0 aria-pressed:bg-seg aria-pressed:font-bold aria-pressed:text-paper"
          >
            {renderPickLabel(p.label, lang)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-[18px] grid gap-3.5">
      <div role="group" aria-label={t.picks.groups.mood} className="flex flex-wrap gap-2">
        {picksIn("mood").map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.selected(context)}
            onClick={() => toggle(p)}
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[15px] text-soft transition-colors hover:border-muted aria-pressed:border-lamp aria-pressed:bg-lamp aria-pressed:font-bold aria-pressed:text-lamp-ink"
          >
            <span aria-hidden className="text-base not-italic">
              {p.label.kind === "mood" ? MOOD_ICONS[p.label.mood] : null}
            </span>
            {renderPickLabel(p.label, lang)}
          </button>
        ))}
      </div>

      <div className="relative flex flex-wrap items-center gap-x-[22px] gap-y-3">
        {segmented("time")}
        {segmented("company")}
        <button
          ref={prefsButton}
          type="button"
          aria-expanded={prefsOpen}
          aria-haspopup="dialog"
          onClick={() => setPrefsOpen((v) => !v)}
          className="flex items-center gap-2 rounded-tag border border-line px-3 py-[7px] text-sm sm:ml-auto aria-expanded:border-muted"
        >
          {t.picks.prefs.button}
          {active > 0 && (
            <span
              aria-label={t.picks.prefs.activeCount(active)}
              className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-lamp px-1.5 text-xs font-bold text-lamp-ink"
            >
              {active}
            </span>
          )}
        </button>
        {prefsOpen && (
          <PrefsPanel
            context={context}
            onChange={onChange}
            onClose={() => {
              setPrefsOpen(false);
              prefsButton.current?.focus();
            }}
          />
        )}
      </div>
    </div>
  );
}

function PrefsPanel({ context, onChange, onClose }: Props & { onClose: () => void }) {
  const { lang, t } = useLang();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  // On open only: focus moves into the panel, and Escape closes it.
  useEffect(() => {
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tag = (p: QuickPick) => (
    <button
      key={p.id}
      type="button"
      aria-pressed={p.selected(context)}
      onClick={() => onChange(p.toggle(context))}
      className={`rounded-tag border border-line px-[11px] py-[5px] text-sm text-soft first-letter:uppercase ${
        p.group === "avoid"
          ? "aria-pressed:border-[#e07a7a] aria-pressed:text-[#f0a3a3] aria-pressed:line-through"
          : "aria-pressed:border-lamp aria-pressed:text-lamp"
      }`}
    >
      {p.group === "avoid" && p.label.kind === "avoid"
        ? t.avoid[p.label.key]
        : p.label.kind === "completed"
          ? t.picks.prefs.completedOnly
          : renderPickLabel(p.label, lang)}
    </button>
  );
  const filters = picksIn("filters");
  const sections: [string, QuickPick[]][] = [
    [t.picks.prefs.format, filters.filter((p) => p.label.kind === "format" || p.label.kind === "completed")],
    [t.picks.prefs.eraFame, filters.filter((p) => p.label.kind === "era" || p.label.kind === "popularity")],
    [t.picks.prefs.avoid, picksIn("avoid")],
  ];

  return (
    <>
      {/* Backdrop: dims the page on a phone; on desktop it's transparent but still closes on an outside click. */}
      <div className="fixed inset-0 z-30 bg-black/55 sm:bg-transparent" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-label={t.picks.prefs.button}
        className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] overflow-y-auto rounded-t-card border border-line bg-panel px-5 pb-6 pt-4 shadow-2xl sm:absolute sm:inset-x-0 sm:bottom-auto sm:top-full sm:mt-3 sm:max-h-none sm:rounded-box sm:px-5 sm:py-[18px]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        <div className="grid gap-x-7 gap-y-[18px] sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          {sections.map(([heading, picks]) => (
            <div key={heading}>
              <h3 className="mb-2 text-[13px] font-medium text-muted">{heading}</h3>
              <div className="flex flex-wrap gap-1.5">{picks.map(tag)}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onChange(clearPrefs(context))}
            disabled={activePrefCount(context) === 0}
            className="rounded-tag px-3 py-1.5 text-sm text-muted hover:text-paper disabled:opacity-40"
          >
            {t.picks.prefs.clear}
          </button>
          <button type="button" onClick={onClose} className="rounded-tag bg-lamp px-4 py-1.5 text-sm font-bold text-lamp-ink">
            {t.picks.prefs.close}
          </button>
        </div>
      </div>
    </>
  );
}
