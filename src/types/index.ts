// src/types/index.ts

// The 5 core dimensions for the Vector Space Model (Range: 0.0 -> 1.0)
export interface AnimeFeatures {
  romance: number;    // Love, emotional connection
  action: number;     // Fights, pacing, intensity
  drama: number;      // Sadness, emotional weight
  complexity: number; // Plot depth, "brain-twisting" factor
  visuals: number;    // Animation quality, art style
}

export interface Anime {
  id: string;
  title: string;
  description: string;
  coverImage: string; // URL for UI display
  features: AnimeFeatures; // The Feature Vector
}

// User input is also a vector in the same space
export type UserPreference = AnimeFeatures;