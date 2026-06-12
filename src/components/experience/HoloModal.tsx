import { ReactNode, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { playUI } from "@/lib/sound";

/**
 * HoloModal — full-screen holographic panel that embeds existing pages
 * INSIDE the home dashboard, so the user never leaves the immersive hub.
 *
 * The embedded page keeps 100% of its functionality (Convex, Clerk, forms).
 * Its legacy Navbar/Footer are hidden via the `pt-embed` CSS scope, and a
 * transform on the scroll container keeps the page's `position: fixed`
 * background layers contained inside the modal.
 */

interface HoloModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const HoloModal = ({ open, title, onClose, children }: HoloModalProps) => {
  // ESC to close + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="holo-modal"
          className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-5 lg:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: "hsl(252 35% 2% / 0.72)",
              backdropFilter: "blur(10px)",
            }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-6xl h-full flex flex-col rounded-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.94, y: 22, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, y: 14, filter: "blur(6px)" }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background:
                "linear-gradient(165deg, hsl(250 28% 7% / 0.97) 0%, hsl(252 32% 4% / 0.99) 100%)",
              border: "1px solid hsl(var(--primary) / 0.22)",
              boxShadow:
                "0 0 60px hsl(var(--primary) / 0.12), 0 0 120px hsl(270 100% 65% / 0.08), 0 24px 80px hsl(250 35% 1% / 0.8)",
            }}
          >
            {/* Glow seam on top edge */}
            <div
              className="absolute top-0 left-6 right-6 h-px pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.7), transparent)",
              }}
            />

            {/* Title bar */}
            <div
              className="relative flex items-center justify-between px-4 sm:px-6 py-3 shrink-0"
              style={{ borderBottom: "1px solid hsl(var(--primary) / 0.12)" }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-1.5 h-4 rounded-full bg-primary"
                  style={{ boxShadow: "0 0 10px hsl(var(--primary))" }}
                />
                <h2 className="font-gaming font-bold text-sm tracking-[0.25em] text-foreground uppercase">
                  {title}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:block font-cyber text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  ESC to close
                </span>
                <button
                  onClick={() => {
                    playUI("select");
                    onClose();
                  }}
                  aria-label="Close"
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary border border-white/[0.07] hover:border-primary/50 transition-all duration-200 hover:shadow-[0_0_14px_hsl(var(--primary)/0.3)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Embedded page — transform keeps page-level `fixed` layers inside */}
            <div
              className="pt-embed relative flex-1 overflow-y-auto overscroll-contain"
              style={{ transform: "translateZ(0)" }}
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full min-h-[40vh]">
                    <span
                      className="font-gaming font-black italic text-5xl text-primary/50 animate-pulse"
                      style={{ textShadow: "0 0 30px hsl(var(--primary) / 0.5)" }}
                    >
                      PT
                    </span>
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HoloModal;
