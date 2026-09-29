// src/lib/vector.ts
// The 8-dimension space shared by titles and queries. Order is fixed.

export const DIMENSIONS = ["laugh", "cry", "thrill", "relax", "think", "romance", "dark", "heavy"] as const;

export type Dimension = (typeof DIMENSIONS)[number];
export type Vector = Record<Dimension, number>;

export const zeroVector = (): Vector =>
  Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Vector;

const dotProduct = (a: Vector, b: Vector): number =>
  DIMENSIONS.reduce((sum, d) => sum + a[d] * b[d], 0);

const magnitude = (v: Vector): number => Math.sqrt(dotProduct(v, v));

/**
 * Cosine similarity in 0..1 (all components are non-negative).
 * Returns 0 if either vector is all zeros, e.g. a title with no mapped tags.
 */
export const cosineSimilarity = (a: Vector, b: Vector): number => {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
};
