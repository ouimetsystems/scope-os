"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDevLog, updateDevLog, deleteDevLog } from "@/app/(dashboard)/dev-logs/actions";

type DevLog = {
  id: string;
  entry_date: string;
  summary: string;
  details: string | null;
  hours_spent: number | null;
};

export default function DevLogsClient({
  projectId,
  logs,
  totalHours,
}: {
  projectId: string;
  logs: DevLog[];
  totalHours: number;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-medium text-gray-900">Development Log</h2>
          <p className="text-xs text-gray-600">{totalHours.toFixed(1)} hours logged total</p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800"
          >
            + Add Entry
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4">
          <LogForm
            projectId={projectId}
            onDone={() => {
              setAdding(false);
              refresh();
            }}
          />
        </div>
      )}

      {logs.length === 0 && !adding && (
        <p className="text-sm text-gray-700">No entries yet — log what you work on as you go.</p>
      )}

      <div className="space-y-3">
        {logs.map((log) =>
          editingId === log.id ? (
            <LogForm
              key={log.id}
              projectId={projectId}
              log={log}
              onDone={() => {
                setEditingId(null);
                refresh();
              }}
            />
          ) : (
            <div key={log.id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(log.entry_date + "T00:00:00").toLocaleDateString()} — {log.summary}
                  </p>
                  {log.details && (
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{log.details}</p>
                  )}
                  {log.hours_spent != null && (
                    <p className="text-xs text-gray-600 mt-1">{log.hours_spent}h</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditingId(log.id)}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("Delete this log entry?")) {
                        await deleteDevLog(log.id, projectId);
                        refresh();
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Delete
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

function LogForm({
  projectId,
  log,
  onDone,
}: {
  projectId: string;
  log?: DevLog;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = log
      ? await updateDevLog(log.id, projectId, formData)
      : await createDevLog(projectId, formData);
    setPending(false);
    if (result?.error) {
      setErrors(result.error);
      return;
    }
    onDone();
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={handleSubmit} className="space-y-2 border rounded-lg p-3 bg-gray-50">
      <div className="flex gap-2">
        <input
          name="entry_date"
          type="date"
          defaultValue={log?.entry_date ?? today}
          required
          className="border rounded px-2 py-1.5 text-sm text-gray-900"
        />
        <input
          name="hours_spent"
          type="number"
          step="0.25"
          placeholder="Hours"
          defaultValue={log?.hours_spent ?? ""}
          className="w-24 border rounded px-2 py-1.5 text-sm text-gray-900"
        />
      </div>
      <div>
        <input
          name="summary"
          placeholder="Summary *"
          required
          defaultValue={log?.summary}
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
        {errors?.summary && <p className="text-red-600 text-xs mt-1">{errors.summary[0]}</p>}
      </div>
      <textarea
        name="details"
        placeholder="Details, decisions, problems encountered..."
        rows={3}
        defaultValue={log?.details ?? ""}
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      {errors?.form && <p className="text-red-600 text-xs">{errors.form[0]}</p>}
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : log ? "Save" : "Add Entry"}
        </button>
        <button type="button" onClick={onDone} className="rounded border px-3 py-1.5 text-sm text-gray-700">
          Cancel
        </button>
      </div>
    </form>
  );
}