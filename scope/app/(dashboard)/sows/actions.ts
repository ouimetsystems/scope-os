"use server";

import { createClient } from "@/lib/supabase/server";
import { sowFormDataSchema, defaultSowFormData } from "@/lib/validations/sow";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function generateSowNumber(supabase: any, clientId: string): Promise<string> {
  const { data: client } = await supabase
    .from("clients")
    .select("company_name")
    .eq("id", clientId)
    .single();

  const prefix = (client?.company_name ?? "CLI")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");

  const { count } = await supabase
    .from("sows")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  const nextNumber = ((count ?? 0) + 1).toString().padStart(3, "0");
  return `SOW-${prefix}-${nextNumber}`;
}

export async function createSowFromProject(projectId: string) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id")
    .eq("id", projectId)
    .single();

  if (!project) return { error: "Project not found" };

  const { data: latestQuote } = await supabase
    .from("quotes")
    .select("id, total_amount")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestQuote) return { error: "Generate a quote for this project first" };

  const sowNumber = await generateSowNumber(supabase, project.client_id);

  const formData = {
    ...defaultSowFormData,
    pricing: { ...defaultSowFormData.pricing, development: latestQuote.total_amount ?? 0 },
  };

  const { data, error } = await supabase
    .from("sows")
    .insert({
      client_id: project.client_id,
      quote_id: latestQuote.id,
      sow_number: sowNumber,
      version: 1,
      form_data: formData,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("projects").update({ sow_id: data.id }).eq("id", projectId);

  revalidatePath(`/projects/${projectId}/sow`);
  redirect(`/projects/${projectId}/sow`);
}

export async function updateSowFormData(sowId: string, projectId: string, formData: unknown) {
  const parsed = sowFormDataSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("sows").update({ form_data: parsed.data }).eq("id", sowId);

  if (error) return { error: { form: [error.message] } };

  revalidatePath(`/projects/${projectId}/sow`);
  return { success: true };
}

export async function approveSow(sowId: string, projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sows")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", sowId);

  if (error) return { error: error.message };

  // Push each payment schedule line into the real Payments tracker
  const { data: scheduleLines } = await supabase
    .from("sow_payment_schedule")
    .select("*")
    .eq("sow_id", sowId);

  const { data: sow } = await supabase.from("sows").select("client_id").eq("id", sowId).single();

  if (sow && scheduleLines && scheduleLines.length > 0) {
    const paymentRows = scheduleLines.map((line: any) => ({
      client_id: sow.client_id,
      project_id: projectId,
      description: line.description,
      amount: line.amount,
      due_date: line.due_date,
      status: "upcoming",
    }));
    await supabase.from("payments").insert(paymentRows);
  }

  revalidatePath(`/projects/${projectId}/sow`);
  return { success: true };
}

// --- Payment Schedule ---

export async function addPaymentScheduleLine(
  sowId: string,
  projectId: string,
  formData: FormData
) {
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const dueDate = (formData.get("due_date") as string) || null;
  const triggerEvent = (formData.get("trigger_event") as string) || null;

  if (!description || isNaN(amount)) return { error: "Description and amount required" };

  const supabase = await createClient();
  const { error } = await supabase.from("sow_payment_schedule").insert({
    sow_id: sowId,
    description,
    amount,
    due_date: dueDate,
    trigger_event: triggerEvent,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/sow`);
  return { success: true };
}

export async function removePaymentScheduleLine(lineId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sow_payment_schedule").delete().eq("id", lineId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/sow`);
  return { success: true };
}