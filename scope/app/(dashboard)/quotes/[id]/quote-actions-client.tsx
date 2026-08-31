"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateQuoteStatus, reviseQuote } from "@/app/(dashboard)/quotes/actions";

export default function QuoteActionsClient({
  quoteId,
  status,
}: {
  quoteId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={async (e) => {
          setPending(true);
          await updateQuoteStatus(quoteId, e.target.value);
          setPending(false);
          router.refresh();
        }}
        disabled={pending}
        className="text-sm border rounded px-2 py-1.5"
      >
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="accepted">Accepted</option>
        <option value="declined">Declined</option>
      </select>

      <button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await reviseQuote(quoteId);
        }}
        className="text-sm border rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
      >
        Revise (new version)
      </button>
    </div>
  );
}