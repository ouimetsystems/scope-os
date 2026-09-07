"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markPaymentPaid(paymentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", paymentId);

  if (error) return { error: error.message };

  revalidatePath("/payments");
  return { success: true };
}

export async function markPaymentCancelled(paymentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").update({ status: "cancelled" }).eq("id", paymentId);

  if (error) return { error: error.message };

  revalidatePath("/payments");
  return { success: true };
}

// Flips any "upcoming" payment past its due date to "overdue".
// Called on page load rather than a cron job — simple and sufficient for this scale.
export async function flipOverduePayments() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: flipped } = await supabase
    .from("payments")
    .update({ status: "overdue" })
    .lt("due_date", today)
    .eq("status", "upcoming")
    .select("id, client_id, description, amount");

  return flipped ?? [];
}