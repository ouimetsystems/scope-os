import { createClient } from "@/lib/supabase/server";
import LibraryClient from "./library-client";

export default async function FeatureLibraryPage() {
  const supabase = await createClient();

  const [{ data: features }, { data: dependencies }] = await Promise.all([
    supabase.from("feature_library").select("*").order("name"),
    supabase.from("feature_dependencies").select("*"),
  ]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Feature Library</h1>
      <LibraryClient features={features ?? []} dependencies={dependencies ?? []} />
    </div>
  );
}