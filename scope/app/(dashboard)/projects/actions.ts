"use server";

import { createClient } from "@/lib/supabase/server";
import { projectSchema } from "@/lib/validations/project";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(clientId: string, formData: FormData) {
  const parsed = projectSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, client_id: clientId, status: "planning" })
    .select("id")
    .single();

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/clients/${clientId}`);
  redirect(`/projects/${data.id}`);
}

export async function updateProjectStatus(projectId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
