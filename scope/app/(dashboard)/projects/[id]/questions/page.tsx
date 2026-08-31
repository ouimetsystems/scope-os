import { createClient } from "@/lib/supabase/server";
import QuestionsPanel from "@/app/(dashboard)/discovery/questions-panel";

export default async function ProjectQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: questions }, { data: library }] = await Promise.all([
    supabase
      .from("discovery_session_questions")
      .select("*")
      .eq("project_id", id)
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
    <div>
      <h2 className="font-medium text-gray-900 mb-4">Discovery Questions</h2>
      <QuestionsPanel projectId={id} questions={questions ?? []} library={library ?? []} />
    </div>
  );
}