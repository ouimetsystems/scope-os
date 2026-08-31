import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import GenerateProjectQuoteButton from "./generate-quote-button";

export default async function ProjectFeaturesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("id").eq("id", id).single();
  if (!project) notFound();

  const { data: solutions } = await supabase
    .from("solutions")
    .select("id, title, status")
    .eq("project_id", id)
    .eq("status", "selected");

  const solutionIds = (solutions ?? []).map((s) => s.id);

  const { data: features } = solutionIds.length
    ? await supabase
        .from("solution_features")
        .select("*, solutions(title)")
        .in("solution_id", solutionIds)
        .order("name")
    : { data: [] };

  const priced = (features ?? []).filter((f) => f.price != null || f.recurring_price != null);
  const unpriced = (features ?? []).filter((f) => f.price == null && f.recurring_price == null);

  const oneTimeTotal = priced.reduce((sum, f) => sum + (f.price ?? 0), 0);
  const monthlyTotal = priced.reduce((sum, f) => sum + (f.recurring_price ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900">Features</h2>
        {features && features.length > 0 && <GenerateProjectQuoteButton projectId={id} />}
      </div>

      {solutionIds.length === 0 && (
        <p className="text-sm text-gray-500">
          No selected solutions yet. Mark a solution as "selected" on the Problems & Solutions tab
          to see its features here.
        </p>
      )}

      {solutionIds.length > 0 && (
        <>
          <div className="flex gap-4 text-sm bg-gray-50 border rounded-lg p-3 mb-4">
            <span>
              <span className="text-gray-600">One-time:</span>{" "}
              <span className="font-medium text-gray-900">${oneTimeTotal.toFixed(2)}</span>
            </span>
            <span>
              <span className="text-gray-600">Monthly:</span>{" "}
              <span className="font-medium text-gray-900">${monthlyTotal.toFixed(2)}/mo</span>
            </span>
            {unpriced.length > 0 && (
              <span className="text-yellow-700">
                {unpriced.length} feature{unpriced.length > 1 ? "s" : ""} need pricing
              </span>
            )}
          </div>

          <div className="border rounded-lg divide-y">
            {(features ?? []).length === 0 && (
              <p className="p-3 text-sm text-gray-500">
                No features added yet — go into a selected solution to add some.
              </p>
            )}
            {features?.map((f: any) => (
              <div
                key={f.id}
                className={`p-3 text-sm ${
                  f.price == null && f.recurring_price == null ? "bg-yellow-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-medium">{f.name}</span>
                  <span className="text-gray-700">
                    {f.price != null && `$${f.price}`}
                    {f.price != null && f.recurring_price != null && " + "}
                    {f.recurring_price != null && `$${f.recurring_price}/mo`}
                    {f.price == null && f.recurring_price == null && (
                      <span className="text-yellow-700">needs pricing</span>
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">from: {f.solutions?.title}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Link href={`/projects/${id}/problems`} className="text-sm text-blue-600 hover:underline">
              Manage features from Problems & Solutions →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}