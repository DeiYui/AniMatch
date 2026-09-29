// scripts/try.ts
// Run the full pipeline from the terminal.
// Run: npm run try -- "仕事で疲れた。寝る前に30分だけ笑えるやつ" ["another sentence" …]
import { printResults } from "./printResults";

async function main() {
  const sentences = process.argv.slice(2);
  if (!sentences.length) {
    console.error('usage: npm run try -- "文" ["文" …]');
    process.exit(1);
  }
  for (const text of sentences) await printResults(text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
