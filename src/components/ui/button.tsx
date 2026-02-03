import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 will-change-transform",
  {
    variants: {
      variant: {
        // Primary - solid filled button with subtle glow
        default: "bg-primary text-primary-foreground font-gaming uppercase tracking-wide hover:bg-primary/90 shadow-[0_0_10px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]",

        // Secondary - outlined with subtle hover glow (replaces neon, glow, outline)
        secondary: "border border-primary/40 bg-transparent text-primary font-cyber hover:bg-primary/10 hover:border-primary/70 hover:shadow-[0_0_12px_hsl(var(--primary)/0.2)]",

        // Ghost - minimal, text only
        ghost: "text-muted-foreground hover:text-foreground hover:bg-muted/30",

        // Destructive - for dangerous actions
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",

        // Link - inline text link style
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",

        // Legacy variants (mapped to new system for backward compatibility)
        // TODO: Migrate usages and remove these
        neon: "border border-primary/40 bg-transparent text-primary font-cyber hover:bg-primary/10 hover:border-primary/70 hover:shadow-[0_0_12px_hsl(var(--primary)/0.2)]",
        cyber: "bg-primary text-primary-foreground font-gaming uppercase tracking-wide hover:bg-primary/90 shadow-[0_0_10px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]",
        hero: "bg-primary text-primary-foreground font-gaming uppercase tracking-wider hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)]",
        glow: "border border-border bg-card/50 text-foreground font-cyber hover:border-primary/50 hover:text-primary hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]",
        outline: "border border-border bg-transparent text-foreground hover:bg-muted/30 hover:border-primary/30",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6",
        xl: "h-12 rounded-lg px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
