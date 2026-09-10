import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
  <Link href="/clients" className="font-semibold text-gray-900">
    SCOPE
  </Link>
  <Link href="/clients" className="text-sm text-gray-700 hover:text-gray-900">
    Clients
  </Link>
  <Link href="/payments" className="text-sm text-gray-700 hover:text-gray-900">
    Payments
  </Link>
  <Link href="/features/library" className="text-sm text-gray-700 hover:text-gray-900">
    Feature Library
  </Link>
</div>
          <form action={logout}>
            <button className="text-sm text-gray-700 hover:text-black">
              Sign Out
            </button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}