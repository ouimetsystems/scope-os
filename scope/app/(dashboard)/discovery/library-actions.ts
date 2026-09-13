"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addLibraryQuestion(formData: FormData) {
  const question = formData.get("question") as string;
  const category = (formData.get("category") as string) || "Other";
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

export async function updateLibraryQuestion(
  id: string,
  question: string,
  category: string,
  isDefault: boolean
) {
  if (!question.trim()) return { error: "Question cannot be empty" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("discovery_question_library")
    .update({ question, category: category || "Other", is_default: isDefault })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/discovery/library");
  return { success: true };
}

export async function deleteLibraryQuestion(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("discovery_question_library").delete().eq("id", id);

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

export async function renameCategory(oldName: string, newName: string) {
  if (!newName.trim()) return { error: "Category name cannot be empty" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("discovery_question_library")
    .update({ category: newName })
    .eq("category", oldName);

  if (error) return { error: error.message };

  revalidatePath("/discovery/library");
  return { success: true };
}

export async function deleteCategory(categoryName: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("discovery_question_library")
    .delete()
    .eq("category", categoryName);

  if (error) return { error: error.message };

  revalidatePath("/discovery/library");
  return { success: true };
}