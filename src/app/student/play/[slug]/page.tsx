import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getMission } from "@/content/missions";
import { requireStudent } from "@/lib/auth/session";
import { startAttempt } from "@/lib/repo/progress";
import { resumeSceneId } from "@/lib/domain/missionPath";
import { MissionPlayer } from "./MissionPlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: getMission(slug)?.title ?? "Mission" };
}

export default async function PlayMissionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mission = getMission(slug);
  if (!mission) notFound();

  const { student } = await requireStudent();
  // Opening a mission creates or resumes its attempt, so a child who closes
  // the tab mid-story comes back to the same scene.
  const attempt = startAttempt(getDb(), student.id, mission.id);
  const finished = Boolean(attempt.completed_at);

  // A finished mission replays from the beginning and records nothing new:
  // the evidence from the first run stands, and re-reading a story should not
  // be able to overwrite it in either direction.
  return (
    <MissionPlayer
      mission={mission}
      initialSceneId={finished ? mission.openingSceneId : resumeSceneId(mission, attempt.path)}
      alreadyCompleted={finished}
    />
  );
}
