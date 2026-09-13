"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addLibraryQuestion,
  updateLibraryQuestion,
  deleteLibraryQuestion,
  toggleQuestionActive,
  renameCategory,
  deleteCategory,
} from "../library-actions";

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
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryValue, setCategoryValue] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const visible = questions.filter((q) => showInactive || q.is_active);
  const grouped = visible.reduce<Record<string, Question[]>>((acc, q) => {
    const key = q.category ?? "Other";
    acc[key] = acc[key] ? [...acc[key], q] : [q];
    return acc;
  }, {});

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        action={async (formData) => {
          setPending(true);
          await addLibraryQuestion(formData);
          setPending(false);
          (document.getElementById("new-q-form") as HTMLFormElement)?.reset();
          refresh();
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
          {pending ? "Adding..." : "Add Question"}
        </button>
      </form>

      <label className="flex items-center gap-2 text-sm text-gray-800">
        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
        Show retired questions
      </label>

      <div className="space-y-4">
        {Object.entries(grouped).map(([category, qs]) => (
          <div key={category} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              {editingCategory === category ? (
                <div className="flex gap-2 flex-1">
                  <input
                    value={categoryValue}
                    onChange={(e) => setCategoryValue(e.target.value)}
                    className="border rounded px-2 py-1 text-sm text-gray-900 flex-1"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      await renameCategory(category, categoryValue);
                      setEditingCategory(null);
                      refresh();
                    }}
                    className="text-xs bg-black text-white rounded px-2 py-1"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingCategory(null)} className="text-xs text-gray-700">
                    Cancel
                  </button>
                </div>
              ) : (
                <h3 className="text-sm font-semibold text-gray-800 uppercase">{category}</h3>
              )}

              {editingCategory !== category && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setCategoryValue(category);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Rename Category
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete category "${category}" and all ${qs.length} question(s) in it?`)) {
                        await deleteCategory(category);
                        refresh();
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Delete Category
                  </button>
                </div>
              )}
            </div>

            <div className="divide-y">
              {qs.map((q) =>
                editingQuestionId === q.id ? (
                  <QuestionEditForm
                    key={q.id}
                    question={q}
                    onDone={() => {
                      setEditingQuestionId(null);
                      refresh();
                    }}
                  />
                ) : (
                  <div key={q.id} className="py-2 flex items-center justify-between gap-2">
                    <p className={`text-sm ${!q.is_active ? "text-gray-500 line-through" : "text-gray-900"}`}>
                      {q.question}
                    </p>
                    <div className="flex items-center gap-3 shrink-0">
                      {q.is_default && (
                        <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">Default</span>
                      )}
                      <button
                        onClick={() => setEditingQuestionId(q.id)}
                        className="text-xs text-gray-700 hover:text-gray-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          await toggleQuestionActive(q.id, !q.is_active);
                          refresh();
                        }}
                        className="text-xs text-gray-700 hover:text-gray-900"
                      >
                        {q.is_active ? "Retire" : "Reactivate"}
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Delete this question permanently?")) {
                            await deleteLibraryQuestion(q.id);
                            refresh();
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionEditForm({ question, onDone }: { question: Question; onDone: () => void }) {
  const [text, setText] = useState(question.question);
  const [category, setCategory] = useState(question.category ?? "");
  const [isDefault, setIsDefault] = useState(question.is_default);
  const [pending, setPending] = useState(false);

  return (
    <div className="py-2 space-y-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm text-gray-900"
      />
      <div className="flex gap-2 items-center">
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 border rounded px-2 py-1 text-sm text-gray-900"
        />
        <label className="flex items-center gap-1 text-xs text-gray-800">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Default
        </label>
        <button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await updateLibraryQuestion(question.id, text, category, isDefault);
            setPending(false);
            onDone();
          }}
          className="text-xs bg-black text-white rounded px-2 py-1"
        >
          Save
        </button>
        <button onClick={onDone} className="text-xs text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}