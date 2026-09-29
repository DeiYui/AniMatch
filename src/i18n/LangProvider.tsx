// src/i18n/LangProvider.tsx
// Current UI language. Default JA; ?lang=en|ja in the URL wins, then the remembered choice (localStorage).
// The language lives outside React (URL + storage), so it's read with useSyncExternalStore; the server
// snapshot is the default, which avoids hydration mismatches.
// Results are language-neutral, so switching re-renders instantly without refetching.
"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_LANG, dictionaries, isLang, type Lang } from "./index";
import type { Dict } from "./ja";

const STORAGE_KEY = "animatch.lang";

type LangState = { lang: Lang; t: Dict; setLang: (lang: Lang) => void };

const LangContext = createContext<LangState>({ lang: DEFAULT_LANG, t: dictionaries[DEFAULT_LANG], setLang: () => {} });

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener); // other tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// Storage can throw (private mode, blocked site data); the choice then just isn't remembered.
function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (isLang(fromUrl)) return fromUrl;
  const stored = readStored();
  return isLang(stored) ? stored : DEFAULT_LANG;
}

function setLang(next: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
  // Keep a ?lang= link in sync so reloading/sharing shows the same language.
  const url = new URL(window.location.href);
  if (url.searchParams.has("lang")) {
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url);
  }
  listeners.forEach((l) => l());
}

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_LANG);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, t: dictionaries[lang], setLang }}>
      {/* React 19 hoists <title> into <head>; rendering it here keeps the tab title in the UI language. */}
      <title>{dictionaries[lang].meta.title}</title>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
