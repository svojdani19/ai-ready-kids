"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const hasSpeech = () => typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * Read-aloud support.
 *
 * Uses the browser's own speech synthesis. Nothing is sent anywhere, no audio
 * is recorded and no microphone permission is requested — this is playback
 * only. If the browser has no speech support the control never renders, so the
 * page never offers a button that does nothing.
 *
 * The parent keys this component on the text it speaks, so moving to a new
 * scene remounts it: speech stops and the button resets without an effect
 * having to reach in and correct state after the fact.
 */
export function ReadAloud({ text }: { text: string }) {
  const supported = useSyncExternalStore(subscribe, hasSpeech, () => false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!supported) return;
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  if (!supported) return null;

  const toggle = () => {
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-sand-deep bg-surface px-4 text-base font-semibold text-ink-soft hover:bg-paper-deep hover:text-ink"
    >
      <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" fill="currentColor">
        <path d="M9 3.5 5.4 6.6H3a1 1 0 0 0-1 1v4.8a1 1 0 0 0 1 1h2.4L9 16.5a.6.6 0 0 0 1-.46V3.96A.6.6 0 0 0 9 3.5Z" />
        {speaking ? (
          <path d="M13 6.6a.9.9 0 0 1 1.3.1 5.2 5.2 0 0 1 0 6.6.9.9 0 1 1-1.4-1.2 3.4 3.4 0 0 0 0-4.3.9.9 0 0 1 .1-1.2Z" />
        ) : (
          <path d="M13.2 7.4a.85.85 0 1 1 1.1-1.3 5.2 5.2 0 0 1 0 7.8.85.85 0 0 1-1.1-1.3 3.5 3.5 0 0 0 0-5.2Z" />
        )}
      </svg>
      {speaking ? "Stop" : "Read aloud"}
    </button>
  );
}
