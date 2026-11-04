import SurveyForm from "./SurveyForm";
import type { Metadata } from "next";
import Link from "next/link";
import OfficialLogo from "../OfficialLogo";
import BusinessHoursStatus from "../BusinessHoursStatus";
import SiteFooter from "../SiteFooter";

export const metadata: Metadata = {
  title: "Survey | Pitch Health Solutions",
  description: "Complete the Pitch Health Solutions survey.",
};



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
            <p>A cleaner survey experience, built for Pitch Health. The questions below demonstrate how conditional follow-ups will work.</p>
          </div>
        </section>
        <section className="phs-survey-section" aria-label="Survey preview">
          <div className="container">
            <SurveyForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
