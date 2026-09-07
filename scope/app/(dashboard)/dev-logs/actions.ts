"use server";

import { createClient } from "@/lib/supabase/server";
import { devLogSchema } from "@/lib/validations/dev-log";
import { revalidatePath } from "next/cache";

export async function createDevLog(projectId: string, formData: FormData) {
  const parsed = devLogSchema.safeParse({
    entry_date: formData.get("entry_date"),
    summary: formData.get("summary"),
    details: formData.get("details") ?? "",
    hours_spent: formData.get("hours_spent") || null,
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("development_logs").insert({ ...parsed.data, project_id: projectId });

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/projects/${projectId}/dev-logs`);
  return { success: true };
}

export async function updateDevLog(logId: string, projectId: string, formData: FormData) {
  const parsed = devLogSchema.safeParse({
    entry_date: formData.get("entry_date"),
    summary: formData.get("summary"),
    details: formData.get("details") ?? "",
    hours_spent: formData.get("hours_spent") || null,
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("development_logs").update(parsed.data).eq("id", logId);

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/projects/${projectId}/dev-logs`);
  return { success: true };
}

export async function deleteDevLog(logId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("development_logs").delete().eq("id", logId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/dev-logs`);
  return { success: true };
}