import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-muted/50 border border-border/50",
  {
    variants: {
      size: {
        sm: "h-2",
        default: "h-3",
        lg: "h-4",
        xl: "h-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  showTicks?: boolean;
  showShine?: boolean;
  glowIntensity?: "none" | "low" | "medium" | "high";
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, size, showTicks = false, showShine = true, glowIntensity = "medium", ...props }, ref) => {
  const currentValue = value || 0;

  // Dynamic glow based on progress and intensity setting
  const getGlowStyle = () => {
    if (glowIntensity === "none") return {};

    const baseIntensity = {
      low: 0.2,
      medium: 0.4,
      high: 0.6,
    }[glowIntensity];

    // Intensify glow as progress approaches 100%
    const progressMultiplier = 1 + (currentValue / 100) * 0.5;
    const intensity = baseIntensity * progressMultiplier;

    return {
      boxShadow: `0 0 ${8 + currentValue / 10}px hsl(var(--primary) / ${intensity}),
                  0 0 ${16 + currentValue / 5}px hsl(var(--primary) / ${intensity * 0.5})`,
    };
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ size }), className)}
      {...props}
    >
      {/* Tick marks */}
      {showTicks && (
        <div className="absolute inset-0 flex justify-between px-[1px] pointer-events-none z-10">
          {[25, 50, 75].map((tick) => (
            <div
              key={tick}
              className={cn(
                "w-[1px] h-full transition-colors duration-300",
                currentValue >= tick
                  ? "bg-primary-foreground/30"
                  : "bg-muted-foreground/20"
              )}
              style={{ marginLeft: `${tick}%`, position: 'absolute' }}
            />
          ))}
        </div>
      )}

      {/* Progress fill */}
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full flex-1 rounded-full transition-all duration-500 ease-out relative",
          "bg-gradient-to-r from-primary via-primary to-accent"
        )}
        style={{
          width: `${currentValue}%`,
          ...getGlowStyle(),
        }}
      >
        {/* Animated shine effect */}
        {showShine && currentValue > 0 && (
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ opacity: currentValue > 10 ? 1 : 0 }}
          >
            <div
              className="absolute inset-0 -translate-x-full animate-[shine_3s_ease-in-out_infinite]"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              }}
            />
          </div>
        )}

        {/* Leading edge glow */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(var(--primary-foreground) / 0.4))',
          }}
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

// XP-specific progress component with level display
interface XPProgressProps extends ProgressProps {
  currentXP: number;
  xpForNextLevel: number;
  currentLevel: number;
  showLabels?: boolean;
}

const XPProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  XPProgressProps
>(({ currentXP, xpForNextLevel, currentLevel, showLabels = true, className, ...props }, ref) => {
  const progress = (currentXP / xpForNextLevel) * 100;
  const isNearLevelUp = progress >= 80;

  return (
    <div className={cn("space-y-2", className)}>
      {showLabels && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-gaming font-bold transition-all duration-300",
                isNearLevelUp ? "text-primary animate-pulse" : "text-muted-foreground"
              )}
            >
              LVL {currentLevel}
            </span>
            {isNearLevelUp && (
              <span className="text-xs font-cyber text-primary/80 animate-pulse">
                Almost there!
              </span>
            )}
          </div>
          <span className="font-cyber text-muted-foreground">
            <span className="text-primary font-medium">{currentXP.toLocaleString()}</span>
            <span className="text-muted-foreground/60"> / {xpForNextLevel.toLocaleString()} XP</span>
          </span>
        </div>
      )}
      <Progress
        ref={ref}
        value={progress}
        showTicks={true}
        showShine={true}
        glowIntensity={isNearLevelUp ? "high" : "medium"}
        size="lg"
        {...props}
      />
    </div>
  );
});
XPProgress.displayName = "XPProgress";

export { Progress, XPProgress };
