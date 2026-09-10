import { z } from "zod";

export const bugSubmissionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  error_code: z.string().trim().max(100).optional().or(z.literal("")),
  environment: z.enum(["test", "production"]).optional().default("production"),
});

export const bugUpdateSchema = z.object({
  status: z.enum(["open", "investigating", "in_progress", "fixed", "ready_for_retest", "closed", "wont_fix"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  resolution_notes: z.string().trim().max(5000).optional().or(z.literal("")),
});