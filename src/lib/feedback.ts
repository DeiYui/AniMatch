// src/lib/feedback.ts
// 👍/👎 logging behind a small interface, so the JSONL file can be swapped for a database later.
// Not used for learning (non-goal).
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { ContextSchema } from "@/lib/context/schema";

export const FeedbackSchema = z.object({
  animeId: z.number().int(),
  vote: z.enum(["up", "down"]),
  rank: z.number().int().min(1).max(9), // position in the results
  text: z.string().max(500).nullable(), // the sentence, if the results came from text
  context: ContextSchema,
});

export type Feedback = z.infer<typeof FeedbackSchema>;

export interface FeedbackLogger {
  log(feedback: Feedback): Promise<void>;
}

/** One JSON object per line, with a timestamp. */
export const jsonlLogger = (path: string): FeedbackLogger => ({
  async log(feedback) {
    await mkdir(dirname(path), { recursive: true });
    await appendFile(path, JSON.stringify({ at: new Date().toISOString(), ...feedback }) + "\n");
  },
});

export const feedbackLogger: FeedbackLogger = jsonlLogger(resolve(process.cwd(), "logs/feedback.jsonl"));
