import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import { NeonText } from "../components/NeonText";

interface IntroSceneProps {
  vertical?: boolean;
}

export const IntroScene: React.FC<IntroSceneProps> = ({ vertical = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const logoRotation = interpolate(frame, [20, 60], [180, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow burst on logo appear
  const glowBurst = interpolate(frame, [40, 60, 90], [0, 1, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Text animations with stagger
  const phreshOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const teamOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tvOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline animation
  const taglineOpacity = interpolate(frame, [100, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [100, 120], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Particle burst effect
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const distance = interpolate(frame, [40, 80], [0, 300], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const particleOpacity = interpolate(frame, [40, 60, 100], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      opacity: particleOpacity,
      size: 4 + (i % 3) * 2,
      color: i % 2 === 0 ? "#00f0ff" : "#8b5cf6",
    };
  });

  // Zoom out effect near end
  const sceneScale = interpolate(frame, [130, 150], [1, 0.95], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sceneOpacity = interpolate(frame, [140, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${sceneScale})`,
        opacity: sceneOpacity,
      }}
    >
      {/* Particle burst */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}, 0 0 20px ${p.color}`,
            transform: `translate(${p.x}px, ${p.y}px)`,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Central glow burst */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0, 240, 255, ${glowBurst * 0.5}) 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Logo Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Animated Logo */}
        <div
          style={{
            width: vertical ? 150 : 200,
            height: vertical ? 150 : 200,
            borderRadius: 24,
            background: "linear-gradient(135deg, #00f0ff 0%, #8b5cf6 50%, #ff00ff 100%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: `scale(${logoScale}) rotateY(${logoRotation}deg)`,
            boxShadow: `
              0 0 ${30 + glowBurst * 50}px rgba(0, 240, 255, ${0.5 + glowBurst * 0.5}),
              0 0 ${60 + glowBurst * 100}px rgba(139, 92, 246, ${0.3 + glowBurst * 0.4})
            `,
          }}
        >
          {/* Gamepad icon */}
          <svg
            width={vertical ? 80 : 100}
            height={vertical ? 80 : 100}
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

        {/* Brand Text */}
        <div
          style={{
            display: "flex",
            flexDirection: vertical ? "column" : "row",
            alignItems: "center",
            gap: vertical ? 8 : 16,
            marginTop: 20,
          }}
        >
          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: vertical ? 48 : 72,
              fontWeight: 700,
              color: "#ffffff",
              textShadow: "0 0 20px rgba(255,255,255,0.5)",
              opacity: phreshOpacity,
              letterSpacing: "0.05em",
            }}
          >
            PHRESH
          </span>
          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: vertical ? 48 : 72,
              fontWeight: 700,
              color: "#00f0ff",
              textShadow: `
                0 0 10px #00f0ff,
                0 0 20px #00f0ff,
                0 0 40px #00f0ff
              `,
              opacity: teamOpacity,
              letterSpacing: "0.05em",
            }}
          >
            TEAM
          </span>
          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: vertical ? 48 : 72,
              fontWeight: 700,
              color: "#8b5cf6",
              textShadow: `
                0 0 10px #8b5cf6,
                0 0 20px #8b5cf6,
                0 0 40px #8b5cf6
              `,
              opacity: tvOpacity,
              letterSpacing: "0.05em",
            }}
          >
            TV
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            marginTop: 20,
          }}
        >
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: vertical ? 24 : 32,
              fontWeight: 600,
              color: "#a0a0b0",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            Level Up Your Experience
          </span>
        </div>
      </div>

      {/* Corner accents */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          width: 60,
          height: 60,
          borderLeft: "2px solid #00f0ff40",
          borderTop: "2px solid #00f0ff40",
          opacity: interpolate(frame, [0, 30], [0, 1]),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          width: 60,
          height: 60,
          borderRight: "2px solid #8b5cf640",
          borderBottom: "2px solid #8b5cf640",
          opacity: interpolate(frame, [0, 30], [0, 1]),
        }}
      />
    </AbsoluteFill>
  );
};
