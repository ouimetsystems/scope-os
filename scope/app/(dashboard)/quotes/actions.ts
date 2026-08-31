"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function generateQuoteNumber(supabase: any, clientId: string): Promise<string> {
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
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  const nextNumber = ((count ?? 0) + 1).toString().padStart(3, "0");
  return `Q-${prefix}-${nextNumber}`;
}

export async function createQuoteFromSolution(solutionId: string) {
  const supabase = await createClient();

  const { data: solution } = await supabase
    .from("solutions")
    .select("id, client_id")
    .eq("id", solutionId)
    .single();

  if (!solution) return { error: "Solution not found" };

  const { data: features } = await supabase
    .from("solution_features")
    .select("price, recurring_price")
    .eq("solution_id", solutionId);

  const totalAmount = (features ?? []).reduce((sum, f) => sum + (f.price ?? 0), 0);

  const quoteNumber = await generateQuoteNumber(supabase, solution.client_id);

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      client_id: solution.client_id,
      solution_id: solutionId,
      quote_number: quoteNumber,
      total_amount: totalAmount,
      status: "draft",
      version: 1,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/clients/${solution.client_id}`);
  redirect(`/quotes/${data.id}`);
}

export async function reviseQuote(quoteId: string) {
  const supabase = await createClient();

  const { data: oldQuote } = await supabase.from("quotes").select("*").eq("id", quoteId).single();
  if (!oldQuote) return { error: "Quote not found" };

  const { data: features } = await supabase
    .from("solution_features")
    .select("price, recurring_price")
    .eq("solution_id", oldQuote.solution_id);

  const totalAmount = (features ?? []).reduce((sum, f) => sum + (f.price ?? 0), 0);

  const prefix = oldQuote.quote_number.split("-").slice(0, 2).join("-");
  const nextNumber = (oldQuote.version + 1).toString().padStart(3, "0");
  const newQuoteNumber = `${prefix}-${nextNumber}`;

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      client_id: oldQuote.client_id,
      solution_id: oldQuote.solution_id,
      quote_number: newQuoteNumber,
      version: oldQuote.version + 1,
      previous_version_id: oldQuote.id,
      total_amount: totalAmount,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/quotes/${quoteId}`);
  redirect(`/quotes/${data.id}`);
}

export async function updateQuoteStatus(quoteId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ status }).eq("id", quoteId);

  if (error) return { error: error.message };

  revalidatePath(`/quotes/${quoteId}`);
  return { success: true };
}