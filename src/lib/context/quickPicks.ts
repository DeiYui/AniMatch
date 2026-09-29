// src/lib/context/quickPicks.ts
// Quick picks under the input: one tap toggles a condition directly on the Context (no LLM call).
// Typing is for nuance, picks are for speed; both produce the same Context. Pure and client-safe.
import type { AvoidKey } from "@/data/avoidMap";
import type { PickGroup, PickLabel } from "@/lib/messages";
import { ContextSchema, DEFAULT_MOODS, MOODS, type Context } from "./schema";

export type QuickPick = {
  id: string;
  group: PickGroup;
  label: PickLabel;
  selected: (c: Context) => boolean;
  toggle: (c: Context) => Context;
};

export const PICK_TIMES = [15, 30, 60];
// Avoid keys offered in 「こだわり条件」, most requested first. (Ecchi is already excluded by default.)
export const PICK_AVOID: AvoidKey[] = ["horror", "gore", "tragedy", "long-series", "romance", "sports", "mecha", "isekai", "harem", "idol-music", "war", "cgi"];

/** Groups behind the 「こだわり条件」 button; its badge counts the selected picks in them. */
export const PREF_GROUPS: QuickPick["group"][] = ["filters", "avoid"];
export const activePrefCount = (c: Context) => QUICK_PICKS.filter((p) => PREF_GROUPS.includes(p.group) && p.selected(c)).length;
export const clearPrefs = (c: Context): Context => ({ ...c, format: "any", completedOnly: false, era: "any", popularity: "any", avoid: [] });

/** Starting point when the user taps a pick before typing anything. */
export const emptyContext = (): Context => ContextSchema.parse({ source: "manual" });

const isDefaultMoods = (c: Context) => c.moods.length === 1 && c.moods[0].type === "relax" && c.moods[0].weight === 0.5;
const hasMood = (c: Context, m: Context["moods"][number]["type"]) => !isDefaultMoods(c) && c.moods.some((x) => x.type === m);
const isBinge = (c: Context) => c.energy === "high" && c.completedOnly && c.timeBudgetMin == null;

export const QUICK_PICKS: QuickPick[] = [
  ...MOODS.map(
    (m): QuickPick => ({
      id: `mood:${m}`,
      group: "mood",
      label: { kind: "mood", mood: m },
      selected: (c) => hasMood(c, m),
      toggle: (c) => {
        if (hasMood(c, m)) {
          const moods = c.moods.filter((x) => x.type !== m);
          return { ...c, moods: moods.length ? moods : DEFAULT_MOODS };
        }
        return { ...c, moods: [...(isDefaultMoods(c) ? [] : c.moods), { type: m, weight: 1 }] };
      },
    }),
  ),
  ...PICK_TIMES.map(
    (min): QuickPick => ({
      id: `time:${min}`,
      group: "time",
      label: { kind: "time", minutes: min },
      selected: (c) => c.timeBudgetMin === min,
      // Choosing a time ends binge mode; tapping the selected time clears it.
      toggle: (c) =>
        c.timeBudgetMin === min
          ? { ...c, timeBudgetMin: null }
          : { ...c, timeBudgetMin: min, ...(isBinge(c) ? { energy: "mid" as const, completedOnly: false } : {}) },
    }),
  ),
  {
    id: "time:binge",
    group: "time",
    label: { kind: "binge" },
    selected: isBinge,
    // 週末一気見 = no time limit, high energy, completed titles only.
    toggle: (c) =>
      isBinge(c) ? { ...c, energy: "mid", completedOnly: false } : { ...c, timeBudgetMin: null, energy: "high", completedOnly: true },
  },
  ...(["alone", "partner", "friends", "family"] as const).map(
    (co): QuickPick => ({
      id: `company:${co}`,
      group: "company",
      label: { kind: "company", company: co },
      selected: (c) => c.company === co,
      toggle: (c) => ({ ...c, company: c.company === co ? null : co }),
    }),
  ),
  ...(["movie", "series"] as const).map(
    (f): QuickPick => ({
      id: `format:${f}`,
      group: "filters",
      label: { kind: "format", format: f },
      selected: (c) => c.format === f,
      toggle: (c) => ({ ...c, format: c.format === f ? "any" : f }),
    }),
  ),
  {
    id: "completed",
    group: "filters",
    label: { kind: "completed" },
    selected: (c) => c.completedOnly,
    toggle: (c) => ({ ...c, completedOnly: !c.completedOnly }),
  },
  ...(["recent", "classic"] as const).map(
    (e): QuickPick => ({
      id: `era:${e}`,
      group: "filters",
      label: { kind: "era", era: e },
      selected: (c) => c.era === e,
      toggle: (c) => ({ ...c, era: c.era === e ? "any" : e }),
    }),
  ),
  ...(["famous", "hidden-gem"] as const).map(
    (p): QuickPick => ({
      id: `popularity:${p}`,
      group: "filters",
      label: { kind: "popularity", popularity: p },
      selected: (c) => c.popularity === p,
      toggle: (c) => ({ ...c, popularity: c.popularity === p ? "any" : p }),
    }),
  ),
  ...PICK_AVOID.map(
    (key): QuickPick => ({
      id: `avoid:${key}`,
      group: "avoid",
      label: { kind: "avoid", key },
      selected: (c) => c.avoid.includes(key),
      toggle: (c) => ({ ...c, avoid: c.avoid.includes(key) ? c.avoid.filter((k) => k !== key) : [...c.avoid, key] }),
    }),
  ),
];
