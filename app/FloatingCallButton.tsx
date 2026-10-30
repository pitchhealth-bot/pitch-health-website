"use client";

import { useEffect, useState } from "react";

export default function FloatingCallButton() {
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const hero = document.querySelector(".hero");
    if (!hero) {
      setPastHero(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setPastHero(!entry.isIntersecting);
    }, { threshold: 0 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  return (
    <a className={"floating-call-button" + (pastHero ? " floating-call-visible" : "")}
       href="tel:+18663241509"
       aria-label="Call Us (866) 324-1509">
      <span className="floating-call-icon" aria-hidden="true">☎</span>
      <span>Call Us (866) 324-1509</span>
    </a>
  );
}
