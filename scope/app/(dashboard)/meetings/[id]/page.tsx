import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import NextSteps from "./next-steps";
import QuestionsPanel from "../../discovery/questions-panel";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*, clients(id, company_name)")
    .eq("id", id)
    .single();

  if (!meeting) notFound();

  const [{ data: nextSteps }, { data: questions }, { data: library }] = await Promise.all([
    supabase.from("meeting_next_steps").select("*").eq("meeting_id", id).order("created_at"),
    supabase
      .from("discovery_session_questions")
      .select("*")
      .eq("meeting_id", id)
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
        <Link href={`/clients/${meeting.client_id}`} className="text-sm text-blue-600 hover:underline">
          ← {meeting.clients.company_name}
        </Link>
        <h1 className="text-2xl font-semibold mt-1">
          {meeting.meeting_type} — {new Date(meeting.meeting_date).toLocaleDateString()}
        </h1>
      </div>

      {meeting.attendees && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Attendees:</span> {meeting.attendees}
        </p>
      )}

      {meeting.notes && (
        <section>
          <h2 className="font-medium mb-1 text-sm text-gray-500 uppercase tracking-wide">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{meeting.notes}</p>
        </section>
      )}

      <NextSteps meetingId={id} nextSteps={nextSteps ?? []} />

      <section>
        <h2 className="font-medium mb-3 text-sm text-gray-500 uppercase tracking-wide">
          Discovery Questions
        </h2>
        <QuestionsPanel meetingId={id} questions={questions ?? []} library={library ?? []} />
      </section>
    </div>
  );
}