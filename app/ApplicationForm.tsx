"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type SendState = "idle" | "sending" | "sent" | "error";

export default function ApplicationForm() {
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/applications", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) return false;
        const result = await response.json();
        return result.enabled === true;
      })
      .then(available => { if (active) setEnabled(available); })
      .catch(() => { if (active) setEnabled(false); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || sendState === "sending") return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    setSendState("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not send your application. Please try again.");
      form.reset();
      setSendState("sent");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We could not send your application.");
      setSendState("error");
    }
  }

  return (
    <section className="application-shell">
      <div className="container application-layout">
        <div className="application-intro">
          <div className="application-side-label">JOIN OUR TEAM</div>
          <h2>A new chapter <em>starts here.</em></h2>
          <p>Share a little about yourself and your experience. Our recruiting team will review your application and reach out about next steps.</p>
          <div className="application-side-note">
            <span>Questions about applying?</span>
            <a href="mailto:recruitment@pitchhealthsolutions.com">recruitment@pitchhealthsolutions.com</a>
          </div>
        </div>

        <div className="application-panel">
          <div className="application-panel-header">
            <div>
              <p className="application-panel-eyebrow">INSURANCE AGENT APPLICATION</p>
              <h2>Tell us about yourself</h2>
            </div>
            <span className="application-required-note">* Required</span>
          </div>

          {sendState === "sent" ? (
            <div className="application-success" role="status">
              <h3>Application received</h3>
              <p>Thanks for your interest in Pitch Health Solutions. Our recruiting team will review your submission.</p>
              <button type="button" onClick={() => setSendState("idle")}>Start another application</button>
            </div>
          ) : (
            <form className="application-form" onSubmit={submit}>
              <div className="application-group-title"><span>01</span> Your information</div>
              <div className="application-form-grid">
                <label className="application-field">First name <span>*</span>
                  <input name="firstName" autoComplete="given-name" required maxLength={80} placeholder="First name" />
                </label>
                <label className="application-field">Last name <span>*</span>
                  <input name="lastName" autoComplete="family-name" required maxLength={80} placeholder="Last name" />
                </label>
                <label className="application-field">Email address <span>*</span>
                  <input name="email" type="email" autoComplete="email" required maxLength={150} placeholder="you@example.com" />
                </label>
                <label className="application-field">Phone number <span>*</span>
                  <input name="phone" type="tel" autoComplete="tel" required maxLength={35} placeholder="(555) 555-5555" />
                </label>
                <label className="application-field application-field-wide">State of residence <span>*</span>
                  <input name="state" autoComplete="address-level1" required maxLength={60} placeholder="e.g. Florida" />
                </label>
              </div>

              <div className="application-group-title"><span>02</span> Your background</div>
              <div className="application-form-grid">
                <label className="application-field">Insurance license status <span>*</span>
                  <select name="licenseStatus" required defaultValue="">
                    <option value="" disabled>Select an option</option>
                    <option value="Licensed">Currently licensed</option>
                    <option value="In progress">License in progress</option>
                    <option value="Not licensed">Not yet licensed</option>
                  </select>
                </label>
                <label className="application-field">Insurance or sales experience <span>*</span>
                  <select name="experience" required defaultValue="">
                    <option value="" disabled>Select an option</option>
                    <option value="New to sales">New to sales</option>
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1–3 years">1–3 years</option>
                    <option value="3+ years">3+ years</option>
                  </select>
                </label>
                <label className="application-field application-field-wide">Tell us a little about your background <span className="application-optional">(optional)</span>
                  <textarea name="notes" rows={4} maxLength={1800} placeholder="Relevant experience, what interests you about the role, or anything you'd like the team to know." />
                </label>
              </div>

              <div className="application-consent">
                <label className="application-checkbox">
                  <input name="privacyAcknowledged" type="checkbox" value="yes" required />
                  <span>I acknowledge the <Link href="/privacy-policy" target="_blank">Privacy Policy</Link> and understand my information will be used to review my application. <strong>*</strong></span>
                </label>
                <label className="application-checkbox">
                  <input name="smsConsent" type="checkbox" value="yes" />
                  <span>I agree to receive recruiting and application-related text messages from Pitch Health Solutions at the number provided. Message frequency may vary. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is optional and not required to apply. See our <Link href="/sms-terms-and-conditions" target="_blank">SMS Terms</Link>.</span>
                </label>
              </div>
              <div className="application-honeypot" aria-hidden="true"><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              {sendState === "error" && <p className="application-error" role="alert">{errorMessage}</p>}
              {!checking && !enabled && <p className="application-unavailable" role="status">Application submissions are not enabled on this preview yet. To apply now, email <a href="mailto:recruitment@pitchhealthsolutions.com">recruitment@pitchhealthsolutions.com</a>.</p>}
              <button className="application-submit" type="submit" disabled={!enabled || checking || sendState === "sending"}>
                {checking ? "Checking availability…" : sendState === "sending" ? "Sending application…" : "Submit application"}
              </button>
              <p className="application-fineprint">Please do not include Social Security numbers, Medicare IDs, or other sensitive personal information.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
