import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const statusColors: Record<string, string> = {
  prospect: "bg-gray-100 text-gray-700",
  production: "bg-blue-100 text-blue-700",
  current: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  inactive: "bg-red-100 text-red-700",
};

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, company_name, industry, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="p-6 text-red-600">Failed to load clients: {error.message}</p>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link
          href="/clients/new"
          className="rounded bg-black text-white px-4 py-2 text-sm hover:bg-gray-800"
        >
          + New Client
        </Link>
      </div>

      <div className="border rounded-lg divide-y">
        {clients?.length === 0 && (
          <p className="p-6 text-sm text-gray-500 text-center">
            No clients yet. Add your first one above.
          </p>
        )}
        {clients?.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-medium">{c.company_name}</p>
              <p className="text-sm text-gray-500">{c.industry || "No industry set"}</p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[c.status]}`}
            >
              {c.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}