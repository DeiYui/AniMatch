// scripts/try.ts
// Run the full pipeline from the terminal and print results with score breakdowns.
// Run: npm run try -- "仕事で疲れた。寝る前に30分だけ笑えるやつ" ["another sentence" …]
import { recommend } from "../src/lib/recommend";

const f3 = (x: number) => x.toFixed(3);

async function main() {
  const sentences = process.argv.slice(2);
  if (!sentences.length) {
    console.error('usage: npm run try -- "文" ["文" …]');
    process.exit(1);
  }
  for (const text of sentences) {
    const { context, notices, results } = await recommend({ text });
    const { source, ...rest } = context;
    console.log(`\n## 「${text}」\n`);
    console.log(`Context (${source}): ${JSON.stringify(rest)}`);
    if (notices.length) console.log(`Notices: ${notices.join(" / ")}`);
    console.log();
    console.log("| # | Title | total | cos | sim | quality | heavy− | prequel− | short+ | Reasons |");
    console.log("|---|---|---|---|---|---|---|---|---|---|");
    results.forEach((r, i) => {
      const s = r.score;
      console.log(
        `| ${i + 1} | ${r.title}<br>${r.subtitle ?? ""} | **${f3(s.total)}** | ${f3(s.cosine)} | ${f3(s.similarity)} | ${f3(s.quality)} | ${f3(s.heavyPenalty)} | ${f3(s.prequelPenalty)} | ${f3(s.shortSeriesBonus)} | ${r.reasons.join(" / ")} |`,
      );
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
