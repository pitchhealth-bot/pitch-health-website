"use client";

import { useState, type FormEvent } from "react";

/**
 * DESIGN PREVIEW ONLY.
 * The live Airtable survey's question schema and conditional rules were not accessible.
 * Replace these provisional items with confirmed source content before enabling submissions.
 */
type Topic = "feedback" | "question" | "callback";
type Answers = {
  name: string;
  email: string;
  topic: Topic | "";
  rating: string;
  message: string;
  phone: string;
};

const initial: Answers = {
  name: "", email: "", topic: "", rating: "", message: "", phone: ""
};

const topicOptions: { value: Topic; label: string; description: string }[] = [
  { value: "feedback", label: "Share feedback", description: "Tell us about your experience" },
  { value: "question", label: "Ask a question", description: "Share something you'd like answered" },
  { value: "callback", label: "Request a callback", description: "Leave a number we can contact" },
];

export default function SurveyForm() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>(initial);
  const update = (name: keyof Answers, value: string) => {
    setAnswers(previous => {
      const next = { ...previous, [name]: value };
      // Do not retain answers to questions hidden by branching.
      if (name === "topic") {
        next.rating = "";
        next.message = "";
        next.phone = "";
      }
      return next;
    });
  };

  const validFollowup =
    (answers.topic === "feedback" && answers.rating && answers.message.trim()) ||
    (answers.topic === "question" && answers.message.trim()) ||
    (answers.topic === "callback" && answers.phone.trim());

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1 && answers.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) setStep(2);
    if (step === 2 && validFollowup) setStep(3);
  }

  return (
    <section className="phs-native-survey" aria-labelledby="survey-form-heading">
      <div className="phs-native-survey-preview">
        <span className="phs-native-survey-preview-dot" aria-hidden="true" />
        Layout preview · Sample questions only · Responses are not being collected
      </div>
      <header className="phs-native-survey-top">
        <div>
          <p className="phs-native-survey-overline">YOUR RESPONSES</p>
          <h2 id="survey-form-heading">A few quick questions.</h2>
        </div>
        <span className="phs-native-survey-count">{String(step).padStart(2,"0")} / 03</span>
      </header>
      <div className="phs-native-survey-progress" aria-label={`Step ${step} of 3`}>
        <span style={{width: `${step / 3 * 100}%`}} />
      </div>

      {step === 3 ? (
        <section className="phs-native-survey-review">
          <h3>Preview complete</h3>
          <p>This shows how a respondent can review their answers. The final survey will be connected to Airtable after its original questions and rules are confirmed.</p>
          <dl>
            <div><dt>Name</dt><dd>{answers.name}</dd></div>
            <div><dt>Email</dt><dd>{answers.email}</dd></div>
            <div><dt>Topic</dt><dd>{topicOptions.find(x => x.value === answers.topic)?.label}</dd></div>
            {answers.rating && <div><dt>Rating</dt><dd>{answers.rating} / 5</dd></div>}
            {answers.message && <div><dt>Details</dt><dd>{answers.message}</dd></div>}
            {answers.phone && <div><dt>Phone</dt><dd>{answers.phone}</dd></div>}
          </dl>
          <div className="phs-native-survey-actions">
            <button type="button" className="phs-native-survey-back" onClick={() => setStep(2)}>Back</button>
            <button type="button" className="phs-native-survey-next" onClick={() => {setAnswers(initial);setStep(1);}}>Start over</button>
          </div>
          <p className="phs-native-survey-note">No information is saved or submitted in this preview.</p>
        </section>
      ) : (
        <form className="phs-native-survey-form" onSubmit={next}>
          {step === 1 ? (
            <>
              <p className="phs-native-survey-step-label">01 — ABOUT YOU</p>
              <div className="phs-native-survey-fields">
                <label>
                  Full name <span>*</span>
                  <input type="text" value={answers.name} onChange={e => update("name",e.target.value)} placeholder="Your name" autoComplete="name" maxLength={120} required />
                </label>
                <label>
                  Email address <span>*</span>
                  <input type="email" value={answers.email} onChange={e => update("email",e.target.value)} placeholder="you@example.com" autoComplete="email" maxLength={180} required />
                </label>
              </div>
            </>
          ) : (
            <>
              <p className="phs-native-survey-step-label">02 — TELL US MORE</p>
              <fieldset className="phs-native-survey-fieldset">
                <legend>What would you like to share? <span>*</span></legend>
                <div className="phs-native-survey-choices">
                  {topicOptions.map(option => (
                    <label key={option.value} className={answers.topic === option.value ? "selected" : ""}>
                      <input type="radio" name="topic" value={option.value} checked={answers.topic === option.value} onChange={() => update("topic",option.value)} required />
                      <span className="phs-native-survey-choice-copy"><strong>{option.label}</strong><small>{option.description}</small></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {answers.topic === "feedback" && (
                <div className="phs-native-survey-branch">
                  <fieldset className="phs-native-survey-fieldset">
                    <legend>How would you rate your experience? <span>*</span></legend>
                    <div className="phs-native-survey-rating">
                      {[1,2,3,4,5].map(n => <label key={n} className={answers.rating === String(n) ? "selected":""}><input type="radio" name="rating" required value={n} checked={answers.rating === String(n)} onChange={() => update("rating",String(n))} />{n}</label>)}
                    </div>
                  </fieldset>
                  <label className="phs-native-survey-long">What could we do better? <span>*</span>
                    <textarea required value={answers.message} onChange={e => update("message",e.target.value)} rows={4} maxLength={1000} placeholder="Share your thoughts" />
                  </label>
                </div>
              )}
              {answers.topic === "question" && (
                <div className="phs-native-survey-branch">
                  <label className="phs-native-survey-long">What's your question? <span>*</span>
                    <textarea required value={answers.message} onChange={e => update("message",e.target.value)} rows={4} maxLength={1000} placeholder="Type your question" />
                  </label>
                </div>
              )}
              {answers.topic === "callback" && (
                <div className="phs-native-survey-branch">
                  <label className="phs-native-survey-long">What number can we call? <span>*</span>
                    <input required type="tel" autoComplete="tel" maxLength={35} value={answers.phone} onChange={e => update("phone",e.target.value)} placeholder="(555) 555-5555" />
                  </label>
                </div>
              )}
            </>
          )}
          <div className="phs-native-survey-actions">
            {step === 2 && <button type="button" className="phs-native-survey-back" onClick={() => setStep(1)}>Back</button>}
            <button type="submit" className="phs-native-survey-next">{step === 1 ? "Continue" : "Review answers"}</button>
          </div>
          <p className="phs-native-survey-note">Preview mode. The original survey questions and Airtable response mapping have not been verified.</p>
        </form>
      )}
    </section>
  );
}
