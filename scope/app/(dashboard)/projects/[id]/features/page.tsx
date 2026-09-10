import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FeaturesClient from "./features-client";

export default async function ProjectFeaturesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("id").eq("id", id).single();
  if (!project) notFound();

  const { data: features } = await supabase
    .from("features")
    .select("*, problem_features(problem_id, problems(id, title))")
    .eq("project_id", id)
    .order("sort_order")
    .order("created_at");

  const { data: library } = await supabase
    .from("feature_library")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("name");

  const { data: bugCounts } = await supabase
    .from("bugs")
    .select("feature_id")
    .eq("project_id", id)
    .not("status", "in", "(fixed,closed,wont_fix)");

  const bugCountByFeature = (bugCounts ?? []).reduce<Record<string, number>>((acc, b: any) => {
    if (b.feature_id) acc[b.feature_id] = (acc[b.feature_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <FeaturesClient
      projectId={id}
      features={features ?? []}
      library={library ?? []}
      bugCountByFeature={bugCountByFeature}
    />
  );
}