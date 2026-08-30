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
 *
 * **Voice.** The default voice a browser picks is usually the flattest one it
 * has, which reads a story to a seven year old like a station announcement.
 * `pickVoice` prefers a British English female voice, by name where the good
 * ones are known and by language otherwise, and the rate and pitch are set for
 * a reading voice rather than a dictation one.
 *
 * What this cannot do is guarantee that voice. `getVoices` returns whatever is
 * installed on the child's own device, and no audio ships with this product —
 * adding a hosted voice would mean sending what a child is reading to somebody
 * else's server, which is the one thing the privacy page promises never
 * happens. So this picks the best available and degrades quietly: a device with
 * only one robotic voice still reads aloud, and the button never claims an
 * accent it cannot produce.
 */

/**
 * Known-good British English female voices, best first.
 *
 * Chrome and ChromeOS ship the Google voice; Edge ships the Microsoft ones;
 * macOS and iOS ship the personal-name ones. Matched by prefix because
 * platforms append qualifiers like "Online (Natural)" or "Compact".
 */
const PREFERRED_VOICES = [
  "Google UK English Female",
  "Microsoft Sonia",
  "Microsoft Libby",
  "Microsoft Hazel",
  "Microsoft Susan",
  "Serena",
  "Stephanie",
  "Kate",
  "Martha",
];

/** British English voices that are not what was asked for. */
const NOT_THESE = [
  "Google UK English Male",
  "Microsoft Ryan",
  "Microsoft George",
  "Microsoft Thomas",
  "Daniel",
  "Oliver",
  "Arthur",
  "George",
];

/** Exported for test: this choice is the whole point of the control. */
export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  for (const wanted of PREFERRED_VOICES) {
    const match = voices.find((v) => v.name === wanted || v.name.startsWith(`${wanted} `));
    if (match) return match;
  }

  // Any British English voice that is not on the list above. Platforms write
  // the tag as en-GB or en_GB depending on the engine.
  const british = voices.filter((v) =>
    v.lang.replace("_", "-").toLowerCase().startsWith("en-gb"),
  );
  const unnamed = british.find((v) => !NOT_THESE.some((n) => v.name.includes(n)));
  if (unnamed) return unnamed;
  if (british[0]) return british[0];

  // Any English at all, rather than whatever the system default happens to be.
  return voices.find((v) => v.lang.toLowerCase().startsWith("en")) ?? null;
}

/**
 * Voices arrive asynchronously in most browsers: the first `getVoices` call
 * returns an empty list and `voiceschanged` fires once they are loaded.
 */
function useVoice(supported: boolean): SpeechSynthesisVoice | null {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    if (typeof synth.getVoices !== "function") return;

    const choose = () => setVoice(pickVoice(synth.getVoices() ?? []));
    choose();
    synth.addEventListener?.("voiceschanged", choose);
    return () => synth.removeEventListener?.("voiceschanged", choose);
  }, [supported]);

  return voice;
}
export function ReadAloud({ text }: { text: string }) {
  const supported = useSyncExternalStore(subscribe, hasSpeech, () => false);
  const voice = useVoice(supported);
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
    if (voice) {
      utterance.voice = voice;
      // Some engines read the default language rather than the voice's own
      // unless this is set alongside it.
      utterance.lang = voice.lang;
    }
    // 0.92 was slow enough to sound like dictation. Just under natural pace
    // keeps it followable for a seven year old without plodding, and a little
    // lift in pitch reads as telling a story rather than reading a list.
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
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
