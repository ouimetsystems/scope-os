"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFeatureFromLibrary,
  createCustomFeature,
  linkProblemToFeature,
  unlinkProblemFromFeature,
  updateFeatureDetails,
  updateFeatureDevStatus,
  updateFeatureTestStatus,
  deleteFeature,
} from "@/app/(dashboard)/features/project-actions";

type Feature = {
  id: string;
  name: string;
  description: string | null;
  user_flow: string | null;
  notes: string | null;
  price: number | null;
  recurring_price: number | null;
  dev_status: string;
  test_status: string;
  problem_features: { problem_id: string; problems: { id: string; title: string } }[];
};

type LibraryFeature = { id: string; name: string; category: string | null };

const devColors: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  in_development: "bg-yellow-100 text-yellow-800",
  needs_testing: "bg-blue-100 text-blue-800",
  complete: "bg-green-100 text-green-800",
};

const testColors: Record<string, string> = {
  unconfirmed: "bg-gray-100 text-gray-700",
  needs_fixing: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
};

export default function FeaturesClient({
  projectId,
  features,
  library,
  bugCountByFeature,
}: {
  projectId: string;
  features: Feature[];
  library: LibraryFeature[];
  bugCountByFeature: Record<string, number>;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  const oneTimeTotal = features.reduce((sum, f) => sum + (f.price ?? 0), 0);
  const monthlyTotal = features.reduce((sum, f) => sum + (f.recurring_price ?? 0), 0);
  const unpriced = features.filter((f) => f.price == null && f.recurring_price == null);

  async function handleDrop(e: React.DragEvent, featureId: string) {
    e.preventDefault();
    const problemId = e.dataTransfer.getData("problemId");
    if (problemId) {
      await linkProblemToFeature(problemId, featureId, projectId);
      refresh();
    }
    setDragOverId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900">Features</h2>
        <button
          onClick={() => setAdding(!adding)}
          className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800"
        >
          {adding ? "Cancel" : "+ Add Feature"}
        </button>
      </div>

      <div className="flex gap-4 text-sm bg-gray-50 border rounded-lg p-3 mb-4">
        <span>
          <span className="text-gray-600">One-time:</span>{" "}
          <span className="font-medium text-gray-900">${oneTimeTotal.toFixed(2)}</span>
        </span>
        <span>
          <span className="text-gray-600">Monthly:</span>{" "}
          <span className="font-medium text-gray-900">${monthlyTotal.toFixed(2)}/mo</span>
        </span>
        {unpriced.length > 0 && (
          <span className="text-yellow-700">{unpriced.length} need pricing</span>
        )}
      </div>

      {adding && (
        <AddFeaturePanel
          projectId={projectId}
          library={library}
          onDone={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}

      <p className="text-xs text-gray-500 mb-2">Drag a Problem here from the Problems tab to link it.</p>

      <div className="space-y-2">
        {features.length === 0 && <p className="text-sm text-gray-500">No features yet.</p>}
        {features.map((f) => (
          <div
            key={f.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverId(f.id);
            }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={(e) => handleDrop(e, f.id)}
            className={`border rounded-lg p-3 ${dragOverId === f.id ? "border-blue-400 bg-blue-50" : ""}`}
          >
            <div
              className="flex items-start justify-between gap-2 cursor-pointer"
              onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{f.name}</p>
                {f.description && <p className="text-xs text-gray-600">{f.description}</p>}
                <div className="flex flex-wrap gap-1 mt-1">
                  {f.problem_features.map((pf) => (
                    <span key={pf.problem_id} className="text-xs bg-orange-50 text-orange-700 rounded-full px-2 py-0.5">
                      {pf.problems?.title}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {bugCountByFeature[f.id] > 0 && (
                  <span className="text-xs text-red-700">{bugCountByFeature[f.id]} open bugs</span>
                )}
                <select
                  value={f.dev_status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={async (e) => {
                    await updateFeatureDevStatus(f.id, projectId, e.target.value);
                    refresh();
                  }}
                  className={`text-xs rounded-full px-2 py-1 border-none ${devColors[f.dev_status]}`}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_development">In Development</option>
                  <option value="needs_testing">Needs Testing</option>
                  <option value="complete">Complete</option>
                </select>
                <select
                  value={f.test_status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={async (e) => {
                    await updateFeatureTestStatus(f.id, projectId, e.target.value);
                    refresh();
                  }}
                  className={`text-xs rounded-full px-2 py-1 border-none ${testColors[f.test_status]}`}
                >
                  <option value="unconfirmed">Unconfirmed</option>
                  <option value="needs_fixing">Needs Fixing</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
            </div>

            {expandedId === f.id && (
              <FeatureDetailForm
                feature={f}
                projectId={projectId}
                onDone={refresh}
                onUnlink={async (problemId) => {
                  await unlinkProblemFromFeature(problemId, f.id, projectId);
                  refresh();
                }}
                onDelete={async () => {
                  if (confirm("Delete this feature?")) {
                    await deleteFeature(f.id, projectId);
                    refresh();
                  }
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AddFeaturePanel({
  projectId,
  library,
  onDone,
}: {
  projectId: string;
  library: LibraryFeature[];
  onDone: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = library.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="border rounded-lg p-3 bg-gray-50 mb-4 space-y-3">
      <form
        action={async (formData) => {
          await createCustomFeature(projectId, formData);
          onDone();
        }}
        className="flex gap-2"
      >
        <input
          name="name"
          placeholder="Custom feature name *"
          required
          className="flex-1 border rounded px-3 py-2 text-sm text-gray-900"
        />
        <input
          name="description"
          placeholder="Description"
          className="flex-1 border rounded px-3 py-2 text-sm text-gray-900"
        />
        <button className="rounded bg-black text-white px-3 py-2 text-sm hover:bg-gray-800 shrink-0">
          Add
        </button>
      </form>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Or search the feature library..."
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto bg-white">
        {filtered.map((f) => (
          <button
            key={f.id}
            onClick={async () => {
              await createFeatureFromLibrary(projectId, f.id);
              onDone();
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-900"
          >
            {f.name} <span className="text-xs text-gray-400">({f.category})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FeatureDetailForm({
  feature,
  projectId,
  onDone,
  onUnlink,
  onDelete,
}: {
  feature: Feature;
  projectId: string;
  onDone: () => void;
  onUnlink: (problemId: string) => void;
  onDelete: () => void;
}) {
  const [pending, setPending] = useState(false);

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      {feature.problem_features.length > 0 && (
        <div>
          <p className="text-xs text-gray-600 mb-1">Linked Problems:</p>
          <div className="flex flex-wrap gap-1">
            {feature.problem_features.map((pf) => (
              <span
                key={pf.problem_id}
                className="text-xs bg-orange-50 text-orange-700 rounded-full px-2 py-0.5 flex items-center gap-1"
              >
                {pf.problems?.title}
                <button onClick={() => onUnlink(pf.problem_id)} className="text-orange-400 hover:text-red-600">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <form
        action={async (formData) => {
          setPending(true);
          await updateFeatureDetails(feature.id, projectId, formData);
          setPending(false);
          onDone();
        }}
        className="space-y-2"
      >
        <input
          name="name"
          defaultValue={feature.name}
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
        <textarea
          name="description"
          defaultValue={feature.description ?? ""}
          placeholder="Description"
          rows={2}
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
        <textarea
          name="user_flow"
          defaultValue={feature.user_flow ?? ""}
          placeholder="User flow (step by step)"
          rows={3}
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={feature.price ?? ""}
            placeholder="One-time $"
            className="border rounded px-2 py-1.5 text-sm text-gray-900"
          />
          <input
            name="recurring_price"
            type="number"
            step="0.01"
            defaultValue={feature.recurring_price ?? ""}
            placeholder="Monthly $"
            className="border rounded px-2 py-1.5 text-sm text-gray-900"
          />
        </div>
        <textarea
          name="notes"
          defaultValue={feature.notes ?? ""}
          placeholder="Notes"
          rows={2}
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
        <div className="flex gap-2">
          <button
            disabled={pending}
            className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={onDelete} className="text-xs text-red-600 hover:text-red-800 ml-auto">
            Delete Feature
          </button>
        </div>
      </form>
    </div>
  );
}