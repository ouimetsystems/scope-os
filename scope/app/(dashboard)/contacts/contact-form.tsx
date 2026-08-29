"use client";

import { useState } from "react";
import { createContact, updateContact } from "./actions";

type Contact = {
  id: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
};

export default function ContactForm({
  clientId,
  contact,
  onDone,
}: {
  clientId: string;
  contact?: Contact;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setErrors(null);

    const result = contact
      ? await updateContact(contact.id, clientId, formData)
      : await createContact(clientId, formData);

    setPending(false);

    if (result?.error) {
      setErrors(result.error);
      return;
    }
    onDone();
  }

  return (
    <form action={handleSubmit} className="space-y-3 border rounded-lg p-4 bg-gray-50">
      <div>
        <input
          name="full_name"
          placeholder="Full name *"
          required
          defaultValue={contact?.full_name}
          className="w-full border rounded px-3 py-2 text-sm"
        />
        {errors?.full_name && (
          <p className="text-red-600 text-xs mt-1">{errors.full_name[0]}</p>
        )}
      </div>

      <input
        name="role_title"
        placeholder="Role / Title"
        defaultValue={contact?.role_title ?? ""}
        className="w-full border rounded px-3 py-2 text-sm"
      />

      <div>
        <input
          name="email"
          placeholder="Email"
          defaultValue={contact?.email ?? ""}
          className="w-full border rounded px-3 py-2 text-sm"
        />
        {errors?.email && <p className="text-red-600 text-xs mt-1">{errors.email[0]}</p>}
      </div>

      <input
        name="phone"
        placeholder="Phone"
        defaultValue={contact?.phone ?? ""}
        className="w-full border rounded px-3 py-2 text-sm"
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_primary"
          defaultChecked={contact?.is_primary}
        />
        Primary contact
      </label>

      {errors?.form && <p className="text-red-600 text-xs">{errors.form[0]}</p>}

      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Saving..." : contact ? "Save" : "Add Contact"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded border px-3 py-1.5 text-sm hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}