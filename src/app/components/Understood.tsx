// src/app/components/Understood.tsx
// 「理解した内容」 as a sentence with editable tokens, so the user reads what the system understood in plain words.
// Tokens with choices (✎) open a native select; the others (×) are removed on tap. 「＋」 adds a condition.
"use client";

import type { Context } from "@/lib/context/schema";
import type { ParseInfo } from "@/lib/api";
import type { Notice } from "@/lib/messages";
import { addOptions, contextToChips, type Chip } from "@/lib/context/chips";
import { composeUnderstood, renderChipLabel, renderNotice } from "@/i18n";
import { useLang } from "@/i18n/LangProvider";

type Props = {
  context: Context;
  parse: ParseInfo | null;
  notices: Notice[];
  open: boolean; // nothing specific was asked → the sentence says "popular, high-rated picks"
  inputText: string | null; // what the user typed, echoed as 「cooking」 → …
  onChange: (next: Context) => void;
};

const REMOVE = "__remove";
const tokenClass =
  "relative inline-flex items-center gap-1.5 rounded-t-[4px] border-b-2 border-lamp bg-lamp/[0.08] px-1.5 font-bold leading-normal";

export function Understood({ context, parse, notices, open, inputText, onChange }: Props) {
  const { lang, t } = useLang();
  const chips = new Map(contextToChips(context).map((c) => [c.id, c]));
  const segments = composeUnderstood(context, lang, { open });
  const options = addOptions(context);
  const groups = [...new Set(options.map((o) => o.group))];

  const token = (chip: Chip, label: string) =>
    chip.choices ? (
      <span className={tokenClass}>
        {label}
        <small aria-hidden className="text-[13px] font-normal text-muted">
          ✎
        </small>
        <select
          aria-label={t.context.change(label)}
          value={chip.value}
          onChange={(e) =>
            onChange(e.target.value === REMOVE ? chip.remove(context) : chip.choices!.find((c) => c.value === e.target.value)!.apply(context))
          }
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {chip.choices.map((c) => (
            <option key={c.value} value={c.value}>
              {renderChipLabel(c.label, lang)}
            </option>
          ))}
          <option value={REMOVE}>{t.understood.removeOption}</option>
        </select>
      </span>
    ) : (
      <span className={tokenClass}>
        {label}
        <button
          type="button"
          onClick={() => onChange(chip.remove(context))}
          aria-label={t.context.remove(label)}
          className="text-[13px] font-normal text-muted hover:text-paper"
        >
          ×
        </button>
      </span>
    );

  const badge =
    context.source === "llm" ? t.context.badgeLlm : context.source === "manual" ? t.context.badgeManual : t.context.badgeRules;
  const dot = context.source === "llm" ? "bg-[#6fd39a]" : context.source === "manual" ? "bg-lamp" : "bg-muted";

  return (
    <section aria-labelledby="understood-heading" className="mb-[22px] mt-10 sm:mt-[52px]">
      <h2 id="understood-heading" className="sr-only">
        {t.context.heading}
      </h2>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2.5">
        <p className="m-0 text-lg leading-[1.9] sm:text-[22px]">
          {/* Show exactly what was read from what: 「cooking」 → 料理・グルメの作品。 */}
          {inputText && (
            <span className="mr-2 font-normal text-muted">
              {t.understood.input(inputText)} <span aria-hidden>→</span>
            </span>
          )}
          {segments.map((s, i) => {
            // English needs spaces between words; Japanese doesn't. No space before the final period.
            const space = lang === "en" && i > 0 && !(s.kind === "text" && s.text === ".") ? " " : "";
            if (s.kind === "text") return <span key={i}>{space + s.text}</span>;
            const chip = chips.get(s.id);
            return (
              <span key={i}>
                {space}
                {chip ? token(chip, s.label) : <span className={tokenClass}>{s.label}</span>}
              </span>
            );
          })}
          {options.length > 0 && (
            <span className="relative ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-line align-middle text-base text-muted hover:border-lamp hover:text-lamp">
              {t.understood.add}
              <select
                aria-label={t.understood.addLabel}
                value=""
                onChange={(e) => {
                  const option = options.find((o) => o.id === e.target.value);
                  if (option) onChange(option.apply(context));
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                <option value="">{t.understood.addLabel}</option>
                {groups.map((g) => (
                  <optgroup key={g} label={t.groups[g]}>
                    {options
                      .filter((o) => o.group === g)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {renderChipLabel(o.label, lang)}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </span>
          )}
        </p>
        <div
          className="flex items-center gap-2 text-[13px] text-muted"
          title={parse?.fallbackReason ? t.context.fallback(parse.fallbackReason) : undefined}
        >
          <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
          {badge}
          {parse && <span>{t.context.latency(parse.latencyMs)}</span>}
        </div>
      </div>
      {context.unmatched.length > 0 && <p className="mt-2 text-sm text-muted">{t.understood.unmatched(context.unmatched)}</p>}
      {notices.length > 0 && (
        <p className="mt-2 text-sm text-lamp">{notices.map((n) => renderNotice(n, lang)).join(" · ")}</p>
      )}
    </section>
  );
}
