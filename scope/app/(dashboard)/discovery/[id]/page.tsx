import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import QuestionsPanel from "../questions-panel";

export default async function DiscoverySessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("discovery_sessions")
    .select("*, clients(id, company_name)")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const [{ data: questions }, { data: library }] = await Promise.all([
    supabase
      .from("discovery_session_questions")
      .select("*")
      .eq("discovery_session_id", id)
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("discovery_question_library")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("question"),
  ]);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/clients/${session.client_id}`} className="text-sm text-blue-600 hover:underline">
          ← {session.clients.company_name}
        </Link>
        <h1 className="text-2xl font-semibold mt-1">{session.title}</h1>
      </div>

      <QuestionsPanel sessionId={id} questions={questions ?? []} library={library ?? []} />
    </div>
  );
}