import { createClient } from "@/lib/supabase/server";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ count: meetingCount }, { count: problemCount }, { count: quoteCount }] = await Promise.all([
    supabase.from("meetings").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("problems").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("quotes").select("id", { count: "exact", head: true }).eq("project_id", id),
  ]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-600">Meetings</p>
        <p className="text-2xl font-semibold text-gray-900">{meetingCount ?? 0}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-600">Problems Logged</p>
        <p className="text-2xl font-semibold text-gray-900">{problemCount ?? 0}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-600">Quotes</p>
        <p className="text-2xl font-semibold text-gray-900">{quoteCount ?? 0}</p>
      </div>
    </div>
  );
}