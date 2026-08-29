"use server";

import { createClient } from "@/lib/supabase/server";
import { libraryQuestionSchema } from "@/lib/validations/discovery";
import { revalidatePath } from "next/cache";

export async function addLibraryQuestion(formData: FormData) {
  const parsed = libraryQuestionSchema.safeParse({
    question: formData.get("question"),
    category: formData.get("category") ?? "",
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("discovery_question_library").insert(parsed.data);

  if (error) return { error: { form: [error.message] } };

  revalidatePath("/discovery/library");
  return { success: true };
}

export async function retireLibraryQuestion(questionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("discovery_question_library")
    .update({ is_active: false })
    .eq("id", questionId);

  if (error) return { error: error.message };

  revalidatePath("/discovery/library");
  return { success: true };
}

export async function reactivateLibraryQuestion(questionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("discovery_question_library")
    .update({ is_active: true })
    .eq("id", questionId);

  if (error) return { error: error.message };

  revalidatePath("/discovery/library");
  return { success: true };
}