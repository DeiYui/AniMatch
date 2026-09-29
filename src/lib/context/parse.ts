// src/lib/context/parse.ts
// Free text → Context. LLM first; on ANY failure (timeout, 429, invalid JSON, schema error, missing key)
// the rule-based parser produces the same Context shape. The app never breaks because of the LLM.
import type { Context } from "./schema";
import { parseRules } from "./rules";
import { llmParse } from "./llm";

export const DEFAULT_LLM_TIMEOUT_MS = 4000; // eval max was 1.6s, but a cold first call took 3.1s

export type ParserMode = "auto" | "rules"; // "rules" forces the fallback (live demo without AI)

export type ParseResult = {
  context: Context;
  parser: Context["source"];
  latencyMs: number; // whole parse, including a failed LLM attempt
  fallbackReason: string | null; // why the LLM wasn't used, if it wasn't
};

export const llmTimeoutMs = (): number => {
  const v = Number(process.env.LLM_TIMEOUT_MS);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_LLM_TIMEOUT_MS;
};

/** Short, log-friendly reason. Never includes the user's text or the API key. */
export function describeError(err: unknown): string {
  const e = err as { name?: string; status?: number; message?: string };
  if (e?.name === "AbortError" || /abort/i.test(e?.message ?? "")) return "timeout";
  if (e?.status === 429 || /\b429\b|RESOURCE_EXHAUSTED/.test(e?.message ?? "")) return "rate-limit (429)";
  if (err instanceof SyntaxError) return "invalid JSON";
  if (e?.name === "ZodError") return "schema mismatch";
  return (e?.message ?? String(err)).slice(0, 80);
}

/** Runs the LLM with a hard timeout. Exported for the eval script. */
export async function llmWithTimeout(text: string, timeoutMs: number): Promise<Context> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // The race guarantees the timeout even if the SDK ignores the abort signal.
    return await Promise.race([
      llmParse(text, controller.signal),
      new Promise<never>((_, reject) =>
        controller.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))),
      ),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function parseContext(text: string, mode: ParserMode = "auto"): Promise<ParseResult> {
  const start = performance.now();
  let fallbackReason: string;

  if (mode === "rules") {
    fallbackReason = "forced (parser=rules)";
  } else {
    try {
      const context = await llmWithTimeout(text, llmTimeoutMs());
      const latencyMs = Math.round(performance.now() - start);
      console.info(`[parseContext] parser=llm ${latencyMs}ms`);
      return { context, parser: "llm", latencyMs, fallbackReason: null };
    } catch (err) {
      fallbackReason = describeError(err);
    }
  }

  const context = parseRules(text);
  const latencyMs = Math.round(performance.now() - start);
  console.info(`[parseContext] parser=rules ${latencyMs}ms (fallback: ${fallbackReason})`);
  return { context, parser: "rules", latencyMs, fallbackReason };
}
