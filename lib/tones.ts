/** Synthesised notification tones (Web Audio) — no audio files needed. */
export interface Tone {
  id: string;
  label: string;
  /** [frequency Hz, start s, duration s, waveform] */
  notes: [number, number, number, OscillatorType][];
}

export const TONES: Tone[] = [
  { id: "pop", label: "Pop", notes: [[620, 0, 0.09, "sine"], [930, 0.07, 0.12, "sine"]] },
  { id: "chime", label: "Chime", notes: [[784, 0, 0.35, "sine"], [1047, 0.12, 0.45, "sine"], [1319, 0.26, 0.55, "sine"]] },
  { id: "bubble", label: "Bubble", notes: [[300, 0, 0.12, "sine"], [520, 0.05, 0.12, "sine"], [880, 0.1, 0.16, "sine"]] },
  { id: "marimba", label: "Marimba", notes: [[523, 0, 0.25, "triangle"], [659, 0.15, 0.25, "triangle"], [784, 0.3, 0.4, "triangle"]] },
  { id: "dingdong", label: "Ding-dong", notes: [[988, 0, 0.4, "sine"], [740, 0.35, 0.6, "sine"]] },
  { id: "pulse", label: "Pulse", notes: [[440, 0, 0.1, "square"], [440, 0.16, 0.1, "square"]] },
  { id: "silent", label: "Silent", notes: [] },
];

let ctx: AudioContext | null = null;

export function playTone(id: string, volume = 0.6): void {
  const tone = TONES.find((t) => t.id === id) ?? TONES[0];
  if (!tone.notes.length || volume <= 0 || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    for (const [freq, start, dur, wave] of tone.notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.25 * volume), now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    }
  } catch { /* audio blocked until a user gesture */ }
}

export function vibrate(pattern: number | number[] = [60, 40, 60]): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
}
