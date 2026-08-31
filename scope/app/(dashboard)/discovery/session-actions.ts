"use server";

import { createClient } from "@/lib/supabase/server";
import { discoverySessionSchema, answerSchema } from "@/lib/validations/discovery";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createDiscoverySession(clientId: string, formData: FormData) {
  const parsed = discoverySessionSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discovery_sessions")
    .insert({ ...parsed.data, client_id: clientId })
    .select("id")
    .single();

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/clients/${clientId}`);
  redirect(`/discovery/${data.id}`);
}

export async function addQuestion({
  libraryQuestionId,
  questionText,
  sessionId,
  meetingId,
  projectId,
}: {
  libraryQuestionId: string | null;
  questionText: string;
  sessionId?: string;
  meetingId?: string;
  projectId?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("discovery_session_questions").insert({
    discovery_session_id: sessionId ?? null,
    meeting_id: meetingId ?? null,
    project_id: projectId ?? null,
    library_question_id: libraryQuestionId,
    question: questionText,
  });

  if (error) return { error: error.message };

  if (sessionId) revalidatePath(`/discovery/${sessionId}`);
  if (meetingId) revalidatePath(`/meetings/${meetingId}`);
  if (projectId) revalidatePath(`/projects/${projectId}/questions`);
  return { success: true };
}

export async function saveAnswer(
  questionRowId: string,
  formData: FormData,
  paths: { sessionId?: string; meetingId?: string; projectId?: string }
) {
  const parsed = answerSchema.safeParse({ answer: formData.get("answer") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("discovery_session_questions")
    .update({ answer: parsed.data.answer })
    .eq("id", questionRowId);

  if (error) return { error: { form: [error.message] } };

  if (paths.sessionId) revalidatePath(`/discovery/${paths.sessionId}`);
  if (paths.meetingId) revalidatePath(`/meetings/${paths.meetingId}`);
  if (paths.projectId) revalidatePath(`/projects/${paths.projectId}/questions`);
  return { success: true };
}

export async function removeQuestion(
  questionRowId: string,
  paths: { sessionId?: string; meetingId?: string; projectId?: string }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("discovery_session_questions").delete().eq("id", questionRowId);

  if (error) return { error: error.message };

  if (paths.sessionId) revalidatePath(`/discovery/${paths.sessionId}`);
  if (paths.meetingId) revalidatePath(`/meetings/${paths.meetingId}`);
  if (paths.projectId) revalidatePath(`/projects/${paths.projectId}/questions`);
  return { success: true };
}