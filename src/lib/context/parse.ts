// src/lib/context/parse.ts
// Free text → Context. Rules only for now; the LLM (with fallback to rules) is added in step 8.
import type { Context } from "./schema";
import { parseRules } from "./rules";

export async function parseContext(text: string): Promise<Context> {
  const context = parseRules(text);
  console.info(`[parseContext] parser=${context.source}`);
  return context;
}
