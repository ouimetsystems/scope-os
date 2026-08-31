"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProjectStatus } from "@/app/(dashboard)/projects/actions";

export default function ProjectStatusSelect({
  projectId,
  status,
}: {
  projectId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <select
      value={status}
      disabled={pending}
      onChange={async (e) => {
        setPending(true);
        await updateProjectStatus(projectId, e.target.value);
        setPending(false);
        router.refresh();
      }}
      className="text-sm border rounded px-2 py-1.5 text-gray-900"
    >
      <option value="planning">Planning</option>
      <option value="in_progress">In Progress</option>
      <option value="testing">Testing</option>
      <option value="launched">Launched</option>
      <option value="on_hold">On Hold</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}
