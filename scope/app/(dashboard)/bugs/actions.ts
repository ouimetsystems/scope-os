"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBugInternal(projectId: string, clientId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const featureId = (formData.get("feature_id") as string) || null;
  const environment = (formData.get("environment") as string) || "production";
  const priority = (formData.get("priority") as string) || "medium";

  if (!title?.trim()) return { error: "Title is required" };

  const supabase = await createClient();
  const { error } = await supabase.from("bugs").insert({
    project_id: projectId,
    client_id: clientId,
    feature_id: featureId,
    title,
    description,
    environment,
    priority,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/bugs`);
  return { success: true };
}

export async function updateBugStatus(bugId: string, projectId: string, status: string) {
  const supabase = await createClient();
  const updates: any = { status };

  if (status === "fixed") {
    // Spec: fixed bugs automatically move to ready-for-retest
    updates.status = "ready_for_retest";
  }
  if (status === "closed" || updates.status === "closed") {
    updates.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase.from("bugs").update(updates).eq("id", bugId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/bugs`);
  return { success: true };
}

export async function confirmBugFixed(bugId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bugs")
    .update({ status: "closed", resolved_at: new Date().toISOString() })
    .eq("id", bugId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/bugs`);
  return { success: true };
}

export async function updateBugDetails(bugId: string, projectId: string, formData: FormData) {
  const priority = formData.get("priority") as string;
  const resolutionNotes = (formData.get("resolution_notes") as string) || null;
  const featureId = (formData.get("feature_id") as string) || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("bugs")
    .update({ priority, resolution_notes: resolutionNotes, feature_id: featureId })
    .eq("id", bugId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/bugs`);
  return { success: true };
}