import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { flipOverduePayments } from "./actions";
import PaymentRow from "./payment-row";

export default async function PaymentsPage() {
  await flipOverduePayments();

  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("*, clients(id, company_name)")
    .in("status", ["upcoming", "due", "overdue"])
    .order("due_date", { ascending: true, nullsFirst: false });

  const { data: monthlyServices } = await supabase
    .from("monthly_services")
    .select("*, clients(id, company_name)")
    .eq("is_active", true);

  const overdue = (payments ?? []).filter((p) => p.status === "overdue");
  const upcoming = (payments ?? []).filter((p) => p.status !== "overdue");

  const overdueTotal = overdue.reduce((sum, p) => sum + Number(p.amount), 0);
  const upcomingTotal = upcoming.reduce((sum, p) => sum + Number(p.amount), 0);
  const monthlyTotal = (monthlyServices ?? []).reduce((sum, m) => sum + Number(m.monthly_amount), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Overdue</p>
          <p className="text-2xl font-semibold text-red-700">${overdueTotal.toFixed(2)}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Upcoming</p>
          <p className="text-2xl font-semibold text-gray-900">${upcomingTotal.toFixed(2)}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600">Monthly Services (active)</p>
          <p className="text-2xl font-semibold text-gray-900">${monthlyTotal.toFixed(2)}/mo</p>
        </div>
      </div>

      {overdue.length > 0 && (
        <section>
          <h2 className="font-medium text-sm text-red-700 uppercase tracking-wide mb-2">Overdue</h2>
          <div className="border border-red-300 rounded-lg divide-y divide-red-200">
            {overdue.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-medium text-sm text-gray-600 uppercase tracking-wide mb-2">Upcoming</h2>
        {upcoming.length === 0 && <p className="text-sm text-gray-500">Nothing upcoming.</p>}
        <div className="border rounded-lg divide-y">
          {upcoming.map((p) => (
            <PaymentRow key={p.id} payment={p} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-sm text-gray-600 uppercase tracking-wide mb-2">
          Active Monthly Services
        </h2>
        {(monthlyServices ?? []).length === 0 && (
          <p className="text-sm text-gray-500">No active monthly services.</p>
        )}
        <div className="border rounded-lg divide-y">
          {monthlyServices?.map((m) => (
            <Link
              key={m.id}
              href={`/clients/${m.client_id}`}
              className="flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <span className="text-sm text-gray-900">{m.clients?.company_name}</span>
              <span className="text-sm text-gray-700">
                ${m.monthly_amount}/mo · bills on day {m.billing_day}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}