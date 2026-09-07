"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createChangeRequest,
  updateChangeRequestStatus,
  deleteChangeRequest,
} from "@/app/(dashboard)/change-requests/actions";

type ChangeRequest = {
  id: string;
  title: string;
  description: string | null;
  reason: string | null;
  size: "minor" | "major";
  status: string;
  estimated_hours: number | null;
  additional_price: number | null;
  timeline_impact_days: number | null;
};

const statusColors: Record<string, string> = {
  requested: "bg-gray-100 text-gray-700",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
  implemented: "bg-blue-100 text-blue-800",
};

export default function ChangeRequestsClient({
  clientId,
  projectId,
  changeRequests,
}: {
  clientId: string;
  projectId: string;
  changeRequests: ChangeRequest[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  function refresh() {
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900">Change Requests</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800"
          >
            + New Change Request
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4">
          <CrForm
            clientId={clientId}
            projectId={projectId}
            onDone={() => {
              setAdding(false);
              refresh();
            }}
          />
        </div>
      )}

      {changeRequests.length === 0 && !adding && (
        <p className="text-sm text-gray-500">No change requests yet.</p>
      )}

      <div className="space-y-3">
        {changeRequests.map((cr) => (
          <div key={cr.id} className="border rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {cr.title} <span className="text-xs text-gray-500">({cr.size})</span>
                </p>
                {cr.description && <p className="text-sm text-gray-700 mt-1">{cr.description}</p>}
                {cr.reason && <p className="text-xs text-gray-600 mt-1">Reason: {cr.reason}</p>}
                <div className="flex gap-3 text-xs text-gray-600 mt-2">
                  {cr.estimated_hours != null && <span>{cr.estimated_hours}h</span>}
                  {cr.additional_price != null && <span>${cr.additional_price}</span>}
                  {cr.timeline_impact_days != null && (
                    <span>{cr.timeline_impact_days > 0 ? "+" : ""}{cr.timeline_impact_days} days</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={cr.status}
                  onChange={async (e) => {
                    await updateChangeRequestStatus(cr.id, projectId, e.target.value);
                    refresh();
                  }}
                  className={`text-xs rounded-full px-2 py-1 border-none ${statusColors[cr.status]}`}
                >
                  <option value="requested">Requested</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="implemented">Implemented</option>
                </select>
                <button
                  onClick={async () => {
                    if (confirm("Delete this change request?")) {
                      await deleteChangeRequest(cr.id, projectId);
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
        ))}
      </div>
    </div>
  );
}

function CrForm({
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
    const result = await createChangeRequest(clientId, projectId, formData);
    setPending(false);
    if (result?.error) {
      setErrors(result.error);
      return;
    }
    onDone();
  }

  return (
    <form action={handleSubmit} className="space-y-2 border rounded-lg p-3 bg-gray-50">
      <div>
        <input
          name="title"
          placeholder="Title *"
          required
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
        {errors?.title && <p className="text-red-600 text-xs mt-1">{errors.title[0]}</p>}
      </div>
      <textarea
        name="description"
        placeholder="What's being requested"
        rows={2}
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      <textarea
        name="reason"
        placeholder="Reason for the change"
        rows={2}
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
      <select name="size" defaultValue="minor" className="w-full border rounded px-3 py-2 text-sm text-gray-900">
        <option value="minor">Minor</option>
        <option value="major">Major</option>
      </select>
      <div className="grid grid-cols-3 gap-2">
        <input
          name="estimated_hours"
          type="number"
          step="0.5"
          placeholder="Est. hours"
          className="border rounded px-2 py-1.5 text-sm text-gray-900"
        />
        <input
          name="additional_price"
          type="number"
          step="0.01"
          placeholder="Additional $"
          className="border rounded px-2 py-1.5 text-sm text-gray-900"
        />
        <input
          name="timeline_impact_days"
          type="number"
          placeholder="Timeline +/- days"
          className="border rounded px-2 py-1.5 text-sm text-gray-900"
        />
      </div>
      {errors?.form && <p className="text-red-600 text-xs">{errors.form[0]}</p>}
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Create"}
        </button>
        <button type="button" onClick={onDone} className="rounded border px-3 py-1.5 text-sm text-gray-700">
          Cancel
        </button>
      </div>
    </form>
  );
}