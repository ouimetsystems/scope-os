"use server";

import { createClient } from "@/lib/supabase/server";
import { solutionSchema, customFeatureSchema } from "@/lib/validations/problem-solution";
import { revalidatePath } from "next/cache";

export async function createSolution(clientId: string, problemId: string | null, formData: FormData) {
  const parsed = solutionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("solutions")
    .insert({ ...parsed.data, client_id: clientId, problem_id: problemId });

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function updateSolutionStatus(solutionId: string, clientId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("solutions").update({ status }).eq("id", solutionId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/solutions/${solutionId}`);
  return { success: true };
}

export async function deleteSolution(solutionId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("solutions").delete().eq("id", solutionId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

// --- Solution Features ---

export async function addFeatureFromLibrary(solutionId: string, featureLibraryId: string) {
  const supabase = await createClient();

  const { data: libFeature, error: fetchError } = await supabase
    .from("feature_library")
    .select("*")
    .eq("id", featureLibraryId)
    .single();

  if (fetchError || !libFeature) return { error: "Feature not found" };

  const { error } = await supabase.from("solution_features").insert({
    solution_id: solutionId,
    feature_library_id: libFeature.id,
    name: libFeature.name,
    description: libFeature.description,
    complexity: libFeature.complexity,
    price: libFeature.is_included ? 0 : libFeature.base_price,
    recurring_price: libFeature.is_included ? 0 : libFeature.recurring_price,
  });

  if (error) return { error: error.message };

  revalidatePath(`/solutions/${solutionId}`);
  return { success: true };
}

export async function addCustomFeature(solutionId: string, formData: FormData) {
  const parsed = customFeatureSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    complexity: formData.get("complexity"),
    price: formData.get("price") || null,
    recurring_price: formData.get("recurring_price") || null,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("solution_features").insert({
    solution_id: solutionId,
    feature_library_id: null,
    ...parsed.data,
  });

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/solutions/${solutionId}`);
  return { success: true };
}

export async function updateSolutionFeaturePrice(
  featureRowId: string,
  solutionId: string,
  price: number | null,
  recurringPrice: number | null
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("solution_features")
    .update({ price, recurring_price: recurringPrice })
    .eq("id", featureRowId);

  if (error) return { error: error.message };

  revalidatePath(`/solutions/${solutionId}`);
  return { success: true };
}

export async function removeSolutionFeature(featureRowId: string, solutionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("solution_features").delete().eq("id", featureRowId);

  if (error) return { error: error.message };

  revalidatePath(`/solutions/${solutionId}`);
  return { success: true };
}