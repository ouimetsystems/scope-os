import { z } from "zod";

export const contactSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(200),
  role_title: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  is_primary: z.boolean().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;