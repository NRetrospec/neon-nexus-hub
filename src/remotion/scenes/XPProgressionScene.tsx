import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { NeonText } from "../components/NeonText";

interface XPProgressionSceneProps {
  vertical?: boolean;
}

export const XPProgressionScene: React.FC<XPProgressionSceneProps> = ({
  vertical = false,
}) => {
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

  // Level number animation - counting up
  const levelNumber = Math.floor(
    interpolate(frame, [30, 80], [1, 42], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // XP bar fill animation
  const xpFill = interpolate(frame, [40, 100], [0, 85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow intensity increases as XP fills
  const glowIntensity = interpolate(xpFill, [0, 85], [0.3, 1]);

  // Level up flash effect when reaching certain point
  const levelUpFlash = interpolate(frame, [75, 80, 90], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Stats animation
  const statsScale = spring({
    frame: frame - 50,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const stats = [
    { label: "Total XP", value: "42,850", color: "#00f0ff" },
    { label: "Quests Done", value: "127", color: "#8b5cf6" },
    { label: "Streak", value: "14 Days", color: "#ff6b00" },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: sceneOpacity * exitOpacity,
      }}
    >
      {/* Level up flash overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(0, 240, 255, ${levelUpFlash * 0.3})`,
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: vertical ? 80 : 60,
          textAlign: "center",
        }}
      >
        <NeonText fontSize={vertical ? 36 : 56} color="#8b5cf6" animate="scale" delay={10}>
          LEVEL UP
        </NeonText>
      </div>

      {/* Main Level Display */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 30,
        }}
      >
        {/* Level Badge */}
        <div
          style={{
            position: "relative",
            width: vertical ? 180 : 240,
            height: vertical ? 180 : 240,
          }}
        >
          {/* Outer ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "3px solid #00f0ff30",
              boxShadow: `
                0 0 ${20 * glowIntensity}px #00f0ff40,
                inset 0 0 ${30 * glowIntensity}px #00f0ff20
              `,
            }}
          />

          {/* Progress ring */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              transform: "rotate(-90deg)",
            }}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="4"
              strokeDasharray={`${xpFill * 2.83} 283`}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 ${10 * glowIntensity}px #00f0ff)`,
              }}
            />
          </svg>

          {/* Level number */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 14,
                color: "#808090",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Level
            </span>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: vertical ? 64 : 80,
                fontWeight: 700,
                color: "#ffffff",
                textShadow: `
                  0 0 20px rgba(0, 240, 255, ${glowIntensity}),
                  0 0 40px rgba(0, 240, 255, ${glowIntensity * 0.5})
                `,
                lineHeight: 1,
              }}
            >
              {levelNumber}
            </span>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div
          style={{
            width: vertical ? 280 : 500,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 14,
                color: "#808090",
              }}
            >
              Progress to Level {levelNumber + 1}
            </span>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: "#00f0ff",
              }}
            >
              {Math.floor(xpFill)}%
            </span>
          </div>

          {/* Bar container */}
          <div
            style={{
              height: 16,
              backgroundColor: "rgba(0, 240, 255, 0.1)",
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid #00f0ff30",
            }}
          >
            {/* Fill */}
            <div
              style={{
                height: "100%",
                width: `${xpFill}%`,
                background: "linear-gradient(90deg, #00f0ff, #8b5cf6)",
                borderRadius: 8,
                boxShadow: `
                  0 0 ${20 * glowIntensity}px #00f0ff,
                  inset 0 1px 0 rgba(255,255,255,0.3)
                `,
                position: "relative",
              }}
            >
              {/* Shine animation */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "50%",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.3), transparent)",
                  borderRadius: "8px 8px 0 0",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 12,
                color: "#00f0ff",
              }}
            >
              850 XP
            </span>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 12,
                color: "#606070",
              }}
            >
              1,000 XP
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "flex",
            flexDirection: vertical ? "column" : "row",
            gap: vertical ? 16 : 40,
            marginTop: 20,
            transform: `scale(${statsScale})`,
            opacity: statsScale,
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: "16px 24px",
                backgroundColor: "rgba(255,255,255,0.02)",
                borderRadius: 12,
                border: `1px solid ${stat.color}30`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: vertical ? 24 : 32,
                  fontWeight: 700,
                  color: stat.color,
                  textShadow: `0 0 15px ${stat.color}80`,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 12,
                  color: "#808090",
                  letterSpacing: "0.1em",
                  marginTop: 4,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
