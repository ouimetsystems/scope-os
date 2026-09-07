"use client";

import { useState } from "react";
import { updateSowFormData, approveSow } from "@/app/(dashboard)/sows/actions";
import type { SowFormData } from "@/lib/validations/sow";

function ListItemRows({
  items,
  onChange,
  fields,
}: {
  items: { title: string; body: string }[];
  onChange: (items: { title: string; body: string }[]) => void;
  fields: { titlePlaceholder: string; bodyPlaceholder: string };
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border rounded p-2 space-y-1">
          <input
            value={item.title}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...next[i], title: e.target.value };
              onChange(next);
            }}
            placeholder={fields.titlePlaceholder}
            className="w-full border rounded px-2 py-1 text-sm text-gray-900"
          />
          <textarea
            value={item.body}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...next[i], body: e.target.value };
              onChange(next);
            }}
            placeholder={fields.bodyPlaceholder}
            rows={2}
            className="w-full border rounded px-2 py-1 text-sm text-gray-900"
          />
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { title: "", body: "" }])}
        className="text-sm text-blue-600 hover:underline"
      >
        + Add
      </button>
    </div>
  );
}

function TextListField({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={items.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        rows={4}
        placeholder="One per line"
        className="w-full border rounded px-3 py-2 text-sm text-gray-900"
      />
    </div>
  );
}

export default function SowFormClient({
  sowId,
  projectId,
  initialData,
  status,
}: {
  sowId: string;
  projectId: string;
  initialData: SowFormData;
  status: string;
}) {
  const [data, setData] = useState<SowFormData>(initialData);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function set<K extends keyof SowFormData>(key: K, value: SowFormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateSowFormData(sowId, projectId, data);
    setSaving(false);
    if (!result?.error) setSavedAt(new Date().toLocaleTimeString());
  }

  const pricingSubtotal =
    data.pricing.development + data.pricing.data_migration + data.pricing.integrations_cost + data.pricing.other;
  const pricingTotal = pricingSubtotal + data.pricing.taxes;
  const recurringTotal =
    data.recurring.support_maintenance +
    data.recurring.hosting +
    data.recurring.third_party +
    data.recurring.additional_support;

  return (
    <div className="space-y-6">
      <section className="border rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Project Overview</h3>
        <textarea
          value={data.project_summary}
          onChange={(e) => set("project_summary", e.target.value)}
          rows={3}
          placeholder="Project summary..."
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
        />
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Functional Requirements</h3>
        <ListItemRows
          items={data.functional_requirements}
          onChange={(v) => set("functional_requirements", v)}
          fields={{ titlePlaceholder: "Function name", bodyPlaceholder: "Description" }}
        />
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Integrations</h3>
        <ListItemRows
          items={data.integrations}
          onChange={(v) => set("integrations", v)}
          fields={{
            titlePlaceholder: "Integration name",
            bodyPlaceholder: "Purpose, data exchanged, function, requirements, cost...",
          }}
        />
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Users & Permissions</h3>
        <ListItemRows
          items={data.user_roles}
          onChange={(v) => set("user_roles", v)}
          fields={{ titlePlaceholder: "Role name", bodyPlaceholder: "Permissions" }}
        />
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Deliverables & Responsibilities</h3>
        <TextListField label="Deliverables" items={data.deliverables} onChange={(v) => set("deliverables", v)} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Client Responsibilities
          </label>
          <textarea
            value={data.client_responsibilities_additional}
            onChange={(e) => set("client_responsibilities_additional", e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm text-gray-900"
          />
        </div>
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Timeline</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={data.start_date}
              onChange={(e) => set("start_date", e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Estimated Completion</label>
            <input
              type="date"
              value={data.estimated_completion_date}
              onChange={(e) => set("estimated_completion_date", e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Milestones</label>
          <div className="space-y-2">
            {data.milestones.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={m.name}
                  onChange={(e) => {
                    const next = [...data.milestones];
                    next[i] = { ...next[i], name: e.target.value };
                    set("milestones", next);
                  }}
                  className="flex-1 border rounded px-2 py-1 text-sm text-gray-900"
                />
                <input
                  type="date"
                  value={m.date}
                  onChange={(e) => {
                    const next = [...data.milestones];
                    next[i] = { ...next[i], date: e.target.value };
                    set("milestones", next);
                  }}
                  className="border rounded px-2 py-1 text-sm text-gray-900"
                />
                <button
                  onClick={() => set("milestones", data.milestones.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => set("milestones", [...data.milestones, { name: "", date: "" }])}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Milestone
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Additional Deadlines</label>
          <textarea
            value={data.additional_deadlines}
            onChange={(e) => set("additional_deadlines", e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Timeline Constraints</label>
          <textarea
            value={data.timeline_constraints}
            onChange={(e) => set("timeline_constraints", e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm text-gray-900"
          />
        </div>
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pricing</h3>
        <div className="grid grid-cols-2 gap-3">
          {(["development", "data_migration", "integrations_cost", "other", "taxes"] as const).map((key) => (
            <div key={key}>
              <label className="block text-xs text-gray-600 mb-1 capitalize">{key.replace("_", " ")}</label>
              <input
                type="number"
                step="0.01"
                value={data.pricing[key]}
                onChange={(e) => set("pricing", { ...data.pricing, [key]: parseFloat(e.target.value) || 0 })}
                className="w-full border rounded px-2 py-1 text-sm text-gray-900"
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-700">
          Subtotal: ${pricingSubtotal.toFixed(2)} · <span className="font-medium">Total: ${pricingTotal.toFixed(2)}</span>
        </p>

        <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mt-3">Recurring Costs</h4>
        <div className="grid grid-cols-2 gap-3">
          {(["support_maintenance", "hosting", "third_party", "additional_support"] as const).map((key) => (
            <div key={key}>
              <label className="block text-xs text-gray-600 mb-1 capitalize">{key.replace("_", " ")}</label>
              <input
                type="number"
                step="0.01"
                value={data.recurring[key]}
                onChange={(e) => set("recurring", { ...data.recurring, [key]: parseFloat(e.target.value) || 0 })}
                className="w-full border rounded px-2 py-1 text-sm text-gray-900"
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-700">Monthly Total: ${recurringTotal.toFixed(2)}/mo</p>
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Support & Hosting</h3>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Other Included Support (beyond defaults)</label>
          <textarea
            value={data.support_included_other}
            onChange={(e) => set("support_included_other", e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Other Support Exclusions</label>
          <textarea
            value={data.support_excluded_other}
            onChange={(e) => set("support_excluded_other", e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Hosting Provider</label>
            <input
              value={data.hosting_provider}
              onChange={(e) => set("hosting_provider", e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Database Provider</label>
            <input
              value={data.database_provider}
              onChange={(e) => set("database_provider", e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Other Services</label>
            <input
              value={data.other_services}
              onChange={(e) => set("other_services", e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm text-gray-900"
            />
          </div>
        </div>
        <TextListField
          label="Third-Party Costs (e.g. 'Twilio — $15/month')"
          items={data.third_party_costs}
          onChange={(v) => set("third_party_costs", v)}
        />
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Testing & Acceptance</h3>
        <TextListField
          label="Testing Requirements"
          items={data.testing_requirements}
          onChange={(v) => set("testing_requirements", v)}
        />
        <div>
          <label className="block text-sm text-gray-700 mb-1">Acceptance Period (days)</label>
          <input
            type="number"
            value={data.acceptance_days}
            onChange={(e) => set("acceptance_days", parseInt(e.target.value) || 0)}
            className="w-32 border rounded px-2 py-1 text-sm text-gray-900"
          />
        </div>
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          Assumptions, Constraints & Exclusions
        </h3>
        <TextListField label="Assumptions" items={data.assumptions} onChange={(v) => set("assumptions", v)} />
        <TextListField label="Constraints" items={data.constraints} onChange={(v) => set("constraints", v)} />
        <TextListField label="Exclusions" items={data.exclusions} onChange={(v) => set("exclusions", v)} />
      </section>

      <section className="border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Governing Documents</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">CSA Number</label>
            <input
              value={data.csa_number}
              onChange={(e) => set("csa_number", e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">CSA Date</label>
            <input
              type="date"
              value={data.csa_date}
              onChange={(e) => set("csa_date", e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm text-gray-900"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 sticky bottom-4 bg-white border rounded-lg p-3 shadow">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        {savedAt && <span className="text-xs text-gray-600">Saved at {savedAt}</span>}
        {status !== "approved" && (
          <button
            onClick={async () => {
              if (confirm("Approve this SOW? This adds its payment schedule to your Payments tracker.")) {
                await handleSave();
                await approveSow(sowId, projectId);
                window.location.reload();
              }
            }}
            className="ml-auto rounded border border-green-600 text-green-700 px-4 py-2 text-sm hover:bg-green-50"
          >
            Approve SOW
          </button>
        )}
        {status === "approved" && (
          <span className="ml-auto text-sm text-green-700 font-medium">Approved</span>
        )}
      </div>
    </div>
  );
}