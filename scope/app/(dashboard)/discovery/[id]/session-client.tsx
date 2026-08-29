"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addQuestionToSession,
  saveAnswer,
  removeQuestionFromSession,
} from "../session-actions";

type SessionQuestion = {
  id: string;
  question: string;
  answer: string | null;
  library_question_id: string | null;
};

type LibraryQuestion = {
  id: string;
  question: string;
  category: string | null;
};

export default function SessionClient({
  sessionId,
  sessionQuestions,
  library,
}: {
  sessionId: string;
  sessionQuestions: SessionQuestion[];
  library: LibraryQuestion[];
}) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");

  const usedLibraryIds = new Set(sessionQuestions.map((q) => q.library_question_id).filter(Boolean));
  const availableLibrary = library.filter((q) => !usedLibraryIds.has(q.id));

  async function handlePick(libraryQuestionId: string, questionText: string) {
    await addQuestionToSession(sessionId, libraryQuestionId, questionText);
    router.refresh();
  }

  async function handleAddCustom() {
    if (!customQuestion.trim()) return;
    await addQuestionToSession(sessionId, null, customQuestion.trim());
    setCustomQuestion("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {sessionQuestions.length === 0 && (
          <p className="text-sm text-gray-400">No questions added yet — pick some below.</p>
        )}
        {sessionQuestions.map((q) => (
          <div key={q.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium">{q.question}</p>
              <button
                onClick={async () => {
                  await removeQuestionFromSession(q.id, sessionId);
                  router.refresh();
                }}
                className="text-xs text-red-500 hover:text-red-700 shrink-0"
              >
                Remove
              </button>
            </div>
            <AnswerBox questionRowId={q.id} sessionId={sessionId} initialAnswer={q.answer} />
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        {!picking ? (
          <button
            onClick={() => setPicking(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Questions
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Custom question..."
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button
                onClick={handleAddCustom}
                className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800"
              >
                Add
              </button>
            </div>

            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {availableLibrary.length === 0 && (
                <p className="p-3 text-sm text-gray-400">No more library questions to add.</p>
              )}
              {availableLibrary.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handlePick(q.id, q.question)}
                  className="w-full text-left p-3 text-sm hover:bg-gray-50"
                >
                  {q.question}
                  {q.category && <span className="text-xs text-gray-400 ml-2">({q.category})</span>}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPicking(false)}
              className="text-sm text-gray-500 hover:text-black"
            >
              Done adding
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AnswerBox({
  questionRowId,
  sessionId,
  initialAnswer,
}: {
  questionRowId: string;
  sessionId: string;
  initialAnswer: string | null;
}) {
  const [value, setValue] = useState(initialAnswer ?? "");
  const [saving, setSaving] = useState(false);

  async function handleBlur() {
    setSaving(true);
    const formData = new FormData();
    formData.set("answer", value);
    await saveAnswer(questionRowId, sessionId, formData);
    setSaving(false);
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        rows={2}
        placeholder="Answer..."
        className="w-full border rounded px-3 py-2 text-sm"
      />
      {saving && <p className="text-xs text-gray-400 mt-1">Saving...</p>}
    </div>
  );
}