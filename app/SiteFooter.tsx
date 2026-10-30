import Link from "next/link";
import OfficialLogo from "./OfficialLogo";

export default function SiteFooter() {
  return (
    <footer className="phs-footer">
      <div className="container phs-footer-top">
        <div className="phs-footer-brand">
          <Link href="/" className="phs-footer-logo" aria-label="Pitch Health Solutions home">
            <OfficialLogo />
          </Link>
          <p>Putting you first in every HealthCare decision.</p>
        </div>

        <nav className="phs-footer-nav" aria-label="Footer navigation">
          <h2>Explore</h2>
          <Link href="/">Home</Link>
          <Link href="/#why-us">About us</Link>
          <Link href="/career">Careers</Link>
          <Link href="/#contact">Contact</Link>
        </nav>

        <div className="phs-footer-contact">
          <h2>Get in touch</h2>
          <a href="mailto:memberservices@pitchhealthsolutions.com">memberservices@pitchhealthsolutions.com</a>
          <a href="tel:+18663241509">(866) 324-1509</a>
          <Link href="/text-updates">Plan updates by text</Link>
        </div>
      </div>

      <div className="container phs-footer-lower">
        <p className="phs-footer-disclaimer">
          <strong>Disclaimer.</strong> Pitch Health Solutions, LLC. is a national Medicare brokerage working with multiple insurance carriers to offer a range of Medicare plan options. The information we provide is limited to the plans we offer in your area. For information on all available plans, please visit <a href="https://www.medicare.gov/" target="_blank" rel="noopener noreferrer">www.medicare.gov</a> or call 1-800-MEDICARE (TTY users: 1-877-486-2048), available 24/7. This is not a complete listing of all plans available in your service area.
        </p>
        <div className="phs-footer-bottom">
          <p>© 2025 Pitch Health Solutions, LLC. is committed to equal opportunity employment.</p>
          <div className="phs-footer-legal">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/sms-terms-and-conditions">SMS Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
