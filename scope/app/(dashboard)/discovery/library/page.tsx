import { createClient } from "@/lib/supabase/server";
import LibraryClient from "./library-client";

export default async function DiscoveryLibraryPage() {
  const supabase = await createClient();
  const { data: questions } = await supabase
    .from("discovery_question_library")
    .select("*")
    .order("category")
    .order("created_at");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Discovery Question Library</h1>
      <LibraryClient questions={questions ?? []} />
    </div>
  );
}