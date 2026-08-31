import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteClientButton from "./delete-button";
import ContactsSection from "@/app/(dashboard)/contacts/contacts-section";

const statusColors: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  testing: "bg-purple-100 text-purple-700",
  launched: "bg-green-100 text-green-700",
  on_hold: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  const [{ data: contacts }, { data: projects }] = await Promise.all([
    supabase.from("contacts").select("*").eq("client_id", id).order("is_primary", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name, status")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{client.company_name}</h1>
          <p className="text-gray-600 mt-1">
            {client.status} · {client.industry || "No industry set"}
          </p>
          {client.website && (
            <a href={client.website} target="_blank" className="text-sm text-blue-600 hover:underline">
              {client.website}
            </a>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/clients/${id}/edit`}
            className="text-sm border rounded px-3 py-1.5 hover:bg-gray-50 text-gray-700"
          >
            Edit
          </Link>
          <DeleteClientButton clientId={id} companyName={client.company_name} />
        </div>
      </div>

      {client.notes && (
        <section>
          <h2 className="font-medium mb-1 text-sm text-gray-600 uppercase tracking-wide">Notes</h2>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{client.notes}</p>
        </section>
      )}

      <ContactsSection clientId={id} contacts={contacts ?? []} />

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium text-sm text-gray-600 uppercase tracking-wide">Projects</h2>
          <Link href={`/clients/${id}/projects/new`} className="text-sm text-blue-600 hover:underline">
            + New Project
          </Link>
        </div>
        {projects?.length === 0 && <p className="text-sm text-gray-500">No projects yet.</p>}
        <div className="border rounded-lg divide-y">
          {projects?.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-900">{p.name}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[p.status]}`}>
                {p.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}