import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getBenchmarkForm } from "@/content/benchmark";
import { requireStudent } from "@/lib/auth/session";
import { getBenchmark } from "@/lib/repo/progress";
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
  const existing = getBenchmark(getDb(), student.id, content.form);
  // A finished check-in is not re-openable: it is a measurement, and letting a
  // child revisit answers after the window closes would quietly invalidate it.
  if (existing?.completed_at) redirect("/student");

  return <CheckInPlayer content={content} initialResponses={existing?.responses ?? {}} />;
}
