import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

export default async function ProjectQuotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, version, status, total_amount, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="font-medium text-gray-900 mb-4">Quotes</h2>

      {quotes?.length === 0 && (
        <p className="text-sm text-gray-500">
          No quotes yet — generate one from the Features tab once you have priced features.
        </p>
      )}

      <div className="border rounded-lg divide-y">
        {quotes?.map((q) => (
          <Link
            key={q.id}
            href={`/quotes/${q.id}`}
            className="flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {q.quote_number} <span className="text-gray-500">v{q.version}</span>
              </p>
              <p className="text-xs text-gray-600">${q.total_amount} one-time</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[q.status]}`}>
              {q.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}