// src/lib/context/chips.ts
// Context → 「理解した内容」 chips. Removing a chip returns a new Context, which is re-ranked without re-parsing.
import { AVOID_MAP } from "@/data/avoidMap";
import { COMPANY_LABELS, ENERGY_LABELS, MOOD_LABELS } from "@/lib/labels";
import { DEFAULT_MOODS, type Context } from "./schema";

export type Chip = { id: string; label: string; remove: (c: Context) => Context };

const isDefaultMoods = (c: Context) =>
  c.moods.length === 1 && c.moods[0].type === DEFAULT_MOODS[0].type && c.moods[0].weight === DEFAULT_MOODS[0].weight;

export function contextToChips(c: Context): Chip[] {
  const chips: Chip[] = [];

  // Default moods weren't said by the user, so they get no chip.
  if (!isDefaultMoods(c)) {
    for (const m of c.moods) {
      chips.push({
        id: `mood:${m.type}`,
        label: MOOD_LABELS[m.type],
        remove: (ctx) => {
          const moods = ctx.moods.filter((x) => x.type !== m.type);
          return { ...ctx, moods: moods.length ? moods : DEFAULT_MOODS };
        },
      });
    }
  }
  const energy = ENERGY_LABELS[c.energy];
  if (energy) chips.push({ id: "energy", label: energy, remove: (ctx) => ({ ...ctx, energy: "mid" }) });
  if (c.timeBudgetMin != null) {
    chips.push({ id: "time", label: `${c.timeBudgetMin}分`, remove: (ctx) => ({ ...ctx, timeBudgetMin: null }) });
  }
  if (c.company) chips.push({ id: "company", label: COMPANY_LABELS[c.company], remove: (ctx) => ({ ...ctx, company: null }) });
  for (const key of c.avoid) {
    chips.push({
      id: `avoid:${key}`,
      label: `${AVOID_MAP[key].label}なし`,
      remove: (ctx) => ({ ...ctx, avoid: ctx.avoid.filter((k) => k !== key) }),
    });
  }
  if (c.referenceTitle) {
    chips.push({ id: "reference", label: `『${c.referenceTitle}』みたいな`, remove: (ctx) => ({ ...ctx, referenceTitle: null }) });
  }
  return chips;
}
