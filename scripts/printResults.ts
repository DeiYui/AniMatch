// scripts/printResults.ts
// Compact Markdown table for one sentence, shared by try.ts and showcase.ts.
import { recommend } from "../src/lib/recommend";

const f2 = (x: number) => x.toFixed(2);
const signed = (x: number) => (x === 0 ? "0" : (x > 0 ? "+" : "") + x.toFixed(2));

export async function printResults(text: string): Promise<void> {
  const { context, notices, results } = await recommend({ text });
  const { source, ...rest } = context;
  console.log(`\n## 「${text}」\n`);
  console.log(`${source}: ${JSON.stringify(rest)}${notices.length ? `\nnotices: ${notices.join(" / ")}` : ""}\n`);
  console.log("| # | Title | Runtime | total | cos | int | qual | adj | Reasons |");
  console.log("|---|---|---|---|---|---|---|---|---|");
  results.forEach((r, i) => {
    const s = r.score;
    const adj = s.energy + s.prequelPenalty + s.shortSeriesBonus;
    console.log(
      `| ${i + 1} | ${r.title} | ${r.runtime} | **${f2(s.total)}** | ${f2(s.cosine)} | ${f2(s.intensity)} | ${f2(s.quality)} | ${signed(adj)} | ${r.reasons.join(" / ")} |`,
    );
  });
}
