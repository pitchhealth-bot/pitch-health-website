import { NextResponse } from "next/server";
import { validateAnswers } from "../../survey/survey-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const configured = () => process.env.SURVEY_INTAKE_ENABLED === "true" && Boolean(process.env.SURVEY_AIRTABLE_API_TOKEN);
const headers = { "Cache-Control": "no-store" };
const destination = "https://api.airtable.com/v0/app4ihGae0XFY7RAD/tbliyoHDTdMVNYsma";

export async function GET() {
  return NextResponse.json({ enabled: configured() }, { headers });
}

export async function POST(request: Request) {
  if (!configured()) return NextResponse.json({ error: "Website survey submissions are not available yet. Please use the existing Airtable survey." }, { status: 503, headers });
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ error: "Invalid request format." }, { status: 415, headers });
  // Bound the actual bytes, including chunked bodies without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Missing answers." }, { status: 400, headers });
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 32768) { await reader.cancel(); return NextResponse.json({ error: "Survey answers are too large." }, { status: 413, headers }); }
    chunks.push(value);
  }
  let data: unknown;
  try { data = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { return NextResponse.json({ error: "Invalid survey answers." }, { status: 400, headers }); }
  const validated = validateAnswers(data);
  if (!validated.fields) return NextResponse.json({ error: validated.error }, { status: 400, headers });
  try {
    const response = await fetch(destination, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SURVEY_AIRTABLE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields: validated.fields }], typecast: false }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return NextResponse.json({ error: "Your feedback could not be saved. Please contact our team or use the existing survey." }, { status: 502, headers });
    const result = await response.json() as { records?: { id?: string }[] };
    if (!/^rec[A-Za-z0-9]{14}$/.test(result.records?.[0]?.id || "")) throw new Error("Unconfirmed save");
    return NextResponse.json({ ok: true }, { headers });
  } catch {
    // No automatic retry: Airtable may have accepted the write before a timeout.
    return NextResponse.json({ error: "We could not confirm whether your feedback was saved. Please contact our team before sending it again." }, { status: 502, headers });
  }
}
