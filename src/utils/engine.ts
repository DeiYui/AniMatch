// src/utils/engine.ts
import { Anime, AnimeFeatures, UserPreference } from "@/types";

/**
 * Calculates the Dot Product of two vectors.
 * Formula: A . B = (A1 * B1) + (A2 * B2) + ... + (An * Bn)
 */
const dotProduct = (vecA: AnimeFeatures, vecB: AnimeFeatures): number => {
  return (
    vecA.romance * vecB.romance +
    vecA.action * vecB.action +
    vecA.drama * vecB.drama +
    vecA.complexity * vecB.complexity +
    vecA.visuals * vecB.visuals
  );
};

/**
 * Calculates the Magnitude (Length) of a vector.
 * Formula: ||A|| = sqrt(A1^2 + A2^2 + ... + An^2)
 */
const magnitude = (vec: AnimeFeatures): number => {
  return Math.sqrt(
    Math.pow(vec.romance, 2) +
    Math.pow(vec.action, 2) +
    Math.pow(vec.drama, 2) +
    Math.pow(vec.complexity, 2) +
    Math.pow(vec.visuals, 2)
  );
};

/**
 * Calculates Cosine Similarity between two feature vectors.
 * Returns a value between -1.0 and 1.0 (1.0 means identical direction).
 * Formula: Similarity = (A . B) / (||A|| * ||B||)
 */
export const cosineSimilarity = (vecA: AnimeFeatures, vecB: AnimeFeatures): number => {
  const dot = dotProduct(vecA, vecB);
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);

  // Prevent division by zero
  if (magA === 0 || magB === 0) return 0;

  return dot / (magA * magB);
};

/**
 * The main recommendation function.
 * 1. Iterates through the database.
 * 2. Calculates similarity score for each anime against user preference.
 * 3. Sorts by score descending.
 * 4. Returns top K results.
 */
export const getRecommendations = (
  userPref: UserPreference,
  database: Anime[],
  topK: number = 3
): (Anime & { score: number })[] => {
  
  const scoredAnime = database.map((anime) => {
    const score = cosineSimilarity(userPref, anime.features);
    return { ...anime, score };
  });

  // Sort: Highest score first
  scoredAnime.sort((a, b) => b.score - a.score);

  return scoredAnime.slice(0, topK);
};