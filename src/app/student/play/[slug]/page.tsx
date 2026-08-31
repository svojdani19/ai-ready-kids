import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getClass, listAssignments } from "@/lib/repo/classroom";
import { classMayBeAssigned, missionAccessFor } from "@/lib/domain/eligibility";
import { getDb } from "@/lib/db";
import { getMission } from "@/content/missions";
import { requireStudent } from "@/lib/auth/session";
import { getAttempt, startAttempt } from "@/lib/repo/progress";
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
  const db = getDb();

  // Being a shipped mission is not the same as being open to this child. The
  // page used to accept any slug, so an unassigned mission could be played and
  // its evidence recorded by typing a URL.
  // And being assigned is not the same as being in this class's grade band. A
  // row made before sprint 85's rule existed must not open the mission.
  const classroom = getClass(db, student.class_id);
  const access = missionAccessFor({
    missionId: mission.id,
    assignedMissionIds: listAssignments(db, student.class_id).map((a) => a.mission_id),
    hasCompleted: Boolean(getAttempt(db, student.id, mission.id)?.completed_at),
    eligible: classroom ? classMayBeAssigned(classroom.grade, mission) : false,
  });
  if (access === "denied") redirect("/student");

  // Opening a mission creates or resumes its attempt, so a child who closes
  // the tab mid-story comes back to the same scene.
  const attempt = startAttempt(db, student.id, mission.id);
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
