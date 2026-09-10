"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { markPaymentPaid, markPaymentCancelled } from "./actions";

type Payment = {
  id: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  status: string;
  client_id: string;
  clients: { id: string; company_name: string } | null;
};

export default function PaymentRow({ payment }: { payment: Payment }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <div className="flex items-center justify-between p-3">
      <div>
        <Link href={`/clients/${payment.client_id}`} className="text-sm font-medium text-gray-900 hover:underline">
          {payment.clients?.company_name}
        </Link>
        <p className="text-xs text-gray-600">
          {payment.description || "Payment"}
          {payment.due_date && ` — due ${payment.due_date}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-900">${Number(payment.amount).toFixed(2)}</span>
        <button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await markPaymentPaid(payment.id);
            router.refresh();
          }}
          className="text-xs border border-green-600 text-green-700 rounded px-2 py-1 hover:bg-green-50 disabled:opacity-50"
        >
          Mark Paid
        </button>
        <button
          disabled={pending}
          onClick={async () => {
            if (confirm("Cancel this payment?")) {
              setPending(true);
              await markPaymentCancelled(payment.id);
              router.refresh();
            }
          }}
          className="text-xs text-gray-700 hover:text-red-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}