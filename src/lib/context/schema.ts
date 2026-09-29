// src/lib/context/schema.ts
// Single source of truth for Context: what both parsers (LLM and rules) must produce.
import { z } from "zod";
import { AVOID_KEYS } from "@/data/avoidMap";
import { THEME_KEYS, type ThemeKey } from "@/data/themes";

export const MOODS = ["laugh", "cry", "thrill", "relax", "think", "romance", "dark"] as const;
export const ENERGIES = ["low", "mid", "high"] as const;
export const COMPANIES = ["alone", "partner", "friends", "family"] as const;
export const FORMAT_PREFS = ["any", "movie", "series"] as const;
export const ERAS = ["any", "recent", "classic"] as const;
export const POPULARITIES = ["any", "famous", "hidden-gem"] as const;
// "manual": built from quick picks, without parsing any text.
export const SOURCES = ["llm", "rules", "manual"] as const;
// recommend: a request we can answer. unclear: too vague / gibberish. off_topic: not about choosing anime.
export const INTENTS = ["recommend", "unclear", "off_topic"] as const;
export const MAX_INPUT_CHARS = 200;

export const MoodSchema = z.enum(MOODS);
export const AvoidKeySchema = z.enum(AVOID_KEYS);
export const ThemeKeySchema = z.enum(THEME_KEYS as [ThemeKey, ...ThemeKey[]]);

// Sentinel for "no mood stated". It is never used as a real preference: ranking ignores it (see rank.ts modes).
export const DEFAULT_MOODS = [{ type: "relax" as const, weight: 0.5 }];

export const ContextSchema = z.object({
  moods: z
    .array(z.object({ type: MoodSchema, weight: z.number().min(0).max(1) }))
    .min(1)
    .default(DEFAULT_MOODS),
  energy: z.enum(ENERGIES).default("mid"),
  timeBudgetMin: z.number().int().positive().nullable().default(null),
  company: z.enum(COMPANIES).nullable().default(null),
  avoid: z.array(AvoidKeySchema).default([]),
  referenceTitle: z.string().trim().min(1).nullable().default(null),
  format: z.enum(FORMAT_PREFS).default("any"), // hard filter
  completedOnly: z.boolean().default(false), // hard filter; binge (一気見) implies true
  era: z.enum(ERAS).default("any"), // soft: small bonus
  popularity: z.enum(POPULARITIES).default("any"), // soft: small bonus
  themes: z.array(ThemeKeySchema).default([]), // what it's about (src/data/themes.ts)
  intent: z.enum(INTENTS).default("recommend"),
  unmatched: z.array(z.string().trim().min(1).max(40)).max(3).default([]), // parts of the input that weren't understood
  titleSearch: z.boolean().default(false), // the input was just this title: show it first (set server-side)
  source: z.enum(SOURCES),
});

export type Mood = z.infer<typeof MoodSchema>;
export type Context = z.infer<typeof ContextSchema>;
