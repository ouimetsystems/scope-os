import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { bugSubmissionSchema } from "@/lib/validations/bug";

// Uses the service role key — this route is intentionally public (no login),
// so it bypasses RLS on purpose after verifying the api_key belongs to a real client.
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  console.log("Received API key:", JSON.stringify(apiKey));

  if (!apiKey) {
    return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bugSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const supabase = serviceClient();

  const { data: client, error: clientLookupError } = await supabase
    .from("clients")
    .select("id")
    .eq("api_key", apiKey)
    .single();

  console.log("Client lookup result:", client, "Error:", clientLookupError);

  if (!client) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  // Find the client's most recently active project to attach the bug to.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "No project found for this client" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bugs")
    .insert({
      client_id: client.id,
      project_id: project.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      error_code: parsed.data.error_code || null,
      environment: parsed.data.environment,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, bug_id: data.id }, { status: 201 });
}