import { z } from "zod";

export const clientSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(200),
  industry: z.string().trim().max(100).optional().or(z.literal("")),
  status: z.enum(["prospect", "production", "current", "paused", "inactive"]),
  website: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;