"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  bulkAddQuestions,
  addCustomQuestion,
  saveAnswer,
  removeQuestion,
  reorderQuestion,
  flagAsProblem,
} from "@/app/(dashboard)/discovery/session-actions";

type ProjectQuestion = {
  id: string;
  question: string;
  answer: string | null;
  category: string | null;
  library_question_id: string | null;
  flagged_problem_id: string | null;
};

type LibraryQuestion = {
  id: string;
  question: string;
  category: string | null;
};

export default function QuestionsPanel({
  projectId,
  clientId,
  questions,
  library,
}: {
  projectId: string;
  clientId: string;
  questions: ProjectQuestion[];
  library: LibraryQuestion[];
}) {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [customText, setCustomText] = useState("");
  const [customCategory, setCustomCategory] = useState("Project-Specific");
  const [adding, setAdding] = useState(false);

  const usedLibraryIds = new Set(questions.map((q) => q.library_question_id).filter(Boolean));
  const available = library.filter(
    (q) => !usedLibraryIds.has(q.id) && q.question.toLowerCase().includes(search.trim().toLowerCase())
  );

  const availableGrouped = available.reduce<Record<string, LibraryQuestion[]>>((acc, q) => {
    const key = q.category ?? "Other";
    acc[key] = acc[key] ? [...acc[key], q] : [q];
    return acc;
  }, {});

  const addedGrouped = questions.reduce<Record<string, ProjectQuestion[]>>((acc, q) => {
    const key = q.category ?? "Other";
    acc[key] = acc[key] ? [...acc[key], q] : [q];
    return acc;
  }, {});

  const totalQ = questions.length;
  const answeredQ = questions.filter((q) => q.answer && q.answer.trim()).length;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCollapse(category: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }

  async function handleBulkAdd() {
    if (selectedIds.size === 0) return;
    setAdding(true);
    await bulkAddQuestions(projectId, Array.from(selectedIds));
    setAdding(false);
    setSelectedIds(new Set());
    router.refresh();
  }

  async function handleAddCustom() {
    if (!customText.trim()) return;
    await addCustomQuestion(projectId, customText.trim(), customCategory);
    setCustomText("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-gray-900">Discovery Questions</h2>
          <p className="text-xs text-gray-600">
            {answeredQ}/{totalQ} answered
          </p>
        </div>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800"
        >
          {showPicker ? "Done Adding" : "+ Add Questions"}
        </button>
      </div>

      {showPicker && (
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="flex gap-2">
            <input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Custom question..."
              className="flex-1 border rounded px-3 py-2 text-sm text-gray-900"
            />
            <input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Category"
              className="w-40 border rounded px-3 py-2 text-sm text-gray-900"
            />
            <button
              onClick={handleAddCustom}
              className="rounded bg-black text-white px-3 py-2 text-sm hover:bg-gray-800 shrink-0"
            >
              Add
            </button>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question library..."
            className="w-full border rounded px-3 py-2 text-sm text-gray-900"
          />

          <div className="border rounded-lg divide-y max-h-96 overflow-y-auto bg-white">
            {Object.keys(availableGrouped).length === 0 && (
              <p className="p-3 text-sm text-gray-500">No matching questions.</p>
            )}
            {Object.entries(availableGrouped).map(([category, qs]) => (
              <div key={category}>
                <button
                  onClick={() => toggleCollapse(category)}
                  className="w-full flex items-center justify-between px-3 pt-2 pb-1"
                >
                  <span className="text-xs font-semibold text-gray-500 uppercase">{category}</span>
                  <span className="text-xs text-gray-400">{collapsed.has(category) ? "▸" : "▾"}</span>
                </button>
                {!collapsed.has(category) &&
                  qs.map((q) => (
                    <label
                      key={q.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(q.id)}
                        onChange={() => toggleSelect(q.id)}
                      />
                      <span className="text-gray-900">{q.question}</span>
                    </label>
                  ))}
              </div>
            ))}
          </div>

          <button
            onClick={handleBulkAdd}
            disabled={selectedIds.size === 0 || adding}
            className="w-full rounded bg-black text-white px-3 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {adding ? "Adding..." : `Add ${selectedIds.size} Selected Question${selectedIds.size === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {Object.keys(addedGrouped).length === 0 && (
          <p className="text-sm text-gray-500">No questions added yet.</p>
        )}
        {Object.entries(addedGrouped).map(([category, qs]) => (
          <div key={category}>
            <button
              onClick={() => toggleCollapse(`added-${category}`)}
              className="w-full flex items-center justify-between mb-2"
            >
              <span className="text-xs font-semibold text-gray-500 uppercase">{category}</span>
              <span className="text-xs text-gray-400">
                {collapsed.has(`added-${category}`) ? "▸" : "▾"}
              </span>
            </button>
            {!collapsed.has(`added-${category}`) && (
              <div className="space-y-2">
                {qs.map((q, i) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    projectId={projectId}
                    clientId={clientId}
                    isFirst={i === 0}
                    isLast={i === qs.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionRow({
  question,
  projectId,
  clientId,
  isFirst,
  isLast,
}: {
  question: ProjectQuestion;
  projectId: string;
  clientId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(question.answer ?? "");
  const [saving, setSaving] = useState(false);
  const [flagging, setFlagging] = useState(false);

  const hasAnswer = value.trim().length > 0;

  async function handleBlur() {
    setSaving(true);
    const formData = new FormData();
    formData.set("answer", value);
    await saveAnswer(question.id, projectId, formData);
    setSaving(false);
  }

  return (
    <div
      className={`border-l-4 rounded-lg p-3 ${
        hasAnswer ? "border-l-green-500 bg-green-50/40" : "border-l-yellow-500 bg-yellow-50/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <button
            disabled={flagging || !!question.flagged_problem_id}
            title={question.flagged_problem_id ? "Already flagged as a Problem" : "Flag as Problem"}
            onClick={async () => {
              setFlagging(true);
              await flagAsProblem(question.id, projectId, clientId);
              setFlagging(false);
              router.refresh();
            }}
            className={`text-base leading-none ${
              question.flagged_problem_id
                ? "opacity-100 cursor-default"
                : "opacity-40 hover:opacity-100 cursor-pointer"
            }`}
          >
            🚩
          </button>
          <p className="text-sm font-medium text-gray-900">{question.question}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            disabled={isFirst}
            onClick={async () => {
              await reorderQuestion(question.id, projectId, "up");
              router.refresh();
            }}
            className="text-xs text-gray-400 hover:text-gray-900 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            disabled={isLast}
            onClick={async () => {
              await reorderQuestion(question.id, projectId, "down");
              router.refresh();
            }}
            className="text-xs text-gray-400 hover:text-gray-900 disabled:opacity-30"
          >
            ↓
          </button>
          <button
            onClick={async () => {
              if (confirm("Remove this question from the project?")) {
                await removeQuestion(question.id, projectId);
                router.refresh();
              }
            }}
            className="text-xs text-red-600 hover:text-red-800 ml-2"
          >
            Remove
          </button>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        rows={2}
        placeholder="Answer..."
        className="w-full border rounded px-3 py-2 text-sm text-gray-900 bg-white"
      />
      {saving && <p className="text-xs text-gray-500 mt-1">Saving...</p>}
    </div>
  );
}