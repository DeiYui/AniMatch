// src/app/page.tsx
"use client";

import { useState } from "react";
import { animeList } from "@/data/animeList";
import { getRecommendations } from "@/utils/engine";
import { UserPreference, Anime } from "@/types";

export default function Home() {
  // --- STATE ---
  const [preferences, setPreferences] = useState<UserPreference>({
    romance: 0.5,
    action: 0.5,
    drama: 0.5,
    complexity: 0.5,
    visuals: 0.5,
  });

  // Removed 'reason' from state type since we deleted the Explainable AI part
  const [results, setResults] = useState<(Anime & { score: number })[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // --- CONFIG ---
  const featuresList = [
    { key: "romance", label: "Romance (Love)" },
    { key: "action", label: "Action (Fights)" },
    { key: "drama", label: "Drama (Tears)" },
    { key: "complexity", label: "Complexity (Plot)" },
    { key: "visuals", label: "Visuals (Art)" },
  ] as const;

  // --- HELPERS ---
  const getIntensityLabel = (value: number) => {
    if (value <= 0.0) return { text: "None", color: "text-gray-500", barColor: "bg-gray-700" };
    if (value <= 0.25) return { text: "Mild", color: "text-blue-300", barColor: "bg-blue-900" };
    if (value <= 0.5) return { text: "Balanced", color: "text-green-400", barColor: "bg-green-600" };
    if (value <= 0.75) return { text: "High", color: "text-purple-400", barColor: "bg-purple-600" };
    return { text: "Max / Intense", color: "text-pink-500 font-bold", barColor: "bg-gradient-to-r from-purple-500 to-pink-500" };
  };

  const handleSliderChange = (key: keyof UserPreference, value: number) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSurpriseMe = () => {
    setIsAnimating(true);
    const randomStep = () => Math.floor(Math.random() * 5) * 0.25;
    
    const newPrefs = {
      romance: randomStep(),
      action: randomStep(),
      drama: randomStep(),
      complexity: randomStep(),
      visuals: randomStep(),
    };

    setPreferences(newPrefs);
    
    setTimeout(() => {
        // Just get recommendations, no reasoning logic
        const recs = getRecommendations(newPrefs, animeList, 3);
        setResults(recs);
        setIsAnimating(false);
    }, 400);
  };

  const handleRecommend = () => {
    const topPicks = getRecommendations(preferences, animeList, 3);
    setResults(topPicks);
  };

  // --- RENDER ---
  return (
    // ✨ Dark Luxury Background
    <main className="min-h-screen bg-gray-950 text-white p-6 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
      
      {/* 🌌 AMBIENT BACKGROUND LIGHTS */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto"> 
        
        {/* HEADER: Clean & Simple */}
        <header className="mb-12 text-center">
          <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tighter drop-shadow-2xl">
            AniMatch AI
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: INPUTS (4 Columns) */}
          <section className="lg:col-span-4 bg-[#111]/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800 shadow-2xl h-fit sticky top-6">
            <div className="flex flex-col gap-4 mb-6 border-b border-gray-800 pb-4">
                {/* 😺 Updated Title */}
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   😺 What is your mood today?
                </h2>
                
                {/* 🎲 SURPRISE ME BUTTON */}
                <button 
                    onClick={handleSurpriseMe}
                    className="w-full text-sm font-medium bg-gray-800 hover:bg-gray-700 hover:text-white text-purple-300 px-4 py-3 rounded-xl transition-all border border-gray-700 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/20 group"
                >
                    <span className="text-lg group-hover:rotate-12 transition-transform">🎲</span> 
                    Surprise Me (Random)
                </button>
            </div>

            <div className={`space-y-7 ${isAnimating ? 'opacity-50 pointer-events-none' : ''} transition-opacity`}>
              {featuresList.map((feature) => {
                const info = getIntensityLabel(preferences[feature.key]);
                return (
                  <div key={feature.key} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">
                        {feature.label}
                      </label>
                      <span className={`text-xs ${info.color} font-mono`}>
                        {info.text}
                      </span>
                    </div>
                    
                    <div className="relative h-4 w-full flex items-center">
                        <div className="absolute w-full h-2 bg-gray-900 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className={`h-full ${info.barColor} transition-all duration-300 ease-out`} 
                                style={{ width: `${preferences[feature.key] * 100}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min="0" max="1" step="0.25"
                            value={preferences[feature.key]}
                            onChange={(e) => handleSliderChange(feature.key as keyof UserPreference, parseFloat(e.target.value))}
                            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div 
                            className="absolute h-5 w-5 bg-white rounded-full shadow-lg border-2 border-gray-800 pointer-events-none transition-all duration-300"
                            style={{ left: `calc(${preferences[feature.key] * 100}% - 10px)` }}
                        />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRecommend}
              className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-purple-900/30 text-lg"
            >
              Find My Match ✨
            </button>
          </section>

          {/* RIGHT: RESULTS (8 Columns) */}
          <section className="lg:col-span-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-2">
              🎯 Top Picks
            </h2>

            {results.length === 0 ? (
              <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl text-gray-600 bg-[#111]/50">
                <div className="text-7xl mb-6 opacity-20 animate-pulse">📡</div>
                <p className="text-xl font-medium text-gray-400">Waiting for context signal...</p>
                <p className="text-sm mt-2 max-w-xs text-center">Adjust the sliders or roll the dice.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {results.map((anime, index) => {
                  const isTopPick = index === 0;

                  return (
                    <div
                      key={anime.id}
                      className={`
                        group relative rounded-3xl flex gap-6 border transition-all duration-500
                        ${isTopPick 
                            ? 'bg-gradient-to-r from-[#1a1a1a] to-[#222] border-yellow-500/50 p-6 shadow-2xl shadow-yellow-900/10 scale-[1.02]' 
                            : 'bg-[#111] border-gray-800 p-4 hover:border-gray-600'
                        }
                      `}
                    >
                      {/* 👑 CROWN & RANK BADGE */}
                      <div className={`
                        absolute -top-4 -left-4 w-10 h-10 font-bold rounded-full flex items-center justify-center shadow-lg border-4 border-[#0a0a0a] z-20
                        ${isTopPick ? 'bg-yellow-500 text-black text-xl' : 'bg-gray-700 text-white'}
                      `}>
                          {isTopPick ? '1' : index + 1}
                      </div>

                      {/* 👑 Crown Animation for Top 1 */}
                      {isTopPick && (
                        <div className="absolute -top-10 -left-6 text-4xl animate-bounce drop-shadow-lg z-20">
                            👑
                        </div>
                      )}

                      {/* Poster */}
                      <div className={`
                        flex-shrink-0 rounded-xl overflow-hidden relative shadow-lg bg-gray-800
                        ${isTopPick ? 'w-40 h-56' : 'w-24 h-36'} 
                      `}>
                        <img 
                          src={anime.coverImage} 
                          alt={anime.title} 
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                              <div className="flex justify-between items-start">
                                  <h3 className={`font-bold text-white transition-colors ${isTopPick ? 'text-3xl text-yellow-100' : 'text-xl group-hover:text-purple-300'}`}>
                                      {anime.title}
                                  </h3>
                                  
                                  {/* Score Badge */}
                                  <div className="text-right">
                                      <span className={`block font-black text-transparent bg-clip-text ${isTopPick ? 'text-4xl bg-gradient-to-br from-yellow-300 to-yellow-600' : 'text-2xl bg-gradient-to-br from-white to-gray-500'}`}>
                                          {(anime.score * 100).toFixed(0)}%
                                      </span>
                                  </div>
                              </div>

                              {/* REMOVED: "Why" Reasoning Section */}
                              
                              <p className={`text-gray-400 mt-3 line-clamp-2 leading-relaxed ${isTopPick ? 'text-base' : 'text-sm'}`}>
                                  {anime.description}
                              </p>
                          </div>

                          {/* Vector Visualization Bar */}
                          <div className="mt-4">
                             <div className="flex justify-between text-[10px] text-gray-600 uppercase mb-1 font-bold">
                                  <span>Romance</span><span>Action</span><span>Drama</span><span>Complexity</span><span>Visuals</span>
                             </div>
                             <div className="flex gap-1 h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                                  <div className="bg-pink-500" style={{ width: `${anime.features.romance * 20}%` }} />
                                  <div className="bg-blue-500" style={{ width: `${anime.features.action * 20}%` }} />
                                  <div className="bg-yellow-500" style={{ width: `${anime.features.drama * 20}%` }} />
                                  <div className="bg-green-500" style={{ width: `${anime.features.complexity * 20}%` }} />
                                  <div className="bg-purple-500" style={{ width: `${anime.features.visuals * 20}%` }} />
                             </div>
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}