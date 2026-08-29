import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditClientForm from "./edit-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Edit Client</h1>
      <EditClientForm client={client} />
    </div>
  );
}