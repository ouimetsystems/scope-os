"use client";

import { useState, use } from "react";
import { createMeeting } from "@/app/(dashboard)/meetings/actions";

export default function NewMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = use(params);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await createMeeting(clientId, formData);
    setPending(false);
    if (result?.error) setErrors(result.error);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Log Meeting</h1>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Meeting Type</label>
          <select name="meeting_type" defaultValue="check_in" className="w-full border rounded px-3 py-2">
            <option value="discovery">Discovery</option>
            <option value="check_in">Check In</option>
            <option value="planning">Planning</option>
            <option value="support">Support</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <input
            type="datetime-local"
            name="meeting_date"
            required
            className="w-full border rounded px-3 py-2"
          />
          {errors?.meeting_date && (
            <p className="text-red-600 text-sm mt-1">{errors.meeting_date[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Attendees</label>
          <input
            name="attendees"
            placeholder="John, Sarah, Alek"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea name="notes" rows={6} className="w-full border rounded px-3 py-2" />
        </div>

        {errors?.form && <p className="text-red-600 text-sm">{errors.form[0]}</p>}

        <button
          disabled={pending}
          className="rounded bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Meeting"}
        </button>
      </form>
    </div>
  );
}