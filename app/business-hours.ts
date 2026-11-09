const easternClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function getHoursStatus(date: Date): "open" | "away" {
  const parts = easternClock.formatToParts(date);
  const weekday = parts.find(part => part.type === "weekday")?.value;
  const hour = Number(parts.find(part => part.type === "hour")?.value ?? -1);
  const minute = Number(parts.find(part => part.type === "minute")?.value ?? -1);
  const businessDay = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday ?? "");
  const currentMinutes = hour * 60 + minute;
  return businessDay && currentMinutes >= 9 * 60 && currentMinutes < 18 * 60 ? "open" : "away";
}

