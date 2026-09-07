import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  title: { fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 16 },
  metaRow: { fontSize: 10, marginBottom: 2 },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  subTitle: { fontSize: 10, fontWeight: 700, marginTop: 6, marginBottom: 2 },
  body: { fontSize: 10, marginBottom: 4, lineHeight: 1.4 },
  bullet: { fontSize: 10, marginBottom: 2, marginLeft: 10 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ccc", paddingVertical: 3 },
  tableCellLeft: { flex: 2, fontSize: 10 },
  tableCellRight: { flex: 1, fontSize: 10, textAlign: "right" },
  tableHeader: { fontWeight: 700 },
});

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.filter(Boolean).map((item, i) => (
        <Text key={i} style={styles.bullet}>
          • {item}
        </Text>
      ))}
    </>
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sow } = await supabase.from("sows").select("*, clients(company_name)").eq("id", id).single();
  if (!sow) return NextResponse.json({ error: "SOW not found" }, { status: 404 });

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("sow_id", id)
    .maybeSingle();

  const { data: solutions } = project
    ? await supabase.from("solutions").select("id").eq("project_id", project.id).eq("status", "selected")
    : { data: [] };

  const solutionIds = (solutions ?? []).map((s) => s.id);

  const { data: features } = solutionIds.length
    ? await supabase.from("solution_features").select("name, description").in("solution_id", solutionIds)
    : { data: [] };

  const { data: paymentLines } = await supabase
    .from("sow_payment_schedule")
    .select("*")
    .eq("sow_id", id)
    .order("sort_order");

  const d = sow.form_data;
  const pricingSubtotal =
    (d.pricing?.development ?? 0) +
    (d.pricing?.data_migration ?? 0) +
    (d.pricing?.integrations_cost ?? 0) +
    (d.pricing?.other ?? 0);
  const pricingTotal = pricingSubtotal + (d.pricing?.taxes ?? 0);
  const recurringTotal =
    (d.recurring?.support_maintenance ?? 0) +
    (d.recurring?.hosting ?? 0) +
    (d.recurring?.third_party ?? 0) +
    (d.recurring?.additional_support ?? 0);
  const paymentTotal = (paymentLines ?? []).reduce((sum, l) => sum + Number(l.amount), 0);

  const doc = (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>STATEMENT OF WORK</Text>
        <Text style={styles.metaRow}>SOW Number: {sow.sow_number}</Text>
        <Text style={styles.metaRow}>Client: {sow.clients?.company_name}</Text>
        <Text style={styles.metaRow}>Date: {new Date(sow.created_at).toLocaleDateString()}</Text>
        <Text style={styles.metaRow}>Version: {sow.version}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Project Overview</Text>
          <Text style={styles.body}>{d.project_summary || "—"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Included Features</Text>
          {(features ?? []).map((f, i) => (
            <View key={i}>
              <Text style={styles.subTitle}>2.{i + 1} {f.name}</Text>
              {f.description && <Text style={styles.body}>{f.description}</Text>}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Functional Requirements</Text>
          {(d.functional_requirements ?? []).map((r: any, i: number) => (
            <View key={i}>
              <Text style={styles.subTitle}>3.{i + 1} {r.title}</Text>
              {r.body && <Text style={styles.body}>{r.body}</Text>}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Integrations</Text>
          {(d.integrations ?? []).map((r: any, i: number) => (
            <View key={i}>
              <Text style={styles.subTitle}>4.{i + 1} {r.title}</Text>
              {r.body && <Text style={styles.body}>{r.body}</Text>}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Users & Permissions</Text>
          {(d.user_roles ?? []).map((r: any, i: number) => (
            <View key={i}>
              <Text style={styles.subTitle}>5.{i + 1} {r.title}</Text>
              {r.body && <Text style={styles.body}>{r.body}</Text>}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Deliverables</Text>
          <Bullets items={d.deliverables ?? []} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Client Responsibilities</Text>
          <Text style={styles.body}>
            Providing required information, content, materials, third-party access, and timely
            feedback and approvals.
          </Text>
          {d.client_responsibilities_additional && <Text style={styles.body}>{d.client_responsibilities_additional}</Text>}
        </View>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Project Timeline</Text>
          <Text style={styles.body}>Start Date: {d.start_date || "—"}</Text>
          <Text style={styles.body}>Estimated Completion: {d.estimated_completion_date || "—"}</Text>
          <Text style={styles.subTitle}>Milestones</Text>
          {(d.milestones ?? []).map((m: any, i: number) => (
            <Text key={i} style={styles.body}>
              {m.name}: {m.date || "TBD"}
            </Text>
          ))}
          {d.additional_deadlines && (
            <>
              <Text style={styles.subTitle}>Additional Deadlines</Text>
              <Text style={styles.body}>{d.additional_deadlines}</Text>
            </>
          )}
          {d.timeline_constraints && (
            <>
              <Text style={styles.subTitle}>Timeline Constraints</Text>
              <Text style={styles.body}>{d.timeline_constraints}</Text>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Pricing & Payment</Text>
          <Text style={styles.subTitle}>9.1 Project Costs</Text>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellLeft}>Item</Text>
            <Text style={styles.tableCellRight}>Cost</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>Project Development</Text>
            <Text style={styles.tableCellRight}>${(d.pricing?.development ?? 0).toFixed(2)} CAD</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>Data Migration</Text>
            <Text style={styles.tableCellRight}>${(d.pricing?.data_migration ?? 0).toFixed(2)} CAD</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>Integrations</Text>
            <Text style={styles.tableCellRight}>${(d.pricing?.integrations_cost ?? 0).toFixed(2)} CAD</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>Other</Text>
            <Text style={styles.tableCellRight}>${(d.pricing?.other ?? 0).toFixed(2)} CAD</Text>
          </View>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellLeft}>Subtotal</Text>
            <Text style={styles.tableCellRight}>${pricingSubtotal.toFixed(2)} CAD</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>Taxes</Text>
            <Text style={styles.tableCellRight}>${(d.pricing?.taxes ?? 0).toFixed(2)} CAD</Text>
          </View>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellLeft}>Total Initial Project Cost</Text>
            <Text style={styles.tableCellRight}>${pricingTotal.toFixed(2)} CAD</Text>
          </View>

          <Text style={styles.subTitle}>9.2 Payment Schedule</Text>
          {(paymentLines ?? []).map((l, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCellLeft}>{l.description}</Text>
              <Text style={styles.tableCellRight}>${Number(l.amount).toFixed(2)} CAD</Text>
            </View>
          ))}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellLeft}>Total</Text>
            <Text style={styles.tableCellRight}>${paymentTotal.toFixed(2)} CAD</Text>
          </View>

          <Text style={styles.subTitle}>9.3 Recurring Costs</Text>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>Support & Maintenance</Text>
            <Text style={styles.tableCellRight}>${(d.recurring?.support_maintenance ?? 0).toFixed(2)}/mo</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>Hosting</Text>
            <Text style={styles.tableCellRight}>${(d.recurring?.hosting ?? 0).toFixed(2)}/mo</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>Third-Party Services</Text>
            <Text style={styles.tableCellRight}>${(d.recurring?.third_party ?? 0).toFixed(2)}/mo</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>Additional Support</Text>
            <Text style={styles.tableCellRight}>${(d.recurring?.additional_support ?? 0).toFixed(2)}/mo</Text>
          </View>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellLeft}>Total Monthly Cost</Text>
            <Text style={styles.tableCellRight}>${recurringTotal.toFixed(2)}/mo</Text>
          </View>
        </View>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Ongoing Support & Maintenance</Text>
          <Text style={styles.subTitle}>10.1 Included</Text>
          <Bullets
            items={[
              "Bug fixes",
              "Minor adjustments",
              "Routine maintenance",
              "Technical support",
              "Security updates",
              d.support_included_other,
            ]}
          />
          <Text style={styles.subTitle}>10.2 Not Included</Text>
          <Bullets
            items={[
              "New features",
              "New modules",
              "Major redesigns",
              "New integrations",
              "Significant functionality changes",
              "Work outside the agreed scope",
              d.support_excluded_other,
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Hosting & Third-Party Services</Text>
          <Text style={styles.body}>Hosting Provider: {d.hosting_provider || "—"}</Text>
          <Text style={styles.body}>Database Provider: {d.database_provider || "—"}</Text>
          <Text style={styles.body}>Other Services: {d.other_services || "—"}</Text>
          <Text style={styles.subTitle}>Third-Party Costs</Text>
          <Bullets items={d.third_party_costs ?? []} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Testing & Acceptance</Text>
          <Text style={styles.subTitle}>12.1 Testing Requirements</Text>
          <Bullets items={d.testing_requirements ?? []} />
          <Text style={styles.subTitle}>12.2 Acceptance</Text>
          <Text style={styles.body}>
            The Client shall have {d.acceptance_days || 7} days following delivery to identify material
            defects. If none are identified within that period, the deliverables are deemed accepted.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Change Requests</Text>
          <Text style={styles.body}>
            Changes to scope, functionality, requirements, integrations, or deliverables may require a
            Change Order, which can affect cost and timeline.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Assumptions & Constraints</Text>
          <Text style={styles.subTitle}>Assumptions</Text>
          <Bullets items={d.assumptions ?? []} />
          <Text style={styles.subTitle}>Constraints</Text>
          <Bullets items={d.constraints ?? []} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Exclusions</Text>
          <Bullets items={d.exclusions ?? []} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>17. Agreement & Governing Documents</Text>
          <Text style={styles.body}>
            This SOW is governed by the Ouimet Systems Client Services Agreement ("CSA").
          </Text>
          <Text style={styles.body}>Client Services Agreement: {d.csa_number || "—"}</Text>
          <Text style={styles.body}>CSA Date: {d.csa_date || "—"}</Text>
          <Text style={styles.body}>Statement of Work: {sow.sow_number}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>18. Signatures</Text>
          <Text style={styles.body}>Ouimet Systems — Name: _________________________ Date: ______________</Text>
          <Text style={styles.body}>Client — Name: _________________________ Date: ______________</Text>
        </View>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${sow.sow_number}.pdf"`,
    },
  });
}