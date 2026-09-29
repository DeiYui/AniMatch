// src/lib/context/rules.ts
// Rule-based parser: Japanese keywords → Context. The fallback whenever the LLM fails, so it must never throw.
//
// Order matters. Each step removes what it consumed so later steps don't misread it:
//   1. negation (〜は嫌 …) → avoid keys / low energy
//   2. reference title (〜みたいな …)
//   3. company (家族, 恋人 … — removed so 恋人 doesn't read as romance)
//   4. time budget, 5. energy, 6. moods (ordered by position; the first is the primary mood)
import { AVOID_KEYS, AVOID_MAP, type AvoidKey } from "@/data/avoidMap";
import { ContextSchema, type Context, type Mood } from "./schema";

const DELIM = "、。,.!?！？\\s「」『』";

// "X は嫌" etc. X is the chunk before it, cut at the last conjunction so 「笑えるけどグロは嫌」 keeps 笑える.
const NEGATION = new RegExp(`([^${DELIM}]+?)(?:は|が|も)?(?:嫌い|嫌|いや|イヤ|なし|無し|以外|じゃない|じゃなく)`, "g");
const CONJUNCTION = /.*(?:だけど|けれど|けど|でも|ただ|ので|から)/;

// Negated "heavy" words mean "keep it light" → energy low.
const HEAVY_WORDS = ["重い", "重たい", "重め", "難しい", "頭を使う", "考える", "長い"];

// Bare みたい is left out on purpose: in hiragana it can also mean 見たい.
const REFERENCE = new RegExp(`([^${DELIM}]+?)(?:みたいな|みたいの|みたいに|っぽい|のような|のよう|に似た)`);

const COMPANY: [NonNullable<Context["company"]>, string[]][] = [
  ["family", ["家族", "子ども", "子供", "こども", "親と", "両親"]],
  ["partner", ["恋人", "彼女", "彼氏", "妻", "夫", "嫁"]],
  ["friends", ["友達", "友人", "ともだち"]],
  ["alone", ["一人", "ひとり", "1人"]],
];

const ENERGY_LOW = ["疲れ", "つかれ", "だるい", "眠い", "ねむい", "寝る前", "何も考えず", "頭を使わず", "軽く", "軽め", "ゆるく"];
const ENERGY_HIGH = ["一気見", "一気に", "がっつり", "じっくり", "重い", "重め"];

const MOOD_WORDS: Record<Mood, string[]> = {
  laugh: ["笑", "ギャグ", "コメディ", "明るい"],
  cry: ["泣", "感動", "涙"],
  thrill: ["ワクワク", "わくわく", "熱い", "アツい", "バトル", "アクション", "ハラハラ", "燃え"],
  relax: ["癒", "ほっこり", "のんびり", "まったり", "ゆるい", "和む", "日常"],
  think: ["考察", "伏線", "頭を使う", "謎解き", "ミステリー", "推理"],
  romance: ["恋", "ラブ", "胸キュン", "キュン"],
  dark: ["ダーク", "暗い", "鬱", "シリアス", "怖い", "ホラー"],
};

const includesAny = (text: string, words: string[]) => words.some((w) => text.includes(w));

function firstIndex(text: string, words: string[]): number {
  const found = words.map((w) => text.indexOf(w)).filter((i) => i >= 0);
  return found.length ? Math.min(...found) : -1;
}

function parseNegations(text: string): { rest: string; avoid: AvoidKey[]; lowEnergy: boolean } {
  const avoid = new Set<AvoidKey>();
  let lowEnergy = false;
  const rest = text.replace(NEGATION, (whole, chunk: string) => {
    const kept = chunk.match(CONJUNCTION)?.[0] ?? ""; // the part before the conjunction is not negated
    const negated = chunk.slice(kept.length);
    for (const key of AVOID_KEYS) if (includesAny(negated, AVOID_MAP[key].keywords)) avoid.add(key);
    if (includesAny(negated, HEAVY_WORDS)) lowEnergy = true;
    return `${kept}、`;
  });
  return { rest, avoid: [...avoid], lowEnergy };
}

function parseReference(text: string): { rest: string; referenceTitle: string | null } {
  const m = text.match(REFERENCE);
  if (!m) return { rest: text, referenceTitle: null };
  const name = m[1].replace(CONJUNCTION, "").trim();
  return { rest: text.replace(m[0], "、"), referenceTitle: name || null };
}

function parseCompany(text: string): { rest: string; company: Context["company"] } {
  let company: Context["company"] = null;
  let rest = text;
  for (const [value, words] of COMPANY) {
    if (includesAny(rest, words)) company ??= value;
    for (const w of words) rest = rest.replaceAll(w, "、");
  }
  return { rest, company };
}

function parseTimeBudget(text: string): number | null {
  const hours = text.match(/(\d+(?:\.\d+)?)\s*時間(半)?/);
  const minutes = text.match(/(\d+)\s*分/);
  if (!hours && !minutes) return null;
  const total = (hours ? Number(hours[1]) * 60 + (hours[2] ? 30 : 0) : 0) + (minutes ? Number(minutes[1]) : 0);
  return total > 0 ? Math.round(total) : null;
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
  const company = parseCompany(reference.rest);
  const rest = company.rest;

  const energy: Context["energy"] =
    negation.lowEnergy || includesAny(rest, ENERGY_LOW) ? "low" : includesAny(rest, ENERGY_HIGH) ? "high" : "mid";
  const moods = parseMoods(rest);

  // Zod fills the defaults (moods, …) and guarantees the same shape the LLM path produces.
  return ContextSchema.parse({
    moods: moods.length ? moods : undefined,
    energy,
    timeBudgetMin: parseTimeBudget(text),
    company: company.company,
    avoid: negation.avoid,
    referenceTitle: reference.referenceTitle,
    source: "rules",
  });
}
