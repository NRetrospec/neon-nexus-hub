import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { NeonText } from "../components/NeonText";
import { GlowingCard } from "../components/GlowingCard";

interface QuestsSceneProps {
  vertical?: boolean;
}

export const QuestsScene: React.FC<QuestsSceneProps> = ({ vertical = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene entrance
  const sceneOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Scene exit
  const exitOpacity = interpolate(frame, [150, 165], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title animation
  const titleY = interpolate(frame, [10, 30], [-50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Quest cards data
  const quests = [
    {
      title: "Complete Daily Challenge",
      xp: 500,
      difficulty: "EPIC",
      color: "#8b5cf6",
      progress: 75,
    },
    {
      title: "Watch 3 Streams",
      xp: 200,
      difficulty: "EASY",
      color: "#00ff88",
      progress: 100,
    },
    {
      title: "Win Tournament Match",
      xp: 1000,
      difficulty: "LEGENDARY",
      color: "#ff6b00",
      progress: 30,
    },
  ];

  // Flying quest card animation
  const flyingCardX = interpolate(
    frame,
    [60, 120],
    [vertical ? 0 : 800, vertical ? 0 : -800],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

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
          top: vertical ? 100 : 80,
          left: 0,
          right: 0,
          textAlign: "center",
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
        }}
      >
        <NeonText fontSize={vertical ? 42 : 64} color="#00f0ff" animate="scale" delay={15}>
          DAILY QUESTS
        </NeonText>
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: vertical ? 18 : 24,
            color: "#808090",
            marginTop: 10,
            letterSpacing: "0.2em",
          }}
        >
          EARN XP • UNLOCK REWARDS • LEVEL UP
        </div>
      </div>

      {/* Quest Cards Container */}
      <div
        style={{
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          gap: vertical ? 20 : 30,
          marginTop: vertical ? 120 : 60,
          padding: 20,
        }}
      >
        {quests.map((quest, i) => (
          <GlowingCard
            key={i}
            delay={30 + i * 15}
            width={vertical ? 320 : 350}
            glowColor={quest.color}
            animate={vertical ? "scale" : "slideUp"}
          >
            {/* Difficulty Badge */}
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 20,
                backgroundColor: `${quest.color}20`,
                border: `1px solid ${quest.color}60`,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: quest.color,
                  letterSpacing: "0.1em",
                }}
              >
                {quest.difficulty}
              </span>
            </div>

            {/* Quest Title */}
            <h3
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "#ffffff",
                marginBottom: 16,
              }}
            >
              {quest.title}
            </h3>

            {/* Progress Bar */}
            <div
              style={{
                height: 8,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${interpolate(
                    frame - (30 + i * 15),
                    [0, 40],
                    [0, quest.progress],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  )}%`,
                  background: `linear-gradient(90deg, ${quest.color}, ${quest.color}aa)`,
                  boxShadow: `0 0 10px ${quest.color}`,
                  borderRadius: 4,
                }}
              />
            </div>

            {/* XP Reward */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 14,
                  color: "#808090",
                }}
              >
                {quest.progress}% Complete
              </span>
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#00f0ff",
                  textShadow: "0 0 10px #00f0ff",
                }}
              >
                +{quest.xp} XP
              </span>
            </div>
          </GlowingCard>
        ))}
      </div>

      {/* Floating XP particles */}
      {Array.from({ length: 8 }, (_, i) => {
        const startY = 600 + (i % 3) * 100;
        const x = 200 + i * 180;
        const floatY = interpolate(
          (frame + i * 20) % 120,
          [0, 120],
          [startY, startY - 400]
        );
        const particleOpacity = interpolate(
          (frame + i * 20) % 120,
          [0, 30, 90, 120],
          [0, 0.8, 0.8, 0]
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: floatY,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: "#00f0ff",
              textShadow: "0 0 10px #00f0ff",
              opacity: particleOpacity,
            }}
          >
            +XP
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
