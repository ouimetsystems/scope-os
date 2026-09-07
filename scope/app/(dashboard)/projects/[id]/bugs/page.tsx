import { createClient } from "@/lib/supabase/server";
import BugsClient from "./bugs-client";

export default async function ProjectBugsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: bugs } = await supabase
    .from("bugs")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return <BugsClient projectId={id} bugs={bugs ?? []} />;
}