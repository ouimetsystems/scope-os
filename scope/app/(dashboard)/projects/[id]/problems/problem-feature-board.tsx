"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProblem, updateProblemStatus, deleteProblem } from "@/app/(dashboard)/problems/actions";
import {
  createFeatureFromProblem,
  createFeatureFromLibrary,
  createCustomFeature,
  linkProblemToFeature,
  unlinkProblemFromFeature,
  updateProblemTitle,
  updateFeatureDevStatus,
  updateFeatureTestStatus,
  deleteFeature,
} from "@/app/(dashboard)/features/project-actions";
import Link from "next/dist/client/link";

type LibFeature = { id: string; name: string; category: string | null };

type Problem = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "addressed" | "wont_fix";
  problem_features: { feature_id: string; features: { id: string; name: string } }[];
};

type Feature = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  recurring_price: number | null;
  dev_status: string;
  test_status: string;
  problem_features: { problem_id: string; problems: { id: string; title: string } }[];
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  addressed: "bg-green-100 text-green-800",
  wont_fix: "bg-gray-200 text-gray-700",
};

const devColors: Record<string, string> = {
  not_started: "bg-gray-200 text-gray-700",
  in_development: "bg-yellow-100 text-yellow-800",
  needs_testing: "bg-blue-100 text-blue-800",
  complete: "bg-green-100 text-green-800",
};

const testColors: Record<string, string> = {
  unconfirmed: "bg-gray-200 text-gray-700",
  needs_fixing: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
};

export default function ProblemFeatureBoard({
  clientId,
  projectId,
  problems,
  features,
  library,
}: {
  clientId: string;
  projectId: string;
  problems: Problem[];
  features: Feature[];
  library: LibFeature[];
}) {
  const router = useRouter();
  const [addingProblem, setAddingProblem] = useState(false);
  const [addingFeature, setAddingFeature] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dragOverFeature, setDragOverFeature] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  const filteredProblems = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.trim().toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleDrop(e: React.DragEvent, featureId: string) {
    e.preventDefault();
    const problemId = e.dataTransfer.getData("problemId");
    if (problemId) {
      const result = await linkProblemToFeature(problemId, featureId, projectId);
      if (result?.error) alert("Error linking: " + result.error);
      refresh();
    }
    setDragOverFeature(null);
  }

  const oneTimeTotal = features.reduce((sum, f) => sum + (f.price ?? 0), 0);
  const monthlyTotal = features.reduce((sum, f) => sum + (f.recurring_price ?? 0), 0);

  return (
    <div>
      <div className="flex gap-4 text-sm bg-gray-50 border rounded-lg p-3 mb-4">
        <span>
          <span className="text-gray-700">One-time:</span>{" "}
          <span className="font-medium text-gray-900">${oneTimeTotal.toFixed(2)}</span>
        </span>
        <span>
          <span className="text-gray-700">Monthly:</span>{" "}
          <span className="font-medium text-gray-900">${monthlyTotal.toFixed(2)}/mo</span>
        </span>
        <span className="text-gray-600 ml-auto">Drag a Problem onto a Feature to link them</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">Problems</h2>
            {!addingProblem && (
              <button
                type="button"
                onClick={() => setAddingProblem(true)}
                className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800"
              >
                + Add
              </button>
            )}
          </div>

          {addingProblem && (
            <ProblemForm
              clientId={clientId}
              projectId={projectId}
              onDone={() => {
                setAddingProblem(false);
                refresh();
              }}
            />
          )}

          <div className="flex gap-2 mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 border rounded px-3 py-1.5 text-sm text-gray-900"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm text-gray-900"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="addressed">Addressed</option>
              <option value="wont_fix">Won't Fix</option>
            </select>
          </div>

          {filteredProblems.length === 0 && <p className="text-sm text-gray-600">No problems.</p>}

          <div className="space-y-2">
            {filteredProblems.map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("problemId", p.id)}
                className="border rounded-lg p-3 cursor-move bg-white hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <EditableTitle
                    title={p.title}
                    onSave={async (newTitle) => {
                      const result = await updateProblemTitle(p.id, projectId, newTitle);
                      if (result?.error) alert("Error: " + result.error);
                      refresh();
                    }}
                  />
                  <select
                    value={p.status}
                    onChange={async (e) => {
                      const result = await updateProblemStatus(p.id, projectId, e.target.value);
                      if (result?.error) alert("Error: " + result.error);
                      refresh();
                    }}
                    className={`text-xs rounded-full px-2 py-1 border-none shrink-0 ${statusColors[p.status]}`}
                  >
                    <option value="open">Open</option>
                    <option value="addressed">Addressed</option>
                    <option value="wont_fix">Won't Fix</option>
                  </select>
                </div>

                {p.description && <p className="text-xs text-gray-700 mt-1">{p.description}</p>}

                {p.problem_features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.problem_features.map((pf) => (
                      <span key={pf.feature_id} className="text-xs bg-blue-50 text-blue-800 rounded-full px-2 py-0.5">
                        → {pf.features?.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <QuickCreateFeature
                    problemTitle={p.title}
                    onCreate={async (name, description) => {
                      const result = await createFeatureFromProblem(projectId, p.id, name, description);
                      if (result?.error) {
                        alert("Error creating feature: " + result.error);
                      } else {
                        refresh();
                      }
                    }}
                  />
                  {features.length > 0 && (
                    <LinkExistingFeature
                      alreadyLinked={p.problem_features.map((pf) => pf.feature_id)}
                      features={features}
                      onLink={async (featureId) => {
                        const result = await linkProblemToFeature(p.id, featureId, projectId);
                        if (result?.error) alert("Error: " + result.error);
                        refresh();
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm("Delete this problem?")) {
                        const result = await deleteProblem(p.id, projectId);
                        if (result?.error) alert("Error: " + result.error);
                        refresh();
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-800 ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">Features</h2>
            <button
              type="button"
              onClick={() => setAddingFeature((v) => !v)}
              className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800"
            >
              {addingFeature ? "Cancel" : "+ Add"}
            </button>
          </div>

          {addingFeature && (
            <AddFeaturePanel
              projectId={projectId}
              library={library}
              onDone={() => {
                setAddingFeature(false);
                refresh();
              }}
            />
          )}

          {features.length === 0 && <p className="text-sm text-gray-600">No features yet.</p>}

          <div className="space-y-2">
            {features.map((f) => (
              <div
                key={f.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverFeature(f.id);
                }}
                onDragLeave={() => setDragOverFeature(null)}
                onDrop={(e) => handleDrop(e, f.id)}
                className={`border rounded-lg p-3 bg-white ${
                  dragOverFeature === f.id ? "border-blue-500 bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/features/${f.id}`}
                    className="text-sm font-medium text-gray-900 hover:underline"
                    >
                      {f.name} →
                    </Link>
                    {f.description && <p className="text-xs text-gray-700">{f.description}</p>}
                    {f.problem_features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {f.problem_features.map((pf) => (
                          <span
                            key={pf.problem_id}
                            className="text-xs bg-orange-50 text-orange-800 rounded-full px-2 py-0.5 flex items-center gap-1"
                          >
                            {pf.problems?.title}
                            <button
                              type="button"
                              onClick={async () => {
                                const result = await unlinkProblemFromFeature(pf.problem_id, f.id, projectId);
                                if (result?.error) alert("Error: " + result.error);
                                refresh();
                              }}
                              className="text-orange-500 hover:text-red-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm("Delete this feature?")) {
                        const result = await deleteFeature(f.id, projectId);
                        if (result?.error) alert("Error: " + result.error);
                        refresh();
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-800 shrink-0"
                  >
                    Delete
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <select
                    value={f.dev_status}
                    onChange={async (e) => {
                      const result = await updateFeatureDevStatus(f.id, projectId, e.target.value);
                      if (result?.error) alert("Error: " + result.error);
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
                    onChange={async (e) => {
                      const result = await updateFeatureTestStatus(f.id, projectId, e.target.value);
                      if (result?.error) alert("Error: " + result.error);
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableTitle({ title, onSave }: { title: string; onSave: (newTitle: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (value.trim() && value !== title) onSave(value.trim());
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setValue(title);
            setEditing(false);
          }
        }}
        className="text-sm font-medium text-gray-900 border rounded px-2 py-1 flex-1"
      />
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      title="Click to edit"
      className="text-sm font-medium text-gray-900 cursor-text hover:bg-gray-50 rounded px-1 -mx-1 flex-1"
    >
      {title}
    </p>
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
    setPending(true);
    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    const result = await createProblem(clientId, projectId, formData);
    setPending(false);
    if (result?.error) {
      alert("Error: " + JSON.stringify(result.error));
      return;
    }
    onDone();
  }

  return (
    <div className="space-y-2 border rounded-lg p-3 bg-gray-50 mb-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Problem title *"
        autoFocus
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleSubmit}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Add"}
        </button>
        <button type="button" onClick={onDone} className="rounded border px-3 py-1.5 text-sm text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}

function QuickCreateFeature({
  problemTitle,
  onCreate,
}: {
  problemTitle: string;
  onCreate: (name: string, description: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(problemTitle);
  const [description, setDescription] = useState("");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-blue-600 hover:underline">
        + Create Feature
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
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
          type="button"
          onClick={() => {
            if (!name.trim()) {
              alert("Name is required");
              return;
            }
            onCreate(name, description);
            setOpen(false);
          }}
          className="text-xs bg-black text-white rounded px-2 py-1"
        >
          Create
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}

function LinkExistingFeature({
  features,
  alreadyLinked,
  onLink,
}: {
  features: Feature[];
  alreadyLinked: string[];
  onLink: (featureId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = features.filter((f) => !alreadyLinked.includes(f.id));

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-blue-600 hover:underline">
        Link Feature
      </button>
    );
  }

  return (
    <select
      autoFocus
      onChange={(e) => {
        if (e.target.value) {
          onLink(e.target.value);
          setOpen(false);
        }
      }}
      onBlur={() => setOpen(false)}
      defaultValue=""
      className="text-xs border rounded px-2 py-1 text-gray-900"
    >
      <option value="" disabled>
        Select...
      </option>
      {options.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}

function AddFeaturePanel({
  projectId,
  library,
  onDone,
}: {
  projectId: string;
  library: LibFeature[];
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const filtered = library.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  async function handleAddCustom() {
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    setPending(true);
    const formData = new FormData();
    formData.set("name", name);
    const result = await createCustomFeature(projectId, formData);
    setPending(false);
    if (result?.error) {
      alert("Error creating feature: " + JSON.stringify(result.error));
      return;
    }
    setName("");
    onDone();
  }

  async function handlePickFromLibrary(featureId: string) {
    const result = await createFeatureFromLibrary(projectId, featureId);
    if (result?.error) {
      alert("Error: " + result.error);
      return;
    }
    onDone();
  }

  return (
    <div className="border rounded-lg p-3 bg-gray-50 mb-3 space-y-2">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Custom feature name *"
          className="flex-1 border rounded px-3 py-2 text-sm text-gray-900"
        />
        <button
          type="button"
          disabled={pending}
          onClick={handleAddCustom}
          className="rounded bg-black text-white px-3 py-2 text-sm hover:bg-gray-800 shrink-0 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add"}
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Or search feature library..."
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      <div className="border rounded-lg divide-y max-h-40 overflow-y-auto bg-white">
        {filtered.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handlePickFromLibrary(f.id)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-900"
          >
            {f.name} <span className="text-xs text-gray-600">({f.category})</span>
          </button>
        ))}
      </div>
    </div>
  );
}