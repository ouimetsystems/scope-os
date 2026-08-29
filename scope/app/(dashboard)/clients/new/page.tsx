"use client";

import { useState } from "react";
import { createClientRecord } from "../actions";

export default function NewClientPage() {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await createClientRecord(formData);
    setPending(false);
    if (result?.error) setErrors(result.error);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6">New Client</h1>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Company Name *</label>
          <input name="company_name" required className="w-full border rounded px-3 py-2" />
          {errors?.company_name && (
            <p className="text-red-600 text-sm mt-1">{errors.company_name[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Industry</label>
          <input name="industry" className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select name="status" defaultValue="prospect" className="w-full border rounded px-3 py-2">
            <option value="prospect">Prospect</option>
            <option value="production">Production</option>
            <option value="current">Current</option>
            <option value="paused">Paused</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <input name="website" placeholder="https://example.com" className="w-full border rounded px-3 py-2" />
          {errors?.website && (
            <p className="text-red-600 text-sm mt-1">{errors.website[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea name="notes" rows={4} className="w-full border rounded px-3 py-2" />
        </div>

        {errors?.form && <p className="text-red-600 text-sm">{errors.form[0]}</p>}

        <button
          disabled={pending}
          className="rounded bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Create Client"}
        </button>
      </form>
    </div>
  );
}