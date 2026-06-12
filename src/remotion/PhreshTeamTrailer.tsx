import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { QuestsScene } from "./scenes/QuestsScene";
import { XPProgressionScene } from "./scenes/XPProgressionScene";
import { LeaderboardScene } from "./scenes/LeaderboardScene";
import { SocialScene } from "./scenes/SocialScene";
import { OutroScene } from "./scenes/OutroScene";
import { CyberGrid } from "./components/CyberGrid";
import { GlitchTransition } from "./components/GlitchTransition";

interface PhreshTeamTrailerProps {
  vertical?: boolean;
}

export const PhreshTeamTrailer: React.FC<PhreshTeamTrailerProps> = ({
  vertical = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene timing (in frames at 30fps)
  const INTRO_START = 0;
  const INTRO_END = 150; // 0-5 sec
  const QUESTS_START = 135; // slight overlap for transition
  const QUESTS_END = 300; // 5-10 sec
  const XP_START = 285;
  const XP_END = 450; // 10-15 sec
  const LEADERBOARD_START = 435;
  const LEADERBOARD_END = 600; // 15-20 sec
  const SOCIAL_START = 585;
  const SOCIAL_END = 750; // 20-25 sec
  const OUTRO_START = 735;
  const OUTRO_END = 900; // 25-30 sec

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0f",
        overflow: "hidden",
      }}
    >
      {/* Animated cyber grid background */}
      <CyberGrid />

      {/* Ambient glow overlay */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(0, 240, 255, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(255, 0, 255, 0.05) 0%, transparent 60%)
          `,
          pointerEvents: "none",
        }}
      />

      {/* Scene: Intro with logo reveal */}
      <Sequence from={INTRO_START} durationInFrames={INTRO_END - INTRO_START}>
        <IntroScene vertical={vertical} />
      </Sequence>

      {/* Glitch transition to Quests */}
      <Sequence from={INTRO_END - 15} durationInFrames={30}>
        <GlitchTransition />
      </Sequence>

      {/* Scene: Quests showcase */}
      <Sequence from={QUESTS_START} durationInFrames={QUESTS_END - QUESTS_START}>
        <QuestsScene vertical={vertical} />
      </Sequence>

      {/* Glitch transition to XP */}
      <Sequence from={QUESTS_END - 15} durationInFrames={30}>
        <GlitchTransition />
      </Sequence>

      {/* Scene: XP & Progression */}
      <Sequence from={XP_START} durationInFrames={XP_END - XP_START}>
        <XPProgressionScene vertical={vertical} />
      </Sequence>

      {/* Glitch transition to Leaderboard */}
      <Sequence from={XP_END - 15} durationInFrames={30}>
        <GlitchTransition />
      </Sequence>

      {/* Scene: Leaderboard */}
      <Sequence from={LEADERBOARD_START} durationInFrames={LEADERBOARD_END - LEADERBOARD_START}>
        <LeaderboardScene vertical={vertical} />
      </Sequence>

      {/* Glitch transition to Social */}
      <Sequence from={LEADERBOARD_END - 15} durationInFrames={30}>
        <GlitchTransition />
      </Sequence>

      {/* Scene: Social & Community */}
      <Sequence from={SOCIAL_START} durationInFrames={SOCIAL_END - SOCIAL_START}>
        <SocialScene vertical={vertical} />
      </Sequence>

      {/* Glitch transition to Outro */}
      <Sequence from={SOCIAL_END - 15} durationInFrames={30}>
        <GlitchTransition />
      </Sequence>

      {/* Scene: Call to Action Outro */}
      <Sequence from={OUTRO_START} durationInFrames={OUTRO_END - OUTRO_START}>
        <OutroScene vertical={vertical} />
      </Sequence>

      {/* Scanline overlay for CRT effect */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.15) 2px,
            rgba(0, 0, 0, 0.15) 4px
          )`,
          pointerEvents: "none",
          opacity: 0.5,
        }}
      />

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
