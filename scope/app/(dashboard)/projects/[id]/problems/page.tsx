import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProblemsSection from "@/app/(dashboard)/problems/problems-section";

export default async function ProjectProblemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("id, client_id").eq("id", id).single();
  if (!project) notFound();

  const [{ data: problems }, { data: allFeatures }] = await Promise.all([
    supabase
      .from("problems")
      .select("*, problem_features(feature_id, features(id, name))")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("features").select("id, name").eq("project_id", id).order("name"),
  ]);

  return (
    <ProblemsSection
      clientId={project.client_id}
      projectId={id}
      problems={problems ?? []}
      allFeatures={allFeatures ?? []}
    />
  );
}