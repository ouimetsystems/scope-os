"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProblem, updateProblemStatus, deleteProblem } from "./actions";
import { createFeatureFromProblem, linkProblemToFeature } from "@/app/(dashboard)/features/project-actions";

type Feature = { id: string; name: string };

type Problem = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "addressed" | "wont_fix";
  problem_features: { feature_id: string; features: Feature }[];
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  addressed: "bg-green-100 text-green-800",
  wont_fix: "bg-gray-100 text-gray-600",
};

export default function ProblemsSection({
  clientId,
  projectId,
  problems,
  allFeatures,
}: {
  clientId: string;
  projectId: string;
  problems: Problem[];
  allFeatures: Feature[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [creatingFeatureFor, setCreatingFeatureFor] = useState<string | null>(null);
  const [linkingFor, setLinkingFor] = useState<string | null>(null);
  const [dragOverFeature, setDragOverFeature] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  const filtered = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.trim().toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900">Problems</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800"
          >
            + Add Problem
          </button>
        )}
      </div>

      {adding && (
        <ProblemForm
          clientId={clientId}
          projectId={projectId}
          onDone={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}

      <div className="flex gap-2 mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search problems..."
          className="flex-1 border rounded px-3 py-2 text-sm text-gray-900"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm text-gray-900"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="addressed">Addressed</option>
          <option value="wont_fix">Won't Fix</option>
        </select>
      </div>

      {filtered.length === 0 && <p className="text-sm text-gray-500">No problems match.</p>}

      <div className="space-y-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("problemId", p.id)}
            className="border rounded-lg p-3 cursor-move"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{p.title}</p>
                {p.description && <p className="text-xs text-gray-600 mt-0.5">{p.description}</p>}
                {p.problem_features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.problem_features.map((pf) => (
                      <span key={pf.feature_id} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                        {pf.features?.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={p.status}
                  onChange={async (e) => {
                    await updateProblemStatus(p.id, projectId, e.target.value);
                    refresh();
                  }}
                  className={`text-xs rounded-full px-2 py-1 border-none ${statusColors[p.status]}`}
                >
                  <option value="open">Open</option>
                  <option value="addressed">Addressed</option>
                  <option value="wont_fix">Won't Fix</option>
                </select>
                <button
                  onClick={async () => {
                    if (confirm("Delete this problem?")) {
                      await deleteProblem(p.id, projectId);
                      refresh();
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-2 flex gap-3">
              {creatingFeatureFor === p.id ? (
                <QuickFeatureForm
                  problemTitle={p.title}
                  onSubmit={async (name, description) => {
                    await createFeatureFromProblem(projectId, p.id, name, description);
                    setCreatingFeatureFor(null);
                    refresh();
                  }}
                  onCancel={() => setCreatingFeatureFor(null)}
                />
              ) : (
                <button
                  onClick={() => setCreatingFeatureFor(p.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + Create Feature
                </button>
              )}

              {linkingFor === p.id ? (
                <select
                  autoFocus
                  onChange={async (e) => {
                    if (e.target.value) {
                      await linkProblemToFeature(p.id, e.target.value, projectId);
                      setLinkingFor(null);
                      refresh();
                    }
                  }}
                  defaultValue=""
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="" disabled>
                    Select a feature...
                  </option>
                  {allFeatures
                    .filter((f) => !p.problem_features.some((pf) => pf.feature_id === f.id))
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </select>
              ) : (
                <button onClick={() => setLinkingFor(p.id)} className="text-xs text-blue-600 hover:underline">
                  Link Existing Feature
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProblemForm({
  clientId,
  projectId,
  onDone,
}: {
  clientId: string;
  projectId: string;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await createProblem(clientId, projectId, formData);
    setPending(false);
    if (result?.error) {
      setErrors(result.error);
      return;
    }
    onDone();
  }

  return (
    <form action={handleSubmit} className="space-y-2 border rounded-lg p-3 bg-gray-50 mb-3">
      <input
        name="title"
        placeholder="Problem title *"
        required
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      {errors?.title && <p className="text-red-600 text-xs">{errors.title[0]}</p>}
      <textarea
        name="description"
        placeholder="Description"
        rows={2}
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Add Problem"}
        </button>
        <button type="button" onClick={onDone} className="rounded border px-3 py-1.5 text-sm text-gray-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

function QuickFeatureForm({
  problemTitle,
  onSubmit,
  onCancel,
}: {
  problemTitle: string;
  onSubmit: (name: string, description: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(problemTitle);
  const [description, setDescription] = useState("");

  return (
    <div className="flex flex-col gap-1 w-full">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Feature name"
        className="border rounded px-2 py-1 text-xs text-gray-900"
        autoFocus
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="border rounded px-2 py-1 text-xs text-gray-900"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit(name, description)}
          className="text-xs bg-black text-white rounded px-2 py-1"
        >
          Create
        </button>
        <button onClick={onCancel} className="text-xs text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  );
}