/**
 * sound.ts — UI sound architecture for PhreshTeamTV.
 *
 * DISABLED BY DEFAULT. Flip the master switch with:
 *   import { setSoundEnabled } from "@/lib/sound";
 *   setSoundEnabled(true);
 *
 * Sounds are synthesized with WebAudio (no asset downloads) so enabling
 * them later costs zero bytes. Add file-based sounds by registering a
 * URL in SOUND_SOURCES and they'll be lazily fetched on first play.
 */

export type UISound = "hover" | "select" | "notify" | "ambient";

const STORAGE_KEY = "pt_sound_enabled";

let enabled: boolean = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
})();

let ctx: AudioContext | null = null;

/** Optional file-based sources (empty by default — synth fallback used). */
const SOUND_SOURCES: Partial<Record<UISound, string>> = {};

const buffers = new Map<UISound, AudioBuffer>();

export const isSoundEnabled = () => enabled;

export const setSoundEnabled = (value: boolean) => {
  enabled = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
};

const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
};

/** Tiny synthesized blips so no assets are required. */
const synth = (kind: UISound, ac: AudioContext) => {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  const now = ac.currentTime;

  switch (kind) {
    case "hover":
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
      break;
    case "select":
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(940, now + 0.09);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
      break;
    case "notify":
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.setValueAtTime(990, now + 0.1);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case "ambient":
      // Ambient pads should be file-based; synth fallback is a no-op.
      osc.disconnect();
      gain.disconnect();
      break;
  }
};

/** Play a UI sound. Safe to call anywhere — silently no-ops when disabled. */
export const playUI = (kind: UISound) => {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  const src = SOUND_SOURCES[kind];
  if (src) {
    const cached = buffers.get(kind);
    if (cached) {
      const node = ac.createBufferSource();
      node.buffer = cached;
      node.connect(ac.destination);
      node.start();
    } else {
      void fetch(src)
        .then((r) => r.arrayBuffer())
        .then((b) => ac.decodeAudioData(b))
        .then((buf) => {
          buffers.set(kind, buf);
          const node = ac.createBufferSource();
          node.buffer = buf;
          node.connect(ac.destination);
          node.start();
        })
        .catch(() => {
          /* fall back silently */
        });
    }
    return;
  }
  synth(kind, ac);
};
