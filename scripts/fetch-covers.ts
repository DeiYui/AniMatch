// scripts/fetch-covers.ts
// Download every cover in src/data/anime.json into public/covers/<id>.webp, so the demo doesn't depend on the
// AniList CDN (connections to it were intermittently reset during development).
// Safe to rerun: existing files are skipped. Run: npm run fetch:covers
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { AnimeSchema } from "../src/lib/anime/schema";
import rawData from "../src/data/anime.json";

const OUT_DIR = resolve(__dirname, "../public/covers");
const CONCURRENCY = 8;
const MAX_ATTEMPTS = 4;
const BACKOFF_MS = 1000; // 1s, 2s, 4s
const TIMEOUT_MS = 15000;
const WEBP_QUALITY = 80;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const coverFile = (id: number) => resolve(OUT_DIR, `${id}.webp`);

/** Short reason for a failure: HTTP status, or the network error code (e.g. ECONNRESET). */
function describe(err: unknown): string {
  const e = err as { name?: string; message?: string; cause?: { code?: string; message?: string } };
  if (e?.name === "TimeoutError") return "timeout";
  return e?.cause?.code ?? e?.message ?? String(err);
}

async function download(url: string, file: string): Promise<void> {
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const input = Buffer.from(await res.arrayBuffer());
      await sharp(input).webp({ quality: WEBP_QUALITY }).toFile(file);
      return;
    } catch (err) {
      lastError = describe(err);
      if (lastError.startsWith("HTTP 4") && lastError !== "HTTP 429") break; // won't get better
      if (attempt < MAX_ATTEMPTS) await sleep(BACKOFF_MS * 2 ** (attempt - 1));
    }
  }
  throw new Error(lastError);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const titles = AnimeSchema.array().parse(rawData);
  const todo = titles.filter((t) => !existsSync(coverFile(t.id)));
  console.log(`${titles.length} covers: ${titles.length - todo.length} already present, ${todo.length} to download…`);

  const failures = new Map<string, number[]>(); // reason → ids
  let done = 0;
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const t = todo[next++];
      try {
        await download(t.coverImage, coverFile(t.id));
      } catch (err) {
        const reason = (err as Error).message;
        failures.set(reason, [...(failures.get(reason) ?? []), t.id]);
      }
      if (++done % 100 === 0) console.log(`  ${done}/${todo.length}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const files = readdirSync(OUT_DIR).filter((f) => f.endsWith(".webp"));
  const bytes = files.reduce((sum, f) => sum + statSync(resolve(OUT_DIR, f)).size, 0);
  const failed = [...failures.values()].reduce((n, ids) => n + ids.length, 0);
  console.log(`\nDownloaded ${todo.length - failed}, failed ${failed}. On disk: ${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB.`);
  for (const [reason, ids] of failures) console.log(`  ${reason}: ${ids.length} (ids ${ids.slice(0, 10).join(", ")}${ids.length > 10 ? ", …" : ""})`);
  if (failed) console.log("Rerun to retry the failures (existing files are skipped). Missing covers fall back to the CDN in the UI.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
