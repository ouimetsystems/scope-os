"use server";

import { createClient } from "@/lib/supabase/server";
import { answerSchema } from "@/lib/validations/discovery";
import { revalidatePath } from "next/cache";

export async function bulkAddQuestions(projectId: string, libraryQuestionIds: string[]) {
  const supabase = await createClient();

  const { data: libQuestions } = await supabase
    .from("discovery_question_library")
    .select("id, question, category")
    .in("id", libraryQuestionIds);

  if (!libQuestions || libQuestions.length === 0) return { error: "No questions found" };

  const { data: existing } = await supabase
    .from("discovery_session_questions")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  let nextSort = (existing?.[0]?.sort_order ?? 0) + 1;

  const rows = libQuestions.map((q) => ({
    project_id: projectId,
    library_question_id: q.id,
    question: q.question,
    category: q.category,
    sort_order: nextSort++,
  }));

  const { error } = await supabase.from("discovery_session_questions").insert(rows);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/questions`);
  return { success: true };
}

export async function addCustomQuestion(projectId: string, questionText: string, category: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("discovery_session_questions")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("discovery_session_questions").insert({
    project_id: projectId,
    library_question_id: null,
    question: questionText,
    category: category || "Project-Specific",
    sort_order: nextSort,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/questions`);
  return { success: true };
}

export async function saveAnswer(questionRowId: string, projectId: string, formData: FormData) {
  const parsed = answerSchema.safeParse({ answer: formData.get("answer") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("discovery_session_questions")
    .update({ answer: parsed.data.answer })
    .eq("id", questionRowId);

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/projects/${projectId}/questions`);
  return { success: true };
}

export async function removeQuestion(questionRowId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("discovery_session_questions").delete().eq("id", questionRowId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/questions`);
  return { success: true };
}

export async function reorderQuestion(questionRowId: string, projectId: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("discovery_session_questions")
    .select("id, sort_order, category")
    .eq("id", questionRowId)
    .single();

  if (!current) return { error: "Question not found" };

  const { data: neighbor } = await supabase
    .from("discovery_session_questions")
    .select("id, sort_order")
    .eq("project_id", projectId)
    .eq("category", current.category)
    .order("sort_order", { ascending: direction === "up" })
    .gt("sort_order", direction === "up" ? -Infinity : current.sort_order)
    .lt("sort_order", direction === "up" ? current.sort_order : Infinity)
    .order("sort_order", { ascending: direction !== "up" })
    .limit(1)
    .maybeSingle();

  if (!neighbor) return { success: true };

  await supabase.from("discovery_session_questions").update({ sort_order: neighbor.sort_order }).eq("id", current.id);
  await supabase.from("discovery_session_questions").update({ sort_order: current.sort_order }).eq("id", neighbor.id);

  revalidatePath(`/projects/${projectId}/questions`);
  return { success: true };
}

export async function flagAsProblem(questionRowId: string, projectId: string, clientId: string) {
  const supabase = await createClient();

  const { data: q } = await supabase
    .from("discovery_session_questions")
    .select("question, answer")
    .eq("id", questionRowId)
    .single();

  if (!q) return { error: "Question not found" };

  const { data: problem, error } = await supabase
    .from("problems")
    .insert({
      client_id: clientId,
      project_id: projectId,
      title: q.question,
      description: q.answer || null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase
    .from("discovery_session_questions")
    .update({ flagged_problem_id: problem.id })
    .eq("id", questionRowId);

  revalidatePath(`/projects/${projectId}/questions`);
  revalidatePath(`/projects/${projectId}/problems`);
  return { success: true, problemId: problem.id };
}