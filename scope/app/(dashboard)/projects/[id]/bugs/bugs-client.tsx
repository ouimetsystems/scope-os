"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBugInternal, updateBugStatus, confirmBugFixed, updateBugDetails } from "@/app/(dashboard)/bugs/actions";

type Bug = {
  id: string;
  title: string;
  description: string | null;
  error_code: string | null;
  environment: string;
  status: string;
  priority: string;
  resolution_notes: string | null;
  feature_id: string | null;
  features: { id: string; name: string } | null;
  sent_at: string;
};

type Feature = { id: string; name: string };

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  investigating: "bg-blue-100 text-blue-800",
  in_progress: "bg-blue-100 text-blue-800",
  fixed: "bg-blue-100 text-blue-800",
  ready_for_retest: "bg-purple-100 text-purple-800",
  closed: "bg-green-100 text-green-800",
  wont_fix: "bg-gray-100 text-gray-600",
};

const priorityColors: Record<string, string> = {
  low: "text-gray-600",
  medium: "text-yellow-700",
  high: "text-orange-700",
  critical: "text-red-700",
};

export default function BugsClient({
  projectId,
  clientId,
  bugs,
  features,
}: {
  projectId: string;
  clientId: string;
  bugs: Bug[];
  features: Feature[];
}) {
  const router = useRouter();
  const [reporting, setReporting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [envFilter, setEnvFilter] = useState<string>("all");

  const filtered = bugs.filter((b) => envFilter === "all" || b.environment === envFilter);
  const openCount = filtered.filter((b) => !["closed", "wont_fix"].includes(b.status)).length;

  function refresh() {
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-medium text-gray-900">Bugs</h2>
          <p className="text-xs text-gray-600">{openCount} open</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="text-sm border rounded px-2 py-1.5 text-gray-900"
          >
            <option value="all">All environments</option>
            <option value="test">Test</option>
            <option value="production">Production</option>
          </select>
          <button
            onClick={() => setReporting(!reporting)}
            className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800"
          >
            {reporting ? "Cancel" : "+ Report Bug"}
          </button>
        </div>
      </div>

      {reporting && (
        <QuickBugForm
          projectId={projectId}
          clientId={clientId}
          features={features}
          onDone={() => {
            setReporting(false);
            refresh();
          }}
        />
      )}

      {filtered.length === 0 && <p className="text-sm text-gray-700">No bugs.</p>}

      <div className="space-y-2">
        {filtered.map((bug) => (
          <div key={bug.id} className="border rounded-lg p-3">
            <div
              className="flex items-start justify-between gap-2 cursor-pointer"
              onClick={() => setExpandedId(expandedId === bug.id ? null : bug.id)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs rounded px-1.5 py-0.5 ${
                      bug.environment === "production" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {bug.environment}
                  </span>
                  <p className="text-sm font-medium text-gray-900">{bug.title}</p>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {bug.features?.name && <span>{bug.features.name} · </span>}
                  {new Date(bug.sent_at).toLocaleDateString()}
                  {bug.error_code && ` · ${bug.error_code}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium ${priorityColors[bug.priority]}`}>{bug.priority}</span>
                <span className={`text-xs rounded-full px-2 py-1 ${statusColors[bug.status]}`}>
                  {bug.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {expandedId === bug.id && (
              <div className="mt-3 pt-3 border-t space-y-2">
                {bug.description && <p className="text-sm text-gray-800 whitespace-pre-wrap">{bug.description}</p>}

                <div className="flex gap-2 flex-wrap">
                  {bug.status === "open" && (
                    <button
                      onClick={async () => {
                        await updateBugStatus(bug.id, projectId, "in_progress");
                        refresh();
                      }}
                      className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                    >
                      Start Working
                    </button>
                  )}
                  {(bug.status === "open" || bug.status === "in_progress" || bug.status === "investigating") && (
                    <button
                      onClick={async () => {
                        await updateBugStatus(bug.id, projectId, "fixed");
                        refresh();
                      }}
                      className="text-xs border border-purple-400 text-purple-700 rounded px-2 py-1 hover:bg-purple-50"
                    >
                      Mark Fixed → Ready for Retest
                    </button>
                  )}
                  {bug.status === "ready_for_retest" && (
                    <button
                      onClick={async () => {
                        await confirmBugFixed(bug.id, projectId);
                        refresh();
                      }}
                      className="text-xs border border-green-500 text-green-700 rounded px-2 py-1 hover:bg-green-50"
                    >
                      Confirm & Close
                    </button>
                  )}
                  {bug.status === "ready_for_retest" && (
                    <button
                      onClick={async () => {
                        await updateBugStatus(bug.id, projectId, "in_progress");
                        refresh();
                      }}
                      className="text-xs border border-red-400 text-red-700 rounded px-2 py-1 hover:bg-red-50"
                    >
                      Still Broken
                    </button>
                  )}
                  {!["closed", "wont_fix"].includes(bug.status) && (
                    <button
                      onClick={async () => {
                        await updateBugStatus(bug.id, projectId, "wont_fix");
                        refresh();
                      }}
                      className="text-xs text-gray-700 hover:text-gray-800"
                    >
                      Won't Fix
                    </button>
                  )}
                </div>

                <form
                  action={async (formData) => {
                    await updateBugDetails(bug.id, projectId, formData);
                    refresh();
                  }}
                  className="space-y-2"
                >
                  <div className="flex gap-2">
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
                    <select
                      name="feature_id"
                      defaultValue={bug.feature_id ?? ""}
                      className="border rounded px-2 py-1.5 text-sm text-gray-900"
                    >
                      <option value="">No feature linked</option>
                      {features.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    name="resolution_notes"
                    placeholder="Resolution notes..."
                    defaultValue={bug.resolution_notes ?? ""}
                    rows={2}
                    className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                  />
                  <button className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800">
                    Save Details
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickBugForm({
  projectId,
  clientId,
  features,
  onDone,
}: {
  projectId: string;
  clientId: string;
  features: Feature[];
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        await createBugInternal(projectId, clientId, formData);
        setPending(false);
        onDone();
      }}
      className="border rounded-lg p-3 bg-gray-50 mb-4 space-y-2"
    >
      <input
        name="title"
        placeholder="What's broken? *"
        required
        autoFocus
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      <textarea
        name="description"
        placeholder="Details (optional)"
        rows={2}
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      <div className="flex gap-2">
        <select name="environment" defaultValue="production" className="border rounded px-2 py-1.5 text-sm text-gray-900">
          <option value="test">Test</option>
          <option value="production">Production</option>
        </select>
        <select name="priority" defaultValue="medium" className="border rounded px-2 py-1.5 text-sm text-gray-900">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select name="feature_id" defaultValue="" className="border rounded px-2 py-1.5 text-sm text-gray-900 flex-1">
          <option value="">No feature linked</option>
          {features.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
      <button
        disabled={pending}
        className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}