"use server";

import { createClient } from "@/lib/supabase/server";
import { problemSchema } from "@/lib/validations/problem-solution";
import { revalidatePath } from "next/cache";

export async function createProblem(clientId: string, formData: FormData) {
  const parsed = problemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("problems").insert({ ...parsed.data, client_id: clientId });

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function updateProblemStatus(problemId: string, clientId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("problems").update({ status }).eq("id", problemId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deleteProblem(problemId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("problems").delete().eq("id", problemId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}