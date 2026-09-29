// src/lib/vector.ts
// The 8-dimension space shared by titles and queries. Order is fixed.

export const DIMENSIONS = ["laugh", "cry", "thrill", "relax", "think", "romance", "dark", "heavy"] as const;

export type Dimension = (typeof DIMENSIONS)[number];

// Everything except heavy. heavy is handled by separate energy terms, never by the cosine.
export const MOOD_DIMENSIONS = DIMENSIONS.filter((d) => d !== "heavy");
export type Vector = Record<Dimension, number>;

export const zeroVector = (): Vector =>
  Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Vector;

type Dims = readonly Dimension[];

const dotProduct = (a: Vector, b: Vector, dims: Dims = DIMENSIONS): number =>
  dims.reduce((sum, d) => sum + a[d] * b[d], 0);

const magnitude = (v: Vector, dims: Dims = DIMENSIONS): number => Math.sqrt(dotProduct(v, v, dims));

/**
 * Cosine similarity in 0..1 (all components are non-negative), over `dims` only.
 * Returns 0 if either vector is all zeros on those dims, e.g. a title with no mapped tags.
 */
export const cosineSimilarity = (a: Vector, b: Vector, dims: Dims = DIMENSIONS): number => {
  const magA = magnitude(a, dims);
  const magB = magnitude(b, dims);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b, dims) / (magA * magB);
};

export const addVectors = (a: Vector, b: Vector): Vector =>
  Object.fromEntries(DIMENSIONS.map((d) => [d, a[d] + b[d]])) as Vector;

export const scaleVector = (v: Vector, k: number): Vector =>
  Object.fromEntries(DIMENSIONS.map((d) => [d, v[d] * k])) as Vector;

/** Unit-length copy (or the zero vector unchanged). */
export const unitVector = (v: Vector): Vector => {
  const m = magnitude(v);
  return m === 0 ? v : scaleVector(v, 1 / m);
};
