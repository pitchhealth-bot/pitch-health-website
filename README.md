# Pitch Health Solutions Website

Next.js / Vercel redesign from Squarespace export, October 2026.

## Development

Run `npm install && npm run dev`.

## Insurance Agent Application

The new /apply page includes a redesigned, responsive application form. The original Squarespace export did **not** contain individual form questions or delivery configuration. Screenshots supplied later confirmed the required resident-state dropdown (50 states + DC), 18+ question, Health/Life/Both/Not licensed choices, conditional carrier-release or two-week licensing question, last insurance-employment date for licensed applicants, and mandatory résumé upload. The source of these details is the user's original form screenshots. The résumé can be PDF, DOC or DOCX (maximum 4 MB). Form submissions use multipart POST and attach the résumé to a recruiting email only when enabled.

The `POST /api/applications` endpoint validates applicant details and delivers a plain-text email through Resend **only if** all of the following Vercel environment variables are configured:

- `RESEND_API_KEY`: Resend API key with permission to send from the verified domain.
- `APPLICATION_INTAKE_ENABLED`: explicitly set to `true` only after the form, privacy, delivery, security, and storage handling have been approved and tested.
- `APPLICATION_FROM_EMAIL`: verified sending address, e.g. a recruitment-domain address under your control (do not use an unverified address).
- `APPLICATION_TO_EMAIL`: verified recruiting destination (currently proposed as `recruitment@pitchhealthsolutions.com` based on the old application page).

Until all four exist, `GET /api/applications` returns `enabled: false` and the form displays an explicit "submissions not enabled" notice; **no data is sent or stored**. Never claim an application was received if the email service returned an error.

Before enabling:
- Confirm the recruiting inbox and every required question, optional question, privacy notice, and SMS disclosure.
- Test successful delivery, failures, input validation and mobile access; ensure messages are private.
- Add robust abuse prevention/rate limiting and any required consent-record retention before advertising or accepting traffic.
- This implementation sends a résumé as a private recruiting-email attachment when enabled; confirm that email-based résumé handling and retention are approved, otherwise replace it with an approved private storage workflow.
- Verify whether Resend/email handling meets company privacy and compliance requirements.

## Other pre-launch items

- Reconnect and test contact and SMS opt-in form integrations.
- Obtain approved Terms of Service content.
- Review legal language and links against the live website.
- Test mobile layout, accessibility, redirects and asset hosting.
- Keep Squarespace live until final approval and DNS cutover.
