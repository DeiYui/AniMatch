// src/app/api/recommend/route.ts
// POST { text } or { context } → RecommendResponse.
import { NextResponse } from "next/server";
import { RecommendRequestSchema } from "@/lib/api";
import { recommend } from "@/lib/recommend";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = RecommendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  return NextResponse.json(await recommend(parsed.data));
}
