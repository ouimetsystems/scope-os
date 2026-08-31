"use client";

import { useState } from "react";
import { createQuoteFromProject } from "@/app/(dashboard)/quotes/actions";

export default function GenerateProjectQuoteButton({ projectId }: { projectId: string }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await createQuoteFromProject(projectId);
      }}
      className="rounded bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
    >
      {pending ? "Generating..." : "Generate Quote"}
    </button>
  );
}