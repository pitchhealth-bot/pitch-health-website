import { createHash } from "node:crypto";

type Fields = Record<string, string>;
type ApplicantRecord = { id: string; fields: Record<string, unknown> };

export function airtableConfigured() {
  return Boolean(process.env.AIRTABLE_ACCESS_TOKEN && process.env.AIRTABLE_BASE_ID && process.env.AIRTABLE_TABLE_ID);
}

function endpoint() {
  return `https://api.airtable.com/v0/${encodeURIComponent(process.env.AIRTABLE_BASE_ID!)}/${encodeURIComponent(process.env.AIRTABLE_TABLE_ID!)}`;
}

async function airtableRequest(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  // Never log provider response bodies, credentials, or applicant data.
  if (!response.ok) throw new Error(`Airtable request failed (${response.status})`);
  return response.json();
}

export function submissionId(fields: Fields, filename: string, binary: Buffer) {
  return createHash("sha256").update(JSON.stringify(fields)).update(filename).update(binary).digest("hex");
}

export async function saveApplication(fields: Fields, filename: string, binary: Buffer, contentType: string) {
  const key = submissionId(fields, filename, binary);
  // A content-derived key prevents identical retries from creating new applicants.
  // No client-supplied record ID is accepted, so callers cannot overwrite arbitrary records.
  const result = await airtableRequest(endpoint(), "PATCH", {
    performUpsert: { fieldsToMergeOn: ["Application submission ID"] },
    records: [{ fields: { ...fields, "Application submission ID": key } }],
  });
  const record: ApplicantRecord | undefined = result.records?.[0];
  if (!record?.id || !/^rec[a-zA-Z0-9]+$/.test(record.id) || !record.fields)
    throw new Error("Invalid Airtable record response");

  const attachments = record.fields.Attachments;
  if (!Array.isArray(attachments) || !attachments.some(a => a.filename === filename && a.size === binary.length)) {
    // Direct authenticated byte upload: no public bucket or externally hosted résumé URL.
    const upload = await airtableRequest(
      `https://content.airtable.com/v0/${encodeURIComponent(process.env.AIRTABLE_BASE_ID!)}/${record.id}/Attachments/uploadAttachment`,
      "POST", { filename, file: binary.toString("base64"), contentType },
    );
    const uploaded = Object.values(upload.fields ?? {}).some(value =>
      Array.isArray(value) && value.some(a => a.filename === filename && a.size === binary.length),
    );
    if (!uploaded) throw new Error("Airtable did not confirm résumé storage");
  }
  return { id: record.id, key, emailSent: record.fields["Email delivery status"] === "Sent" };
}

export async function markEmailSent(id: string) {
  await airtableRequest(`${endpoint()}/${encodeURIComponent(id)}`, "PATCH", {
    fields: { "Email delivery status": "Sent" },
  });
}
