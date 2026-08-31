import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProjectStatusSelect from "./project-status-select";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, clients(id, company_name)")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const navItems = [
  { href: `/projects/${id}`, label: "Overview" },
  { href: `/projects/${id}/meetings`, label: "Meetings" },
  { href: `/projects/${id}/questions`, label: "Discovery Questions" },
  { href: `/projects/${id}/problems`, label: "Problems & Solutions" },
  { href: `/projects/${id}/features`, label: "Features" },
  { href: `/projects/${id}/quotes`, label: "Quotes" },
];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href={`/clients/${project.client_id}`} className="text-sm text-blue-600 hover:underline">
          ← {project.clients.company_name}
        </Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
          <ProjectStatusSelect projectId={id} status={project.status} />
        </div>
      </div>

      <div className="flex gap-6">
        <nav className="w-48 shrink-0 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
          <span className="block px-3 py-2 rounded text-sm text-gray-400 cursor-not-allowed">
            Generate SOW <span className="text-xs">(soon)</span>
          </span>
        </nav>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}