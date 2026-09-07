import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ChangeRequestsClient from "./change-requests-client";

export default async function ProjectChangeRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("id, client_id").eq("id", id).single();
  if (!project) notFound();

  const { data: crs } = await supabase
    .from("change_requests")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return <ChangeRequestsClient clientId={project.client_id} projectId={id} changeRequests={crs ?? []} />;
}