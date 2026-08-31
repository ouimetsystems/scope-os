import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
});
