import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const configured = () => Boolean(
  process.env.RESEND_API_KEY &&
  process.env.APPLICATION_FROM_EMAIL &&
  process.env.APPLICATION_TO_EMAIL
);

export async function GET() {
  return NextResponse.json({ enabled: configured() }, { headers: { "Cache-Control": "no-store" } });
}

const clean = (value: unknown, max = 200) =>
  typeof value === "string" ? value.trim().slice(0, max).replace(/[\r\n]/g, " ") : "";

export async function POST(request: Request) {
  if (!configured()) {
    return NextResponse.json({ error: "Application submissions are not configured yet." }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ error: "Invalid submission origin." }, { status: 403 });
  }

  if (Number(request.headers.get("content-length") || 0) > 12000) {
    return NextResponse.json({ error: "Application is too large." }, { status: 413 });
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Invalid application." }, { status: 400 });
  }

  // Ignore submissions from automated form fillers.
  if (clean(input.website)) return NextResponse.json({ ok: true });

  const firstName = clean(input.firstName, 80);
  const lastName = clean(input.lastName, 80);
  const email = clean(input.email, 150);
  const phone = clean(input.phone, 35);
  const state = clean(input.state, 60);
  const licenseStatus = clean(input.licenseStatus, 40);
  const experience = clean(input.experience, 40);
  const notes = typeof input.notes === "string" ? input.notes.trim().slice(0, 1800) : "";
  const smsConsent = input.smsConsent === "yes";

  if (
    !firstName || !lastName || !state ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^[+\d\s().-]{7,35}$/.test(phone) ||
    !["Licensed", "In progress", "Not licensed"].includes(licenseStatus) ||
    !["New to sales", "Less than 1 year", "1–3 years", "3+ years"].includes(experience) ||
    input.privacyAcknowledged !== "yes"
  ) {
    return NextResponse.json({ error: "Please review the required fields and try again." }, { status: 400 });
  }

  const lines = [
    "New Pitch Health Solutions insurance agent application",
    "",
    "Name: " + firstName + " " + lastName,
    "Email: " + email,
    "Phone: " + phone,
    "State: " + state,
    "License status: " + licenseStatus,
    "Insurance/sales experience: " + experience,
    "SMS recruiting consent: " + (smsConsent ? "YES" : "NO"),
    "Privacy acknowledgement: YES",
    "",
    "Additional background:",
    notes || "(not provided)",
  ];

  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.APPLICATION_FROM_EMAIL,
        to: [process.env.APPLICATION_TO_EMAIL],
        reply_to: email,
        subject: "New insurance agent application: " + firstName + " " + lastName,
        text: lines.join("\n"),
      }),
    });
    if (!result.ok) {
      console.error("Application email delivery failed", result.status);
      return NextResponse.json({ error: "We couldn't deliver your application. Please try again or email recruitment@pitchhealthsolutions.com." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "We couldn't deliver your application. Please try again or email recruitment@pitchhealthsolutions.com." }, { status: 502 });
  }
}
