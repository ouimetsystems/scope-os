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
    .select("*, clients(id, company_name), solutions(id, title)")
    .eq("id", id)
    .single();

  if (!quote) notFound();

  const { data: features } = await supabase
    .from("solution_features")
    .select("*")
    .eq("solution_id", quote.solution_id)
    .order("sort_order");

  const priced = (features ?? []).filter((f) => f.price != null || f.recurring_price != null);
  const unpriced = (features ?? []).filter((f) => f.price == null && f.recurring_price == null);

  const oneTimeTotal = priced.reduce((sum, f) => sum + (f.price ?? 0), 0);
  const monthlyTotal = priced.reduce((sum, f) => sum + (f.recurring_price ?? 0), 0);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/clients/${quote.client_id}`} className="text-sm text-blue-600 hover:underline">
          ← {quote.clients.company_name}
        </Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-2xl font-semibold">{quote.quote_number}</h1>
          <span className="text-xs uppercase tracking-wide bg-gray-100 px-2 py-1 rounded-full">
            {quote.status} · v{quote.version}
          </span>
        </div>
        <p className="text-sm text-gray-500">For: {quote.solutions?.title}</p>
      </div>

      <QuoteActionsClient quoteId={id} status={quote.status} />

      <div className="border rounded-lg p-4 bg-gray-50 flex gap-6 text-sm">
        <span>
          <span className="text-gray-500">One-time total:</span>{" "}
          <span className="font-semibold">${oneTimeTotal.toFixed(2)}</span>
        </span>
        <span>
          <span className="text-gray-500">Monthly total:</span>{" "}
          <span className="font-semibold">${monthlyTotal.toFixed(2)}/mo</span>
        </span>
      </div>

      <section>
        <h2 className="font-medium mb-2 text-sm text-gray-500 uppercase tracking-wide">
          Included Features
        </h2>
        <div className="border rounded-lg divide-y">
          {priced.map((f) => (
            <div key={f.id} className="p-3 flex items-center justify-between text-sm">
              <span>{f.name}</span>
              <span className="text-gray-600">
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
              <div key={f.id} className="p-3 text-sm">
                {f.name}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Set a price on these features from the Solution page, then generate a new quote version to
            include them.
          </p>
        </section>
      )}
    </div>
  );
}