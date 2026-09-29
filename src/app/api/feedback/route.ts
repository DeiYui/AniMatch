// src/app/api/feedback/route.ts
// POST a 👍/👎 → appended to logs/feedback.jsonl.
import { NextResponse } from "next/server";
import { FeedbackSchema, feedbackLogger } from "@/lib/feedback";

export async function POST(req: Request) {
  const parsed = FeedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid feedback", issues: parsed.error.issues }, { status: 400 });
  }
  await feedbackLogger.log(parsed.data);
  return NextResponse.json({ ok: true });
}
