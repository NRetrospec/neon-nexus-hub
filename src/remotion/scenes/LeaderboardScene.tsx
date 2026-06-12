import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { NeonText } from "../components/NeonText";

interface LeaderboardSceneProps {
  vertical?: boolean;
}

export const LeaderboardScene: React.FC<LeaderboardSceneProps> = ({
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

  // Leaderboard data
  const players = [
    { rank: 1, name: "xNightmare", level: 67, xp: "156,420", avatar: "👑" },
    { rank: 2, name: "CyberPhoenix", level: 64, xp: "148,900", avatar: "🔥" },
    { rank: 3, name: "NeonHunter", level: 61, xp: "142,350", avatar: "⚡" },
    { rank: 4, name: "GhostByte", level: 58, xp: "135,200", avatar: "👻" },
    { rank: 5, name: "PixelStorm", level: 55, xp: "128,750", avatar: "🌀" },
  ];

  const rankColors = ["#ffd700", "#c0c0c0", "#cd7f32", "#00f0ff", "#00f0ff"];

  // Podium animation
  const podiumScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, stiffness: 80 },
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
        <NeonText fontSize={vertical ? 36 : 56} color="#ffd700" animate="scale" delay={10}>
          LEADERBOARD
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
          COMPETE • DOMINATE • REIGN
        </div>
      </div>

      {/* Podium for top 3 */}
      {!vertical && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 20,
            marginTop: 40,
            transform: `scale(${podiumScale})`,
            opacity: podiumScale,
          }}
        >
          {/* 2nd Place */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 48,
                marginBottom: 10,
              }}
            >
              {players[1].avatar}
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 16,
                color: "#ffffff",
                marginBottom: 8,
              }}
            >
              {players[1].name}
            </div>
            <div
              style={{
                width: 120,
                height: 100,
                background: "linear-gradient(180deg, #c0c0c0 0%, #808080 100%)",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 0 20px rgba(192, 192, 192, 0.3)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#1a1a2e",
                }}
              >
                2
              </span>
            </div>
          </div>

          {/* 1st Place */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 64,
                marginBottom: 10,
                filter: "drop-shadow(0 0 20px gold)",
              }}
            >
              {players[0].avatar}
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 20,
                color: "#ffd700",
                textShadow: "0 0 10px #ffd700",
                marginBottom: 8,
              }}
            >
              {players[0].name}
            </div>
            <div
              style={{
                width: 140,
                height: 140,
                background: "linear-gradient(180deg, #ffd700 0%, #b8860b 100%)",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 0 40px rgba(255, 215, 0, 0.5)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#1a1a2e",
                }}
              >
                1
              </span>
            </div>
          </div>

          {/* 3rd Place */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 48,
                marginBottom: 10,
              }}
            >
              {players[2].avatar}
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 16,
                color: "#ffffff",
                marginBottom: 8,
              }}
            >
              {players[2].name}
            </div>
            <div
              style={{
                width: 120,
                height: 80,
                background: "linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 0 20px rgba(205, 127, 50, 0.3)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#1a1a2e",
                }}
              >
                3
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div
        style={{
          position: "absolute",
          bottom: vertical ? 100 : 80,
          left: "50%",
          transform: "translateX(-50%)",
          width: vertical ? "90%" : 700,
        }}
      >
        {players.map((player, i) => {
          const rowDelay = 40 + i * 10;
          const rowOpacity = interpolate(frame, [rowDelay, rowDelay + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const rowX = interpolate(frame, [rowDelay, rowDelay + 15], [50, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                padding: vertical ? "10px 16px" : "12px 20px",
                marginBottom: 8,
                backgroundColor: i === 0 ? "rgba(255, 215, 0, 0.1)" : "rgba(255, 255, 255, 0.02)",
                borderRadius: 8,
                border: `1px solid ${rankColors[i]}30`,
                opacity: rowOpacity,
                transform: `translateX(${rowX}px)`,
              }}
            >
              {/* Rank */}
              <div
                style={{
                  width: 40,
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: vertical ? 18 : 24,
                  fontWeight: 700,
                  color: rankColors[i],
                  textShadow: i < 3 ? `0 0 10px ${rankColors[i]}` : "none",
                }}
              >
                #{player.rank}
              </div>

              {/* Avatar */}
              <div
                style={{
                  width: vertical ? 32 : 40,
                  height: vertical ? 32 : 40,
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: vertical ? 18 : 24,
                  marginRight: 12,
                }}
              >
                {player.avatar}
              </div>

              {/* Name */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: vertical ? 14 : 16,
                    color: "#ffffff",
                  }}
                >
                  {player.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 12,
                    color: "#808090",
                  }}
                >
                  Level {player.level}
                </div>
              </div>

              {/* XP */}
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: vertical ? 14 : 16,
                  fontWeight: 700,
                  color: "#00f0ff",
                  textShadow: "0 0 10px #00f0ff80",
                }}
              >
                {player.xp} XP
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
