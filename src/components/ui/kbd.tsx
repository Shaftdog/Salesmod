import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const kbdVariants = cva(
  "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100",
  {
    variants: {
      variant: {
        default: "",
        outline: "border-input bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface KbdProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof kbdVariants> {}

const Kbd = React.forwardRef<HTMLSpanElement, KbdProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <kbd
        className={cn(kbdVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Kbd.displayName = "Kbd"

export { Kbd, kbdVariants }
