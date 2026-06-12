import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { NeonText } from "../components/NeonText";

interface OutroSceneProps {
  vertical?: boolean;
}

export const OutroScene: React.FC<OutroSceneProps> = ({ vertical = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene entrance
  const sceneOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Logo animation
  const logoScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  // CTA button animation
  const ctaScale = spring({
    frame: frame - 50,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Pulsing glow for CTA
  const ctaGlow = interpolate(Math.sin(frame * 0.15), [-1, 1], [0.6, 1]);

  // Final flash
  const finalFlash = interpolate(frame, [150, 160, 165], [0, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Taglines with stagger
  const taglines = [
    { text: "COMPLETE QUESTS", delay: 30 },
    { text: "EARN XP", delay: 40 },
    { text: "DOMINATE LEADERBOARDS", delay: 50 },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: sceneOpacity,
      }}
    >
      {/* Radial glow background */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse at center, rgba(0, 240, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 30% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 70% 30%, rgba(255, 0, 255, 0.1) 0%, transparent 40%)
          `,
        }}
      />

      {/* Final flash overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(255, 255, 255, ${finalFlash})`,
          pointerEvents: "none",
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: vertical ? 24 : 32,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: `scale(${logoScale})`,
            opacity: logoScale,
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: vertical ? 100 : 140,
              height: vertical ? 100 : 140,
              borderRadius: 24,
              background: "linear-gradient(135deg, #00f0ff 0%, #8b5cf6 50%, #ff00ff 100%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: `
                0 0 40px rgba(0, 240, 255, 0.5),
                0 0 80px rgba(139, 92, 246, 0.3)
              `,
              marginBottom: 20,
            }}
          >
            <svg
              width={vertical ? 60 : 80}
              height={vertical ? 60 : 80}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="6" y1="12" x2="10" y2="12" />
              <line x1="8" y1="10" x2="8" y2="14" />
              <line x1="15" y1="13" x2="15.01" y2="13" />
              <line x1="18" y1="11" x2="18.01" y2="11" />
              <rect x="2" y="6" width="20" height="12" rx="2" />
            </svg>
          </div>

          {/* Brand name */}
          <div
            style={{
              display: "flex",
              flexDirection: vertical ? "column" : "row",
              alignItems: "center",
              gap: vertical ? 4 : 12,
            }}
          >
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: vertical ? 36 : 56,
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              PHRESH
            </span>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: vertical ? 36 : 56,
                fontWeight: 700,
                color: "#00f0ff",
                textShadow: "0 0 20px #00f0ff, 0 0 40px #00f0ff",
              }}
            >
              TEAM
            </span>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: vertical ? 36 : 56,
                fontWeight: 700,
                color: "#8b5cf6",
                textShadow: "0 0 20px #8b5cf6, 0 0 40px #8b5cf6",
              }}
            >
              TV
            </span>
          </div>
        </div>

        {/* Taglines */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
          }}
        >
          {taglines.map((tagline, i) => {
            const tagOpacity = interpolate(
              frame,
              [tagline.delay, tagline.delay + 15],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const tagY = interpolate(
              frame,
              [tagline.delay, tagline.delay + 15],
              [10, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: vertical ? 16 : 20,
                  fontWeight: 600,
                  color: "#808090",
                  letterSpacing: "0.3em",
                  opacity: tagOpacity,
                  transform: `translateY(${tagY}px)`,
                }}
              >
                {tagline.text}
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div
          style={{
            marginTop: 20,
            transform: `scale(${ctaScale})`,
            opacity: ctaScale,
          }}
        >
          <div
            style={{
              padding: vertical ? "16px 40px" : "20px 60px",
              background: "linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%)",
              borderRadius: 12,
              boxShadow: `
                0 0 ${30 * ctaGlow}px rgba(0, 240, 255, 0.5),
                0 0 ${60 * ctaGlow}px rgba(139, 92, 246, 0.3)
              `,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: vertical ? 18 : 24,
                fontWeight: 700,
                color: "#0a0a0f",
                letterSpacing: "0.1em",
              }}
            >
              JOIN NOW
            </span>
          </div>
        </div>

        {/* Website URL */}
        <div
          style={{
            marginTop: 16,
            opacity: interpolate(frame, [80, 100], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: vertical ? 14 : 18,
              color: "#00f0ff",
              letterSpacing: "0.2em",
            }}
          >
            PHRESHTEAM.TV
          </span>
        </div>
      </div>

      {/* Particle effects */}
      {Array.from({ length: 12 }, (_, i) => {
        const particleDelay = 60 + (i % 4) * 15;
        const startX = (i % 4) * 25 + 12.5;
        const floatY = interpolate(
          (frame - particleDelay + i * 10) % 100,
          [0, 100],
          [120, -20],
          { extrapolateLeft: "clamp" }
        );
        const particleOpacity = interpolate(
          (frame - particleDelay + i * 10) % 100,
          [0, 20, 80, 100],
          [0, 0.6, 0.6, 0]
        );

        const colors = ["#00f0ff", "#8b5cf6", "#ff00ff", "#00ff88"];

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${startX}%`,
              bottom: `${floatY}%`,
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              borderRadius: "50%",
              backgroundColor: colors[i % 4],
              boxShadow: `0 0 10px ${colors[i % 4]}`,
              opacity: frame > particleDelay ? particleOpacity : 0,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
