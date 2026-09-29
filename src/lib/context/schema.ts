// src/lib/context/schema.ts
// Single source of truth for Context: what both parsers (LLM and rules) must produce.
import { z } from "zod";
import { AVOID_KEYS } from "@/data/avoidMap";

export const MOODS = ["laugh", "cry", "thrill", "relax", "think", "romance", "dark"] as const;
export const ENERGIES = ["low", "mid", "high"] as const;
export const COMPANIES = ["alone", "partner", "friends", "family"] as const;

export const MoodSchema = z.enum(MOODS);
export const AvoidKeySchema = z.enum(AVOID_KEYS);

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
  source: z.enum(["llm", "rules"]),
});

export type Mood = z.infer<typeof MoodSchema>;
export type Context = z.infer<typeof ContextSchema>;
