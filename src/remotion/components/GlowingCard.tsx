import {
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import React from "react";

interface GlowingCardProps {
  children: React.ReactNode;
  delay?: number;
  width?: number | string;
  height?: number | string;
  glowColor?: string;
  animate?: "slideUp" | "slideLeft" | "slideRight" | "scale" | "fade";
}

export const GlowingCard: React.FC<GlowingCardProps> = ({
  children,
  delay = 0,
  width = 400,
  height = "auto",
  glowColor = "#00f0ff",
  animate = "slideUp",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const springValue = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  let transform = "";
  let opacity = 1;

  switch (animate) {
    case "slideUp":
      transform = `translateY(${interpolate(springValue, [0, 1], [100, 0])}px)`;
      opacity = springValue;
      break;
    case "slideLeft":
      transform = `translateX(${interpolate(springValue, [0, 1], [100, 0])}px)`;
      opacity = springValue;
      break;
    case "slideRight":
      transform = `translateX(${interpolate(springValue, [0, 1], [-100, 0])}px)`;
      opacity = springValue;
      break;
    case "scale":
      transform = `scale(${interpolate(springValue, [0, 1], [0.8, 1])})`;
      opacity = springValue;
      break;
    case "fade":
      opacity = springValue;
      break;
  }

  // Animated border glow
  const glowPulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.5, 1]);

  return (
    <div
      style={{
        width,
        height,
        background: "linear-gradient(145deg, rgba(15, 15, 26, 0.95), rgba(10, 10, 20, 0.98))",
        borderRadius: 16,
        border: `1px solid ${glowColor}40`,
        boxShadow: `
          0 0 ${20 * glowPulse}px ${glowColor}30,
          0 0 ${40 * glowPulse}px ${glowColor}15,
          inset 0 1px 0 rgba(255,255,255,0.05)
        `,
        padding: 24,
        transform,
        opacity,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Shine effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${glowColor}60, transparent)`,
        }}
      />
      {children}
    </div>
  );
};
