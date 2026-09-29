// scripts/printResults.ts
// Compact Markdown table for one sentence, shared by try.ts and showcase.ts.
// Rendered in the sentence's language: Japanese text → JA labels/titles, otherwise EN.
import { recommend } from "../src/lib/recommend";
import { dictionaries, renderNotice, renderReason, renderRuntime, titleFor, type Lang } from "../src/i18n";
import { isDefaultMoods } from "../src/lib/engine/query";
import type { Context } from "../src/lib/context/schema";

const f2 = (x: number) => x.toFixed(2);
const signed = (x: number) => (Math.abs(x) < 0.005 ? "0" : (x > 0 ? "+" : "") + x.toFixed(2));

export const langOf = (text: string): Lang => (/[぀-ヿ一-鿿]/.test(text) ? "ja" : "en");

/** Only what differs from a neutral Context, so the line stays readable. */
const understood = (c: Context) =>
  JSON.stringify({
    ...(c.intent !== "recommend" && { intent: c.intent }),
    ...(!isDefaultMoods(c.moods) && { moods: c.moods.map((m) => m.type) }),
    ...(c.themes.length && { themes: c.themes }),
    ...(c.energy !== "mid" && { energy: c.energy }),
    ...(c.timeBudgetMin != null && { time: c.timeBudgetMin }),
    ...(c.company && { company: c.company }),
    ...(c.avoid.length && { avoid: c.avoid }),
    ...(c.referenceTitle && { ref: c.referenceTitle }),
    ...(c.titleSearch && { titleSearch: true }),
    ...(c.format !== "any" && { format: c.format }),
    ...(c.completedOnly && { completed: true }),
    ...(c.era !== "any" && { era: c.era }),
    ...(c.popularity !== "any" && { popularity: c.popularity }),
    ...(c.unmatched.length && { unmatched: c.unmatched }),
  });

export async function formatResults(text: string, parser: "auto" | "rules" = "rules"): Promise<string> {
  const lang = langOf(text);
  const t = dictionaries[lang];
  const { context, notices, results, intent, mode } = await recommend({ text, parser });
  const noticeText = notices.map((n) => renderNotice(n, lang)).join(" / ");
  const head = [`### 「${text}」`, "", `${context.source} (mode: ${mode}): \`${understood(context)}\`${notices.length ? `  \nnotices: ${noticeText}` : ""}`, ""];
  if (intent !== "recommend") return [...head, `> ${t.intent[intent]}`, ""].join("\n");
  const lines = [
    ...head,
    "| # | Title | Runtime | total | cos | int | theme | qual | adj | Reasons |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...results.map((r, i) => {
      const s = r.score;
      const adj = s.energy + s.prequelPenalty + s.longSeriesPenalty + s.shortSeriesBonus + s.eraBonus + s.popularityBonus;
      const reasons = r.reasons.map((x) => renderReason(x, lang)).join(" / ");
      const rank = r.searched ? t.card.searched : String(i + 1);
      return `| ${rank} | ${titleFor(r.titles, lang)} | ${renderRuntime(r, lang)} | **${f2(s.total)}** | ${f2(s.cosine)} | ${f2(s.intensity)} | ${f2(s.themeMatch)} | ${f2(s.qualityRaw)} | ${signed(adj)} | ${reasons} |`;
    }),
    "",
  ];
  return lines.join("\n");
}

export async function printResults(text: string, parser: "auto" | "rules" = "rules"): Promise<void> {
  console.log("\n" + (await formatResults(text, parser)));
}
