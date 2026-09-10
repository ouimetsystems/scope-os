"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addLibraryQuestion(formData: FormData) {
  const question = formData.get("question") as string;
  const category = (formData.get("category") as string) || null;
  const isDefault = formData.get("is_default") === "on";

  if (!question?.trim()) return { error: "Question is required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("discovery_question_library")
    .insert({ question, category, is_default: isDefault });

  if (error) return { error: error.message };

  revalidatePath("/discovery/library");
  return { success: true };
}

export async function toggleQuestionActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("discovery_question_library").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/discovery/library");
  return { success: true };
}

export async function toggleQuestionDefault(id: string, isDefault: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("discovery_question_library").update({ is_default: isDefault }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/discovery/library");
  return { success: true };
}