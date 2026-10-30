"use client";

import { useEffect, useState } from "react";

const easternClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function getHoursStatus(date: Date): "open" | "away" {
  const parts = easternClock.formatToParts(date);
  const weekday = parts.find(part => part.type === "weekday")?.value;
  const hour = Number(parts.find(part => part.type === "hour")?.value ?? -1);
  const minute = Number(parts.find(part => part.type === "minute")?.value ?? -1);
  const businessDay = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday ?? "");
  const currentMinutes = hour * 60 + minute;
  return businessDay && currentMinutes >= 9 * 60 && currentMinutes < 18 * 60 ? "open" : "away";
}

export default function BusinessHoursStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<"open" | "away" | null>(null);

  useEffect(() => {
    const refresh = () => setStatus(getHoursStatus(new Date()));
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div title="Based on Monday–Friday, 9 AM–6 PM Eastern Time" className={"business-hours-status " + (compact ? "business-hours-compact " : "") + (status === "open" ? "is-open" : status === "away" ? "is-away" : "is-checking")}>
      <span className="business-hours-status-dot" aria-hidden="true" />
      <div className="business-hours-status-copy">
        <span className="business-hours-status-label" role="status" aria-live="polite">
          {status === "open" ? "We're open" : status === "away" ? "Currently away" : "Checking business hours"}
        </span>
        <span className="business-hours-status-note">
          {status === "open" ? "Within our scheduled business hours" : status === "away" ? "Outside our scheduled business hours" : "Monday–Friday, 9 AM–6 PM ET"}
        </span>
      </div>
    </div>
  );
}
