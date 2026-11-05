import type { Metadata } from "next";
import Link from "next/link";
import OfficialLogo from "../OfficialLogo";
import BusinessHoursStatus from "../BusinessHoursStatus";
import SiteFooter from "../SiteFooter";
import SurveyForm from "./SurveyForm";

export const metadata: Metadata = {
  title: "Customer Survey",
  description: "Share your experience with Pitch Health Solutions through Quick Feedback or Detailed Feedback.",
};


export default function SurveyPage() {
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Pitch Health Solutions home"><OfficialLogo /></Link>
        <nav aria-label="Primary navigation">
          <Link href="/#why-us">About us</Link>
          <Link href="/career">Careers</Link>
          <Link href="/survey" aria-current="page">Customer Survey</Link>
          <Link href="/#contact">Contact</Link>
        </nav>
        <div className="header-actions">
          <BusinessHoursStatus compact />
          <Link className="nav-cta" href="/text-updates">Member updates</Link>
        </div>
      </header>

      <main className="phs-survey-page">
        <section className="phs-survey-header">
          <div className="container phs-survey-header-inner">
            <p className="phs-survey-eyebrow">CUSTOMER SURVEY</p>
            <h1>Your experience matters.</h1>
            <p>Thank you for choosing Pitch Health Solutions. Your feedback helps us recognize excellent service and better support your Medicare needs.</p>
          </div>
        </section>
        <section className="phs-survey-section" aria-label="Survey access">
          <div className="container">
            <SurveyForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
