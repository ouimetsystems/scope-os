import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteClientButton from "./delete-button";
import ContactsSection from "@/app/(dashboard)/contacts/contacts-section";
import ProblemsSection from "@/app/(dashboard)/problems/problems-section";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  const [
    { data: contacts },
    { data: projects },
    { data: upcomingPayments },
    { data: meetings },
    { data: discoverySessions },
    { data: problems },
  ] = await Promise.all([
    supabase.from("contacts").select("*").eq("client_id", id).order("is_primary", { ascending: false }),
    supabase.from("projects").select("id, name, status").eq("client_id", id),
    supabase
      .from("payments")
      .select("id, description, amount, due_date")
      .eq("client_id", id)
      .in("status", ["upcoming", "due"])
      .order("due_date"),
    supabase
      .from("meetings")
      .select("id, meeting_type, meeting_date, notes")
      .eq("client_id", id)
      .order("meeting_date", { ascending: false })
      .limit(5),
    supabase
      .from("discovery_sessions")
      .select("id, title, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("problems")
      .select("*, solutions(id, title, status)")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.company_name}</h1>
          <p className="text-gray-500 mt-1">
            {client.status} · {client.industry || "No industry set"}
          </p>
          {client.website && (
            <a href={client.website} target="_blank" className="text-sm text-blue-600 hover:underline">
              {client.website}
            </a>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/clients/${id}/edit`} className="text-sm border rounded px-3 py-1.5 hover:bg-gray-50">
            Edit
          </Link>
          <DeleteClientButton clientId={id} companyName={client.company_name} />
        </div>
      </div>

      {client.notes && (
        <section>
          <h2 className="font-medium mb-1 text-sm text-gray-500 uppercase tracking-wide">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
        </section>
      )}

      <ContactsSection clientId={id} contacts={contacts ?? []} />

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Discovery</h2>
          <Link href={`/clients/${id}/discovery/new`} className="text-sm text-blue-600 hover:underline">
            + New Session
          </Link>
        </div>
        {discoverySessions?.length === 0 && (
          <p className="text-sm text-gray-400">No discovery sessions yet.</p>
        )}
        <div className="space-y-1">
          {discoverySessions?.map((s) => (
            <Link key={s.id} href={`/discovery/${s.id}`} className="block text-sm hover:underline">
              {s.title}
            </Link>
          ))}
        </div>
      </section>

      <ProblemsSection clientId={id} problems={problems ?? []} />

      <section>
        <h2 className="font-medium mb-2 text-sm text-gray-500 uppercase tracking-wide">Projects</h2>
        {projects?.length === 0 && <p className="text-sm text-gray-400">No projects yet.</p>}
        <div className="space-y-1">
          {projects?.map((p) => (
            <p key={p.id} className="text-sm">
              {p.name} <span className="text-gray-500">— {p.status}</span>
            </p>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-2 text-sm text-gray-500 uppercase tracking-wide">Upcoming Payments</h2>
        {upcomingPayments?.length === 0 && <p className="text-sm text-gray-400">Nothing outstanding.</p>}
        <div className="space-y-1">
          {upcomingPayments?.map((p) => (
            <p key={p.id} className="text-sm">
              ${p.amount} — {p.description || "Payment"}
              {p.due_date && <span className="text-gray-500"> · due {p.due_date}</span>}
            </p>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium text-sm text-gray-500 uppercase tracking-wide">Recent Meetings</h2>
          <Link href={`/clients/${id}/meetings/new`} className="text-sm text-blue-600 hover:underline">
            + Log Meeting
          </Link>
        </div>
        {meetings?.length === 0 && <p className="text-sm text-gray-400">No meetings logged yet.</p>}
        <div className="space-y-1">
          {meetings?.map((m) => (
            <Link key={m.id} href={`/meetings/${m.id}`} className="block text-sm hover:underline">
              {new Date(m.meeting_date).toLocaleDateString()} — {m.meeting_type}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}