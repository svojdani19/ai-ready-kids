import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getBenchmarkForm } from "@/content/benchmark";
import { requireStudent } from "@/lib/auth/session";
import { getClass } from "@/lib/repo/classroom";
import { getSchool } from "@/lib/repo/school";
import { canTakeBenchmark } from "@/lib/domain/eligibility";
import { getBenchmark, listBenchmarksForStudent } from "@/lib/repo/progress";
import { CheckInPlayer } from "./CheckInPlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ form: string }>;
}): Promise<Metadata> {
  const { form } = await params;
  return { title: getBenchmarkForm(form)?.title ?? "Check-in" };
}

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ form: string }>;
}) {
  const { form } = await params;
  const content = getBenchmarkForm(form);
  if (!content) notFound();

  const { student } = await requireStudent();
  const db = getDb();

  // A form is open because the school opened that window, not because the
  // other one is finished. This page used to accept either form at any time.
  const classroom = getClass(db, student.class_id);
  const school = classroom ? getSchool(db, classroom.school_id) : undefined;
  const open = Boolean(
    school &&
      canTakeBenchmark({
        window: school.benchmark_window,
        form: content.form,
        records: listBenchmarksForStudent(db, student.id),
        grade: classroom?.grade,
      }),
  );
  if (!open) redirect("/student");

  const existing = getBenchmark(db, student.id, content.form);
  // A finished check-in is not re-openable: it is a measurement, and letting a
  // child revisit answers after the window closes would quietly invalidate it.
  if (existing?.completed_at) redirect("/student");

  return <CheckInPlayer content={content} initialResponses={existing?.responses ?? {}} />;
}
