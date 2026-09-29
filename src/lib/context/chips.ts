// src/lib/context/chips.ts
// Context ⇄ 「理解した内容」 chips. Every edit returns a new Context, which the server re-ranks without re-parsing.
// Labels are language-neutral (ChipLabel); the UI renders them per language. Pure and client-safe.
import { AVOID_KEYS } from "@/data/avoidMap";
import { THEME_KEYS } from "@/data/themes";
import type { ChipGroup, ChipLabel } from "@/lib/messages";
import { COMPANIES, DEFAULT_MOODS, MOODS, type Context } from "./schema";

type Edit = (c: Context) => Context;

export type Choice = { value: string; label: ChipLabel; apply: Edit };

export type Chip = {
  id: string;
  label: ChipLabel;
  remove: Edit;
  choices?: Choice[]; // editable in place (e.g. change 30分 → 60分)
  value?: string; // current choice value
};

export type AddOption = { id: string; group: ChipGroup; label: ChipLabel; apply: Edit };

export const TIME_CHOICES = [5, 10, 15, 30, 45, 60, 90, 120];

const isDefaultMoods = (c: Context) =>
  c.moods.length === 1 && c.moods[0].type === DEFAULT_MOODS[0].type && c.moods[0].weight === DEFAULT_MOODS[0].weight;

const timeChoices = (current: number | null): Choice[] =>
  [...new Set([...TIME_CHOICES, ...(current != null ? [current] : [])])]
    .sort((a, b) => a - b)
    .map((m) => ({ value: String(m), label: { kind: "time", minutes: m }, apply: (ctx) => ({ ...ctx, timeBudgetMin: m }) }));

const companyChoices: Choice[] = COMPANIES.map((co) => ({
  value: co,
  label: { kind: "company", company: co },
  apply: (ctx) => ({ ...ctx, company: co }),
}));

const energyChoices: Choice[] = (["low", "high"] as const).map((e) => ({
  value: e,
  label: { kind: "energy", energy: e },
  apply: (ctx) => ({ ...ctx, energy: e }),
}));

const formatChoices: Choice[] = (["movie", "series"] as const).map((f) => ({
  value: f,
  label: { kind: "format", format: f },
  apply: (ctx) => ({ ...ctx, format: f }),
}));

const eraChoices: Choice[] = (["recent", "classic"] as const).map((e) => ({
  value: e,
  label: { kind: "era", era: e },
  apply: (ctx) => ({ ...ctx, era: e }),
}));

const popularityChoices: Choice[] = (["famous", "hidden-gem"] as const).map((p) => ({
  value: p,
  label: { kind: "popularity", popularity: p },
  apply: (ctx) => ({ ...ctx, popularity: p }),
}));

export function contextToChips(c: Context): Chip[] {
  const chips: Chip[] = [];

  // Default moods weren't said by the user, so they get no chip.
  if (!isDefaultMoods(c)) {
    for (const m of c.moods) {
      // Swap for another mood not already chosen (e.g. 泣ける → 笑える).
      const swaps: Choice[] = MOODS.filter((x) => x === m.type || !c.moods.some((y) => y.type === x)).map((x) => ({
        value: x,
        label: { kind: "mood", mood: x },
        apply: (ctx) => ({ ...ctx, moods: ctx.moods.map((y) => (y.type === m.type ? { ...y, type: x } : y)) }),
      }));
      chips.push({
        id: `mood:${m.type}`,
        label: { kind: "mood", mood: m.type },
        value: m.type,
        choices: swaps,
        remove: (ctx) => {
          const moods = ctx.moods.filter((x) => x.type !== m.type);
          return { ...ctx, moods: moods.length ? moods : DEFAULT_MOODS };
        },
      });
    }
  }
  for (const k of c.themes) {
    chips.push({ id: `theme:${k}`, label: { kind: "theme", theme: k }, remove: (ctx) => ({ ...ctx, themes: ctx.themes.filter((x) => x !== k) }) });
  }
  if (c.energy !== "mid") {
    chips.push({
      id: "energy",
      label: { kind: "energy", energy: c.energy },
      value: c.energy,
      choices: energyChoices,
      remove: (ctx) => ({ ...ctx, energy: "mid" }),
    });
  }
  if (c.timeBudgetMin != null) {
    chips.push({
      id: "time",
      label: { kind: "time", minutes: c.timeBudgetMin },
      value: String(c.timeBudgetMin),
      choices: timeChoices(c.timeBudgetMin),
      remove: (ctx) => ({ ...ctx, timeBudgetMin: null }),
    });
  }
  if (c.company) {
    chips.push({
      id: "company",
      label: { kind: "company", company: c.company },
      value: c.company,
      choices: companyChoices,
      remove: (ctx) => ({ ...ctx, company: null }),
    });
  }
  if (c.format !== "any") {
    chips.push({
      id: "format",
      label: { kind: "format", format: c.format },
      value: c.format,
      choices: formatChoices,
      remove: (ctx) => ({ ...ctx, format: "any" }),
    });
  }
  if (c.completedOnly) {
    chips.push({ id: "completed", label: { kind: "completed" }, remove: (ctx) => ({ ...ctx, completedOnly: false }) });
  }
  if (c.era !== "any") {
    chips.push({ id: "era", label: { kind: "era", era: c.era }, value: c.era, choices: eraChoices, remove: (ctx) => ({ ...ctx, era: "any" }) });
  }
  if (c.popularity !== "any") {
    chips.push({
      id: "popularity",
      label: { kind: "popularity", popularity: c.popularity },
      value: c.popularity,
      choices: popularityChoices,
      remove: (ctx) => ({ ...ctx, popularity: "any" }),
    });
  }
  for (const key of c.avoid) {
    chips.push({
      id: `avoid:${key}`,
      label: { kind: "avoid", key },
      remove: (ctx) => ({ ...ctx, avoid: ctx.avoid.filter((k) => k !== key) }),
    });
  }
  if (c.referenceTitle) {
    chips.push({
      id: "reference",
      label: { kind: "reference", title: c.referenceTitle },
      remove: (ctx) => ({ ...ctx, referenceTitle: null }),
    });
  }
  return chips;
}

/** Conditions that can be added to the current Context (for the 「＋条件を追加」 menu). */
export function addOptions(c: Context): AddOption[] {
  const present = new Set(isDefaultMoods(c) ? [] : c.moods.map((m) => m.type));
  const options: AddOption[] = MOODS.filter((m) => !present.has(m)).map((m) => ({
    id: `mood:${m}`,
    group: "mood",
    label: { kind: "mood", mood: m },
    apply: (ctx) => ({ ...ctx, moods: [...(isDefaultMoods(ctx) ? [] : ctx.moods), { type: m, weight: 1 }] }),
  }));
  for (const k of THEME_KEYS.filter((x) => !c.themes.includes(x))) {
    options.push({ id: `theme:${k}`, group: "themes", label: { kind: "theme", theme: k }, apply: (ctx) => ({ ...ctx, themes: [...ctx.themes, k] }) });
  }
  if (c.energy === "mid") {
    for (const ch of energyChoices) options.push({ id: `energy:${ch.value}`, group: "energy", label: ch.label, apply: ch.apply });
  }
  if (c.timeBudgetMin == null) {
    for (const ch of timeChoices(null)) options.push({ id: `time:${ch.value}`, group: "time", label: ch.label, apply: ch.apply });
  }
  if (c.company == null) {
    for (const ch of companyChoices) options.push({ id: `company:${ch.value}`, group: "company", label: ch.label, apply: ch.apply });
  }
  const filters: Choice[] = [
    ...(c.format === "any" ? formatChoices : []),
    ...(c.completedOnly ? [] : [{ value: "completed", label: { kind: "completed" } as const, apply: (ctx: Context) => ({ ...ctx, completedOnly: true }) }]),
    ...(c.era === "any" ? eraChoices : []),
    ...(c.popularity === "any" ? popularityChoices : []),
  ];
  for (const ch of filters) options.push({ id: `filter:${ch.value}`, group: "filters", label: ch.label, apply: ch.apply });
  for (const key of AVOID_KEYS.filter((k) => !c.avoid.includes(k))) {
    options.push({ id: `avoid:${key}`, group: "avoid", label: { kind: "avoid", key }, apply: (ctx) => ({ ...ctx, avoid: [...ctx.avoid, key] }) });
  }
  return options;
}
