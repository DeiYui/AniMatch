// src/i18n/index.ts
// Rendering of language-neutral messages (src/lib/messages.ts) with a dictionary.
// Pure; used by the UI and by scripts (showcase prints Japanese for JA sentences, English for EN ones).
import type { Anime } from "@/lib/anime/schema";
import type { Context } from "@/lib/context/schema";
import { THEMES, type ThemeKey } from "@/data/themes";
import type { ChipLabel, Notice, PickLabel, Reason, TitleNames } from "@/lib/messages";
import { ja, type Dict } from "./ja";
import { en } from "./en";

export const LANGS = ["ja", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "ja";

export const dictionaries: Record<Lang, Dict> = { ja, en };

export const isLang = (x: unknown): x is Lang => (LANGS as readonly unknown[]).includes(x);

/** Theme labels live next to their definitions in src/data/themes.ts (one file to review). */
export const themeLabel = (k: ThemeKey, lang: Lang): string => THEMES[k][lang];

/** JA: native title first. EN: English title, then romaji. */
export function titleFor(names: TitleNames, lang: Lang): string {
  const order = lang === "ja" ? [names.native, names.romaji, names.english] : [names.english, names.romaji, names.native];
  return order.find((n): n is string => !!n) ?? "";
}

/** The other-language name, shown under the main title (null if it would repeat it). */
export function subtitleFor(names: TitleNames, lang: Lang): string | null {
  const main = titleFor(names, lang);
  const sub = lang === "ja" ? (names.english ?? names.romaji) : names.native;
  return sub && sub !== main ? sub : null;
}

export { reasonKey } from "@/lib/messages";

export function renderReason(r: Reason, lang: Lang): string {
  const t = dictionaries[lang];
  switch (r.key) {
    case "theme":
      return t.reasons.theme(r.themes.map((k) => themeLabel(k, lang)));
    case "popular":
      return t.reasons.popular(r.topPct);
    case "mood":
      return t.reasons.mood(t.dims[r.dim], t.levels[r.level]);
    case "reference":
      return t.reasons.reference(titleFor(r.titles, lang));
    case "fitsTime":
      return r.whole ? t.reasons.fitsWhole(r.minutes) : t.reasons.fitsEpisode(r.minutes);
    case "completed":
      return t.reasons.completed;
    case "era":
      return r.era === "recent" ? t.reasons.recent(r.year) : t.reasons.classic(r.year);
    case "popularity":
      return r.popularity === "famous" ? t.reasons.famous : t.reasons.hiddenGem(r.score);
    case "heavy":
      return t.reasons.heavy(t.dims.heavy, t.heavyLevels[r.level]);
    case "family":
      return t.reasons.family;
    case "avoid":
      return t.reasons.avoid(r.keys.map((k) => t.avoid[k]));
    case "substantial":
      return t.reasons.substantial;
    case "sequel":
      return t.reasons.sequel;
    case "shortSeries":
      return t.reasons.shortSeries(r.episodes);
    case "score":
      return t.reasons.score(r.score);
  }
}

export function renderNotice(n: Notice, lang: Lang): string {
  const t = dictionaries[lang];
  switch (n.key) {
    case "referenceNotFound":
      return t.notices.referenceNotFound(n.title);
    case "relaxed":
      return t.notices.relaxed;
    case "fewResults":
      return t.notices.fewResults(n.count);
  }
}

export function renderChipLabel(l: ChipLabel, lang: Lang): string {
  const t = dictionaries[lang];
  switch (l.kind) {
    case "mood":
      return t.moods[l.mood];
    case "energy":
      return t.energy[l.energy];
    case "time":
      return t.chip.time(l.minutes);
    case "company":
      return t.company[l.company];
    case "avoid":
      return t.chip.avoid(t.avoid[l.key]);
    case "reference":
      return t.chip.reference(l.title);
    case "theme":
      return themeLabel(l.theme, lang);
    case "format":
      return t.chip.format[l.format];
    case "completed":
      return t.chip.completed;
    case "era":
      return t.chip.era[l.era];
    case "popularity":
      return t.chip.popularity[l.popularity];
  }
}

/** Quick-pick labels are shorter / more "wish"-like than chips (笑いたい vs 笑い). */
export function renderPickLabel(l: PickLabel, lang: Lang): string {
  const t = dictionaries[lang];
  switch (l.kind) {
    case "mood":
      return t.picks.moods[l.mood];
    case "time":
      return t.picks.time(l.minutes);
    case "binge":
      return t.picks.binge;
    case "company":
      return t.picks.company[l.company];
    default:
      return renderChipLabel(l, lang);
  }
}

/** 「TVアニメ・1話24分 × 12話」 / "TV series · 24 min × 12 eps"; movies just 「映画・約130分」. */
export function renderRuntime(a: Pick<Anime, "format" | "episodes" | "duration">, lang: Lang): string {
  const t = dictionaries[lang];
  if (a.format === "MOVIE" || a.episodes === 1) return t.runtime.movie(a.duration);
  return t.runtime.withFormat(t.formats[a.format], t.runtime.series(a.duration, a.episodes));
}

// ---------- 「理解した内容」 as a sentence ----------

/** A piece of the sentence. Tokens carry the chip id they edit (see context/chips.ts). */
export type Segment = { kind: "text"; text: string } | { kind: "token"; id: string; label: string };

const isDefaultMoods = (c: Context) => c.moods.length === 1 && c.moods[0].type === "relax" && c.moods[0].weight === 0.5;

/** Tokens after the sentence: filters and avoid keys, removable one by one. */
function trailingTokens(c: Context, t: Dict): Segment[] {
  const out: Segment[] = [];
  if (c.format !== "any") out.push({ kind: "token", id: "format", label: t.chip.format[c.format] });
  if (c.completedOnly) out.push({ kind: "token", id: "completed", label: t.chip.completed });
  if (c.era !== "any") out.push({ kind: "token", id: "era", label: t.chip.era[c.era] });
  if (c.popularity !== "any") out.push({ kind: "token", id: "popularity", label: t.chip.popularity[c.popularity] });
  for (const k of c.avoid) out.push({ kind: "token", id: `avoid:${k}`, label: t.chip.avoid(t.avoid[k]) });
  return out;
}

const text = (s: string): Segment => ({ kind: "text", text: s });

type ComposeOptions = { open: boolean }; // open: nothing specific was asked → popular, high-rated picks

const themeTokens = (c: Context, lang: Lang, join: string): Segment[] =>
  c.themes.flatMap((k, i) => [
    ...(i > 0 ? [text(join)] : []),
    { kind: "token" as const, id: `theme:${k}`, label: themeLabel(k, lang) },
  ]);

/** JA: 『X』みたいな、家族と30分で軽く見られる、笑える、泣ける、料理の作品。 + trailing tokens */
function composeJa(c: Context, t: Dict, { open }: ComposeOptions): Segment[] {
  const u = t.understood;
  if (c.titleSearch && c.referenceTitle) {
    return [{ kind: "token", id: "reference", label: u.reference(c.referenceTitle) }, text(u.searched), ...trailingTokens(c, t)];
  }
  const moods = isDefaultMoods(c) ? [] : c.moods;
  const hasNoun = moods.length > 0 || c.themes.length > 0;
  const hasPredicate = c.company != null || c.timeBudgetMin != null || c.energy !== "mid";
  const main: Segment[] = [];
  if (c.referenceTitle) {
    main.push({ kind: "token", id: "reference", label: u.reference(c.referenceTitle) }, text(u.referenceLink));
    if (hasPredicate || moods.length) main.push(text(u.listComma));
  }
  if (c.company) main.push({ kind: "token", id: "company", label: u.company[c.company] });
  if (c.timeBudgetMin != null) main.push({ kind: "token", id: "time", label: t.chip.time(c.timeBudgetMin) }, text(u.timeLink));
  if (c.energy !== "mid") main.push({ kind: "token", id: "energy", label: u.energy[c.energy] });
  if (hasPredicate) main.push(text((c.energy === "high" ? u.verbHigh : u.verbOther) + (hasNoun || open ? u.listComma : "")));
  moods.forEach((m, i) => {
    if (i > 0) main.push(text(u.moodJoin));
    main.push({ kind: "token", id: `mood:${m.type}`, label: u.moods[m.type] });
  });
  if (c.themes.length) {
    if (moods.length) main.push(text(u.moodJoin));
    main.push(...themeTokens(c, "ja", "・"), text(u.themeLink));
  }
  const trailing = trailingTokens(c, t);
  // Nothing specific asked: say what we're showing instead of pretending ("popular, high-rated").
  if (open) return [...main, text(u.open), ...trailing];
  if (!main.length) return trailing.length ? trailing : [text(u.open)];
  return [...main, text(u.work), ...trailing];
}

/** EN: Something light, funny and tearjerking about cooking like “X” with family for 30 min. + trailing tokens */
function composeEn(c: Context, t: Dict, { open }: ComposeOptions): Segment[] {
  const u = t.understood;
  if (c.titleSearch && c.referenceTitle) {
    return [{ kind: "token", id: "reference", label: u.reference(c.referenceTitle) }, text(u.searched), text("."), ...trailingTokens(c, t)];
  }
  const moods = isDefaultMoods(c) ? [] : c.moods;
  const main: Segment[] = [text(open ? u.open : u.work)];
  const adjectives: Segment[] = [];
  if (c.energy === "low") adjectives.push({ kind: "token", id: "energy", label: u.energy.low });
  for (const m of moods) adjectives.push({ kind: "token", id: `mood:${m.type}`, label: u.moods[m.type] });
  adjectives.forEach((a, i) => {
    if (i > 0) main.push(text(i === adjectives.length - 1 ? u.moodJoin : u.listComma));
    main.push(a);
  });
  if (c.themes.length) main.push(text(u.themeLink), ...themeTokens(c, "en", "and"));
  if (c.referenceTitle) main.push(text(u.referenceLink), { kind: "token", id: "reference", label: u.reference(c.referenceTitle) });
  if (c.company) main.push({ kind: "token", id: "company", label: u.company[c.company] });
  if (c.timeBudgetMin != null) main.push(text(u.timeLink), { kind: "token", id: "time", label: t.chip.time(c.timeBudgetMin) });
  if (c.energy === "high") main.push(text(u.verbHigh), { kind: "token", id: "energy", label: u.energy.high });
  const trailing = trailingTokens(c, t);
  if (main.length === 1 && !open) return trailing.length ? trailing : [text(u.open), text(".")];
  return [...main, text("."), ...trailing];
}

export function composeUnderstood(c: Context, lang: Lang, options: ComposeOptions = { open: false }): Segment[] {
  return lang === "ja" ? composeJa(c, dictionaries.ja, options) : composeEn(c, dictionaries.en, options);
}
