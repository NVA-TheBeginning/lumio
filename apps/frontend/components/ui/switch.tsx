"use client";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: "sm" | "md" | "lg";
}

export const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, size = "md", ...props }, ref) => {
    const rootSize = {
      sm: "h-4 w-8",
      md: "h-5 w-10",
      lg: "h-6 w-12",
    }[size];

    const thumbSize = {
      sm: "h-3 w-3 translate-x-0.5 data-[state=checked]:translate-x-[1.375rem]",
      md: "h-4 w-4 translate-x-0.5 data-[state=checked]:translate-x-[1.625rem]",
      lg: "h-5 w-5 translate-x-0.5 data-[state=checked]:translate-x-[2rem]",
    }[size];

    return (
      <SwitchPrimitives.Root
        ref={ref}
        className={cn(
          "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-muted data-[state=checked]:bg-primary",
          rootSize,
          className,
        )}
        {...props}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block rounded-full bg-background shadow-md ring-0 transition-transform",
            thumbSize,
          )}
        />
      </SwitchPrimitives.Root>
    );
  },
);
Switch.displayName = "Switch";

export default Switch;
