import { createClient } from "@/lib/supabase/server";
import LibraryClient from "./library-client";

export default async function DiscoveryLibraryPage() {
  const supabase = await createClient();
  const { data: questions } = await supabase
    .from("discovery_question_library")
    .select("*")
    .order("category")
    .order("question");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2 text-gray-900">Discovery Question Templates</h1>
      <p className="text-sm text-gray-700 mb-6">
        Questions marked "Default" are automatically added to every new project.
      </p>
      <LibraryClient questions={questions ?? []} />
    </div>
  );
}