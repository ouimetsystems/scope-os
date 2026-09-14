import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import FeatureDetailClient from "./feature-detail-client";

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: feature } = await supabase
    .from("features")
    .select("*, projects(id, name), problem_features(problem_id, problems(id, title))")
    .eq("id", id)
    .single();

  if (!feature) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/projects/${feature.project_id}/problems`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← {feature.projects?.name}
        </Link>
        <h1 className="text-2xl font-semibold mt-1 text-gray-900">{feature.name}</h1>
      </div>

      {feature.problem_features.length > 0 && (
        <div>
          <p className="text-xs text-gray-700 uppercase tracking-wide mb-1">Solves these Problems</p>
          <div className="flex flex-wrap gap-1">
            {feature.problem_features.map((pf: any) => (
              <span key={pf.problem_id} className="text-xs bg-orange-50 text-orange-800 rounded-full px-2 py-0.5">
                {pf.problems?.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <FeatureDetailClient feature={feature} projectId={feature.project_id} />
    </div>
  );
}