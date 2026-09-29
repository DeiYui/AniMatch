// scripts/try.ts
// Run the full pipeline from the terminal.
// Run: npm run try -- [--llm] "仕事で疲れた。寝る前に30分だけ笑えるやつ" ["another sentence" …]
// Rules parser by default (deterministic); --llm tries Gemini first, like the app.
import { printResults } from "./printResults";
import { loadLocalEnv } from "./env";

async function main() {
  loadLocalEnv();
  const args = process.argv.slice(2);
  const parser = args.includes("--llm") ? "auto" : "rules";
  const sentences = args.filter((a) => a !== "--llm");
  if (!sentences.length) {
    console.error('usage: npm run try -- "文" ["文" …]');
    process.exit(1);
  }
  for (const text of sentences) await printResults(text, parser);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
