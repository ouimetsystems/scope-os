"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addFeatureFromLibrary,
  addCustomFeature,
  updateSolutionFeaturePrice,
  removeSolutionFeature,
} from "@/app/(dashboard)/solutions/actions";

type SolutionFeature = {
  id: string;
  feature_library_id: string | null;
  name: string;
  description: string | null;
  complexity: string;
  price: number | null;
  recurring_price: number | null;
};

type LibraryFeature = {
  id: string;
  name: string;
  category: string | null;
  is_included: boolean;
  base_price: number | null;
  recurring_price: number | null;
};

type Dependency = {
  id: string;
  feature_id: string;
  depends_on_feature_id: string;
};

export default function FeaturesPanel({
  solutionId,
  solutionFeatures,
  library,
  dependencies,
}: {
  solutionId: string;
  clientId: string;
  solutionFeatures: SolutionFeature[];
  library: LibraryFeature[];
  dependencies: Dependency[];
}) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);

  const usedLibraryIds = new Set(solutionFeatures.map((f) => f.feature_library_id).filter(Boolean));
  const availableLibrary = library.filter((f) => !usedLibraryIds.has(f.id));

  const grouped = availableLibrary.reduce<Record<string, LibraryFeature[]>>((acc, f) => {
    const key = f.category ?? "Other";
    acc[key] = acc[key] ? [...acc[key], f] : [f];
    return acc;
  }, {});

  const oneTimeTotal = solutionFeatures.reduce((sum, f) => sum + (f.price ?? 0), 0);
  const monthlyTotal = solutionFeatures.reduce((sum, f) => sum + (f.recurring_price ?? 0), 0);
  const unpriced = solutionFeatures.filter((f) => f.price == null && f.recurring_price == null);

  async function handlePick(libraryFeature: LibraryFeature) {
    await addFeatureFromLibrary(solutionId, libraryFeature.id);
    router.refresh();

    // suggest dependencies
    const deps = dependencies.filter((d) => d.feature_id === libraryFeature.id);
    for (const dep of deps) {
      const alreadyHas = solutionFeatures.some((f) => f.feature_library_id === dep.depends_on_feature_id);
      if (!alreadyHas) {
        const depFeature = library.find((f) => f.id === dep.depends_on_feature_id);
        if (depFeature && confirm(`"${libraryFeature.name}" requires "${depFeature.name}". Add it too?`)) {
          await addFeatureFromLibrary(solutionId, depFeature.id);
          router.refresh();
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 text-sm bg-gray-50 border rounded-lg p-3">
        <span>
          <span className="text-gray-500">One-time:</span>{" "}
          <span className="font-medium">${oneTimeTotal.toFixed(2)}</span>
        </span>
        <span>
          <span className="text-gray-500">Monthly:</span>{" "}
          <span className="font-medium">${monthlyTotal.toFixed(2)}/mo</span>
        </span>
        {unpriced.length > 0 && (
          <span className="text-yellow-700">
            {unpriced.length} feature{unpriced.length > 1 ? "s" : ""} need pricing
          </span>
        )}
      </div>

      <div className="space-y-2">
        {solutionFeatures.length === 0 && (
          <p className="text-sm text-gray-400">No features added yet.</p>
        )}
        {solutionFeatures.map((f) => (
          <FeatureRow key={f.id} feature={f} solutionId={solutionId} onChanged={() => router.refresh()} />
        ))}
      </div>

      <div className="border-t pt-4 flex gap-3">
        <button onClick={() => setPicking(!picking)} className="text-sm text-blue-600 hover:underline">
          {picking ? "Hide library" : "+ Add from Library"}
        </button>
        <button
          onClick={() => setAddingCustom(!addingCustom)}
          className="text-sm text-blue-600 hover:underline"
        >
          {addingCustom ? "Cancel" : "+ Add Custom Feature"}
        </button>
      </div>

      {addingCustom && (
        <CustomFeatureForm
          solutionId={solutionId}
          onDone={() => {
            setAddingCustom(false);
            router.refresh();
          }}
        />
      )}

      {picking && (
        <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
          {Object.keys(grouped).length === 0 && (
            <p className="p-3 text-sm text-gray-400">No more library features to add.</p>
          )}
          {Object.entries(grouped).map(([category, feats]) => (
            <div key={category}>
              <p className="px-3 pt-2 text-xs font-semibold text-gray-400 uppercase">{category}</p>
              {feats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handlePick(f)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between"
                >
                  <span>
                    {f.name}
                    {f.is_included && <span className="text-xs text-green-600 ml-2">(included)</span>}
                  </span>
                  {!f.is_included && (
                    <span className="text-gray-500 text-xs">
                      {f.base_price != null ? `$${f.base_price}` : "no price"}
                      {f.recurring_price != null && ` +$${f.recurring_price}/mo`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureRow({
  feature,
  solutionId,
  onChanged,
}: {
  feature: SolutionFeature;
  solutionId: string;
  onChanged: () => void;
}) {
  const [price, setPrice] = useState(feature.price?.toString() ?? "");
  const [recurring, setRecurring] = useState(feature.recurring_price?.toString() ?? "");
  const needsEstimate = feature.price == null && feature.recurring_price == null;

  async function savePrice() {
    await updateSolutionFeaturePrice(
      feature.id,
      solutionId,
      price === "" ? null : parseFloat(price),
      recurring === "" ? null : parseFloat(recurring)
    );
    onChanged();
  }

  return (
    <div className={`border rounded-lg p-3 ${needsEstimate ? "border-yellow-300 bg-yellow-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{feature.name}</p>
          {feature.description && <p className="text-xs text-gray-500">{feature.description}</p>}
          {needsEstimate && (
            <p className="text-xs text-yellow-700 mt-1">Not applied — needs a price estimate</p>
          )}
        </div>
        <button
          onClick={async () => {
            await removeSolutionFeature(feature.id, solutionId);
            onChanged();
          }}
          className="text-xs text-red-500 hover:text-red-700 shrink-0"
        >
          Remove
        </button>
      </div>
      <div className="flex gap-2 mt-2">
        <input
          type="number"
          step="0.01"
          placeholder="One-time $"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={savePrice}
          className="w-32 border rounded px-2 py-1 text-sm"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Monthly $"
          value={recurring}
          onChange={(e) => setRecurring(e.target.value)}
          onBlur={savePrice}
          className="w-32 border rounded px-2 py-1 text-sm"
        />
      </div>
    </div>
  );
}

function CustomFeatureForm({ solutionId, onDone }: { solutionId: string; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await addCustomFeature(solutionId, formData);
    setPending(false);
    if (result?.error) {
      setErrors(result.error as Record<string, string[]>);
      return;
    }
    onDone();
  }

  return (
    <form action={handleSubmit} className="space-y-2 border rounded-lg p-3 bg-gray-50">
      <input
        name="name"
        placeholder="Feature name *"
        required
        className="w-full border rounded px-3 py-2 text-sm"
      />
      {errors?.name && <p className="text-red-600 text-xs">{errors.name[0]}</p>}
      <textarea
        name="description"
        placeholder="Description"
        rows={2}
        className="w-full border rounded px-3 py-2 text-sm"
      />
      <select name="complexity" defaultValue="medium" className="w-full border rounded px-3 py-2 text-sm">
        <option value="low">Low complexity</option>
        <option value="medium">Medium complexity</option>
        <option value="high">High complexity</option>
      </select>
      <div className="flex gap-2">
        <input
          name="price"
          type="number"
          step="0.01"
          placeholder="One-time $ (optional)"
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <input
          name="recurring_price"
          type="number"
          step="0.01"
          placeholder="Monthly $ (optional)"
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add Feature"}
        </button>
        <button type="button" onClick={onDone} className="rounded border px-3 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}