import { z } from "zod";

export const meetingSchema = z.object({
  meeting_type: z.enum(["discovery", "check_in", "planning", "support", "other"]),
  meeting_date: z.string().min(1, "Date is required"),
  attendees: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(10000).optional().or(z.literal("")),
});

export type MeetingInput = z.infer<typeof meetingSchema>;

export const nextStepSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(500),
});