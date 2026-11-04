import type { Metadata } from "next";
import Link from "next/link";
import OfficialLogo from "../OfficialLogo";
import BusinessHoursStatus from "../BusinessHoursStatus";
import SiteFooter from "../SiteFooter";

export const metadata: Metadata = {
  title: "Survey | Pitch Health Solutions",
  description: "Complete the Pitch Health Solutions survey.",
};

const surveyUrl = "https://airtable.com/app4ihGae0XFY7RAD/pagDbB3N19fxL4Ts6/form";

export default function SurveyPage() {
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Pitch Health Solutions home">
          <OfficialLogo />
        </Link>
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
            <h1>We'd love to hear from you.</h1>
            <p>Complete the survey below. Questions may change depending on your answers.</p>
          </div>
        </section>
        <section className="phs-survey-section" aria-label="Survey form">
          <div className="container">
            <div className="phs-survey-embed">
              <iframe
                title="Pitch Health Solutions Airtable survey"
                src={surveyUrl}
                referrerPolicy="strict-origin-when-cross-origin"
                loading="eager"
              />
            </div>
            <p className="phs-survey-fallback">
              Having trouble viewing the survey?{" "}
              <a href={surveyUrl} target="_blank" rel="noopener noreferrer">
                Open the original survey in a new tab.
              </a>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
