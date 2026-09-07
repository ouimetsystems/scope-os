import { createClient } from "@/lib/supabase/server";
import DevLogsClient from "./dev-logs-client";

export default async function ProjectDevLogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("development_logs")
    .select("*")
    .eq("project_id", id)
    .order("entry_date", { ascending: false });

  const totalHours = (logs ?? []).reduce((sum, l) => sum + Number(l.hours_spent ?? 0), 0);

  return <DevLogsClient projectId={id} logs={logs ?? []} totalHours={totalHours} />;
}