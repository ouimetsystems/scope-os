import { z } from "zod";

export const featureLibrarySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  complexity: z.enum(["low", "medium", "high"]),
  base_price: z.coerce.number().min(0).optional().nullable(),
  recurring_price: z.coerce.number().min(0).optional().nullable(),
  typical_hours: z.coerce.number().min(0).optional().nullable(),
});

export type FeatureLibraryInput = z.infer<typeof featureLibrarySchema>;