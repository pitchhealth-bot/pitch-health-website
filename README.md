# Pitch Health Solutions Website

Next.js / Vercel redesign from Squarespace export, October 2026.

## Development

Run `npm install && npm run dev`.

## Insurance Agent Application

The new /apply page includes a redesigned, responsive application form. The original Squarespace export did **not** contain individual form questions or delivery configuration. Screenshots supplied later confirmed the required resident-state dropdown (50 states + DC), 18+ question, Health/Life/Both/Not licensed choices, conditional carrier-release or two-week licensing question, last insurance-employment date for licensed applicants, and mandatory résumé upload. The source of these details is the user's original form screenshots. The résumé can be PDF, DOC or DOCX (maximum 4 MB). Form submissions use multipart POST and attach the résumé to a recruiting email only when enabled.

### Airtable Website Applicants integration

The server mapping now targets **Recruiting Pipeline** (base `appHdrREosaz1BUMv`), table **Website Applicants** (`tblxsRT8YnsNUa9jm`) using its verified field IDs. Values stored: full name, first/last name, email, phone, resident state, 18+ answer, license type, relevant conditional license answer, last employment date when applicable, privacy acknowledgement, SMS consent and a stable submission ID. Conditional fields that do not apply are omitted.

A required résumé is uploaded directly into Airtable using the direct attachment API, after upserting the applicant record by submission ID. **Resume** was confirmed as a `multipleAttachments` field on Website Applicants (`fld1V5oAzbAa8YMIt`). `AIRTABLE_RESUME_FIELD_ID` is now configured in Vercel for production and preview. Live intake is still disabled because an Airtable API token and explicit approval flag are not configured; no résumé or application is currently transmitted.

Required Vercel environment variables (Production, not `.env` committed to GitHub):
- `AIRTABLE_API_TOKEN`: a least-privilege Airtable personal access token scoped to this base, with `data.records:read` and `data.records:write`.
- `AIRTABLE_RESUME_FIELD_ID`: field ID of a new **multipleAttachments** field named `Resume` on Website Applicants.
- `APPLICATION_INTAKE_ENABLED`: set to `true` **only after** a safe test, field mapping and handling of private résumé files are approved.

The separate Airtable connection within ChatGPT is not a Vercel deployment credential. Never paste tokens into chat or commit them to GitHub. Until all required variables exist and the intake flag is enabled, `GET /api/applications` returns `enabled:false` and users cannot submit.

The Airtable table's `Email delivery status` field currently records `Not sent (Airtable intake only)` after successful Airtable storage. This new integration **does not send a recruiting email**; email notification can be added after Airtable storage and privacy review.

Before enabling publicly:
- Confirm the destination table's columns, exact select values and whether any additional fields are needed.
- Confirm résumé attachment access permissions and privacy/retention policy.
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

## Customer survey integration

`/survey` offers Quick Feedback (1 minute) and Detailed Feedback (3–4 minutes).
The source of truth is the captured Airtable form schema in `app/survey/schema.json`,
read on November 5, 2026 from form `pagDbB3N19fxL4Ts6`.
The user confirmed destination base `app4ihGae0XFY7RAD` (PHS Compliance).
The verified form creates records in **Customer Survey Responses** (`tbliyoHDTdMVNYsma`).
No complaint or recruiting tables are used.

The schema supplies exact field IDs, select values, required flags and visibility
rules to both the UI and server validation. This includes required detailed plan
questions/issues; Other issue and issue-explanation branches; service satisfaction;
contact-time fields; and required phone if follow-up is requested without the
optional phone. Hidden answers are removed when their parent answer changes.

`GET /api/survey` exposes only enabled status. `POST /api/survey` validates the
origin, bounded JSON body, types, lengths, required answers and exact options,
then sends only visible whitelisted fields to the verified table. Credentials
stay server-side. There is no automatic retry after an uncertain write, and the
UI confirms success only after the server confirms an Airtable record ID.

Server configuration (not committed):
- Reuse the existing production `AIRTABLE_API_TOKEN` where it has access to this
  survey base. An optional `SURVEY_AIRTABLE_API_TOKEN` overrides it if separate
  credentials are desired; a new token is not inherently required.
- `SURVEY_INTAKE_ENABLED=true`: enable the survey integration independently of
  recruiting. No environment variables were changed by this work.

The user confirmed the existing API access covers this base, with a supporting screenshot.
The Charla PHS browser shows an existing token named “charla's” with record read/write
and all-base access. Vercel confirms an existing production AIRTABLE_API_TOKEN
Secret, but does not disclose its value or token identity. Its exact match to that
Airtable token cannot be verified from metadata. GET /api/survey therefore performs
an authenticated read-only check of the exact survey table before enabling the UI.
No returned records are logged, retained or sent to the browser. Successful reading
proves table access, not write permission; a designated submission test is still needed.

Until the survey flag is enabled, the site remains explicitly a preview and POST
returns 503. The original Airtable form link remains available. Preview answers
are held in memory only and are not sent to Airtable. No live record was created.

Remaining launch checks: verify the existing deployed credential, perform a designated synthetic
end-to-end test with existing automation behavior understood, and add deployment-level
rate limiting/spam controls. Durable idempotency is not provided by this table schema;
ambiguous failures tell respondents to contact the team before resending. Merge and
publication remain pending; do not open a PR until separately approved.

Validation: production build and TypeScript passed. Eight automated tests cover
exact destination/payload, required detailed and follow-up answers, hidden-field
removal, invalid input, disabled intake, origin/body limits, and upstream failures.
Airtable writes were mocked; no credentials or real survey responses were used.

Run tests from this checkout:
```sh
./node_modules/.bin/tsc app/survey/survey-schema.ts app/api/survey/route.ts --outDir /tmp/pitch-survey-tests --module commonjs --target es2022 --esModuleInterop --resolveJsonModule --skipLibCheck
SURVEY_TEST_BUILD=/tmp/pitch-survey-tests NODE_PATH="$PWD/node_modules" node --test tests/survey.test.cjs
```
