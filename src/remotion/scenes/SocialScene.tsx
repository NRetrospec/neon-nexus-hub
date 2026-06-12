import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { NeonText } from "../components/NeonText";
import { GlowingCard } from "../components/GlowingCard";

interface SocialSceneProps {
  vertical?: boolean;
}

export const SocialScene: React.FC<SocialSceneProps> = ({ vertical = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene entrance/exit
  const sceneOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const exitOpacity = interpolate(frame, [150, 165], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Features data
  const features = [
    {
      icon: "👥",
      title: "Friends",
      description: "Connect with gamers",
      color: "#00f0ff",
    },
    {
      icon: "📊",
      title: "Polls",
      description: "Vote on hot topics",
      color: "#8b5cf6",
    },
    {
      icon: "💬",
      title: "Chat",
      description: "Real-time messaging",
      color: "#ff6b00",
    },
    {
      icon: "🏆",
      title: "Achievements",
      description: "Show off your badges",
      color: "#00ff88",
    },
  ];

  // Animated connection lines between features
  const connectionProgress = interpolate(frame, [60, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: sceneOpacity * exitOpacity,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: vertical ? 60 : 50,
          textAlign: "center",
        }}
      >
        <NeonText fontSize={vertical ? 36 : 56} color="#ff00ff" animate="scale" delay={10}>
          COMMUNITY
        </NeonText>
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: vertical ? 16 : 20,
            color: "#808090",
            marginTop: 8,
            letterSpacing: "0.2em",
            opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          CONNECT • SHARE • GROW
        </div>
      </div>

      {/* Features Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: vertical ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: vertical ? 16 : 24,
          padding: vertical ? 20 : 40,
          marginTop: vertical ? 80 : 40,
        }}
      >
        {features.map((feature, i) => {
          const cardDelay = 25 + i * 12;
          const cardScale = spring({
            frame: frame - cardDelay,
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          // Pulsing glow for each card
          const glowPulse = interpolate(
            Math.sin((frame + i * 20) * 0.08),
            [-1, 1],
            [0.5, 1]
          );

          return (
            <div
              key={i}
              style={{
                width: vertical ? 140 : 180,
                padding: vertical ? 20 : 28,
                backgroundColor: "rgba(15, 15, 26, 0.9)",
                borderRadius: 16,
                border: `1px solid ${feature.color}40`,
                boxShadow: `0 0 ${20 * glowPulse}px ${feature.color}30`,
                textAlign: "center",
                transform: `scale(${cardScale})`,
                opacity: cardScale,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  fontSize: vertical ? 36 : 48,
                  marginBottom: 12,
                  filter: `drop-shadow(0 0 10px ${feature.color})`,
                }}
              >
                {feature.icon}
              </div>

              {/* Title */}
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: vertical ? 14 : 18,
                  fontWeight: 600,
                  color: feature.color,
                  textShadow: `0 0 10px ${feature.color}80`,
                  marginBottom: 8,
                }}
              >
                {feature.title}
              </div>

              {/* Description */}
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: vertical ? 12 : 14,
                  color: "#808090",
                }}
              >
                {feature.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Animated user avatars floating around */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + frame * 0.01;
        const radius = vertical ? 180 : 320;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.4;

        const avatarOpacity = interpolate(frame, [50 + i * 5, 70 + i * 5], [0, 0.8], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const avatars = ["🎮", "🎯", "🚀", "⭐", "💎", "🔮"];

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              width: vertical ? 40 : 50,
              height: vertical ? 40 : 50,
              borderRadius: "50%",
              backgroundColor: "rgba(15, 15, 26, 0.9)",
              border: "2px solid #00f0ff40",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: vertical ? 20 : 24,
              opacity: avatarOpacity,
              boxShadow: "0 0 15px rgba(0, 240, 255, 0.3)",
            }}
          >
            {avatars[i]}
          </div>
        );
      })}

      {/* Connection lines animation */}
      <svg
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Animated connection lines */}
        {[...Array(3)].map((_, i) => {
          const lineOpacity = interpolate(
            frame,
            [80 + i * 10, 100 + i * 10],
            [0, 0.4],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <line
              key={i}
              x1={`${30 + i * 15}%`}
              y1="50%"
              x2={`${55 + i * 15}%`}
              y2="50%"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              opacity={lineOpacity}
              strokeDasharray={`${connectionProgress * 200} 200`}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
