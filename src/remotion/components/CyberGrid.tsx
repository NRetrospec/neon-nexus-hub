import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const CyberGrid: React.FC = () => {
  const frame = useCurrentFrame();

  // Subtle pulsing animation for the grid
  const gridOpacity = interpolate(
    Math.sin(frame * 0.02),
    [-1, 1],
    [0.03, 0.08]
  );

  // Slow vertical scroll effect
  const scrollY = (frame * 0.5) % 60;

  return (
    <AbsoluteFill
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 240, 255, ${gridOpacity}) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 240, 255, ${gridOpacity}) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        backgroundPosition: `0 ${scrollY}px`,
        transform: "perspective(500px) rotateX(60deg)",
        transformOrigin: "center 120%",
        opacity: 0.6,
      }}
    />
  );
};
