import { createClient } from "@/lib/supabase/server";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: questions }, { data: problems }, { count: featureCount }, { count: quoteCount }] =
    await Promise.all([
      supabase.from("discovery_session_questions").select("answer").eq("project_id", id),
      supabase.from("problems").select("id, status").eq("project_id", id),
      supabase.from("features").select("id", { count: "exact", head: true }).eq("project_id", id),
      supabase.from("quotes").select("id", { count: "exact", head: true }).eq("project_id", id),
    ]);

  const unanswered = (questions ?? []).filter((q) => !q.answer || !q.answer.trim()).length;
  const openProblems = (problems ?? []).filter((p) => p.status === "open").length;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-700">Unanswered Questions</p>
        <p className="text-2xl font-semibold text-gray-900">{unanswered}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-700">Open Problems</p>
        <p className="text-2xl font-semibold text-gray-900">{openProblems}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-700">Features</p>
        <p className="text-2xl font-semibold text-gray-900">{featureCount ?? 0}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-700">Quotes</p>
        <p className="text-2xl font-semibold text-gray-900">{quoteCount ?? 0}</p>
      </div>
    </div>
  );
}