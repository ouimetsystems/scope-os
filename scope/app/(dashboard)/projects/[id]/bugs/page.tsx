import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BugsClient from "./bugs-client";

export default async function ProjectBugsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("id, client_id").eq("id", id).single();
  if (!project) notFound();

  const [{ data: bugs }, { data: features }] = await Promise.all([
    supabase.from("bugs").select("*, features(id, name)").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("features").select("id, name").eq("project_id", id).order("name"),
  ]);

  return (
    <BugsClient
      projectId={id}
      clientId={project.client_id}
      bugs={bugs ?? []}
      features={features ?? []}
    />
  );
}