import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMission } from "@/content/missions";
import { ClassroomMode } from "./ClassroomMode";
import { requireOpenCurriculum } from "@/lib/auth/instruction-access";
import { CurriculumClosed } from "@/components/staff/CurriculumClosed";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mission = getMission(slug);
  return { title: mission ? `${mission.title} on the board` : "Classroom Mode" };
}

export default async function ClassroomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const gate = await requireOpenCurriculum();
  if (!gate.open) return <CurriculumClosed reason={gate.reason} role={gate.user.role} />;
  const { slug } = await params;
  const mission = getMission(slug);
  if (!mission) notFound();

  return <ClassroomMode mission={mission} />;
}
