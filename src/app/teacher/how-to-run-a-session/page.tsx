import type { Metadata } from "next";
import Link from "next/link";
import {
  NOT_THIS,
  ROOM_SETUPS,
  SESSION_SHAPES,
  WHAT_IS_RECORDED,
  WHEN_THINGS_HAPPEN,
} from "@/content/session-guide";
import { PageHeader, Panel, PanelBody } from "@/components/ui/Panel";
import { Note, Tag } from "@/components/ui/Bits";
import { requireOpenCurriculum } from "@/lib/auth/instruction-access";
import { CurriculumClosed } from "@/components/staff/CurriculumClosed";

export const metadata: Metadata = { title: "How to run a session" };

export default async function HowToRunASession() {
  const gate = await requireOpenCurriculum();
  if (!gate.open) return <CurriculumClosed reason={gate.reason} role={gate.user.role} />;

  return (
    <div>
      <PageHeader
        eyebrow="Teaching guide"
        title="How to run a session"
        description="Every session already has its own guide: what it teaches, what to watch for, what to ask afterwards. This is the part that is the same every time — where the minutes go, what you are doing while they play, and what to do when the room does what rooms do."
      />

      {SESSION_SHAPES.map((shape) => {
        const total = shape.steps.reduce((n, s) => n + s.minutes, 0);
        return (
          <div key={shape.id} className="mt-6">
            <Panel
              title={shape.name}
              description={shape.applies}
              actions={<Tag tone="neutral">{shape.totalMinutes}</Tag>}
            >
              <PanelBody className="space-y-4">
                <ol className="space-y-3">
                  {shape.steps.map((step, i) => (
                    <li key={step.label} className="flex gap-4">
                      <span className="flex w-16 shrink-0 flex-col items-center rounded-lg border border-sand-deep bg-paper py-2">
                        <span className="ark-tabular font-display text-xl text-ink">
                          {step.minutes}
                        </span>
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                          min
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          {i + 1}. {step.label}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                          <strong className="font-semibold text-ink">You:</strong>{" "}
                          {step.teacher}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                          <strong className="font-semibold text-ink">Them:</strong>{" "}
                          {step.children}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="border-t border-sand pt-3 text-sm leading-relaxed text-ink">
                  <strong className="font-semibold">{total} minutes of it.</strong>{" "}
                  {shape.keyPoint}
                </p>
              </PanelBody>
            </Panel>
          </div>
        );
      })}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Whatever your room actually has">
          <PanelBody>
            <dl className="space-y-3">
              {ROOM_SETUPS.map((r) => (
                <div key={r.setup}>
                  <dt className="text-sm font-semibold text-ink">{r.setup}</dt>
                  <dd className="text-sm leading-relaxed text-ink-soft">{r.guidance}</dd>
                </div>
              ))}
            </dl>
          </PanelBody>
        </Panel>

        <Panel title="What each kind of session leaves behind">
          <PanelBody>
            <dl className="space-y-3">
              {WHAT_IS_RECORDED.map((w) => (
                <div key={w.shape}>
                  <dt className="text-sm font-semibold text-ink">{w.shape}</dt>
                  <dd className="text-sm leading-relaxed text-ink-soft">{w.recorded}</dd>
                </div>
              ))}
            </dl>
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="When the room does what rooms do"
          description="None of these is a problem with the lesson. They are the lesson."
        >
          <PanelBody>
            <dl className="space-y-3.5">
              {WHEN_THINGS_HAPPEN.map((w) => (
                <div key={w.situation}>
                  <dt className="text-sm font-semibold text-ink">{w.situation}</dt>
                  <dd className="text-sm leading-relaxed text-ink-soft">{w.response}</dd>
                </div>
              ))}
            </dl>
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Note tone="berry" title="Five things not to do">
          <span className="block space-y-2">
            {NOT_THIS.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        </Note>
        <Note tone="neutral" title="Where the rest of the guidance is">
          Each session has its own guide with the setup line to read out, what to watch for
          while they play, the debrief questions, the answers to the things children
          predictably say, and a ten-minute unplugged extension.{" "}
          <Link
            href="/teacher/missions"
            className="font-semibold underline underline-offset-2"
          >
            Open the mission library
          </Link>{" "}
          and pick one; the guide is on the mission&rsquo;s own page and printable from it.
        </Note>
      </div>
    </div>
  );
}
