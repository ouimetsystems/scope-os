"use client";

import { useState, use } from "react";
import { createDiscoverySession } from "@/app/(dashboard)/discovery/session-actions";

export default function NewDiscoverySessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = use(params);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await createDiscoverySession(clientId, formData);
    setPending(false);
    if (result?.error) setErrors(result.error);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6">New Discovery Session</h1>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            name="title"
            required
            placeholder="Initial Discovery — Aug 2026"
            className="w-full border rounded px-3 py-2"
          />
          {errors?.title && <p className="text-red-600 text-sm mt-1">{errors.title[0]}</p>}
        </div>

        {errors?.form && <p className="text-red-600 text-sm">{errors.form[0]}</p>}

        <button
          disabled={pending}
          className="rounded bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create Session"}
        </button>
      </form>
    </div>
  );
}