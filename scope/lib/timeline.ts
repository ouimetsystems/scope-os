import { createClient } from "@/lib/supabase/server";

export async function logTimelineEvent(
  projectId: string,
  eventType: string,
  description: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createClient();
  await supabase.from("timeline_events").insert({
    project_id: projectId,
    event_type: eventType,
    description,
    metadata,
  });
}