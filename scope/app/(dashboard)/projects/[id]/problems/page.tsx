import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProblemFeatureBoard from "./problem-feature-board";

export default async function ProjectProblemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("id, client_id").eq("id", id).single();
  if (!project) notFound();

  const [{ data: problems }, { data: features }, { data: library }] = await Promise.all([
    supabase
      .from("problems")
      .select("*, problem_features(feature_id, features(id, name))")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("features")
      .select("*, problem_features(problem_id, problems(id, title))")
      .eq("project_id", id)
      .order("sort_order")
      .order("created_at"),
    supabase.from("feature_library").select("*").eq("is_active", true).order("category").order("name"),
  ]);

  return (
    <ProblemFeatureBoard
      clientId={project.client_id}
      projectId={id}
      problems={problems ?? []}
      features={features ?? []}
      library={library ?? []}
    />
  );
}