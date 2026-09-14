import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import QuestionsPanel from "./questions-panel";

export default async function ProjectQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("id, client_id").eq("id", id).single();
  if (!project) notFound();

  const [{ data: questions }, { data: library }] = await Promise.all([
    supabase
      .from("discovery_session_questions")
      .select("*")
      .eq("project_id", id)
      .order("category")
      .order("sort_order"),
    supabase
      .from("discovery_question_library")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("question"),
  ]);

  return (
    <QuestionsPanel
      projectId={id}
      clientId={project.client_id}
      questions={questions ?? []}
      library={library ?? []}
    />
  );
}