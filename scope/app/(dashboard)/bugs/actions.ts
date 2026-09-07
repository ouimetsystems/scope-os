"use server";

import { createClient } from "@/lib/supabase/server";
import { bugUpdateSchema } from "@/lib/validations/bug";
import { revalidatePath } from "next/cache";

export async function updateBug(bugId: string, projectId: string, formData: FormData) {
  const parsed = bugUpdateSchema.safeParse({
    status: formData.get("status"),
    priority: formData.get("priority"),
    resolution_notes: formData.get("resolution_notes") ?? "",
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();

  const updates: any = { ...parsed.data };
  if (parsed.data.status === "fixed" || parsed.data.status === "closed") {
    updates.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase.from("bugs").update(updates).eq("id", bugId);

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/projects/${projectId}/bugs`);
  return { success: true };
}

export async function regenerateApiKey(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("regenerate_client_api_key", { client_id_input: clientId });

  if (error) {
    // Fallback if the RPC isn't set up: do it directly
    const { data: updated, error: updateError } = await supabase
      .from("clients")
      .update({ api_key: crypto.randomUUID() })
      .eq("id", clientId)
      .select("api_key")
      .single();

    if (updateError) return { error: updateError.message };
    revalidatePath(`/clients/${clientId}`);
    return { success: true, apiKey: updated.api_key };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true, apiKey: data };
}
