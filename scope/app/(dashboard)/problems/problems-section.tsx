"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProblem, updateProblemStatus, deleteProblem } from "./actions";
import { createSolution, updateSolutionStatus } from "@/app/(dashboard)/solutions/actions";

type Solution = {
  id: string;
  title: string;
  status: "proposed" | "selected" | "rejected";
};

type Problem = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "addressed" | "wont_fix";
  solutions: Solution[];
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  addressed: "bg-green-100 text-green-800",
  wont_fix: "bg-gray-100 text-gray-600",
};

const solutionColors: Record<string, string> = {
  proposed: "bg-gray-100 text-gray-700",
  selected: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

export default function ProblemsSection({
  clientId,
  projectId,
  problems,
}: {
  clientId: string;
  projectId: string;
  problems: Problem[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [addingSolutionFor, setAddingSolutionFor] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900">Problems & Solutions</h2>
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

      {problems.length === 0 && !adding && (
        <p className="text-sm text-gray-500">No problems logged yet.</p>
      )}

      <div className="space-y-3">
        {problems.map((p) => (
          <div key={p.id} className="border rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{p.title}</p>
                {p.description && <p className="text-xs text-gray-600 mt-0.5">{p.description}</p>}
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

            <div className="mt-2 pl-3 border-l-2 space-y-1">
              {p.solutions.map((s) => (
  <div key={s.id} className="flex items-center gap-2">
    <Link href={`/solutions/${s.id}`} className="text-sm text-gray-900 hover:underline">
      {s.title}
    </Link>
    <select
      value={s.status}
      onChange={async (e) => {
        await updateSolutionStatus(s.id, projectId, e.target.value);
        refresh();
      }}
      className={`text-xs rounded-full px-2 py-0.5 border-none ${solutionColors[s.status]}`}
    >
      <option value="proposed">proposed</option>
      <option value="selected">selected</option>
      <option value="rejected">rejected</option>
    </select>
  </div>
))}

              {addingSolutionFor === p.id ? (
                <SolutionForm
                  clientId={clientId}
                  projectId={projectId}
                  problemId={p.id}
                  onDone={() => {
                    setAddingSolutionFor(null);
                    refresh();
                  }}
                />
              ) : (
                <button
                  onClick={() => setAddingSolutionFor(p.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + Add Solution
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

function SolutionForm({
  clientId,
  projectId,
  problemId,
  onDone,
}: {
  clientId: string;
  projectId: string;
  problemId: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await createSolution(clientId, projectId, problemId, formData);
    setPending(false);
    if (result?.error) {
      setErrors(result.error);
      return;
    }
    if (result?.solutionId) {
      router.push(`/solutions/${result.solutionId}`);
      return;
    }
    onDone();
  }

  return (
    <form action={handleSubmit} className="space-y-2 mt-2">
      <input
        name="title"
        placeholder="Solution title *"
        required
        className="w-full border rounded px-3 py-1.5 text-sm text-gray-900"
      />
      {errors?.title && <p className="text-red-600 text-xs">{errors.title[0]}</p>}
      <textarea
        name="description"
        placeholder="Description"
        rows={2}
        className="w-full border rounded px-3 py-1.5 text-sm text-gray-900"
      />
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1 text-xs hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Add Solution & Add Features"}
        </button>
        <button type="button" onClick={onDone} className="rounded border px-3 py-1 text-xs text-gray-700">
          Cancel
        </button>
      </div>
    </form>
  );
}