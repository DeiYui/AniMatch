// scripts/env.ts
// Scripts run outside Next.js, so load .env.local ourselves (no-op if it doesn't exist).
export function loadLocalEnv(): void {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // no .env.local: the LLM path will fail and fall back to rules
  }
}
