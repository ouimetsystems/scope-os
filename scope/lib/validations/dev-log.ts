import { z } from "zod";

export const devLogSchema = z.object({
  entry_date: z.string().min(1, "Date is required"),
  summary: z.string().trim().min(1, "Summary is required").max(300),
  details: z.string().trim().max(5000).optional().or(z.literal("")),
  hours_spent: z.coerce.number().min(0).optional().nullable(),
});