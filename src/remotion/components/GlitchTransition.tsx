import { AbsoluteFill, useCurrentFrame, interpolate, random } from "remotion";

export const GlitchTransition: React.FC = () => {
  const frame = useCurrentFrame();

  // Glitch intensity peaks in the middle
  const intensity = interpolate(frame, [0, 15, 30], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Generate glitch slices
  const slices = Array.from({ length: 8 }, (_, i) => {
    const seed = i * 1000 + Math.floor(frame / 2);
    const offsetX = random(seed) * 40 - 20;
    const height = random(seed + 1) * 15 + 5;
    const top = random(seed + 2) * 100;
    const hue = random(seed + 3) > 0.5 ? 0 : 180; // Red or cyan shift

    return {
      offsetX: offsetX * intensity,
      height,
      top,
      hue,
      opacity: intensity * 0.8,
    };
  });

  // Flash effect
  const flash = interpolate(frame, [12, 15, 18], [0, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Glitch slices */}
      {slices.map((slice, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${slice.top}%`,
            left: 0,
            right: 0,
            height: `${slice.height}%`,
            transform: `translateX(${slice.offsetX}px)`,
            background: `linear-gradient(90deg,
              transparent 0%,
              hsla(${slice.hue}, 100%, 50%, ${slice.opacity * 0.3}) 20%,
              hsla(${slice.hue}, 100%, 50%, ${slice.opacity * 0.5}) 50%,
              hsla(${slice.hue}, 100%, 50%, ${slice.opacity * 0.3}) 80%,
              transparent 100%
            )`,
            mixBlendMode: "screen",
          }}
        />
      ))}

      {/* Chromatic aberration lines */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent ${4 - intensity * 2}px,
            rgba(0, 255, 255, ${intensity * 0.1}) ${4 - intensity * 2}px,
            rgba(0, 255, 255, ${intensity * 0.1}) ${8 - intensity * 4}px
          )`,
        }}
      />

      {/* White flash */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(255, 255, 255, ${flash})`,
        }}
      />

      {/* Noise overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: intensity * 0.15,
          mixBlendMode: "overlay",
        }}
      />
    </AbsoluteFill>
  );
};
