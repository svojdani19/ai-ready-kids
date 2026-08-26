"use client";

import { useTransition } from "react";
import { completeCertificationAction } from "@/app/actions/teacher";
import { Button } from "@/components/ui/Button";

export function CompleteButton({ ready }: { ready: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="lg"
      disabled={!ready || pending}
      onClick={() =>
        startTransition(async () => {
          await completeCertificationAction();
        })
      }
    >
      {pending ? "Recording…" : "Complete the certification"}
    </Button>
  );
}
