"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFeature,
  updateFeature,
  retireFeature,
  reactivateFeature,
  addDependency,
  removeDependency,
} from "../library-actions";

type Feature = {
  id: string;
  name: string;
  description: string | null;
  complexity: "low" | "medium" | "high";
  base_price: number | null;
  recurring_price: number | null;
  typical_hours: number | null;
  is_active: boolean;
};

type Dependency = {
  id: string;
  feature_id: string;
  depends_on_feature_id: string;
};

export default function LibraryClient({
  features,
  dependencies,
}: {
  features: Feature[];
  dependencies: Dependency[];
}) {
  const router = useRouter();
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [depFeatureId, setDepFeatureId] = useState<string | null>(null);

  const visible = features.filter((f) => showInactive || f.is_active);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-500">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show retired features
        </label>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Feature
          </button>
        )}
      </div>

      {adding && (
        <FeatureForm
          onDone={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}

      <div className="border rounded-lg divide-y">
        {visible.map((f) =>
          editingId === f.id ? (
            <div key={f.id} className="p-4">
              <FeatureForm
                feature={f}
                onDone={() => {
                  setEditingId(null);
                  refresh();
                }}
              />
            </div>
          ) : (
            <div key={f.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`font-medium text-sm ${!f.is_active ? "text-gray-400 line-through" : ""}`}>
                    {f.name}
                    <span className="text-xs text-gray-400 ml-2">({f.complexity})</span>
                  </p>
                  {f.description && <p className="text-sm text-gray-500 mt-0.5">{f.description}</p>}
                  <p className="text-sm text-gray-600 mt-1">
                    {f.base_price != null ? `$${f.base_price}` : "No price set"}
                    {f.recurring_price != null && ` + $${f.recurring_price}/mo`}
                    {f.typical_hours != null && (
                      <span className="text-gray-400"> · ~{f.typical_hours}h</span>
                    )}
                  </p>

                  <DependencyList
                    featureId={f.id}
                    features={features}
                    dependencies={dependencies.filter((d) => d.feature_id === f.id)}
                    picking={depFeatureId === f.id}
                    onTogglePick={() => setDepFeatureId(depFeatureId === f.id ? null : f.id)}
                    onChanged={refresh}
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditingId(f.id)}
                    className="text-xs text-gray-500 hover:text-black"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (f.is_active) await retireFeature(f.id);
                      else await reactivateFeature(f.id);
                      refresh();
                    }}
                    className="text-xs text-gray-500 hover:text-black"
                  >
                    {f.is_active ? "Retire" : "Reactivate"}
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function FeatureForm({
  feature,
  onDone,
}: {
  feature?: Feature;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = feature
      ? await updateFeature(feature.id, formData)
      : await createFeature(formData);
    setPending(false);
    if (result?.error) {
      setErrors(result.error as Record<string, string[]>);
      return;
    }
    onDone();
  }

  return (
    <form action={handleSubmit} className="space-y-3 border rounded-lg p-4 bg-gray-50">
      <div>
        <input
          name="name"
          placeholder="Feature name *"
          required
          defaultValue={feature?.name}
          className="w-full border rounded px-3 py-2 text-sm"
        />
        {errors?.name && <p className="text-red-600 text-xs mt-1">{errors.name[0]}</p>}
      </div>

      <textarea
        name="description"
        placeholder="Description"
        rows={2}
        defaultValue={feature?.description ?? ""}
        className="w-full border rounded px-3 py-2 text-sm"
      />

      <select
        name="complexity"
        defaultValue={feature?.complexity ?? "medium"}
        className="w-full border rounded px-3 py-2 text-sm"
      >
        <option value="low">Low complexity</option>
        <option value="medium">Medium complexity</option>
        <option value="high">High complexity</option>
      </select>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-gray-500">One-time price</label>
          <input
            name="base_price"
            type="number"
            step="0.01"
            placeholder="e.g. 500"
            defaultValue={feature?.base_price ?? ""}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Monthly price</label>
          <input
            name="recurring_price"
            type="number"
            step="0.01"
            placeholder="e.g. 20"
            defaultValue={feature?.recurring_price ?? ""}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Typical hours</label>
          <input
            name="typical_hours"
            type="number"
            step="0.5"
            placeholder="e.g. 8"
            defaultValue={feature?.typical_hours ?? ""}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      {errors?.form && <p className="text-red-600 text-xs">{errors.form[0]}</p>}

      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : feature ? "Save" : "Add Feature"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded border px-3 py-1.5 text-sm hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function DependencyList({
  featureId,
  features,
  dependencies,
  picking,
  onTogglePick,
  onChanged,
}: {
  featureId: string;
  features: Feature[];
  dependencies: Dependency[];
  picking: boolean;
  onTogglePick: () => void;
  onChanged: () => void;
}) {
  const options = features.filter(
    (f) => f.id !== featureId && !dependencies.some((d) => d.depends_on_feature_id === f.id)
  );

  return (
    <div className="mt-2">
      {dependencies.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {dependencies.map((d) => {
            const dep = features.find((f) => f.id === d.depends_on_feature_id);
            return (
              <span
                key={d.id}
                className="text-xs bg-gray-100 rounded-full px-2 py-0.5 flex items-center gap-1"
              >
                requires: {dep?.name ?? "unknown"}
                <button
                  onClick={async () => {
                    await removeDependency(d.id);
                    onChanged();
                  }}
                  className="text-gray-400 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {picking ? (
        <select
          onChange={async (e) => {
            if (e.target.value) {
              await addDependency(featureId, e.target.value);
              onChanged();
              onTogglePick();
            }
          }}
          defaultValue=""
          className="text-xs border rounded px-2 py-1"
        >
          <option value="" disabled>
            Select a dependency...
          </option>
          {options.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      ) : (
        <button onClick={onTogglePick} className="text-xs text-blue-600 hover:underline">
          + Add dependency
        </button>
      )}
    </div>
  );
}