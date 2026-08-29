"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addQuestion, saveAnswer, removeQuestion } from "./session-actions";

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

export default function QuestionsPanel({
  sessionId,
  meetingId,
  questions,
  library,
}: {
  sessionId?: string;
  meetingId?: string;
  questions: SessionQuestion[];
  library: LibraryQuestion[];
}) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");

  const usedLibraryIds = new Set(questions.map((q) => q.library_question_id).filter(Boolean));
  const availableLibrary = library.filter((q) => !usedLibraryIds.has(q.id));

  const grouped = availableLibrary.reduce<Record<string, LibraryQuestion[]>>((acc, q) => {
    const key = q.category ?? "Other";
    acc[key] = acc[key] ? [...acc[key], q] : [q];
    return acc;
  }, {});

  async function handlePick(libraryQuestionId: string, questionText: string) {
    await addQuestion({ libraryQuestionId, questionText, sessionId, meetingId });
    router.refresh();
  }

  async function handleAddCustom() {
    if (!customQuestion.trim()) return;
    await addQuestion({ libraryQuestionId: null, questionText: customQuestion.trim(), sessionId, meetingId });
    setCustomQuestion("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {questions.length === 0 && (
          <p className="text-sm text-gray-400">No questions added yet — pick some below.</p>
        )}
        {questions.map((q) => (
          <div key={q.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium">{q.question}</p>
              <button
                onClick={async () => {
                  await removeQuestion(q.id, { sessionId, meetingId });
                  router.refresh();
                }}
                className="text-xs text-red-500 hover:text-red-700 shrink-0"
              >
                Remove
              </button>
            </div>
            <AnswerBox
              questionRowId={q.id}
              initialAnswer={q.answer}
              paths={{ sessionId, meetingId }}
            />
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        {!picking ? (
          <button onClick={() => setPicking(true)} className="text-sm text-blue-600 hover:underline">
            + Add Question
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

            <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
              {Object.keys(grouped).length === 0 && (
                <p className="p-3 text-sm text-gray-400">No more library questions to add.</p>
              )}
              {Object.entries(grouped).map(([category, qs]) => (
                <div key={category}>
                  <p className="px-3 pt-2 text-xs font-semibold text-gray-400 uppercase">{category}</p>
                  {qs.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handlePick(q.id, q.question)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {q.question}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <button onClick={() => setPicking(false)} className="text-sm text-gray-500 hover:text-black">
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
  initialAnswer,
  paths,
}: {
  questionRowId: string;
  initialAnswer: string | null;
  paths: { sessionId?: string; meetingId?: string };
}) {
  const [value, setValue] = useState(initialAnswer ?? "");
  const [saving, setSaving] = useState(false);

  async function handleBlur() {
    setSaving(true);
    const formData = new FormData();
    formData.set("answer", value);
    await saveAnswer(questionRowId, formData, paths);
    setSaving(false);
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        rows={2}
        placeholder="Answer... (leave blank to prep for later)"
        className="w-full border rounded px-3 py-2 text-sm"
      />
      {saving && <p className="text-xs text-gray-400 mt-1">Saving...</p>}
    </div>
  );
}