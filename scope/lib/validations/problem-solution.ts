import { z } from "zod";

export const problemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const solutionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const customFeatureSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  complexity: z.enum(["low", "medium", "high"]),
  price: z.coerce.number().min(0).optional().nullable(),
  recurring_price: z.coerce.number().min(0).optional().nullable(),
});