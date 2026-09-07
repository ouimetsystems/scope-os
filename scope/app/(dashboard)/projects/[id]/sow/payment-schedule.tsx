"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPaymentScheduleLine, removePaymentScheduleLine } from "@/app/(dashboard)/sows/actions";

type Line = {
  id: string;
  description: string;
  amount: number;
  due_date: string | null;
  trigger_event: string | null;
};

export default function PaymentSchedule({
  sowId,
  projectId,
  lines,
}: {
  sowId: string;
  projectId: string;
  lines: Line[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const total = lines.reduce((sum, l) => sum + Number(l.amount), 0);

  async function handleAdd(formData: FormData) {
    setPending(true);
    await addPaymentScheduleLine(sowId, projectId, formData);
    setPending(false);
    router.refresh();
    (document.getElementById("payment-line-form") as HTMLFormElement)?.reset();
  }

  return (
    <section className="border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Payment Schedule</h3>

      <div className="space-y-1">
        {lines.length === 0 && <p className="text-sm text-gray-500">No payment lines yet.</p>}
        {lines.map((l) => (
          <div key={l.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-900">
              {l.description} {l.due_date && <span className="text-gray-600">— due {l.due_date}</span>}
              {l.trigger_event && <span className="text-gray-600"> — {l.trigger_event}</span>}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-800">${Number(l.amount).toFixed(2)}</span>
              <button
                onClick={async () => {
                  await removePaymentScheduleLine(l.id, projectId);
                  router.refresh();
                }}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {lines.length > 0 && (
          <p className="text-sm font-medium text-gray-900 pt-1 border-t">Total: ${total.toFixed(2)}</p>
        )}
      </div>

      <form id="payment-line-form" action={handleAdd} className="grid grid-cols-4 gap-2">
        <input
          name="description"
          placeholder="e.g. 1st Review"
          required
          className="border rounded px-2 py-1 text-sm text-gray-900"
        />
        <input
          name="amount"
          type="number"
          step="0.01"
          placeholder="Amount"
          required
          className="border rounded px-2 py-1 text-sm text-gray-900"
        />
        <input name="due_date" type="date" className="border rounded px-2 py-1 text-sm text-gray-900" />
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </section>
  );
}