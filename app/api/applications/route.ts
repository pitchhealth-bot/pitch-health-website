import { airtableIntakeConfigured, saveApplicantToAirtable } from "../../lib/airtable-recruitment";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const configured = airtableIntakeConfigured;

const states = new Set("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" "));
const clean = (value: FormDataEntryValue | null, max = 200) =>
  typeof value === "string" ? value.trim().slice(0, max).replace(/[\r\n]/g, " ") : "";

export async function GET() {
  return NextResponse.json({ enabled: configured() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!configured()) return NextResponse.json({ error: "Applications are not currently enabled on this site." }, { status: 503 });

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host)
        return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    }
  }

  if (Number(request.headers.get("content-length") || 0) > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File or application is too large (4 MB résumé maximum)." }, { status: 413 });
  }

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data." }, { status: 400 }); }

  if (clean(form.get("website"))) return NextResponse.json({ ok: true });

  const firstName = clean(form.get("firstName"), 80);
  const lastName = clean(form.get("lastName"), 80);
  const email = clean(form.get("email"), 150);
  const phone = clean(form.get("phone"), 35);
  const state = clean(form.get("state"), 2);
  const adult = clean(form.get("adult"), 3);
  const licenseType = clean(form.get("licenseType"), 32);
  const needsReleases = clean(form.get("needsReleases"), 3);
  const willingToLicense = clean(form.get("willingToLicense"), 3);
  const lastEmploymentDate = clean(form.get("lastEmploymentDate"), 10);
  const smsConsent = clean(form.get("smsConsent")) === "yes";
  const submissionId = clean(form.get("submissionId"), 48);
  const file = form.get("resume");

  const validLicensed = ["Health", "Life", "Both health and life"].includes(licenseType);
  const validUnlicensed = licenseType === "Not licensed" && ["Yes", "No"].includes(willingToLicense);
  const lastDateValid = /^\d{4}-\d{2}-\d{2}$/.test(lastEmploymentDate) &&
    Number.isFinite(new Date(lastEmploymentDate + "T00:00:00Z").valueOf()) &&
    lastEmploymentDate <= new Date().toISOString().slice(0, 10);

  if (
    !firstName || !lastName || !states.has(state) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^[+\d\s().-]{7,35}$/.test(phone) ||
    !["Yes", "No"].includes(adult) ||
    !(validLicensed || validUnlicensed) ||
    (validLicensed && (!["Yes", "No"].includes(needsReleases) || !lastDateValid)) ||
    clean(form.get("privacyAcknowledged")) !== "yes" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)
  ) {
    return NextResponse.json({ error: "Please complete all required questions." }, { status: 400 });
  }

  if (!(file instanceof File) || file.size < 1 || file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "A résumé is required and must be smaller than 4 MB." }, { status: 400 });
  }
  const fileName = file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 100);
  const ext = fileName.split(".").pop()?.toLowerCase();
  const binary = Buffer.from(await file.arrayBuffer());
  const isPdf = ext === "pdf" && binary.subarray(0, 5).toString("ascii") === "%PDF-";
  const isDocx = ext === "docx" && binary.subarray(0, 2).toString("hex") === "504b";
  const isDoc = ext === "doc" && binary.subarray(0, 8).toString("hex") === "d0cf11e0a1b11ae1";
  if (!isPdf && !isDocx && !isDoc)
    return NextResponse.json({ error: "Please upload a PDF, DOC, or DOCX résumé." }, { status: 400 });

  try {
    await saveApplicantToAirtable({
      firstName, lastName, email, phone, state,
      adult: adult as "Yes" | "No",
      licenseType: licenseType as "Health" | "Life" | "Both health and life" | "Not licensed",
      ...(validLicensed ? {
        needsReleases: needsReleases as "Yes" | "No",
        lastEmploymentDate,
      } : {
        willingToLicense: willingToLicense as "Yes" | "No",
      }),
      smsConsent, submissionId,
      resume: {
        filename: fileName,
        contentType: isPdf
          ? "application/pdf"
          : isDocx
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/msword",
        bytes: binary,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "We could not save your application. Please try again or contact the recruiting team." },
      { status: 502 }
    );
  }
}
