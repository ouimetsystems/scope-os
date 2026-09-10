"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFeatureFromProblem(
  projectId: string,
  problemId: string,
  name: string,
  description: string
) {
  const supabase = await createClient();

  const { data: feature, error } = await supabase
    .from("features")
    .insert({ project_id: projectId, name, description: description || null })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("problem_features").insert({ problem_id: problemId, feature_id: feature.id });

  revalidatePath(`/projects/${projectId}/problems`);
  revalidatePath(`/projects/${projectId}/features`);
  return { success: true, featureId: feature.id };
}

export async function createFeatureFromLibrary(projectId: string, featureLibraryId: string) {
  const supabase = await createClient();

  const { data: libFeature } = await supabase
    .from("feature_library")
    .select("*")
    .eq("id", featureLibraryId)
    .single();

  if (!libFeature) return { error: "Feature not found in library" };

  const { data: feature, error } = await supabase
    .from("features")
    .insert({
      project_id: projectId,
      feature_library_id: libFeature.id,
      name: libFeature.name,
      description: libFeature.description,
      complexity: libFeature.complexity,
      price: libFeature.is_included ? 0 : libFeature.base_price,
      recurring_price: libFeature.is_included ? 0 : libFeature.recurring_price,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/features`);
  return { success: true, featureId: feature.id };
}

export async function createCustomFeature(projectId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  if (!name?.trim()) return { error: "Name is required" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("features")
    .insert({ project_id: projectId, name, description })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/features`);
  return { success: true, featureId: data.id };
}

export async function linkProblemToFeature(problemId: string, featureId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("problem_features")
    .insert({ problem_id: problemId, feature_id: featureId });

  // Ignore duplicate-link errors (unique constraint) — already linked is fine
  if (error && !error.message.includes("duplicate")) return { error: error.message };

  revalidatePath(`/projects/${projectId}/problems`);
  revalidatePath(`/projects/${projectId}/features`);
  return { success: true };
}

export async function unlinkProblemFromFeature(problemId: string, featureId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("problem_features")
    .delete()
    .eq("problem_id", problemId)
    .eq("feature_id", featureId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/problems`);
  revalidatePath(`/projects/${projectId}/features`);
  return { success: true };
}

export async function updateFeatureDetails(featureId: string, projectId: string, formData: FormData) {
  const supabase = await createClient();

  const price = formData.get("price");
  const recurringPrice = formData.get("recurring_price");

  const { error } = await supabase
    .from("features")
    .update({
      name: formData.get("name"),
      description: formData.get("description") || null,
      user_flow: formData.get("user_flow") || null,
      notes: formData.get("notes") || null,
      price: price ? parseFloat(price as string) : null,
      recurring_price: recurringPrice ? parseFloat(recurringPrice as string) : null,
    })
    .eq("id", featureId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/features`);
  return { success: true };
}

export async function updateFeatureDevStatus(featureId: string, projectId: string, status: string) {
  const supabase = await createClient();
  const updates: any = { dev_status: status };
  if (status === "complete") updates.test_status = "unconfirmed"; // ready for QA to pick up

  const { error } = await supabase.from("features").update(updates).eq("id", featureId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/features`);
  return { success: true };
}

export async function updateFeatureTestStatus(featureId: string, projectId: string, status: string) {
  const supabase = await createClient();
  const updates: any = { test_status: status };
  if (status === "confirmed") updates.dev_status = "complete"; // auto-complete on confirm

  const { error } = await supabase.from("features").update(updates).eq("id", featureId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/features`);
  return { success: true };
}

export async function deleteFeature(featureId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("features").delete().eq("id", featureId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/features`);
  return { success: true };
}