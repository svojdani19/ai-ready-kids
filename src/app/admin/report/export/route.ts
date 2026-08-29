import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { buildSchoolReport, reportToCsv } from "@/lib/repo/report";
import { recordAudit } from "@/lib/repo/school";

/**
 * Report download.
 *
 * Both formats are built from the same aggregate object the on-screen report
 * renders, and small groups are suppressed upstream in `buildSchoolReport`.
 *
 * That shared object is why the claim has to be narrower than it once was.
 * This comment used to say an export "can never contain something the screen
 * was hiding", which was false in one direction: the screen renders a chosen
 * subset, and the JSON serialises the whole object. So account values the
 * pages deliberately refused to present — a malformed plan, seat count or
 * retention window — went out in the download anyway.
 *
 * The guarantee now rests on the object itself rather than on the rendering:
 * `SchoolReport` carries no raw account metadata, and retention is a
 * discriminated policy rather than a stored number. Nothing in it is unsafe to
 * serialise, which is a stronger property than "the screen hides it".
 */
export async function GET(request: Request) {
  const { user } = await requireAdmin();
  const db = getDb();
  const format = new URL(request.url).searchParams.get("format") === "json" ? "json" : "csv";
  const report = buildSchoolReport(db, user.school_id);

  recordAudit(db, {
    schoolId: user.school_id,
    actorLabel: user.name,
    action: "report.exported",
    detail: `Annual school report exported as ${format.toUpperCase()}. Aggregate figures only, no student identifiers.`,
  });

  const stamp = report.generatedAt.slice(0, 10);
  const slug = report.school.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `ai-ready-kids-${slug}-${stamp}.${format}`;

  const body = format === "json" ? JSON.stringify(report, null, 2) : reportToCsv(report);

  return new Response(body, {
    headers: {
      "Content-Type": format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
