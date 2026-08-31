import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import QuoteActionsClient from "./quote-actions-client";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, clients(id, company_name), projects(id, name)")
    .eq("id", id)
    .single();

  if (!quote) notFound();

  const { data: solutions } = await supabase
    .from("solutions")
    .select("id")
    .eq("project_id", quote.project_id)
    .eq("status", "selected");

  const solutionIds = (solutions ?? []).map((s) => s.id);

  const { data: features } = solutionIds.length
    ? await supabase.from("solution_features").select("*").in("solution_id", solutionIds).order("name")
    : { data: [] };

  const priced = (features ?? []).filter((f) => f.price != null || f.recurring_price != null);
  const unpriced = (features ?? []).filter((f) => f.price == null && f.recurring_price == null);

  const oneTimeTotal = priced.reduce((sum, f) => sum + (f.price ?? 0), 0);
  const monthlyTotal = priced.reduce((sum, f) => sum + (f.recurring_price ?? 0), 0);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/projects/${quote.project_id}/quotes`} className="text-sm text-blue-600 hover:underline">
          ← {quote.projects?.name}
        </Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-2xl font-semibold text-gray-900">{quote.quote_number}</h1>
          <span className="text-xs uppercase tracking-wide bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
            {quote.status} · v{quote.version}
          </span>
        </div>
        <p className="text-sm text-gray-600">{quote.clients?.company_name}</p>
      </div>

      <QuoteActionsClient quoteId={id} status={quote.status} />

      <div className="border rounded-lg p-4 bg-gray-50 flex gap-6 text-sm">
        <span>
          <span className="text-gray-600">One-time total:</span>{" "}
          <span className="font-semibold text-gray-900">${oneTimeTotal.toFixed(2)}</span>
        </span>
        <span>
          <span className="text-gray-600">Monthly total:</span>{" "}
          <span className="font-semibold text-gray-900">${monthlyTotal.toFixed(2)}/mo</span>
        </span>
      </div>

      <section>
        <h2 className="font-medium mb-2 text-sm text-gray-600 uppercase tracking-wide">
          Included Features
        </h2>
        <div className="border rounded-lg divide-y">
          {priced.map((f) => (
            <div key={f.id} className="p-3 flex items-center justify-between text-sm">
              <span className="text-gray-900">{f.name}</span>
              <span className="text-gray-700">
                {f.price ? `$${f.price}` : ""}
                {f.price && f.recurring_price ? " + " : ""}
                {f.recurring_price ? `$${f.recurring_price}/mo` : ""}
                {!f.price && !f.recurring_price && "Included"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {unpriced.length > 0 && (
        <section>
          <h2 className="font-medium mb-2 text-sm text-yellow-700 uppercase tracking-wide">
            Not Applied — Needs Pricing
          </h2>
          <div className="border border-yellow-300 bg-yellow-50 rounded-lg divide-y divide-yellow-200">
            {unpriced.map((f) => (
              <div key={f.id} className="p-3 text-sm text-gray-900">
                {f.name}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Set a price on these features from the Solution page, then generate a new quote version to
            include them.
          </p>
        </section>
      )}
    </div>
  );
}