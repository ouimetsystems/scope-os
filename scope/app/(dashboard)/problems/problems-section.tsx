"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProblem, updateProblemStatus, deleteProblem } from "./actions";
import { createSolution } from "@/app/(dashboard)/solutions/actions";

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
  open: "bg-yellow-100 text-yellow-700",
  addressed: "bg-green-100 text-green-700",
  wont_fix: "bg-gray-100 text-gray-500",
};

const solutionColors: Record<string, string> = {
  proposed: "bg-gray-100 text-gray-600",
  selected: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-500",
};

export default function ProblemsSection({
  clientId,
  problems,
}: {
  clientId: string;
  problems: Problem[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [addingSolutionFor, setAddingSolutionFor] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
          Problems & Solutions
        </h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="text-sm text-blue-600 hover:underline">
            + Add Problem
          </button>
        )}
      </div>

      {adding && (
        <ProblemForm
          clientId={clientId}
          onDone={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}

      {problems.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No problems logged yet.</p>
      )}

      <div className="space-y-3">
        {problems.map((p) => (
          <div key={p.id} className="border rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{p.title}</p>
                {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={p.status}
                  onChange={async (e) => {
                    await updateProblemStatus(p.id, clientId, e.target.value);
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
                      await deleteProblem(p.id, clientId);
                      refresh();
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-2 pl-3 border-l-2 space-y-1">
              {p.solutions.map((s) => (
                <Link
                  key={s.id}
                  href={`/solutions/${s.id}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  {s.title}
                  <span className={`text-xs rounded-full px-2 py-0.5 ${solutionColors[s.status]}`}>
                    {s.status}
                  </span>
                </Link>
              ))}

              {addingSolutionFor === p.id ? (
                <SolutionForm
                  clientId={clientId}
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
    </section>
  );
}

function ProblemForm({ clientId, onDone }: { clientId: string; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await createProblem(clientId, formData);
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
        className="w-full border rounded px-3 py-2 text-sm"
      />
      {errors?.title && <p className="text-red-600 text-xs">{errors.title[0]}</p>}
      <textarea
        name="description"
        placeholder="Description"
        rows={2}
        className="w-full border rounded px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Add Problem"}
        </button>
        <button type="button" onClick={onDone} className="rounded border px-3 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

function SolutionForm({
  clientId,
  problemId,
  onDone,
}: {
  clientId: string;
  problemId: string;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await createSolution(clientId, problemId, formData);
    setPending(false);
    if (result?.error) {
      setErrors(result.error);
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
        className="w-full border rounded px-3 py-1.5 text-sm"
      />
      {errors?.title && <p className="text-red-600 text-xs">{errors.title[0]}</p>}
      <textarea
        name="description"
        placeholder="Description"
        rows={2}
        className="w-full border rounded px-3 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1 text-xs hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Add Solution"}
        </button>
        <button type="button" onClick={onDone} className="rounded border px-3 py-1 text-xs">
          Cancel
        </button>
      </div>
    </form>
  );
}