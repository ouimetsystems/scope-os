"use server";

import { createClient } from "@/lib/supabase/server";
import { featureLibrarySchema } from "@/lib/validations/feature";
import { revalidatePath } from "next/cache";

function parseFeatureForm(formData: FormData) {
  return featureLibrarySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    complexity: formData.get("complexity"),
    base_price: formData.get("base_price") || null,
    recurring_price: formData.get("recurring_price") || null,
    typical_hours: formData.get("typical_hours") || null,
  });
}

export async function createFeature(formData: FormData) {
  const parsed = parseFeatureForm(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("feature_library").insert(parsed.data);

  if (error) return { error: { form: [error.message] } };

  revalidatePath("/features/library");
  return { success: true };
}

export async function updateFeature(featureId: string, formData: FormData) {
  const parsed = parseFeatureForm(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("feature_library").update(parsed.data).eq("id", featureId);

  if (error) return { error: { form: [error.message] } };

  revalidatePath("/features/library");
  return { success: true };
}

export async function retireFeature(featureId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("feature_library")
    .update({ is_active: false })
    .eq("id", featureId);

  if (error) return { error: error.message };
  revalidatePath("/features/library");
  return { success: true };
}

export async function reactivateFeature(featureId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("feature_library")
    .update({ is_active: true })
    .eq("id", featureId);

  if (error) return { error: error.message };
  revalidatePath("/features/library");
  return { success: true };
}

export async function addDependency(featureId: string, dependsOnFeatureId: string) {
  if (featureId === dependsOnFeatureId) {
    return { error: "A feature can't depend on itself" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("feature_dependencies")
    .insert({ feature_id: featureId, depends_on_feature_id: dependsOnFeatureId });

  if (error) return { error: error.message };
  revalidatePath("/features/library");
  return { success: true };
}

export async function removeDependency(dependencyRowId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("feature_dependencies").delete().eq("id", dependencyRowId);

  if (error) return { error: error.message };
  revalidatePath("/features/library");
  return { success: true };
}