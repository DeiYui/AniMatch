// src/app/page.tsx
"use client"; // Required for React State (Interactivity)

import { useState } from "react";
import { animeList } from "@/data/animeList";
import { getRecommendations } from "@/utils/engine";
import { UserPreference, Anime } from "@/types";

export default function Home() {
  // 1. STATE MANAGEMENT
  // Tracks the user's current "Mood Vector" (Initialize all to 0.5 - Neutral)
  const [preferences, setPreferences] = useState<UserPreference>({
    romance: 0.5,
    action: 0.5,
    drama: 0.5,
    complexity: 0.5,
    visuals: 0.5,
  });

  // Tracks the recommendation results returned by the AI Engine
  const [results, setResults] = useState<(Anime & { score: number })[]>([]);

  // Configuration for the sliders (Labels and Keys)
  const featuresList = [
    { key: "romance", label: "Romance (Love & Emotion)" },
    { key: "action", label: "Action (Intensity & Fights)" },
    { key: "drama", label: "Drama (Sadness & Tears)" },
    { key: "complexity", label: "Complexity (Brain-twisting)" },
    { key: "visuals", label: "Visuals (Art Quality)" },
  ] as const;

  // 2. HELPER FUNCTIONS
  
  /**
   * SEMANTIC LABEL MAPPING
   * Maps numerical vector values (0.0 - 1.0) to human-readable labels.
   * Matches the slider step of 0.25 for consistency.
   */
  const getIntensityLabel = (value: number) => {
    if (value <= 0.0) return { text: "None / Low", color: "text-gray-500" };      // 0.0
    if (value <= 0.25) return { text: "Mild", color: "text-blue-300" };           // 0.25
    if (value <= 0.5) return { text: "Balanced", color: "text-blue-400" };        // 0.5
    if (value <= 0.75) return { text: "High", color: "text-purple-400" };         // 0.75
    return { text: "Intense / Max", color: "text-purple-300 font-bold" };         // 1.0
  };

  // Updates a specific dimension of the user's preference vector
  const handleSliderChange = (key: keyof UserPreference, value: number) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Triggers the Recommendation Engine
  const handleRecommend = () => {
    console.log("Current User Vector:", preferences); // Log for debugging demo
    
    // Call the core logic function from utils/engine.ts
    // We request the Top 3 matches
    const topPicks = getRecommendations(preferences, animeList, 3);
    
    setResults(topPicks);
  };

  // 3. UI RENDERING
  return (
    <main className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            AniMatch AI
          </h1>
          <p className="text-gray-400 mt-2">
            Context-Aware Anime Recommender System using Vector Embeddings.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* LEFT COLUMN: User Input (The Context Vector) */}
          <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 h-fit">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400 border-b border-gray-700 pb-2">
              1. Define Your Context
            </h2>
            <div className="space-y-8">
              {featuresList.map((feature) => {
                const intensity = getIntensityLabel(preferences[feature.key]);
                
                return (
                  <div key={feature.key}>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-sm font-medium text-gray-300">
                        {feature.label}
                      </label>
                      {/* Dynamic Semantic Label */}
                      <span className={`text-sm ${intensity.color} transition-colors duration-300 font-medium`}>
                        {intensity.text}
                      </span>
                    </div>
                    
                    {/* QUANTIZED SLIDER: Step 0.25 forces discrete choices */}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.25" 
                      value={preferences[feature.key]}
                      onChange={(e) =>
                        handleSliderChange(
                          feature.key as keyof UserPreference,
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                    />
                    
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRecommend}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg active:scale-95"
            >
              Get Recommendations
            </button>
          </section>

          {/* RIGHT COLUMN: Results (The Output) */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-purple-400 border-b border-gray-700 pb-2">
              2. Top Recommendations
            </h2>
            
            {results.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-6 text-gray-500 bg-gray-800/50">
                <span className="text-4xl mb-2">waiting...</span>
                <p className="text-center text-sm">Adjust sliders and click "Get Recommendations" to see the AI magic.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((anime, index) => (
                  <div
                    key={anime.id}
                    className="flex bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 hover:border-purple-500 transition-colors duration-300 animate-fadeIn"
                  >
                    {/* Poster Image */}
                    <div className="w-24 bg-gray-700 flex-shrink-0 relative overflow-hidden">
                        {/* Note: Use standard img tag for simplicity in this demo */}
                        <img 
                            src={anime.coverImage} 
                            alt={anime.title} 
                            className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                    
                    {/* Content Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg text-white leading-tight">
                                <span className="text-purple-400 mr-2">#{index + 1}</span>
                                {anime.title}
                            </h3>
                            <span className="bg-purple-900/80 text-purple-200 text-xs font-mono px-2 py-1 rounded ml-2 whitespace-nowrap">
                              {(anime.score * 100).toFixed(0)}% Match
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                            {anime.description}
                        </p>
                      </div>
                      
                      {/* Visualizing Why It Matched (Mini Bars) */}
                      <div className="mt-3">
                         <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Vector Profile:</p>
                         <div className="flex gap-1 h-1.5 w-full">
                            {/* Color-coded bars representing the vector */}
                            <div className="bg-red-500 rounded-l" style={{ width: `${anime.features.romance * 20}%` }} title="Romance" />
                            <div className="bg-blue-500" style={{ width: `${anime.features.action * 20}%` }} title="Action" />
                            <div className="bg-yellow-500" style={{ width: `${anime.features.drama * 20}%` }} title="Drama" />
                            <div className="bg-green-500" style={{ width: `${anime.features.complexity * 20}%` }} title="Complexity" />
                            <div className="bg-pink-500 rounded-r" style={{ width: `${anime.features.visuals * 20}%` }} title="Visuals" />
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}