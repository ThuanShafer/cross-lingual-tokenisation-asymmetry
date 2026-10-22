import { z } from "zod";
import { SUPPORTED_LANGUAGE_CODES, TARGET_LANGUAGE_CODES } from "@/config/languages";

const languageCode = z.enum(SUPPORTED_LANGUAGE_CODES);
const text = z.string().trim().min(1, "Text is required").max(2000, "Text is too long");

export const translateRequestSchema = z
  .object({ text, from: languageCode, to: languageCode })
  .refine((v) => v.from !== v.to, { message: "Source and target must differ" });

export const compareRequestSchema = z.object({
  englishQuery: text,
  targetQuery: text,
  target: z.enum(TARGET_LANGUAGE_CODES),
  model: z.string().trim().min(1, "Model is required").max(200),
});

const answer = z.string().trim().min(1, "Answer is required").max(6000, "Answer is too long");

export const agreementRequestSchema = z.object({
  englishQuery: text,
  targetQuery: text,
  englishAnswer: answer,
  targetAnswer: answer,
  target: z.enum(TARGET_LANGUAGE_CODES),
});

export function parseOrThrow(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const error = new Error(result.error.issues.map((i) => i.message).join("; "));
    error.status = 400;
    throw error;
  }
  return result.data;
}
