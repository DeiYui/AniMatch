// src/app/v2/page.tsx
// v2 UI (minimal): free text → 「理解した内容」 chips + 3 results with reasons.
// Moves to / when the v1 slider UI is removed in the final step.
"use client";

import { useState } from "react";
import Image from "next/image";
import type { RecommendRequest, RecommendResponse } from "@/lib/api";
import type { Context } from "@/lib/context/schema";
import { contextToChips } from "@/lib/context/chips";

const EXAMPLES = [
  "仕事で疲れた。寝る前に30分だけ笑えるやつ",
  "週末に一気見できる、泣ける作品",
  "家族で見られる、ワクワクするもの",
  "進撃の巨人みたいなやつ",
];

export default function V2Home() {
  const [text, setText] = useState("");
  const [data, setData] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async (body: RecommendRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch {
      setError("うまく取得できませんでした。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const submit = (value: string) => {
    if (!value.trim()) return;
    setText(value);
    request({ text: value });
  };

  // Chip edits re-rank on the server without parsing the text again.
  const removeChip = (remove: (c: Context) => Context) => {
    if (data) request({ context: remove(data.context) });
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tighter">
            AniMatch
          </h1>
          <p className="mt-3 text-gray-400">今の状況をひとことで。理由つきで3本おすすめします。</p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
          className="bg-[#111]/80 backdrop-blur-md p-5 rounded-3xl border border-gray-800 shadow-2xl"
        >
          <div className="flex gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="例：仕事で疲れた。寝る前に30分だけ笑えるやつ"
              maxLength={500}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold px-6 rounded-xl transition-all"
            >
              {loading ? "検索中…" : "探す"}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => submit(ex)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-purple-300 border border-gray-700 px-3 py-1.5 rounded-full transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>

        {error && <p className="mt-6 text-center text-red-400">{error}</p>}

        {data && (
          <section className={`mt-8 space-y-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
            <div>
              <h2 className="text-sm font-semibold text-gray-400 mb-2">理解した内容</h2>
              <div className="flex flex-wrap gap-2">
                {contextToChips(data.context).map((chip) => (
                  <span key={chip.id} className="flex items-center gap-1 bg-purple-900/40 border border-purple-700/60 text-purple-100 text-sm pl-3 pr-1 py-1 rounded-full">
                    {chip.label}
                    <button
                      onClick={() => removeChip(chip.remove)}
                      aria-label={`${chip.label}を外す`}
                      className="w-5 h-5 rounded-full hover:bg-purple-700/60 text-purple-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {data.notices.map((n) => (
                  <span key={n} className="bg-amber-900/30 border border-amber-700/60 text-amber-200 text-sm px-3 py-1 rounded-full">
                    {n}
                  </span>
                ))}
                {contextToChips(data.context).length === 0 && data.notices.length === 0 && (
                  <span className="text-sm text-gray-500">特に条件なし（おまかせ）</span>
                )}
              </div>
            </div>

            {data.results.map((r, i) => (
              <article key={r.id} className={`relative flex gap-5 rounded-3xl border p-5 ${i === 0 ? "bg-gradient-to-r from-[#1a1a1a] to-[#222] border-yellow-500/50" : "bg-[#111] border-gray-800"}`}>
                <div className={`absolute -top-3 -left-3 w-9 h-9 rounded-full flex items-center justify-center font-bold border-4 border-gray-950 ${i === 0 ? "bg-yellow-500 text-black" : "bg-gray-700"}`}>
                  {i + 1}
                </div>
                <div className="relative flex-shrink-0 w-28 h-40 rounded-xl overflow-hidden bg-gray-800">
                  <Image src={r.coverImage} alt={r.title} fill sizes="112px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-white">{r.title}</h3>
                      {r.subtitle && r.subtitle !== r.title && <p className="text-sm text-gray-500 truncate">{r.subtitle}</p>}
                      <p className="text-xs text-gray-400 mt-1">{r.runtime}</p>
                    </div>
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600">
                      {Math.round(r.score.total * 100)}
                    </span>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {r.reasons.map((reason) => (
                      <li key={reason} className="text-xs bg-gray-800/80 border border-gray-700 text-gray-200 px-2.5 py-1 rounded-lg">
                        {reason}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <a href={r.siteUrl} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">
                      AniListで見る ↗
                    </a>
                    <details>
                      <summary className="cursor-pointer">スコア内訳</summary>
                      <p className="mt-1 font-mono">
                        方向 {r.score.similarity.toFixed(3)} + 強さ {r.score.strength.toFixed(3)} + 評価 {r.score.quality.toFixed(3)} + 気力 {r.score.energy.toFixed(3)} + 続編 {r.score.prequelPenalty.toFixed(3)} + 短編 {r.score.shortSeriesBonus.toFixed(3)} = {r.score.total.toFixed(3)}
                      </p>
                    </details>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
