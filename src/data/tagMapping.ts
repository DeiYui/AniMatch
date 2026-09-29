// src/data/tagMapping.ts
// THE place where human judgment lives: AniList genre/tag → partial weights per dimension.
//
// How it's used (src/lib/vectorize.ts):
//   raw[dim]   = Σ weight × rank/100   (genres count as rank GENRE_RANK, tags below MIN_TAG_RANK are ignored)
//   final[dim] = clamp(raw[dim] / p99 of that dim over the dataset, 0, 1)
//   heavy      = 0.7 × tag part + 0.3 × runtime part
//
// Weights are relative within a row. Negative weights pull a dimension down (e.g. Iyashikei → less heavy).
// Anything not listed here has no effect on vectors. Broad genres like Fantasy / Supernatural are left out on purpose.
// Ecchi / harem / sexual tags are deliberately NOT mapped, so they never raise laugh or romance (demo audience: managers).
import type { Dimension } from "@/lib/vector";

export type Weights = Partial<Record<Dimension, number>>;

export const GENRE_WEIGHTS: Record<string, Weights> = {
  Comedy: { laugh: 1.0 },
  Drama: { cry: 0.6, heavy: 0.3 },
  Romance: { romance: 1.0 },
  Action: { thrill: 1.0 },
  Adventure: { thrill: 0.5 },
  "Slice of Life": { relax: 0.8, heavy: -0.2 },
  Mystery: { think: 0.8, thrill: 0.3 },
  Psychological: { think: 0.7, dark: 0.4, heavy: 0.4 },
  Thriller: { thrill: 0.8, dark: 0.4 },
  Horror: { dark: 1.0, thrill: 0.4 },
  "Sci-Fi": { think: 0.4 },
  Sports: { thrill: 0.7 },
  Mecha: { thrill: 0.5 },
};

export const TAG_WEIGHTS: Record<string, Weights> = {
  // --- laugh ---
  Slapstick: { laugh: 1.0 },
  "Surreal Comedy": { laugh: 1.0 },
  Parody: { laugh: 1.0 },
  Satire: { laugh: 0.6, think: 0.3 },
  Chibi: { laugh: 0.4 },
  Manzai: { laugh: 1.0 },

  // --- cry ---
  Tragedy: { cry: 0.5, dark: 0.5, heavy: 0.3 }, // very common tag (~37% of titles), so kept moderate
  "Coming of Age": { cry: 0.4 },
  "Found Family": { cry: 0.4, relax: 0.2 },
  Afterlife: { cry: 0.5 },
  Disability: { cry: 0.4, heavy: 0.2 },
  Parenthood: { cry: 0.4, relax: 0.3 },
  Rehabilitation: { cry: 0.3 },
  Orphan: { cry: 0.3 },

  // --- thrill ---
  "Super Power": { thrill: 0.6 },
  Swordplay: { thrill: 0.6 },
  "Martial Arts": { thrill: 0.7 },
  Superhero: { thrill: 0.5 },
  Kaiju: { thrill: 0.5 },
  "Battle Royale": { thrill: 0.8, dark: 0.4 },
  "Death Game": { thrill: 0.7, dark: 0.5, think: 0.3 },
  Survival: { thrill: 0.6, dark: 0.3 },
  War: { thrill: 0.5, dark: 0.5, heavy: 0.4 },
  Military: { thrill: 0.4 },
  Guns: { thrill: 0.4 },
  Assassins: { thrill: 0.4, dark: 0.2 },

  // --- relax ---
  Iyashikei: { relax: 1.0, heavy: -0.5 },
  "Cute Girls Doing Cute Things": { relax: 0.8, laugh: 0.3, heavy: -0.3 },
  "Cute Boys Doing Cute Things": { relax: 0.8, laugh: 0.3, heavy: -0.3 },
  Episodic: { relax: 0.4, heavy: -0.3 },
  Food: { relax: 0.5 },
  "Outdoor Activities": { relax: 0.6 },
  Camping: { relax: 0.8 },
  "Family Life": { relax: 0.5 },
  Agriculture: { relax: 0.5 },
  Rural: { relax: 0.4 },
  Travel: { relax: 0.3 },
  Animals: { relax: 0.3 },

  // --- think ---
  Philosophy: { think: 0.8, heavy: 0.3 },
  Conspiracy: { think: 0.7 },
  Detective: { think: 0.7 },
  Politics: { think: 0.6, heavy: 0.3 },
  Economics: { think: 0.6 },
  Espionage: { think: 0.5, thrill: 0.3 },
  "Time Loop": { think: 0.6 },
  "Time Manipulation": { think: 0.5 },
  "Achronological Order": { think: 0.6, heavy: 0.4 },
  "Memory Manipulation": { think: 0.4 },
  "Artificial Intelligence": { think: 0.4 },
  Dystopian: { think: 0.4, dark: 0.4 },
  Crime: { think: 0.3, dark: 0.2 },

  // --- romance ---
  "Love Triangle": { romance: 0.7, cry: 0.2 },
  "Unrequited Love": { romance: 0.5, cry: 0.5 },
  "Fake Relationship": { romance: 0.6, laugh: 0.3 },
  Marriage: { romance: 0.5 },
  Cohabitation: { romance: 0.3 },
  Yuri: { romance: 0.5 },
  "Boys' Love": { romance: 0.5 },

  // --- dark ---
  Gore: { dark: 0.8 },
  "Body Horror": { dark: 0.8 },
  "Cosmic Horror": { dark: 0.8, think: 0.3 },
  Torture: { dark: 0.8 },
  Cannibalism: { dark: 0.8 },
  Rape: { dark: 0.9, heavy: 0.3 },
  Suicide: { dark: 0.6, cry: 0.3, heavy: 0.3 },
  "Human Experimentation": { dark: 0.6 },
  Revenge: { dark: 0.5 },
  Cult: { dark: 0.5 },
  Slavery: { dark: 0.5 },
  Psychosexual: { dark: 0.5 },
  Terrorism: { dark: 0.4 },
  "Post-Apocalyptic": { dark: 0.4 },
  Noir: { dark: 0.4 },
  Drugs: { dark: 0.3 },

  // --- heavy (besides the heavy weights above) ---
  "Ensemble Cast": { heavy: 0.3 },
  "Time Skip": { heavy: 0.2 },
};
