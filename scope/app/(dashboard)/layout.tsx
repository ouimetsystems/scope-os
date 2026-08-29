import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/clients" className="font-semibold">
            SCOPE
          </Link>
          <form action={logout}>
            <button className="text-sm text-gray-500 hover:text-black">
              Sign Out
            </button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}