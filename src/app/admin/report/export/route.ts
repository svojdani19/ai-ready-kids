import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { buildSchoolReport, reportToCsv } from "@/lib/repo/report";
import { recordAudit } from "@/lib/repo/school";

/**
 * Report download.
 *
 * Both formats are built from the same aggregate object the on-screen report
 * renders, so an export can never contain something the screen was hiding.
 * Small groups are already suppressed upstream in buildSchoolReport.
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
