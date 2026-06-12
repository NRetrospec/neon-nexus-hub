import { useEffect, useRef } from "react";

/**
 * AmbientBackground — the "living world" layer.
 * A single lightweight 2D canvas that renders:
 *  - drifting particles (lime + purple)
 *  - slow moving light streaks
 *  - subtle twinkling stars
 *  - occasional energy waves
 *  - an animated city silhouette with blinking windows
 *  - soft parallax that follows the mouse
 * Designed to stay cheap: capped DPR, ~90 total elements, one rAF loop.
 * Respects prefers-reduced-motion.
 */

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  hue: "lime" | "purple";
  alpha: number;
  pulse: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  tw: number;
  speed: number;
}

interface Streak {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
}

interface Wave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

const LIME = "132, 255, 51";
const PURPLE = "168, 85, 247";

const AmbientBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let buildings: { x: number; bw: number; bh: number; windows: { wx: number; wy: number; on: number }[] }[] = [];

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const buildCity = () => {
      buildings = [];
      let x = 0;
      while (x < w + 80) {
        const bw = 40 + Math.random() * 90;
        const bh = h * (0.08 + Math.random() * 0.16);
        const windows: { wx: number; wy: number; on: number }[] = [];
        for (let wy = 12; wy < bh - 8; wy += 16) {
          for (let wx = 6; wx < bw - 10; wx += 14) {
            if (Math.random() < 0.28) {
              windows.push({ wx, wy, on: Math.random() });
            }
          }
        }
        buildings.push({ x, bw, bh, windows });
        x += bw + 6 + Math.random() * 18;
      }
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildCity();
    };
    resize();

    const particles: Particle[] = Array.from({ length: 42 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.8 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.05 - Math.random() * 0.22,
      hue: Math.random() < 0.6 ? "lime" : ("purple" as const),
      alpha: 0.15 + Math.random() * 0.45,
      pulse: Math.random() * Math.PI * 2,
    }));

    const stars: Star[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.65,
      r: 0.4 + Math.random() * 1.1,
      tw: Math.random() * Math.PI * 2,
      speed: 0.005 + Math.random() * 0.015,
    }));

    const streaks: Streak[] = Array.from({ length: 4 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.7,
      len: 80 + Math.random() * 160,
      speed: 0.4 + Math.random() * 0.8,
      alpha: 0.04 + Math.random() * 0.08,
    }));

    const waves: Wave[] = [];
    let lastWave = performance.now();

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("resize", resize);

    let t = 0;

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      const px = (mouseRef.current.x - 0.5) * 14; // parallax offset
      const py = (mouseRef.current.y - 0.5) * 8;

      // ---- stars ----
      for (const s of stars) {
        s.tw += s.speed;
        const a = 0.25 + Math.sin(s.tw) * 0.2;
        ctx.fillStyle = `rgba(255,255,255,${Math.max(a, 0.05)})`;
        ctx.beginPath();
        ctx.arc(s.x - px * 0.3, s.y - py * 0.3, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- light streaks ----
      for (const st of streaks) {
        if (!reduceMotion) st.x += st.speed;
        if (st.x - st.len > w) {
          st.x = -st.len;
          st.y = Math.random() * h * 0.7;
        }
        const grad = ctx.createLinearGradient(st.x - st.len, st.y, st.x, st.y);
        grad.addColorStop(0, `rgba(${PURPLE}, 0)`);
        grad.addColorStop(1, `rgba(${PURPLE}, ${st.alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(st.x - st.len, st.y);
        ctx.lineTo(st.x, st.y);
        ctx.stroke();
      }

      // ---- energy waves (occasional) ----
      if (!reduceMotion && performance.now() - lastWave > 9000) {
        lastWave = performance.now();
        waves.push({
          x: Math.random() * w,
          y: h * 0.4 + Math.random() * h * 0.3,
          radius: 0,
          maxRadius: 180 + Math.random() * 160,
          alpha: 0.22,
        });
      }
      for (let i = waves.length - 1; i >= 0; i--) {
        const wv = waves[i];
        wv.radius += 1.4;
        wv.alpha *= 0.992;
        if (wv.radius >= wv.maxRadius || wv.alpha < 0.01) {
          waves.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(${LIME}, ${wv.alpha * (1 - wv.radius / wv.maxRadius)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(wv.x, wv.y, wv.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ---- city silhouette ----
      const baseY = h;
      ctx.save();
      ctx.translate(-px * 0.6, -py * 0.25);
      for (const b of buildings) {
        ctx.fillStyle = "rgba(10, 8, 24, 0.92)";
        ctx.fillRect(b.x, baseY - b.bh, b.bw, b.bh);
        // glow rim
        ctx.fillStyle = `rgba(${PURPLE}, 0.06)`;
        ctx.fillRect(b.x, baseY - b.bh, b.bw, 2);
        for (const win of b.windows) {
          win.on += (Math.random() - 0.5) * 0.02;
          win.on = Math.min(1, Math.max(0, win.on));
          if (win.on > 0.5) {
            const isLime = (win.wx + win.wy) % 28 < 14;
            ctx.fillStyle = isLime
              ? `rgba(${LIME}, ${0.12 + win.on * 0.18})`
              : `rgba(${PURPLE}, ${0.1 + win.on * 0.16})`;
            ctx.fillRect(b.x + win.wx, baseY - b.bh + win.wy, 5, 7);
          }
        }
      }
      ctx.restore();

      // ---- floating particles ----
      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx + px * 0.002;
          p.y += p.vy;
          p.pulse += 0.02;
        }
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        const a = p.alpha * (0.7 + Math.sin(p.pulse) * 0.3);
        const c = p.hue === "lime" ? LIME : PURPLE;
        ctx.fillStyle = `rgba(${c}, ${a})`;
        ctx.shadowColor = `rgba(${c}, 0.8)`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(draw);
    };

    if (reduceMotion) {
      // Render one static frame only
      draw();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      {/* Deep atmosphere gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 20%, hsl(270 60% 18% / 0.55) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 80%, hsl(78 80% 25% / 0.18) 0%, transparent 55%), linear-gradient(180deg, hsl(252 35% 5%) 0%, hsl(250 30% 3%) 100%)",
        }}
      />
      {/* Soft fog band */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 opacity-40"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, hsl(270 50% 25% / 0.12) 50%, hsl(250 40% 10% / 0.4) 100%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, hsl(250 35% 2% / 0.7) 100%)",
        }}
      />
    </div>
  );
};

export default AmbientBackground;
