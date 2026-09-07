"use client";

import { useState } from "react";
import { createSowFromProject } from "@/app/(dashboard)/sows/actions";

export default function CreateSowButton({ projectId }: { projectId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const result = await createSowFromProject(projectId);
          if (result?.error) {
            setError(result.error);
            setPending(false);
          }
        }}
        className="rounded bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Start SOW"}
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}