import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CreateSowButton from "./create-sow-button";
import SowFormClient from "./sow-form-client";
import PaymentSchedule from "./payment-schedule";

export default async function ProjectSowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id, sow_id")
    .eq("id", id)
    .single();

  if (!project) notFound();

  if (!project.sow_id) {
    return (
      <div>
        <h2 className="font-medium text-gray-900 mb-2">Statement of Work</h2>
        <p className="text-sm text-gray-600 mb-4">
          No SOW started yet. This pulls in your latest quote's pricing automatically — generate a
          quote first if you haven't.
        </p>
        <CreateSowButton projectId={id} />
      </div>
    );
  }

  const { data: sow } = await supabase.from("sows").select("*").eq("id", project.sow_id).single();
  if (!sow) notFound();

  const { data: solutions } = await supabase
    .from("solutions")
    .select("id")
    .eq("project_id", id)
    .eq("status", "selected");

  const solutionIds = (solutions ?? []).map((s) => s.id);

  const { data: features } = solutionIds.length
    ? await supabase.from("solution_features").select("name, description").in("solution_id", solutionIds)
    : { data: [] };

  const { data: paymentLines } = await supabase
    .from("sow_payment_schedule")
    .select("*")
    .eq("sow_id", sow.id)
    .order("sort_order");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-gray-900">{sow.sow_number}</h2>
          <p className="text-xs text-gray-600">
            v{sow.version} · {sow.status}
          </p>
        </div>
        <a
          href={`/api/sows/${sow.id}/pdf`}
          target="_blank"
          className="text-sm bg-black text-white rounded px-3 py-1.5 hover:bg-gray-800"
        >
          Download PDF
        </a>
      </div>

      <section className="border rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
          Included Features (from selected solutions)
        </h3>
        {(features ?? []).length === 0 ? (
          <p className="text-sm text-gray-700">
            No features yet — mark a solution as "selected" on the Problems & Solutions tab.
          </p>
        ) : (
          <ul className="text-sm text-gray-800 space-y-1 list-disc pl-5">
            {features?.map((f, i) => (
              <li key={i}>{f.name}</li>
            ))}
          </ul>
        )}
      </section>

      <SowFormClient sowId={sow.id} projectId={id} initialData={sow.form_data} status={sow.status} />

      <PaymentSchedule sowId={sow.id} projectId={id} lines={paymentLines ?? []} />
    </div>
  );
}