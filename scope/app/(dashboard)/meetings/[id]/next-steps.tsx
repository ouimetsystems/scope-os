"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addNextStep, toggleNextStep, deleteNextStep } from "../actions";

type NextStep = {
  id: string;
  description: string;
  is_complete: boolean;
};

export default function NextSteps({
  meetingId,
  nextSteps,
}: {
  meetingId: string;
  nextSteps: NextStep[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleAdd(formData: FormData) {
    setPending(true);
    await addNextStep(meetingId, formData);
    setPending(false);
    router.refresh();
    (document.getElementById("next-step-input") as HTMLInputElement).value = "";
  }

  return (
    <section>
      <h2 className="font-medium mb-2 text-sm text-gray-500 uppercase tracking-wide">Next Steps</h2>

      <div className="space-y-1 mb-3">
        {nextSteps.length === 0 && <p className="text-sm text-gray-400">No next steps yet.</p>}
        {nextSteps.map((step) => (
          <div key={step.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={step.is_complete}
              onChange={async (e) => {
                await toggleNextStep(step.id, meetingId, e.target.checked);
                router.refresh();
              }}
            />
            <span className={step.is_complete ? "line-through text-gray-400" : ""}>
              {step.description}
            </span>
            <button
              onClick={async () => {
                await deleteNextStep(step.id, meetingId);
                router.refresh();
              }}
              className="text-xs text-red-500 hover:text-red-700 ml-auto"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <form action={handleAdd} className="flex gap-2">
        <input
          id="next-step-input"
          name="description"
          placeholder="Add a next step..."
          required
          className="flex-1 border rounded px-3 py-1.5 text-sm"
        />
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </section>
  );
}