import { z } from "zod";

export const quoteStatusSchema = z.enum(["draft", "sent", "accepted", "declined"]);