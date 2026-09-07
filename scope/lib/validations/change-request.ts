import { z } from "zod";

export const changeRequestSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  reason: z.string().trim().max(2000).optional().or(z.literal("")),
  size: z.enum(["minor", "major"]),
  estimated_hours: z.coerce.number().min(0).optional().nullable(),
  additional_price: z.coerce.number().min(0).optional().nullable(),
  timeline_impact_days: z.coerce.number().optional().nullable(),
});