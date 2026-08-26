import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMission } from "@/content/missions";
import { requireStaff } from "@/lib/auth/session";
import { ClassroomMode } from "./ClassroomMode";

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
  const { slug } = await params;
  const mission = getMission(slug);
  if (!mission) notFound();
  await requireStaff();

  return <ClassroomMode mission={mission} />;
}
