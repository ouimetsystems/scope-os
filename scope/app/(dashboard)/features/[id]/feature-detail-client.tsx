"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateFeatureDetails } from "@/app/(dashboard)/features/project-actions";

type Feature = {
  id: string;
  name: string;
  description: string | null;
  user_flow: string | null;
  notes: string | null;
  price: number | null;
  recurring_price: number | null;
  complexity: string;
};

export default function FeatureDetailClient({
  feature,
  projectId,
}: {
  feature: Feature;
  projectId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const result = await updateFeatureDetails(feature.id, projectId, formData);
    setPending(false);
    if (result?.error) {
      alert("Error: " + result.error);
      return;
    }
    setSavedAt(new Date().toLocaleTimeString());
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-3 border rounded-lg p-4 bg-gray-50">
      <div>
        <input
          name="name"
          placeholder="Feature name *"
          required
          defaultValue={feature.name}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <textarea
        name="description"
        placeholder="Description"
        rows={2}
        defaultValue={feature.description ?? ""}
        className="w-full border rounded px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-700">One-time price</label>
          <input
            name="price"
            type="number"
            step="0.01"
            placeholder="e.g. 500"
            defaultValue={feature.price ?? ""}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-700">Monthly price</label>
          <input
            name="recurring_price"
            type="number"
            step="0.01"
            placeholder="e.g. 20"
            defaultValue={feature.recurring_price ?? ""}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>
      {feature.price == null && feature.recurring_price == null && (
        <p className="text-xs text-yellow-700">Not applied to Quote/SOW yet — needs a price.</p>
      )}

      <div>
        <label className="text-xs text-gray-700">User Flow</label>
        <textarea
          name="user_flow"
          defaultValue={feature.user_flow ?? ""}
          rows={4}
          placeholder={"Step by step, e.g.\n1. User opens inventory\n2. Selects product\n3. Enters quantity\n4. Saves"}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-gray-700">Internal Notes</label>
        <textarea
          name="notes"
          defaultValue={feature.notes ?? ""}
          rows={2}
          placeholder="Anything worth remembering — not shown to the client"
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        {savedAt && <span className="text-xs text-gray-700">Saved at {savedAt}</span>}
      </div>
    </form>
  );
}