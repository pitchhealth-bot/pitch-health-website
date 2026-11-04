/**
 * Field IDs verified against Recruiting Pipeline / Website Applicants on 2026-11-04.
 * No browser-side Airtable credentials: all access stays on the server.
 */
const BASE_ID = "appHdrREosaz1BUMv";
const TABLE_ID = "tblxsRT8YnsNUa9jm";
const RECORDS_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

const FIELD = {
  name: "fldaTbnNY5ffs34Xa",
  firstName: "fldgKduaAEDYOZqUT",
  lastName: "fldhTBh2UXJTo8sCe",
  email: "fldmlxUsVz5gPj0PC",
  phone: "fldk8Yt16GF6eFAgT",
  state: "fldQMo9P3lUzE9Ey5",
  adult: "fldtn3iQAbXp8l2Gu",
  licenseType: "fld4COrgyQ6c1veCD",
  willingToLicense: "fldzrtVFi2eMqHcd8",
  needsReleases: "fldhtLSY7shtz54sK",
  lastEmploymentDate: "fld38KsTRzpyD2nSU",
  privacyAcknowledged: "fldffNZgfkEWNWfuX",
  smsConsent: "fldFe3zyjKfEWBoZY",
  submissionId: "flddmUSV5aBnGrV5U",
  emailStatus: "fldGogWL1zth7zw06",
} as const;

export type ApplicantIntake = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  adult: "Yes" | "No";
  licenseType: "Health" | "Life" | "Both health and life" | "Not licensed";
  willingToLicense?: "Yes" | "No";
  needsReleases?: "Yes" | "No";
  lastEmploymentDate?: string;
  smsConsent: boolean;
  submissionId: string;
  resume: { filename: string; contentType: string; bytes: Buffer };
};

export function airtableIntakeConfigured() {
  const field = process.env.AIRTABLE_RESUME_FIELD_ID ?? "";
  return Boolean(
    process.env.APPLICATION_INTAKE_ENABLED === "true" &&
    process.env.AIRTABLE_API_TOKEN &&
    /^fld[A-Za-z0-9]{14}$/.test(field)
  );
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function assertOK(response: Response, action: string) {
  if (!response.ok) {
    console.error(`Airtable ${action} failed, status:`, response.status);
    throw new Error("We could not save your application. Please try again.");
  }
}

export async function saveApplicantToAirtable(application: ApplicantIntake): Promise<{ recordId: string }> {
  if (!airtableIntakeConfigured()) throw new Error("Applications are not currently enabled.");
  const resumeField = process.env.AIRTABLE_RESUME_FIELD_ID!;
  const isLicensed = application.licenseType !== "Not licensed";
  const fields: Record<string, string> = {
    [FIELD.name]: `${application.firstName} ${application.lastName}`,
    [FIELD.firstName]: application.firstName,
    [FIELD.lastName]: application.lastName,
    [FIELD.email]: application.email,
    [FIELD.phone]: application.phone,
    [FIELD.state]: application.state,
    [FIELD.adult]: application.adult,
    [FIELD.licenseType]: application.licenseType,
    [FIELD.privacyAcknowledged]: "Yes",
    [FIELD.smsConsent]: application.smsConsent ? "Yes" : "No",
    [FIELD.submissionId]: application.submissionId,
    [FIELD.emailStatus]: "Awaiting résumé upload",
  };
  if (isLicensed) {
    fields[FIELD.needsReleases] = application.needsReleases!;
    fields[FIELD.lastEmploymentDate] = application.lastEmploymentDate!;
  } else {
    fields[FIELD.willingToLicense] = application.willingToLicense!;
  }

  // Stable submission ID allows a retry to update the same record, not create a duplicate.
  const response = await fetch(RECORDS_URL, {
    method: "PATCH",
    headers: headers(),
    cache: "no-store",
    body: JSON.stringify({
      performUpsert: { fieldsToMergeOn: [FIELD.submissionId] },
      records: [{ fields }],
      typecast: false,
    }),
  });
  await assertOK(response, "upsert");
  const data = await response.json() as {
    records?: Array<{ id: string; fields?: Record<string, unknown> }>
  };
  const recordId = data.records?.[0]?.id;
  if (!recordId || !/^rec[A-Za-z0-9]{14}$/.test(recordId)) {
    throw new Error("We could not confirm the application record. Please try again.");
  }

  // Do not upload a second copy on form retry if the original was already stored.
  const uploaded = data.records?.[0]?.fields?.[resumeField];
  if (!Array.isArray(uploaded) || uploaded.length === 0) {
    const upload = await fetch(
      `https://content.airtable.com/v0/${BASE_ID}/${recordId}/${resumeField}/uploadAttachment`,
      {
        method: "POST",
        headers: headers(),
        cache: "no-store",
        body: JSON.stringify({
          filename: application.resume.filename,
          contentType: application.resume.contentType,
          file: application.resume.bytes.toString("base64"),
        }),
      }
    );
    await assertOK(upload, "résumé upload");
  }

  const status = await fetch(`${RECORDS_URL}/${recordId}`, {
    method: "PATCH",
    headers: headers(),
    cache: "no-store",
    body: JSON.stringify({ fields: { [FIELD.emailStatus]: "Application and résumé saved" } }),
  });
  if (!status.ok) console.error("Airtable status field update failed", status.status);
  return { recordId };
}
