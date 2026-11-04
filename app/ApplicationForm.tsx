"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

type SendState = "idle" | "sending" | "sent" | "error";
const states: [string,string][] = [["Alabama","AL"],["Alaska","AK"],["Arizona","AZ"],["Arkansas","AR"],["California","CA"],["Colorado","CO"],["Connecticut","CT"],["Delaware","DE"],["District of Columbia","DC"],["Florida","FL"],["Georgia","GA"],["Hawaii","HI"],["Idaho","ID"],["Illinois","IL"],["Indiana","IN"],["Iowa","IA"],["Kansas","KS"],["Kentucky","KY"],["Louisiana","LA"],["Maine","ME"],["Maryland","MD"],["Massachusetts","MA"],["Michigan","MI"],["Minnesota","MN"],["Mississippi","MS"],["Missouri","MO"],["Montana","MT"],["Nebraska","NE"],["Nevada","NV"],["New Hampshire","NH"],["New Jersey","NJ"],["New Mexico","NM"],["New York","NY"],["North Carolina","NC"],["North Dakota","ND"],["Ohio","OH"],["Oklahoma","OK"],["Oregon","OR"],["Pennsylvania","PA"],["Rhode Island","RI"],["South Carolina","SC"],["South Dakota","SD"],["Tennessee","TN"],["Texas","TX"],["Utah","UT"],["Vermont","VT"],["Virginia","VA"],["Washington","WA"],["West Virginia","WV"],["Wisconsin","WI"],["Wyoming","WY"]];

export default function ApplicationForm() {
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [resumeName, setResumeName] = useState("");
  const submissionIdRef = useRef<string | null>(null);

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
    const values = new FormData(form);
    submissionIdRef.current ??= crypto.randomUUID();
    values.set("submissionId", submissionIdRef.current);
    setSendState("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        body: values,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not send your application. Please try again.");
      form.reset();
      setLicenseType("");
      setResumeName("");
      submissionIdRef.current = null;
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
                <label className="application-field"><span className="application-label-line">First name <b className="application-required-mark" aria-hidden="true">*</b></span>
                  <input name="firstName" autoComplete="given-name" required maxLength={80} placeholder="First name" />
                </label>
                <label className="application-field"><span className="application-label-line">Last name <b className="application-required-mark" aria-hidden="true">*</b></span>
                  <input name="lastName" autoComplete="family-name" required maxLength={80} placeholder="Last name" />
                </label>
                <label className="application-field"><span className="application-label-line">Email address <b className="application-required-mark" aria-hidden="true">*</b></span>
                  <input name="email" type="email" autoComplete="email" required maxLength={150} placeholder="you@example.com" />
                </label>
                <label className="application-field"><span className="application-label-line">Phone number <b className="application-required-mark" aria-hidden="true">*</b></span>
                  <input name="phone" type="tel" autoComplete="tel" required maxLength={35} placeholder="(555) 555-5555" />
                </label>
                <label className="application-field application-field-wide"><span className="application-label-line">Resident state <b className="application-required-mark" aria-hidden="true">*</b></span>
                  <select name="state" required defaultValue="" autoComplete="address-level1">
                    <option value="" disabled>Select your state</option>
                    {states.map(([name, code]) => <option key={code} value={code}>{name} - {code}</option>)}
                  </select>
                </label>
              </div>

              <div className="application-group-title"><span>02</span> Licensing &amp; eligibility</div>
              <div className="application-questions">
                <fieldset className="application-radio-field">
                  <legend>Are you 18 years of age or older? <span>*</span></legend>
                  <div className="application-radio-options">
                    <label><input type="radio" name="adult" value="Yes" required /> Yes</label>
                    <label><input type="radio" name="adult" value="No" required /> No</label>
                  </div>
                </fieldset>
                <fieldset className="application-radio-field">
                  <legend>Are you licensed in: <span>*</span></legend>
                  <div className="application-radio-options">
                    {["Health", "Life", "Both health and life", "Not licensed"].map(value => (
                      <label key={value}><input type="radio" name="licenseType" value={value} required checked={licenseType === value} onChange={() => setLicenseType(value)} /> {value}</label>
                    ))}
                  </div>
                </fieldset>
                {licenseType === "Not licensed" ? (
                  <div className="application-conditional application-conditional-question" role="group" aria-labelledby="application-question-willing">
                    <p className="application-conditional-title" id="application-question-willing">Are you willing to get licensed within 2 weeks? <span>*</span></p>
                    <div className="application-radio-options">
                      <label><input type="radio" name="willingToLicense" value="Yes" required /> Yes</label>
                      <label><input type="radio" name="willingToLicense" value="No" required /> No</label>
                    </div>
                  </div>
                ) : licenseType ? (
                  <>
                    <div className="application-conditional application-conditional-question" role="group" aria-labelledby="application-question-releases">
                      <p className="application-conditional-title" id="application-question-releases">Do you need releases from the carriers? <span>*</span></p>
                      <div className="application-radio-options">
                        <label><input type="radio" name="needsReleases" value="Yes" required /> Yes</label>
                        <label><input type="radio" name="needsReleases" value="No" required /> No</label>
                      </div>
                    </div>
                    <label className="application-field application-date-field application-conditional">
                      <span className="application-label-line">Last employment date as an insurance agent <b className="application-required-mark" aria-hidden="true">*</b></span>
                      <input type="date" name="lastEmploymentDate" required max={new Date().toISOString().slice(0,10)} />
                    </label>
                  </>
                ) : null}
              </div>
              <div className="application-group-title"><span>03</span><span className="application-resume-heading">Your résumé <b className="application-required-mark" aria-hidden="true">*</b></span></div>
              <label className="application-upload">
                <input type="file" name="resume" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required onChange={event => {
                  const file = event.target.files?.[0];
                  if (file && file.size > 4 * 1024 * 1024) { event.target.value = ""; setResumeName(""); setErrorMessage("Please upload a résumé smaller than 4 MB."); setSendState("error"); return; }
                  setResumeName(file?.name ?? "");
                  setErrorMessage("");
                  setSendState("idle");
                }} />
                <span className="application-upload-symbol" aria-hidden="true">+</span>
                <strong>{resumeName || "Choose a résumé file"}</strong>
                <small>PDF, DOC or DOCX · Maximum 4 MB · Required</small>
              </label>
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
