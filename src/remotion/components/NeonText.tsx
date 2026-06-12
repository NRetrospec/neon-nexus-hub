import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import React from "react";

interface NeonTextProps {
  children: React.ReactNode;
  color?: string;
  fontSize?: number;
  delay?: number;
  glowIntensity?: number;
  fontFamily?: string;
  animate?: "fade" | "typewriter" | "glitch" | "scale";
}

export const NeonText: React.FC<NeonTextProps> = ({
  children,
  color = "#00f0ff",
  fontSize = 72,
  delay = 0,
  glowIntensity = 1,
  fontFamily = "'Orbitron', sans-serif",
  animate = "fade",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  // Animation values based on type
  let opacity = 1;
  let scale = 1;
  let translateY = 0;
  let clipPath = "inset(0 0 0 0)";

  switch (animate) {
    case "fade":
      opacity = interpolate(adjustedFrame, [0, 20], [0, 1], {
        extrapolateRight: "clamp",
      });
      translateY = interpolate(adjustedFrame, [0, 20], [30, 0], {
        extrapolateRight: "clamp",
      });
      break;

    case "scale":
      const scaleSpring = spring({
        frame: adjustedFrame,
        fps,
        config: { damping: 12, stiffness: 100 },
      });
      scale = interpolate(scaleSpring, [0, 1], [0.5, 1]);
      opacity = interpolate(scaleSpring, [0, 1], [0, 1]);
      break;

    case "typewriter":
      if (typeof children === "string") {
        const progress = interpolate(
          adjustedFrame,
          [0, children.length * 2],
          [0, 100],
          { extrapolateRight: "clamp" }
        );
        clipPath = `inset(0 ${100 - progress}% 0 0)`;
      }
      break;

    case "glitch":
      opacity = adjustedFrame > 0 ? 1 : 0;
      const glitchOffset =
        adjustedFrame < 15
          ? Math.sin(adjustedFrame * 2) * (15 - adjustedFrame)
          : 0;
      translateY = glitchOffset;
      break;
  }

  // Pulsing glow effect
  const glowPulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.7, 1]);
  const glowSize = 20 * glowIntensity * glowPulse;

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight: 700,
        color,
        textShadow: `
          0 0 ${glowSize * 0.5}px ${color},
          0 0 ${glowSize}px ${color},
          0 0 ${glowSize * 1.5}px ${color},
          0 0 ${glowSize * 2}px ${color}80
        `,
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        clipPath,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
};
