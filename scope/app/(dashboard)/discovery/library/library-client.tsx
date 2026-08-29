"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addLibraryQuestion, retireLibraryQuestion, reactivateLibraryQuestion } from "../library-actions";

type Question = {
  id: string;
  question: string;
  category: string | null;
  is_active: boolean;
};

export default function LibraryClient({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  async function handleAdd(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await addLibraryQuestion(formData);
    setPending(false);
    if (result?.error) {
      setErrors(result.error);
      return;
    }
    router.refresh();
    (document.getElementById("question-form") as HTMLFormElement)?.reset();
  }

  const visible = questions.filter((q) => showInactive || q.is_active);

  return (
    <div className="space-y-6">
      <form id="question-form" action={handleAdd} className="border rounded-lg p-4 space-y-3">
        <div>
          <input
            name="question"
            placeholder="New question..."
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
          {errors?.question && <p className="text-red-600 text-xs mt-1">{errors.question[0]}</p>}
        </div>
        <input
          name="category"
          placeholder="Category (optional)"
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add to Library"}
        </button>
      </form>

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show retired questions
        </label>

        <div className="border rounded-lg divide-y">
          {visible.map((q) => (
            <div key={q.id} className="p-3 flex items-center justify-between text-sm">
              <div>
                <p className={!q.is_active ? "text-gray-400 line-through" : ""}>{q.question}</p>
                {q.category && <p className="text-xs text-gray-400">{q.category}</p>}
              </div>
              <button
                onClick={async () => {
                  if (q.is_active) {
                    await retireLibraryQuestion(q.id);
                  } else {
                    await reactivateLibraryQuestion(q.id);
                  }
                  router.refresh();
                }}
                className="text-xs text-gray-500 hover:text-black"
              >
                {q.is_active ? "Retire" : "Reactivate"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}