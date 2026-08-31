"use server";

import { createClient } from "@/lib/supabase/server";
import { meetingSchema, nextStepSchema } from "@/lib/validations/meeting";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMeetingForProject(projectId: string, formData: FormData) {
  const parsed = meetingSchema.safeParse({
    meeting_type: formData.get("meeting_type"),
    meeting_date: formData.get("meeting_date"),
    attendees: formData.get("attendees") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("client_id")
    .eq("id", projectId)
    .single();

  if (!project) return { error: { form: ["Project not found"] } };

  const { data, error } = await supabase
    .from("meetings")
    .insert({ ...parsed.data, client_id: project.client_id, project_id: projectId })
    .select("id")
    .single();

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/projects/${projectId}/meetings`);
  redirect(`/meetings/${data.id}`);
}

export async function createMeeting(clientId: string, formData: FormData) {
  const parsed = meetingSchema.safeParse({
    meeting_type: formData.get("meeting_type"),
    meeting_date: formData.get("meeting_date"),
    attendees: formData.get("attendees") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .insert({ ...parsed.data, client_id: clientId })
    .select("id")
    .single();

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/clients/${clientId}`);
  redirect(`/meetings/${data.id}`);
}

export async function updateMeeting(meetingId: string, clientId: string, formData: FormData) {
  const parsed = meetingSchema.safeParse({
    meeting_type: formData.get("meeting_type"),
    meeting_date: formData.get("meeting_date"),
    attendees: formData.get("attendees") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("meetings").update(parsed.data).eq("id", meetingId);

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deleteMeeting(meetingId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meetings").delete().eq("id", meetingId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

// --- Next Steps ---

export async function addNextStep(meetingId: string, formData: FormData) {
  const parsed = nextStepSchema.safeParse({ description: formData.get("description") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("meeting_next_steps")
    .insert({ meeting_id: meetingId, description: parsed.data.description });

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/meetings/${meetingId}`);
  return { success: true };
}

export async function toggleNextStep(nextStepId: string, meetingId: string, isComplete: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meeting_next_steps")
    .update({ is_complete: isComplete })
    .eq("id", nextStepId);

  if (error) return { error: error.message };

  revalidatePath(`/meetings/${meetingId}`);
  return { success: true };
}

export async function deleteNextStep(nextStepId: string, meetingId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meeting_next_steps").delete().eq("id", nextStepId);

  if (error) return { error: error.message };

  revalidatePath(`/meetings/${meetingId}`);
  return { success: true };
}