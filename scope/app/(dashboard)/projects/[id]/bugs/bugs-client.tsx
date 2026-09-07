"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBug } from "@/app/(dashboard)/bugs/actions";

type Bug = {
  id: string;
  title: string;
  description: string | null;
  error_code: string | null;
  screenshot_urls: string[] | null;
  status: string;
  priority: string;
  resolution_notes: string | null;
  sent_at: string;
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  investigating: "bg-blue-100 text-blue-800",
  in_progress: "bg-blue-100 text-blue-800",
  fixed: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
  wont_fix: "bg-gray-100 text-gray-600",
};

const priorityColors: Record<string, string> = {
  low: "text-gray-600",
  medium: "text-yellow-700",
  high: "text-orange-700",
  critical: "text-red-700",
};

export default function BugsClient({ projectId, bugs }: { projectId: string; bugs: Bug[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openCount = bugs.filter((b) => !["fixed", "closed", "wont_fix"].includes(b.status)).length;

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-medium text-gray-900">Bug Reports</h2>
        <p className="text-xs text-gray-600">{openCount} open</p>
      </div>

      {bugs.length === 0 && <p className="text-sm text-gray-500">No bugs reported yet.</p>}

      <div className="space-y-2">
        {bugs.map((bug) => (
          <div key={bug.id} className="border rounded-lg p-3">
            <div
              className="flex items-start justify-between gap-2 cursor-pointer"
              onClick={() => setExpandedId(expandedId === bug.id ? null : bug.id)}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{bug.title}</p>
                <p className="text-xs text-gray-600">
                  Reported {new Date(bug.sent_at).toLocaleDateString()}
                  {bug.error_code && ` · ${bug.error_code}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium ${priorityColors[bug.priority]}`}>
                  {bug.priority}
                </span>
                <span className={`text-xs rounded-full px-2 py-1 ${statusColors[bug.status]}`}>
                  {bug.status}
                </span>
              </div>
            </div>

            {expandedId === bug.id && (
              <div className="mt-3 pt-3 border-t">
                {bug.description && (
                  <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">{bug.description}</p>
                )}
                {bug.screenshot_urls && bug.screenshot_urls.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {bug.screenshot_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        className="block text-xs text-blue-600 hover:underline"
                      >
                        Screenshot {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                <BugUpdateForm bug={bug} projectId={projectId} onDone={() => router.refresh()} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BugUpdateForm({
  bug,
  projectId,
  onDone,
}: {
  bug: Bug;
  projectId: string;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    await updateBug(bug.id, projectId, formData);
    setPending(false);
    onDone();
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <select
          name="status"
          defaultValue={bug.status}
          className="border rounded px-2 py-1.5 text-sm text-gray-900"
        >
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="in_progress">In Progress</option>
          <option value="fixed">Fixed</option>
          <option value="closed">Closed</option>
          <option value="wont_fix">Won't Fix</option>
        </select>
        <select
          name="priority"
          defaultValue={bug.priority}
          className="border rounded px-2 py-1.5 text-sm text-gray-900"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <textarea
        name="resolution_notes"
        placeholder="Resolution notes..."
        defaultValue={bug.resolution_notes ?? ""}
        rows={2}
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      <button
        disabled={pending}
        className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}