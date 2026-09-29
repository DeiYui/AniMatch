// src/app/api/warmup/route.ts
// POST: warms up the LLM when the page loads. Never fails the page: errors are reported, not thrown.
import { NextResponse } from "next/server";
import { warmUp } from "@/lib/context/llm";
import { describeError } from "@/lib/context/parse";

const WARMUP_TIMEOUT_MS = 10000;

export async function POST() {
  const start = performance.now();
  try {
    const status = await warmUp(AbortSignal.timeout(WARMUP_TIMEOUT_MS));
    const latencyMs = Math.round(performance.now() - start);
    if (status === "warmed") console.info(`[warmup] ${latencyMs}ms`);
    return NextResponse.json({ status, latencyMs });
  } catch (err) {
    const reason = describeError(err);
    console.info(`[warmup] failed: ${reason}`);
    return NextResponse.json({ status: "failed", reason });
  }
}
