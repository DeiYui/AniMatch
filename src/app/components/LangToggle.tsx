// src/app/components/LangToggle.tsx
// 日本語 / English switch in the header.
"use client";

import { LANGS } from "@/i18n";
import { useLang } from "@/i18n/LangProvider";

export function LangToggle() {
  const { lang, t, setLang } = useLang();
  return (
    <div role="group" aria-label={t.header.langToggle} className="flex rounded-full border border-line p-[3px]">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className="rounded-full px-3 py-1 text-[13px] text-muted aria-pressed:bg-panel aria-pressed:text-paper"
        >
          {t.header.langNames[l]}
        </button>
      ))}
    </div>
  );
}
