// src/lib/context/merge.ts
// Typed text + quick picks chosen before typing → one Context.
// What the sentence says wins; picks fill in what it didn't mention. Lists (moods, avoid) are combined.
import type { Context } from "./schema";

const isDefaultMoods = (c: Context) => c.moods.length === 1 && c.moods[0].type === "relax" && c.moods[0].weight === 0.5;

/** True if the Context asks for anything at all (a mood, theme, constraint or reference). */
export function hasAnyCondition(c: Context): boolean {
  return (
    !isDefaultMoods(c) ||
    c.themes.length > 0 ||
    c.energy !== "mid" ||
    c.timeBudgetMin != null ||
    c.company != null ||
    c.avoid.length > 0 ||
    c.referenceTitle != null ||
    c.format !== "any" ||
    c.completedOnly ||
    c.era !== "any" ||
    c.popularity !== "any"
  );
}

export function mergeContexts(parsed: Context, picks: Context): Context {
  const moods = isDefaultMoods(parsed)
    ? picks.moods
    : isDefaultMoods(picks)
      ? parsed.moods
      : [...parsed.moods, ...picks.moods.filter((m) => !parsed.moods.some((p) => p.type === m.type))];
  return {
    moods,
    energy: parsed.energy !== "mid" ? parsed.energy : picks.energy,
    timeBudgetMin: parsed.timeBudgetMin ?? picks.timeBudgetMin,
    company: parsed.company ?? picks.company,
    avoid: [...new Set([...parsed.avoid, ...picks.avoid])],
    referenceTitle: parsed.referenceTitle ?? picks.referenceTitle,
    format: parsed.format !== "any" ? parsed.format : picks.format,
    completedOnly: parsed.completedOnly || picks.completedOnly,
    era: parsed.era !== "any" ? parsed.era : picks.era,
    popularity: parsed.popularity !== "any" ? parsed.popularity : picks.popularity,
    themes: [...new Set([...parsed.themes, ...picks.themes])],
    // Picks make any request answerable (e.g. picked 泣きたい, then typed something unreadable).
    intent: parsed.intent === "unclear" && hasAnyCondition(picks) ? "recommend" : parsed.intent,
    unmatched: parsed.unmatched,
    titleSearch: parsed.titleSearch,
    source: parsed.source,
  };
}
