"use client";

import { useEffect, useState } from "react";

export default function BusinessHoursStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<"open" | "away" | "unavailable" | null>(null);

  useEffect(() => {
    let disposed = false;
    let request: AbortController | null = null;
    const refresh = async () => {
      if (request) return;
      const controller = new AbortController();
      request = controller;
      const timeout = window.setTimeout(() => controller.abort(), 8_000);
      try {
        const response = await fetch("/api/business-hours", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Availability check failed");
        const data = await response.json();
        if (data.status !== "open" && data.status !== "away") throw new Error("Invalid availability");
        if (!disposed) setStatus(data.status);
      } catch {
        if (!disposed) setStatus("unavailable");
      } finally {
        window.clearTimeout(timeout);
        request = null;
      }
    };
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      disposed = true;
      request?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div title="Based on Monday–Friday, 9 AM–6 PM Eastern Time" className={"business-hours-status " + (compact ? "business-hours-compact " : "") + (status === "open" ? "is-open" : status === "away" ? "is-away" : "is-checking")}>
      <span className="business-hours-status-dot" aria-hidden="true" />
      <div className="business-hours-status-copy">
        <span className="business-hours-status-label" role="status" aria-live="polite">
          {status === "open" ? "We're open" : status === "away" ? "Currently away" : status === "unavailable" ? "Mon–Fri, 9 AM–6 PM ET" : "Checking business hours"}
        </span>
        <span className="business-hours-status-note">
          {status === "open" ? "Within our scheduled business hours" : status === "away" ? "Outside our scheduled business hours" : "Monday–Friday, 9 AM–6 PM ET"}
        </span>
      </div>
    </div>
  );
}
