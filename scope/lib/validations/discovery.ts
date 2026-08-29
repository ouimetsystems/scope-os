import { z } from "zod";

export const libraryQuestionSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(500),
  category: z.string().trim().max(100).optional().or(z.literal("")),
});

export const discoverySessionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
});

export const answerSchema = z.object({
  answer: z.string().trim().max(5000).optional().or(z.literal("")),
});