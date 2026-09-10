"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addLibraryQuestion, toggleQuestionActive, toggleQuestionDefault } from "../library-actions";

type Question = {
  id: string;
  question: string;
  category: string | null;
  is_active: boolean;
  is_default: boolean;
};

export default function LibraryClient({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [showInactive, setShowInactive] = useState(false);
  const [pending, setPending] = useState(false);

  const visible = questions.filter((q) => showInactive || q.is_active);

  return (
    <div className="space-y-6">
      <form
        action={async (formData) => {
          setPending(true);
          await addLibraryQuestion(formData);
          setPending(false);
          (document.getElementById("new-q-form") as HTMLFormElement)?.reset();
          router.refresh();
        }}
        id="new-q-form"
        className="border rounded-lg p-4 space-y-2"
      >
        <input
          name="question"
          placeholder="New question *"
          required
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
        <div className="flex gap-2">
          <input
            name="category"
            placeholder="Category (e.g. Users, Data, Integrations)"
            className="flex-1 border rounded px-3 py-2 text-sm text-gray-900"
          />
          <label className="flex items-center gap-1 text-sm text-gray-800 whitespace-nowrap">
            <input type="checkbox" name="is_default" /> Default
          </label>
        </div>
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add to Library"}
        </button>
      </form>

      <label className="flex items-center gap-2 text-sm text-gray-800">
        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
        Show retired questions
      </label>

      <div className="border rounded-lg divide-y">
        {visible.map((q) => (
          <div key={q.id} className="p-3 flex items-center justify-between gap-2">
            <div>
              <p className={`text-sm ${!q.is_active ? "text-gray-700 line-through" : "text-gray-900"}`}>
                {q.question}
              </p>
              <p className="text-xs text-gray-600">{q.category}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <label className="flex items-center gap-1 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={q.is_default}
                  onChange={async (e) => {
                    await toggleQuestionDefault(q.id, e.target.checked);
                    router.refresh();
                  }}
                />
                Default
              </label>
              <button
                onClick={async () => {
                  await toggleQuestionActive(q.id, !q.is_active);
                  router.refresh();
                }}
                className="text-xs text-gray-700 hover:text-gray-900"
              >
                {q.is_active ? "Retire" : "Reactivate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}