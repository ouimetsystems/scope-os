"use client";

import { useState } from "react";
import { deleteClientRecord } from "../actions";

export default function DeleteClientButton({
  clientId,
  companyName,
}: {
  clientId: string;
  companyName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm border border-red-300 text-red-600 rounded px-3 py-1.5 hover:bg-red-50"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-red-600">
        Permanently delete {companyName} and all their history?
      </span>
      <button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await deleteClientRecord(clientId);
        }}
        className="text-sm bg-red-600 text-white rounded px-3 py-1.5 hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? "Deleting..." : "Yes, delete"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-sm border rounded px-3 py-1.5 hover:bg-gray-50">
        Cancel
      </button>
    </div>
  );
}