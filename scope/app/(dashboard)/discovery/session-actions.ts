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

export async function addQuestionToSession(
  sessionId: string,
  libraryQuestionId: string | null,
  questionText: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from("discovery_session_questions").insert({
    discovery_session_id: sessionId,
    library_question_id: libraryQuestionId,
    question: questionText,
  });

  if (error) return { error: error.message };

  revalidatePath(`/discovery/${sessionId}`);
  return { success: true };
}

export async function saveAnswer(questionRowId: string, sessionId: string, formData: FormData) {
  const parsed = answerSchema.safeParse({ answer: formData.get("answer") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("discovery_session_questions")
    .update({ answer: parsed.data.answer })
    .eq("id", questionRowId);

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/discovery/${sessionId}`);
  return { success: true };
}

export async function removeQuestionFromSession(questionRowId: string, sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("discovery_session_questions").delete().eq("id", questionRowId);

  if (error) return { error: error.message };

  revalidatePath(`/discovery/${sessionId}`);
  return { success: true };
}