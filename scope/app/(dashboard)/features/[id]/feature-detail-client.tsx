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
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Feature Name</label>
        <input
          name="name"
          defaultValue={feature.name}
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          defaultValue={feature.description ?? ""}
          rows={3}
          placeholder="What this feature does, for the client and for the SOW..."
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">User Flow</label>
        <textarea
          name="user_flow"
          defaultValue={feature.user_flow ?? ""}
          rows={4}
          placeholder={"Step by step, e.g.\n1. User opens inventory\n2. Selects product\n3. Enters quantity\n4. Saves"}
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
      </div>

      <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
        <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Pricing (used in Quotes & SOW)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-700 mb-1">One-time Price</label>
            <input
              name="price"
              type="number"
              step="0.01"
              defaultValue={feature.price ?? ""}
              placeholder="e.g. 500"
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700 mb-1">Monthly Price</label>
            <input
              name="recurring_price"
              type="number"
              step="0.01"
              defaultValue={feature.recurring_price ?? ""}
              placeholder="e.g. 20"
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
            />
          </div>
        </div>
        {feature.price == null && feature.recurring_price == null && (
          <p className="text-xs text-yellow-700">Not applied to Quote/SOW yet — needs a price.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
        <textarea
          name="notes"
          defaultValue={feature.notes ?? ""}
          rows={3}
          placeholder="Anything worth remembering — not shown to the client"
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        {savedAt && <span className="text-xs text-gray-700">Saved at {savedAt}</span>}
      </div>
    </form>
  );
}