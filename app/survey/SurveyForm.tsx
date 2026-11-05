"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const satisfaction = ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"];
const recommendation = ["0 — Not at all likely", "1 — Very unlikely", "2 — Unlikely", "3 — Neutral", "4 — Likely", "5 — Extremely likely"];
const experiences = ["Enrollment / Sales Experience", "Customer Service Experience", "Medicare Plan Benefits & Coverage", "Overall Experience with Pitch Health Solutions"];
const detailed = [
  { id: "agent", label: "How satisfied were you with the agent who helped you review or enroll in your Medicare plan?", options: [...satisfaction, "I have not worked with a sales agent."] },
  { id: "explained", label: "Did your agent clearly explain your plan's benefits, costs, and coverage before enrollment?", options: ["Yes, everything was clearly explained", "Mostly, but I had some questions", "No, some important information was not explained", "I don't remember", "Not applicable."] },
  { id: "comfortable", label: "Did you feel comfortable making your enrollment decision without being pressured?", options: ["Yes, completely comfortable", "Somewhat comfortable", "No, I felt pressured or rushed", "I don't remember", "Not applicable."] },
  { id: "coverage", label: "Have the benefits and coverage you've received matched what your agent explained?", options: ["Yes, everything matches", "Mostly, with minor differences", "No, some benefits or costs were different", "My coverage hasn't started yet", "I'm not sure."] },
];
const issues = ["My doctor or hospital was not covered", "My medications were not covered or cost more than expected", "My OTC, Food Card, or Giveback benefits were different than expected", "My copays, premiums, or other costs were higher than expected", "My plan changed without my understanding or permission", "I experienced delays or issues with my coverage", "I have not experienced any issues", "Other"];
const originalSurvey = "https://airtable.com/app4ihGae0XFY7RAD/pagDbB3N19fxL4Ts6/form";
type Answers = Record<string, string>;

function Choice({ id, label, options, value, onChange, required = false }: { id: string; label: string; options: string[]; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <fieldset className="customer-question"><legend>{label}{required && " *"}</legend><div className="customer-options">{options.map(option => <label key={option} className={value === option ? "is-selected" : ""}><input type="radio" name={id} value={option} checked={value === option} required={required} onChange={() => onChange(option)} /><span>{option}</span></label>)}</div>{value && !required && <button className="customer-clear" type="button" onClick={() => onChange("")} aria-label={`Clear answer: ${label}`}>Clear selection</button>}</fieldset>;
}

export default function SurveyForm() {
  const [mode, setMode] = useState<"quick" | "detailed" | "">("");
  const [answers, setAnswers] = useState<Answers>({});
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [review, setReview] = useState(false);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (review) reviewHeading.current?.focus(); }, [review]);
  const update = (id: string, value: string) => setAnswers(previous => {
    const next = { ...previous, [id]: value };
    if (id === "contacted" && value !== "Yes") delete next.service;
    return next;
  });
  function changeMode(next: "quick" | "detailed") {
    setMode(next);
    setReview(false);
    setSelectedIssues([]);
    setAnswers(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => ["name", "phone", "email", "experience", "recommend", "followup"].includes(key))));
  }
  function onReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode && answers.name?.trim()) setReview(true);
  }
  const rows = [
    ["Feedback type", mode === "quick" ? "Quick Feedback" : "Detailed Feedback"],
    ["Full Name", answers.name], ["Phone Number", answers.phone], ["Email Address", answers.email], ["Experience", answers.experience],
    ...(mode === "quick" ? [["Overall satisfaction", answers.satisfaction]] : detailed.map(question => [question.label, answers[question.id]])),
    ...(mode === "detailed" ? [["Plan issues", selectedIssues.join("; ")], ["Contacted Customer Service", answers.contacted], ["Customer Service satisfaction", answers.service]] : []),
    ["Recommendation", answers.recommend], ["Comments", answers.comments], ["Follow-up requested", answers.followup],
  ];
  return <section className="customer-survey" aria-label="Customer feedback">
    <div className="customer-preview"><strong>Preview — responses are not being collected here yet.</strong> Please use sample information. To send feedback now, <a href={originalSurvey} target="_blank" rel="noopener noreferrer">open our existing Airtable survey (new tab)</a>. Answers entered here are not transferred.</div>
    {review ? <div className="customer-review"><p className="phs-native-survey-overline">REVIEW YOUR ANSWERS</p><h2 ref={reviewHeading} tabIndex={-1}>Your feedback at a glance</h2><p>Nothing has been sent or saved. Website submission is not available yet.</p><dl>{rows.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="customer-actions"><button type="button" onClick={() => setReview(false)}>Edit answers</button><button type="button" onClick={() => { setAnswers({}); setSelectedIssues([]); setReview(false); setMode(""); }}>Start over</button></div></div> : <form onSubmit={onReview}>
      <fieldset className="customer-question"><legend className="customer-choice-heading">How would you like to share your feedback? *</legend><div className="customer-mode-grid">{(["quick", "detailed"] as const).map(value => <label key={value} className={`customer-mode ${mode === value ? "is-selected" : ""}`}><input type="radio" name="mode" required checked={mode === value} onChange={() => changeMode(value)} value={value} /><span><strong>{value === "quick" ? "Quick Feedback" : "Detailed Feedback"}</strong><small>{value === "quick" ? "Approximately 1 minute" : "Approximately 3–4 minutes"}</small><span>{value === "quick" ? "A quick check-in on your experience, with room to share a little more." : "Tell us about enrollment, plan benefits, and the support you received."}</span></span></label>)}</div></fieldset>
      {mode && <>
        <div className="customer-section-title"><span>01</span><h2>A little about you</h2></div><p className="customer-help">Fields marked * are required. Phone and email are optional.</p>
        <div className="customer-fields">{[{id:"name",label:"Full Name",type:"text",auto:"name"},{id:"phone",label:"Phone Number",type:"tel",auto:"tel"},{id:"email",label:"Email Address",type:"email",auto:"email"}].map(field => <label key={field.id} htmlFor={`survey-${field.id}`}>{field.label}{field.id === "name" && " *"}<input id={`survey-${field.id}`} type={field.type} autoComplete={field.auto} required={field.id === "name"} pattern={field.id === "name" ? ".*\\S.*" : undefined} maxLength={field.id === "phone" ? 35 : 180} value={answers[field.id] || ""} onChange={event => update(field.id,event.target.value)} /></label>)}</div>
        <Choice id="experience" label="Which part of your experience are you reviewing?" options={experiences} required value={answers.experience || ""} onChange={value => update("experience",value)} />
        <div className="customer-section-title"><span>02</span><h2>{mode === "quick" ? "Your overall experience" : "Tell us more about your experience"}</h2></div>
        {mode === "quick" ? <Choice id="satisfaction" label="How satisfied are you with your overall experience with Pitch Health Solutions?" options={["1 — Very Dissatisfied", "2 — Dissatisfied", "3 — Neutral", "4 — Satisfied", "5 — Very Satisfied"]} value={answers.satisfaction || ""} onChange={value => update("satisfaction",value)} /> : <>
          {detailed.map(question => <Choice key={question.id} {...question} value={answers[question.id] || ""} onChange={value => update(question.id,value)} />)}
          <fieldset className="customer-question"><legend>Have you experienced any of the following issues with your Medicare plan?</legend><p className="customer-help">Select all that apply.</p><div className="customer-options">{issues.map(issue => <label key={issue} className={selectedIssues.includes(issue) ? "is-selected" : ""}><input type="checkbox" checked={selectedIssues.includes(issue)} onChange={event => setSelectedIssues(previous => event.target.checked ? [...previous,issue] : previous.filter(value => value !== issue))} /><span>{issue}</span></label>)}</div></fieldset>
          <Choice id="contacted" label="Have you contacted our Customer Service team for assistance?" options={["Yes","No"]} value={answers.contacted || ""} onChange={value => update("contacted",value)} />
          {answers.contacted === "Yes" && <Choice id="service" label="How satisfied were you with the assistance provided by our Customer Service team?" options={[...satisfaction,"My concern has not been resolved yet."]} value={answers.service || ""} onChange={value => update("service",value)} />}
        </>}
        <Choice id="recommend" label="How likely are you to recommend Pitch Health Solutions to a friend or family member?" options={recommendation} value={answers.recommend || ""} onChange={value => update("recommend",value)} />
        <label className="customer-comments" htmlFor="survey-comments">{mode === "quick" ? "Would you like to share anything about your experience?" : "What could we have done better to improve your experience?"}<textarea id="survey-comments" rows={4} maxLength={3000} value={answers.comments || ""} onChange={event => update("comments",event.target.value)} aria-describedby="survey-sensitive-note" /></label>
        <p id="survey-sensitive-note" className="customer-help">Please do not include Medicare IDs, Social Security numbers, or medical details.</p>
        <Choice id="followup" label="Would you like someone from our team to contact you regarding your feedback?" options={["Yes, I would like someone to contact me","No, thank you"]} value={answers.followup || ""} onChange={value => update("followup",value)} />
        <div className="customer-actions"><button className="customer-primary" type="submit">Review answers</button></div><p className="customer-help">Preview only. No follow-up request or response will be sent.</p>
      </>}
    </form>}
    <noscript><p>Enable JavaScript to try this preview, or use the existing Airtable survey linked above.</p></noscript>
  </section>;
}
