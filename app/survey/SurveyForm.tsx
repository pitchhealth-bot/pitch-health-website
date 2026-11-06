"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { fields, MODE_ID, QUICK, DETAILED, visible, pruneAnswers, validateAnswers, type SurveyAnswers, type SurveyField } from "./survey-schema";
const originalSurvey = "https://airtable.com/app4ihGae0XFY7RAD/pagDbB3N19fxL4Ts6/form";

function Question({ field, value, update }: { field: SurveyField; value?: string | string[]; update: (value: string | string[]) => void }) {
  const label = field.label + (field.isRequired ? " *" : "");
  if (field.options) return <fieldset className="customer-question"><legend>{label}</legend><div className="customer-options">{field.options.choices.map(choice => {
    const multi = field.fieldType === "multipleSelects";
    const selected = multi ? Array.isArray(value) && value.includes(choice.name) : value === choice.name;
    return <label key={choice.id} className={selected ? "is-selected" : ""}><input type={multi ? "checkbox" : "radio"} name={field.fieldId} value={choice.name} checked={selected} required={!multi && field.isRequired} onChange={event => update(multi ? event.target.checked ? [...(Array.isArray(value) ? value : []), choice.name] : (Array.isArray(value) ? value : []).filter(item => item !== choice.name) : choice.name)} /><span>{choice.name}</span></label>;
  })}</div>{value && !field.isRequired && <button className="customer-clear" type="button" onClick={() => update("")} aria-label={`Clear answer: ${field.label}`}>Clear selection</button>}</fieldset>;
  return <label className="customer-comments customer-question" htmlFor={field.fieldId}>{label}{field.fieldType === "multilineText" ? <textarea id={field.fieldId} rows={4} maxLength={3000} value={String(value || "")} required={field.isRequired} onChange={event => update(event.target.value)} /> : <input id={field.fieldId} type={field.fieldType === "email" ? "email" : field.fieldType === "phoneNumber" ? "tel" : "text"} autoComplete={field.label === "Full Name" ? "name" : field.fieldType === "email" ? "email" : field.fieldType === "phoneNumber" ? "tel" : "off"} maxLength={field.fieldType === "phoneNumber" ? 35 : 250} value={String(value || "")} required={field.isRequired} onChange={event => update(event.target.value)} />}</label>;
}

export default function SurveyForm() {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [review, setReview] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const inFlight = useRef(false);
  useEffect(() => { const controller = new AbortController(); fetch("/api/survey", { cache: "no-store", signal: controller.signal }).then(response => response.ok ? response.json() : { enabled: false }).then(data => setEnabled(data.enabled === true)).catch(() => { if (!controller.signal.aborted) setEnabled(false); }); return () => controller.abort(); }, []);
  useEffect(() => { if (review || sent) heading.current?.focus(); }, [review, sent]);
  const update = (id: string, value: string | string[]) => {
    setAnswers(previous => pruneAnswers({ ...previous, [id]: value }));
    setError("");
  };
  function onReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateAnswers(answers);
    if (!result.fields) { setError(result.error || "Please check your answers."); return; }
    setAnswers(result.fields); setReview(true); setError("");
  }
  async function submit() {
    if (!enabled || inFlight.current) return;
    inFlight.current = true; setSending(true); setError("");
    try {
      const response = await fetch("/api/survey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(answers) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) { setError(result.error || "We could not confirm your submission. Please contact our team before sending again."); return; }
      setSent(true); setAnswers({}); setReview(false);
    } catch { setError("We could not confirm whether your feedback was saved. Please contact our team before sending it again."); }
    finally { setSending(false); inFlight.current = false; }
  }
  return <section className="customer-survey" aria-label="Customer feedback">
    {enabled === false && <div className="customer-preview"><strong>Website submissions are temporarily unavailable.</strong> To send feedback now, <a href={originalSurvey} target="_blank" rel="noopener noreferrer">open our existing Airtable survey (new tab)</a>. Answers entered here are not transferred.</div>}
    {!sent && <p className="customer-help">Your feedback goes to Pitch Health Solutions. Please do not include Medicare IDs, Social Security numbers, or medical details. <a href="/privacy-policy">Privacy Policy</a></p>}
    {error && <p className="customer-preview" role="alert">{error}</p>}
    {sent ? <div className="customer-review"><h2 tabIndex={-1} ref={heading}>Thank you for your feedback.</h2><p>Your response has been saved with Pitch Health Solutions.</p></div> : review ? <div className="customer-review"><p className="phs-native-survey-overline">REVIEW YOUR ANSWERS</p><h2 ref={heading} tabIndex={-1}>Your feedback at a glance</h2><p>{enabled === null ? "Checking submission availability…" : enabled ? "Please check your answers before sending." : "Nothing has been sent or saved. Website submission is currently unavailable."}</p><dl>{fields.filter(field => visible(field, answers) && answers[field.fieldId]?.length).map(field => <div key={field.fieldId}><dt>{field.label}</dt><dd>{Array.isArray(answers[field.fieldId]) ? (answers[field.fieldId] as string[]).join("; ") : answers[field.fieldId]}</dd></div>)}</dl><div className="customer-actions"><button type="button" disabled={sending} onClick={() => setReview(false)}>Edit answers</button>{enabled && <button className="customer-primary" type="button" disabled={sending} onClick={submit}>{sending ? "Sending…" : "Submit feedback"}</button>}<button type="button" disabled={sending} onClick={() => { setAnswers({}); setReview(false); setError(""); }}>Start over</button></div></div> : <form onSubmit={onReview}>
      <fieldset className="customer-question"><legend className="customer-choice-heading">How would you like to share your feedback? *</legend><div className="customer-mode-grid">{[QUICK, DETAILED].map(value => <label key={value} className={`customer-mode ${answers[MODE_ID] === value ? "is-selected" : ""}`}><input type="radio" name="mode" required checked={answers[MODE_ID] === value} onChange={() => update(MODE_ID, value)} value={value} /><span><strong>{value === QUICK ? "Quick Feedback" : "Detailed Feedback"}</strong><small>{value === QUICK ? "Approximately 1 minute" : "Approximately 3–4 minutes"}</small><span>{value === QUICK ? "A quick check-in on your experience, with room to share a little more." : "Tell us about enrollment, plan benefits, and the support you received."}</span></span></label>)}</div></fieldset>
      {answers[MODE_ID] && <><div className="customer-section-title"><h2>{answers[MODE_ID] === QUICK ? "Your overall experience" : "Tell us about your experience"}</h2></div><p className="customer-help">Fields marked * are required. Please do not include Medicare IDs, Social Security numbers, or medical details.</p>{fields.filter(field => field.fieldId !== MODE_ID && visible(field, answers)).map(field => <Question key={field.fieldId} field={field} value={answers[field.fieldId]} update={value => update(field.fieldId, value)} />)}<div className="customer-actions"><button className="customer-primary" type="submit">Review answers</button></div>{enabled === false && <p className="customer-help">Website submission is currently unavailable. No response has been sent.</p>}</>}
    </form>}
    <noscript><p>Enable JavaScript or use the existing <a href={originalSurvey}>Airtable survey</a>.</p></noscript>
  </section>;
}
