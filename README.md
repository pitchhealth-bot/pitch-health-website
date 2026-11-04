# Pitch Health Solutions Website

Next.js / Vercel redesign from Squarespace export, October 2026.

## Development

Run `npm install && npm run dev`.

## Insurance Agent Application

The new /apply page includes a redesigned, responsive application form. The original Squarespace export did **not** contain individual form questions or delivery configuration. Screenshots supplied later confirmed the required resident-state dropdown (50 states + DC), 18+ question, Health/Life/Both/Not licensed choices, conditional carrier-release or two-week licensing question, last insurance-employment date for licensed applicants, and mandatory résumé upload. The source of these details is the user's original form screenshots. The résumé can be PDF, DOC or DOCX (maximum 4 MB). Form submissions use multipart POST and attach the résumé to a recruiting email only when enabled.

### Airtable Website Applicants integration

The server mapping now targets **Recruiting Pipeline** (base `appHdrREosaz1BUMv`), table **Website Applicants** (`tblxsRT8YnsNUa9jm`) using its verified field IDs. Values stored: full name, first/last name, email, phone, resident state, 18+ answer, license type, relevant conditional license answer, last employment date when applicable, privacy acknowledgement, SMS consent and a stable submission ID. Conditional fields that do not apply are omitted.

A required résumé is uploaded directly into an Airtable attachment field using the direct attachment API, after upserting the applicant record by submission ID. The source table **does not yet have a résumé field**, so it must be added and reviewed before enabling the endpoint. The Airtable field ID must then be placed into the Vercel environment; no résumé or application is currently transmitted.

Required Vercel environment variables (Production, not `.env` committed to GitHub):
- `AIRTABLE_API_TOKEN`: a least-privilege Airtable personal access token scoped to this base, with `data.records:read` and `data.records:write`.
- `AIRTABLE_RESUME_FIELD_ID`: field ID of a new **multipleAttachments** field named `Resume` on Website Applicants.
- `APPLICATION_INTAKE_ENABLED`: set to `true` **only after** a safe test, field mapping and handling of private résumé files are approved.

The separate Airtable connection within ChatGPT is not a Vercel deployment credential. Never paste tokens into chat or commit them to GitHub. Until all required variables exist and the intake flag is enabled, `GET /api/applications` returns `enabled:false` and users cannot submit.

The Airtable table's `Email delivery status` field currently records `Not sent (Airtable intake only)` after successful Airtable storage. This new integration **does not send a recruiting email**; email notification can be added after Airtable storage and privacy review.

Before enabling publicly:
- Confirm the destination table's columns, exact select values and whether any additional fields are needed.
- Create the résumé attachment field with appropriate Airtable access permissions.
- Approve the privacy notice, sensitive-file retention and who may access candidate data.
- Test creating one test record, attachments, mobile experience, conditional validation and retry behavior; remove test data only after approval.
- Add server-side rate limiting/spam prevention and operational monitoring.
- Confirm what notifications recruiters should receive.

## Other pre-launch items

- Reconnect and test contact and SMS opt-in form integrations.
- Obtain approved Terms of Service content.
- Review legal language and links against the live website.
- Test mobile layout, accessibility, redirects and asset hosting.
- Keep Squarespace live until final approval and DNS cutover.
