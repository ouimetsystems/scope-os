"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateClientRecord } from "../../actions";

type Client = {
  id: string;
  company_name: string;
  industry: string | null;
  status: string;
  website: string | null;
  notes: string | null;
};

export default function EditClientForm({ client }: { client: Client }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await updateClientRecord(client.id, formData);
    setPending(false);
    if (result?.error) {
      setErrors(result.error);
      return;
    }
    router.push(`/clients/${client.id}`);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Company Name *</label>
        <input
          name="company_name"
          required
          defaultValue={client.company_name}
          className="w-full border rounded px-3 py-2"
        />
        {errors?.company_name && (
          <p className="text-red-600 text-sm mt-1">{errors.company_name[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Industry</label>
        <input
          name="industry"
          defaultValue={client.industry ?? ""}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          name="status"
          defaultValue={client.status}
          className="w-full border rounded px-3 py-2"
        >
          <option value="prospect">Prospect</option>
          <option value="production">Production</option>
          <option value="current">Current</option>
          <option value="paused">Paused</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Website</label>
        <input
          name="website"
          defaultValue={client.website ?? ""}
          className="w-full border rounded px-3 py-2"
        />
        {errors?.website && (
          <p className="text-red-600 text-sm mt-1">{errors.website[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          rows={4}
          defaultValue={client.notes ?? ""}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {errors?.form && <p className="text-red-600 text-sm">{errors.form[0]}</p>}

      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/clients/${client.id}`)}
          className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}