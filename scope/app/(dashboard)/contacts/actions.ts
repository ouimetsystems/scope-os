"use server";

import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validations/contact";
import { revalidatePath } from "next/cache";

function parseContactForm(formData: FormData) {
  return contactSchema.safeParse({
    full_name: formData.get("full_name"),
    role_title: formData.get("role_title") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    is_primary: formData.get("is_primary") === "on",
  });
}

export async function createContact(clientId: string, formData: FormData) {
  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  // If this contact is marked primary, unset any existing primary first
  if (parsed.data.is_primary) {
    await supabase.from("contacts").update({ is_primary: false }).eq("client_id", clientId);
  }

  const { error } = await supabase
    .from("contacts")
    .insert({ ...parsed.data, client_id: clientId });

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function updateContact(contactId: string, clientId: string, formData: FormData) {
  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  if (parsed.data.is_primary) {
    await supabase
      .from("contacts")
      .update({ is_primary: false })
      .eq("client_id", clientId)
      .neq("id", contactId);
  }

  const { error } = await supabase.from("contacts").update(parsed.data).eq("id", contactId);

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deleteContact(contactId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}