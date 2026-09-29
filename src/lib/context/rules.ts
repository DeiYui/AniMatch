// src/lib/context/rules.ts
// Rule-based parser: Japanese and English keywords → Context. The fallback whenever the LLM fails,
// so it must never throw.
//
// Order matters. Each step removes what it consumed so later steps don't misread it:
//   1. negation (〜は嫌 …, "no X", "not X" …) → avoid keys / low energy
//   2. reference title (〜みたいな …, "something like X")
//   3. company (家族, 恋人, "with my family" … — removed so 恋人 doesn't read as romance)
//   4. themes (src/data/themes.ts; longest keyword first, so 魔法少女 isn't also read as 魔法; before company so
//      家族もの / 子ども向け are themes, not "watching with family")
//   5. popularity (隠れた名作 removed first so 名作 isn't read again), era, format, completed-only
//   6. time budget, 7. energy, 8. moods (ordered by position; the first is the primary mood)
//   9. intent: if nothing at all was recognised → off_topic (known off-topic words) or unclear,
//      unless it's a valid "anything" request (なんでもいい, おすすめ) → recommend.
//
// Keyword matching: Japanese keywords match as substrings. ASCII keywords match whole words,
// case-insensitively, allowing -s/-es/-ing/-ed (so "robot" matches "robots" but "cry" not "crystal").
import { AVOID_KEYS, AVOID_MAP, type AvoidKey } from "@/data/avoidMap";
import { THEME_KEYS, THEMES, type ThemeKey } from "@/data/themes";
import { ContextSchema, type Context, type Mood } from "./schema";
import { hasAnyCondition } from "./merge";

const DELIM = "、。,.!?！？;\\s「」『』";

// Japanese: "X は嫌" etc. X is the chunk before it, cut at the last conjunction so 「笑えるけどグロは嫌」 keeps 笑える.
const NEGATION_JA = new RegExp(`([^${DELIM}]+?)(?:は|が|も)?(?:嫌い|嫌|いや|イヤ|なし|無し|以外|じゃない|じゃなく)`, "g");
const CONJUNCTION_JA = /.*(?:だけど|けれど|けど|でも|ただ|ので|から)/;

// English: "no X", "not X", "without X", "nothing X", "don't want X" … up to punctuation, "and" or "but".
const NEGATION_EN =
  /\b(?:no|not|without|nothing|anything but|avoid|skip|hate|(?:don't|dont|do not) (?:want|like|need))\s+([^,.!?;、。]+?)(?=\s+(?:and|but)\b|[,.!?;、。]|$)/gi;

// Negated "heavy" words mean "keep it light" → energy low.
const HEAVY_WORDS = ["重い", "重たい", "重め", "難しい", "頭を使う", "考える", "長い", "heavy", "serious", "complicated", "complex", "think", "thinking", "long"];

// Bare みたい is left out on purpose: in hiragana it can also mean 見たい.
const REFERENCE_JA = new RegExp(`([^${DELIM}]+?)(?:みたいな|みたいの|みたいに|っぽい|のような|のよう|に似た)`);
// "something like X", "shows similar to X"; X ends at punctuation or but/and/with/for/that. Bare "like" is not
// enough ("I'd like something funny").
const REFERENCE_EN =
  /\b(?:(?:something|anything|stuff|shows?|anime|series|one|titles?)\s+(?:like|similar to)|similar to)\s+(.+?)(?=\s+(?:but|and|with|for|that|to|please)\b|[,.!?;、。]|$)/i;
const QUOTES = /^["“”'‘’「『]+|["“”'‘’」』]+$/g;

const COMPANY: [NonNullable<Context["company"]>, string[]][] = [
  ["family", ["家族", "子ども", "子供", "こども", "親と", "両親", "family", "kids", "children"]],
  ["partner", ["恋人", "彼女", "彼氏", "妻", "夫", "嫁", "girlfriend", "boyfriend", "partner", "wife", "husband", "date night"]],
  ["friends", ["友達", "友人", "ともだち", "friend", "buddies"]],
  ["alone", ["一人", "ひとり", "1人", "alone", "by myself", "on my own"]],
];

const ENERGY_LOW = [
  ...["疲れ", "つかれ", "だるい", "眠い", "ねむい", "寝る前", "何も考えず", "頭を使わず", "軽く", "軽め", "ゆるく"],
  ...["tired", "exhausted", "sleepy", "before bed", "before sleep", "worn out", "drained", "long day", "mindless", "brain off"],
];
const ENERGY_HIGH = [
  ...["一気見", "一気に", "がっつり", "じっくり", "重い", "重め"],
  ...["binge", "marathon", "all weekend", "deep dive", "substantial", "heavy"],
];

// Binge-watching implies completed titles only (and high energy, via ENERGY_HIGH).
const BINGE = ["一気見", "一気に", "binge", "marathon"];
const COMPLETED = ["完結", "最終回まで", "completed", "complete series", "finished airing", "already ended", "fully aired", ...BINGE];
const HIDDEN_GEM = ["隠れた名作", "隠れ名作", "知る人ぞ知る", "マイナー", "あまり知られていない", "hidden gem", "underrated", "lesser-known", "lesser known", "obscure"];
const FAMOUS = ["有名", "人気", "定番", "王道", "famous", "popular", "well-known", "mainstream"];
// 最近 alone often means "lately" (最近落ち込んでる), so only 最近の counts.
const RECENT = ["最近の", "最新", "新しい", "新しめ", "新作", "recent", "new", "newer", "latest", "modern"];
const CLASSIC = ["昔", "懐かしい", "古い", "レトロ", "90年代", "80年代", "classic", "old", "older", "retro", "old-school", "90s", "80s"];
const MOVIE = ["映画", "劇場版", "movie", "film"];
const SERIES = ["シリーズ", "TVアニメ", "テレビアニメ", "series", "tv show"];

const MOOD_WORDS: Record<Mood, string[]> = {
  laugh: ["笑", "ギャグ", "コメディ", "明るい", "funny", "funnier", "comedy", "comedies", "laugh", "hilarious", "humor", "humour", "lighthearted", "light-hearted"],
  cry: ["泣", "感動", "涙", "cry", "cries", "tearjerker", "emotional", "moving", "touching", "tears", "sad"],
  thrill: ["ワクワク", "わくわく", "熱い", "熱く", "アツい", "アツく", "燃える", "バトル", "アクション", "ハラハラ", "燃え", "exciting", "excitement", "action", "battle", "fight", "hype", "thrilling", "thriller", "adrenaline", "adventure"],
  relax: ["癒", "ほっこり", "のんびり", "まったり", "ゆるい", "和む", "日常", "relaxing", "relax", "chill", "calm", "cozy", "cosy", "healing", "wholesome", "slice of life", "comfy", "soothing"],
  // Mystery / detective / psychological are themes (what it's about), not moods.
  think: ["考察", "伏線", "頭を使う", "考えさせ", "thought-provoking", "clever", "smart", "twist", "puzzle", "mind-bending"],
  romance: ["恋", "ラブ", "胸キュン", "キュン", "romance", "romantic", "love story", "rom-com", "romcom", "dating"],
  // ホラー / horror is a theme (genre); 怖い / scary is the feeling.
  dark: ["ダーク", "暗い", "鬱", "シリアス", "怖い", "dark", "grim", "bleak", "scary", "disturbing", "gritty"],
};

const isAscii = (w: string) => /^[\x00-\x7F]+$/.test(w);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = (w: string, flags = "i") => new RegExp(`\\b${escapeRe(w)}(?:s|es|ing|ed)?\\b`, flags);

function keywordIndex(text: string, word: string): number {
  if (!isAscii(word)) return text.indexOf(word);
  return wordRe(word).exec(text)?.index ?? -1;
}

const includesAny = (text: string, words: string[]) => words.some((w) => keywordIndex(text, w) >= 0);

function firstIndex(text: string, words: string[]): number {
  const found = words.map((w) => keywordIndex(text, w)).filter((i) => i >= 0);
  return found.length ? Math.min(...found) : -1;
}

const removeKeyword = (text: string, word: string) =>
  isAscii(word) ? text.replace(wordRe(word, "gi"), "、") : text.replaceAll(word, "、");

function parseNegations(text: string): { rest: string; avoid: AvoidKey[]; lowEnergy: boolean } {
  const avoid = new Set<AvoidKey>();
  let lowEnergy = false;
  const collect = (negated: string) => {
    for (const key of AVOID_KEYS) if (includesAny(negated, AVOID_MAP[key].keywords)) avoid.add(key);
    if (includesAny(negated, HEAVY_WORDS)) lowEnergy = true;
  };
  const rest = text
    .replace(NEGATION_JA, (whole, chunk: string) => {
      const kept = chunk.match(CONJUNCTION_JA)?.[0] ?? ""; // the part before the conjunction is not negated
      collect(chunk.slice(kept.length));
      return `${kept}、`;
    })
    .replace(NEGATION_EN, (whole, negated: string) => {
      collect(negated);
      return "、";
    });
  return { rest, avoid: [...avoid], lowEnergy };
}

function parseReference(text: string): { rest: string; referenceTitle: string | null } {
  const ja = text.match(REFERENCE_JA);
  if (ja) {
    const name = ja[1].replace(CONJUNCTION_JA, "").replace(QUOTES, "").trim();
    return { rest: text.replace(ja[0], "、"), referenceTitle: name || null };
  }
  const en = text.match(REFERENCE_EN);
  if (en) {
    const name = en[1].replace(QUOTES, "").trim();
    return { rest: text.replace(en[0], "、"), referenceTitle: name || null };
  }
  return { rest: text, referenceTitle: null };
}

// Every (keyword, theme) pair, longest keyword first.
const THEME_KEYWORDS: [string, ThemeKey][] = THEME_KEYS.flatMap((k) =>
  [...THEMES[k].kwJa, ...THEMES[k].kwEn].map((w): [string, ThemeKey] => [w, k]),
).sort((a, b) => b[0].length - a[0].length);

function parseThemes(text: string): { rest: string; themes: ThemeKey[] } {
  const found: { theme: ThemeKey; at: number }[] = [];
  let rest = text;
  for (const [word, theme] of THEME_KEYWORDS) {
    const at = keywordIndex(rest, word);
    if (at < 0) continue;
    if (!found.some((f) => f.theme === theme)) found.push({ theme, at });
    rest = removeKeyword(rest, word);
  }
  return { rest, themes: found.sort((a, b) => a.at - b.at).map((f) => f.theme) };
}

// Only consulted when nothing else was recognised.
const OFF_TOPIC = [
  ...["天気", "天気予報", "ニュース", "株価", "株", "プログラミング", "コード", "翻訳", "計算", "宿題", "レシピ", "占い"],
  ...["weather", "forecast", "news", "stock", "stocks", "code", "coding", "programming", "python", "javascript", "translate", "math", "homework", "capital of", "recipe"],
];
const VAGUE_OK = [
  ...["なんでも", "何でも", "おすすめ", "オススメ", "お勧め", "適当に", "何か見たい", "なにか見たい", "暇", "ひま", "アニメ"],
  ...["anything", "recommend", "recommendation", "recommendations", "whatever", "surprise me", "something good", "any anime", "anime"],
];

function parseCompany(text: string): { rest: string; company: Context["company"] } {
  let company: Context["company"] = null;
  let rest = text;
  for (const [value, words] of COMPANY) {
    if (includesAny(rest, words)) company ??= value;
    for (const w of words) rest = removeKeyword(rest, w);
  }
  return { rest, company };
}

type Filters = Pick<Context, "format" | "completedOnly" | "era" | "popularity">;

function parseFilters(text: string): { rest: string; filters: Filters } {
  let rest = text;
  const consume = (words: string[]): boolean => {
    const found = includesAny(rest, words);
    if (found) for (const w of words) rest = removeKeyword(rest, w);
    return found;
  };
  const popularity: Filters["popularity"] = consume(HIDDEN_GEM) ? "hidden-gem" : consume(FAMOUS) ? "famous" : "any";
  const era: Filters["era"] = consume(RECENT) ? "recent" : consume(CLASSIC) ? "classic" : "any";
  const format: Filters["format"] = consume(MOVIE) ? "movie" : consume(SERIES) ? "series" : "any";
  // Don't consume binge words: they also set energy high.
  const completedOnly = includesAny(rest, COMPLETED);
  return { rest, filters: { format, completedOnly, era, popularity } };
}

function parseTimeBudget(text: string): number | null {
  // Japanese: 30分, 2時間, 1時間半
  const jaHours = text.match(/(\d+(?:\.\d+)?)\s*時間(半)?/);
  const jaMinutes = text.match(/(\d+)\s*分/);
  if (jaHours || jaMinutes) {
    const total = (jaHours ? Number(jaHours[1]) * 60 + (jaHours[2] ? 30 : 0) : 0) + (jaMinutes ? Number(jaMinutes[1]) : 0);
    return total > 0 ? Math.round(total) : null;
  }
  // English: "30 min", "2 hours", "1.5h", "half an hour", "an hour and a half", "an hour"
  if (/\bhour and a half\b/i.test(text)) return 90;
  if (/\bhalf an hour\b/i.test(text)) return 30;
  const enHours = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  const enMinutes = text.match(/(\d+)\s*(?:minutes?|mins?|m)\b/i);
  if (enHours || enMinutes) {
    const total = (enHours ? Number(enHours[1]) * 60 : 0) + (enMinutes ? Number(enMinutes[1]) : 0);
    return total > 0 ? Math.round(total) : null;
  }
  if (/\b(?:an|one) hour\b/i.test(text)) return 60;
  return null;
}

function parseMoods(text: string): Context["moods"] {
  return (Object.entries(MOOD_WORDS) as [Mood, string[]][])
    .map(([type, words]) => ({ type, at: firstIndex(text, words) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map(({ type }) => ({ type, weight: 1 }));
}

export function parseRules(input: string): Context {
  const text = input.normalize("NFKC");

  const negation = parseNegations(text);
  const reference = parseReference(negation.rest);
  const theme = parseThemes(reference.rest);
  const company = parseCompany(theme.rest);
  const { rest, filters } = parseFilters(company.rest);

  const energy: Context["energy"] =
    negation.lowEnergy || includesAny(rest, ENERGY_LOW) ? "low" : includesAny(rest, ENERGY_HIGH) ? "high" : "mid";
  const moods = parseMoods(rest);

  // Zod fills the defaults (moods, …) and guarantees the same shape the LLM path produces.
  const context = ContextSchema.parse({
    moods: moods.length ? moods : undefined,
    energy,
    timeBudgetMin: parseTimeBudget(text),
    company: company.company,
    avoid: negation.avoid,
    referenceTitle: reference.referenceTitle,
    ...filters,
    themes: theme.themes,
    source: "rules",
  });
  return { ...context, intent: intentOf(context, text) };
}

/** Honest fallback: if nothing was recognised, don't pretend (no default "relax" picks). */
function intentOf(c: Context, text: string): Context["intent"] {
  if (hasAnyCondition(c)) return "recommend";
  if (includesAny(text, OFF_TOPIC)) return "off_topic";
  if (includesAny(text, VAGUE_OK)) return "recommend";
  return "unclear";
}
