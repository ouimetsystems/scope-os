"use client";

import { useState, use } from "react";
import { createProject } from "@/app/(dashboard)/projects/actions";

export default function NewProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = use(params);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);
    const result = await createProject(clientId, formData);
    setPending(false);
    if (result?.error) setErrors(result.error);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900">New Project</h1>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Project Name *</label>
          <input
            name="name"
            required
            placeholder="Inventory Management System"
            className="w-full border rounded px-3 py-2 text-gray-900"
          />
          {errors?.name && <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>}
        </div>

        {errors?.form && <p className="text-red-600 text-sm">{errors.form[0]}</p>}

        <button
          disabled={pending}
          className="rounded bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}