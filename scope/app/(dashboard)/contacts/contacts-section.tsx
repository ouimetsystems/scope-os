"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ContactForm from "./contact-form";
import { deleteContact } from "./actions";

type Contact = {
  id: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
};

export default function ContactsSection({
  clientId,
  contacts,
}: {
  clientId: string;
  contacts: Contact[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleDone() {
    setAdding(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(contactId: string) {
    if (!confirm("Delete this contact?")) return;
    await deleteContact(contactId, clientId);
    router.refresh();
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Contacts</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Contact
          </button>
        )}
      </div>

      {contacts.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No contacts yet.</p>
      )}

      <div className="space-y-2">
        {contacts.map((c) =>
          editingId === c.id ? (
            <ContactForm key={c.id} clientId={clientId} contact={c} onDone={handleDone} />
          ) : (
            <div key={c.id} className="flex items-center justify-between text-sm py-1">
              <div>
                <span className="font-medium">{c.full_name}</span>
                {c.is_primary && (
                  <span className="text-xs text-gray-400 ml-1">(primary)</span>
                )}
                {c.role_title && <span className="text-gray-500"> — {c.role_title}</span>}
                {c.email && <span className="text-gray-500"> · {c.email}</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(c.id)}
                  className="text-xs text-gray-500 hover:text-black"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {adding && (
        <div className="mt-2">
          <ContactForm clientId={clientId} onDone={handleDone} />
        </div>
      )}
    </section>
  );
}