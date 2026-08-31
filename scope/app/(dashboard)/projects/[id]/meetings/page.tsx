import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProjectMeetingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, meeting_type, meeting_date, notes")
    .eq("project_id", id)
    .order("meeting_date", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900">Meetings</h2>
        <Link
          href={`/projects/${id}/meetings/new`}
          className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800"
        >
          + Log Meeting
        </Link>
      </div>

      {meetings?.length === 0 && <p className="text-sm text-gray-500">No meetings logged yet.</p>}

      <div className="border rounded-lg divide-y">
        {meetings?.map((m) => (
          <Link key={m.id} href={`/meetings/${m.id}`} className="block p-3 hover:bg-gray-50">
            <p className="text-sm font-medium text-gray-900">
              {new Date(m.meeting_date).toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">{m.meeting_type}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}