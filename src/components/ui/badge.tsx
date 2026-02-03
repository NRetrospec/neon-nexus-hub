import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border/60 text-foreground bg-transparent",
        // Glow variant for achievements and status indicators
        glow: "border-primary/40 bg-primary/10 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]",
        // Success variant
        success: "border-transparent bg-neon-green/20 text-neon-green",
        // Warning variant
        warning: "border-transparent bg-neon-orange/20 text-neon-orange",
        // Muted/subtle variant
        muted: "border-border/40 bg-muted/50 text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
