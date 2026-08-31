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

  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const { data: problems } = await supabase
    .from("problems")
    .select("*, solutions(id, title, status)")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return (
    <ProblemsSection clientId={project.client_id} projectId={id} problems={problems ?? []} />
  );
}