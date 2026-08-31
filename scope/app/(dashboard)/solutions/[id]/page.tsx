import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import FeaturesPanel from "./features-panel";

export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: solution } = await supabase
    .from("solutions")
    .select("*, clients(id, company_name), problems(id, title)")
    .eq("id", id)
    .single();

  if (!solution) notFound();

  const [{ data: solutionFeatures }, { data: library }, { data: dependencies }] = await Promise.all([
    supabase.from("solution_features").select("*").eq("solution_id", id).order("sort_order"),
    supabase.from("feature_library").select("*").eq("is_active", true).order("category").order("name"),
    supabase.from("feature_dependencies").select("*"),
  ]);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={solution.project_id ? `/projects/${solution.project_id}/problems` : `/clients/${solution.client_id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Problems & Solutions
        </Link>
        <h1 className="text-2xl font-semibold mt-1 text-gray-900">{solution.title}</h1>
        {solution.problems && (
          <p className="text-sm text-gray-600">Solves: {solution.problems.title}</p>
        )}
        {solution.description && <p className="text-sm text-gray-700 mt-1">{solution.description}</p>}
      </div>

      <FeaturesPanel
        solutionId={id}
        clientId={solution.client_id}
        solutionFeatures={solutionFeatures ?? []}
        library={library ?? []}
        dependencies={dependencies ?? []}
      />
    </div>
  );
}