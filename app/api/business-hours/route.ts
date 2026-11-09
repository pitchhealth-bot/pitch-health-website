import { getHoursStatus } from "../../business-hours";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: getHoursStatus(new Date()) },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
