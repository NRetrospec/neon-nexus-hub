import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * IntroSequence — cinematic boot-up shown once per browser session.
 *
 * Timeline (~4.2s total, skippable at any moment):
 *  0.0s  near-black + drifting particles
 *  0.6s  glowing PT mark forms from particles
 *  1.6s  energy rings expand outward
 *  2.2s  "PHRESHTEAMTV" fades in
 *  2.8s  tagline PLAY. CONNECT. LEVEL UP.
 *  3.4s  portal opens, camera "moves through" (scale + fade)
 *  4.2s  dashboard revealed
 */

const SESSION_KEY = "pt_intro_seen";
const LOGIN_KEY = "pt_intro_login_sid";

/**
 * Show the intro when EITHER:
 *  - this is a fresh visit to the site (new tab / browser reopened), OR
 *  - the user signed in again (new Clerk session id since last intro).
 * It does NOT replay on every visit to /home within the same login + visit.
 */
export const shouldShowIntro = (clerkSessionId?: string | null) => {
  try {
    const freshVisit = sessionStorage.getItem(SESSION_KEY) !== "1";
    const freshLogin = clerkSessionId
      ? localStorage.getItem(LOGIN_KEY) !== clerkSessionId
      : false;
    return freshVisit || freshLogin;
  } catch {
    return false;
  }
};

/** Persist that the intro has been seen for this visit + this login. */
export const markIntroSeen = (clerkSessionId?: string | null) => {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
    if (clerkSessionId) localStorage.setItem(LOGIN_KEY, clerkSessionId);
  } catch {
    /* private mode */
  }
};

interface IntroSequenceProps {
  onComplete: () => void;
  /** Current Clerk session id — ties intro replay to fresh logins. */
  clerkSessionId?: string | null;
}

const PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 1.2,
  size: 2 + Math.random() * 3,
  lime: i % 3 !== 0,
}));

const IntroSequence = ({ onComplete, clerkSessionId }: IntroSequenceProps) => {
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finish = useCallback(() => {
    markIntroSeen(clerkSessionId);
    setExiting(true);
    setTimeout(onComplete, 700);
  }, [onComplete, clerkSessionId]);

  useEffect(() => {
    const schedule = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms));
    };
    schedule(() => setPhase(1), 500);   // PT mark forms
    schedule(() => setPhase(2), 1500);  // rings
    schedule(() => setPhase(3), 2100);  // title
    schedule(() => setPhase(4), 2700);  // tagline
    schedule(() => setPhase(5), 3400);  // portal
    schedule(finish, 4200);
    return () => timers.current.forEach(clearTimeout);
  }, [finish]);

  // Skip on any key / click
  useEffect(() => {
    const skip = () => finish();
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [finish]);

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden cursor-pointer select-none"
          style={{ background: "hsl(252 35% 2%)" }}
          onClick={finish}
          exit={{ opacity: 0, scale: 1.6, filter: "blur(8px)" }}
          transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
        >
          {/* Drifting particles */}
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: p.lime ? "hsl(78 100% 56%)" : "hsl(270 100% 65%)",
                boxShadow: p.lime
                  ? "0 0 8px hsl(78 100% 56% / 0.9)"
                  : "0 0 8px hsl(270 100% 65% / 0.9)",
              }}
              initial={{ opacity: 0 }}
              animate={
                phase >= 1
                  ? {
                      opacity: [0.6, 0.2],
                      left: "50%",
                      top: "42%",
                      scale: [1, 0.3],
                    }
                  : { opacity: [0, 0.7, 0.3, 0.7], y: [0, -14, 0] }
              }
              transition={
                phase >= 1
                  ? { duration: 1.1, delay: p.delay * 0.25, ease: "easeIn" }
                  : { duration: 3, delay: p.delay, repeat: Infinity }
              }
            />
          ))}

          <div className="relative flex flex-col items-center" style={{ transform: "translateY(-4%)" }}>
            {/* Energy rings */}
            {phase >= 2 &&
              [0, 1, 2].map((i) => (
                <motion.div
                  key={`ring-${i}`}
                  className="absolute rounded-full border"
                  style={{
                    borderColor:
                      i % 2 === 0
                        ? "hsl(78 100% 56% / 0.55)"
                        : "hsl(270 100% 65% / 0.55)",
                    width: 140,
                    height: 140,
                    top: "50%",
                    left: "50%",
                    x: "-50%",
                    y: "-50%",
                  }}
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 3.2 + i, opacity: 0 }}
                  transition={{
                    duration: 1.6,
                    delay: i * 0.35,
                    repeat: Infinity,
                    repeatDelay: 0.6,
                    ease: "easeOut",
                  }}
                />
              ))}

            {/* PT mark */}
            <motion.div
              className="relative font-gaming font-black italic"
              initial={{ opacity: 0, scale: 0.4, filter: "blur(12px)" }}
              animate={
                phase >= 1
                  ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                  : {}
              }
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize: "clamp(4rem, 12vw, 8rem)",
                color: "hsl(78 100% 56%)",
                textShadow:
                  "0 0 24px hsl(78 100% 56% / 0.9), 0 0 80px hsl(78 100% 56% / 0.5), 0 0 140px hsl(270 100% 65% / 0.4)",
                WebkitTextStroke: "2px hsl(78 100% 70%)",
              }}
            >
              PT
              {/* crown */}
              <motion.span
                className="absolute -top-7 left-1/2 -translate-x-1/2 text-3xl"
                initial={{ opacity: 0, y: 8 }}
                animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6, duration: 0.5 }}
                style={{
                  color: "hsl(78 100% 56%)",
                  filter: "drop-shadow(0 0 10px hsl(78 100% 56% / 0.8))",
                }}
              >
                ♛
              </motion.span>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-gaming font-bold tracking-[0.35em] mt-6 text-center"
              initial={{ opacity: 0, letterSpacing: "0.6em" }}
              animate={phase >= 3 ? { opacity: 1, letterSpacing: "0.35em" } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                fontSize: "clamp(1.1rem, 3.2vw, 2rem)",
                color: "hsl(0 0% 96%)",
                textShadow: "0 0 30px hsl(270 100% 65% / 0.6)",
              }}
            >
              PHRESH<span style={{ color: "hsl(78 100% 56%)" }}>TEAM</span>TV
            </motion.h1>

            {/* Tagline */}
            <motion.div
              className="flex gap-3 mt-4 font-cyber font-semibold tracking-[0.25em] text-sm sm:text-base"
              initial="hidden"
              animate={phase >= 4 ? "show" : "hidden"}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.18 } },
              }}
            >
              {["PLAY.", "CONNECT.", "LEVEL UP."].map((wordItem, i) => (
                <motion.span
                  key={wordItem}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.4 }}
                  style={{
                    color:
                      i === 2 ? "hsl(78 100% 56%)" : "hsl(0 0% 96% / 0.85)",
                    textShadow:
                      i === 2
                        ? "0 0 16px hsl(78 100% 56% / 0.7)"
                        : "none",
                  }}
                >
                  {wordItem}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* Portal opening */}
          {phase >= 5 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="rounded-full"
                initial={{ width: 0, height: 0, opacity: 0.9 }}
                animate={{ width: "260vmax", height: "260vmax", opacity: 1 }}
                transition={{ duration: 1.1, ease: [0.7, 0, 0.84, 0] }}
                style={{
                  background:
                    "radial-gradient(circle, hsl(270 100% 65% / 0.25) 0%, hsl(252 35% 2% / 0) 28%, transparent 60%)",
                  border: "2px solid hsl(78 100% 56% / 0.4)",
                  boxShadow:
                    "0 0 80px hsl(78 100% 56% / 0.4), inset 0 0 120px hsl(270 100% 65% / 0.3)",
                }}
              />
            </motion.div>
          )}

          {/* Skip hint */}
          <motion.button
            className="absolute bottom-8 right-8 font-cyber text-xs tracking-[0.3em] uppercase px-4 py-2 rounded-md border transition-colors"
            style={{
              color: "hsl(0 0% 96% / 0.5)",
              borderColor: "hsl(0 0% 96% / 0.15)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            whileHover={{
              color: "hsl(78 100% 56%)",
              borderColor: "hsl(78 100% 56% / 0.5)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              finish();
            }}
          >
            Skip ▸
          </motion.button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default IntroSequence;
