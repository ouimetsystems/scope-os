"use server";

import { createClient } from "@/lib/supabase/server";
import { clientSchema } from "@/lib/validations/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    company_name: formData.get("company_name"),
    industry: formData.get("industry") ?? "",
    status: formData.get("status"),
    website: formData.get("website") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

export async function createClientRecord(formData: FormData) {
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { form: ["Not authenticated"] } };

  const { data, error } = await supabase
    .from("clients")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { error: { form: [error.message] } };

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientRecord(clientId: string, formData: FormData) {
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update(parsed.data)
    .eq("id", clientId);

  if (error) return { error: { form: [error.message] } };

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deleteClientRecord(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  redirect("/clients");
}