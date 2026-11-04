# Website application integration

The application endpoint saves a record in Recruiting Pipeline → Website Applicants,
uploads the résumé directly to its existing Attachments field, then sends the existing
recruiting email with its attachment. Success requires all three operations.

## Configuration

Keep `APPLICATION_INTAKE_ENABLED=false` until live synthetic verification is complete.
All variables below are server-only; never use a `NEXT_PUBLIC_` prefix.

- `AIRTABLE_ACCESS_TOKEN`: an authorized Airtable token with `data.records:write`,
  limited to the Recruiting Pipeline base. No schema-write or workspace-wide access is needed.
- `AIRTABLE_BASE_ID`: `appHdrREosaz1BUMv`.
- `AIRTABLE_TABLE_ID`: `tblxsRT8YnsNUa9jm`.
- `RESEND_API_KEY`: existing authorized Resend sending key.
- `APPLICATION_FROM_EMAIL`: a verified sender in Resend.
- `APPLICATION_TO_EMAIL`: the approved recruiting inbox.
- `APPLICATION_INTAKE_ENABLED`: must explicitly be `true` to accept applications.

Add credentials directly in Vercel's encrypted/sensitive environment settings for
the intended environment. Do not commit them, paste them into chat, or reuse a
browser session credential. Token creation or expanded access needs owner approval.

## Airtable fields

Existing `Name` receives the combined name and `Attachments` receives the résumé.
The handler does not write existing `Status`, `Notes`, or `Assignee`.

| Form name | Airtable field | Type |
| --- | --- | --- |
| firstName | First name | Text |
| lastName | Last name | Text |
| email | Email address | Email |
| phone | Phone number | Phone |
| state | Resident state | Text, two-letter abbreviation |
| adult | 18 or older | Yes/No single select |
| licenseType | License type | Health, Life, Both health and life, Not licensed |
| willingToLicense | Willing to get licensed within 2 weeks | Yes/No single select |
| needsReleases | Needs carrier releases | Yes/No single select |
| lastEmploymentDate | Last employment date as an insurance agent | Date |
| privacyAcknowledged | Privacy policy acknowledged | Yes/No single select |
| smsConsent | Recruiting SMS consent | Yes/No single select |
| server-derived | Application submission ID | Single line text |
| server-derived | Email delivery status | Single line text |

Hidden conditional answers are omitted. An unchecked optional SMS consent is `No`.
The handler records answers only; it does not make hiring decisions or enroll anyone
in messaging. Existing Airtable automations are not changed.

## Résumés and retries

PDF/DOC/DOCX files are limited to 4 MiB, validated by extension and signature,
and uploaded using Airtable's authenticated byte-upload endpoint (5 MB maximum).
Files are never published to a bucket or an intermediate public URL. Existing
Airtable access controls govern stored records and attachments. Signature checking
is not malware scanning; do not treat uploaded documents as trusted executable content.

An identical payload and file produce the same SHA-256 submission ID. Airtable
upsert reuses that record; confirmed attachments and sent emails are reused.
Resend gets a stable idempotency key. Failed uploads or emails return 502 and keep
any partial record for retry; there is no destructive cleanup. Blank email status
means delivery is not confirmed. Resend's idempotency window is finite (24 hours),
so a successful email followed by a failed status update may be duplicated by a
much later retry. Concurrent attachment retries can also append duplicate files.
This is not a durable background queue or exactly-once delivery system.

## Validation and release

`npm run test:applications` runs mocked provider tests using only synthetic data.
`npm run build` checks the production build. Neither command sends applications.

With authorized credentials, use an isolated preview and a controlled recipient
for a synthetic end-to-end test, verifying licensed/unlicensed mapping, attachment
bytes, email receipt, retries and failures. Production intake stays disabled until
that succeeds. Retain synthetic test records until explicitly authorized to remove them.

The existing honeypot and origin check are retained. Configure production abuse
protection/rate limiting before enabling public traffic. This change does not
provision a rate-limit service, add consent policy text, or change retention rules.

API reference: https://airtable.com/developers/web/api/upload-attachment
