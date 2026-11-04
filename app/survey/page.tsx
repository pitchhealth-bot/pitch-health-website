import type { Metadata } from "next";
import Link from "next/link";
import OfficialLogo from "../OfficialLogo";
import BusinessHoursStatus from "../BusinessHoursStatus";
import SiteFooter from "../SiteFooter";

export const metadata: Metadata = {
  title: "Survey | Pitch Health Solutions",
  description: "Access the Pitch Health Solutions Airtable survey.",
};

const originalSurvey = "https://airtable.com/app4ihGae0XFY7RAD/pagDbB3N19fxL4Ts6/form";

export default function SurveyPage() {
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Pitch Health Solutions home"><OfficialLogo /></Link>
        <nav aria-label="Primary navigation">
          <Link href="/#why-us">About us</Link>
          <Link href="/career">Careers</Link>
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
            <p className="phs-survey-eyebrow">PITCH HEALTH SOLUTIONS</p>
            <h1>Survey</h1>
          </div>
        </section>
        <section className="phs-survey-section" aria-label="Survey access">
          <div className="container">
            <div className="phs-survey-source-card">
              <h2>Open the survey</h2>
              <p>Use the original Airtable form to answer the current questions. This page will be replaced with a native survey after the exact questions and conditional rules are verified.</p>
              <a className="phs-survey-source-link" href={originalSurvey} target="_blank" rel="noopener noreferrer">Open survey</a>
              <p className="phs-survey-source-note">The website is not collecting survey responses here yet.</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
