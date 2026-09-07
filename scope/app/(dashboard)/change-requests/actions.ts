"use server";

import { createClient } from "@/lib/supabase/server";
import { changeRequestSchema } from "@/lib/validations/change-request";
import { revalidatePath } from "next/cache";

function parseCrForm(formData: FormData) {
  return changeRequestSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    reason: formData.get("reason") ?? "",
    size: formData.get("size"),
    estimated_hours: formData.get("estimated_hours") || null,
    additional_price: formData.get("additional_price") || null,
    timeline_impact_days: formData.get("timeline_impact_days") || null,
  });
}

export async function createChangeRequest(clientId: string, projectId: string, formData: FormData) {
  const parsed = parseCrForm(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("change_requests")
    .insert({ ...parsed.data, client_id: clientId, project_id: projectId });

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/projects/${projectId}/change-requests`);
  return { success: true };
}

export async function updateChangeRequestStatus(crId: string, projectId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("change_requests").update({ status }).eq("id", crId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/change-requests`);
  return { success: true };
}

export async function deleteChangeRequest(crId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("change_requests").delete().eq("id", crId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/change-requests`);
  return { success: true };
}