import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 capitalize",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        new: "border-transparent bg-status-new text-status-new-foreground hover:bg-status-new/80",
        assigned: "border-transparent bg-status-assigned text-status-assigned-foreground hover:bg-status-assigned/80",
        scheduled: "border-transparent bg-status-scheduled text-status-scheduled-foreground hover:bg-status-scheduled/80",
        "in_progress": "border-transparent bg-status-in-progress text-status-in-progress-foreground hover:bg-status-in-progress/80",
        "in_review": "border-transparent bg-status-in-review text-status-in-review-foreground hover:bg-status-in-review/80",
        completed: "border-transparent bg-status-completed text-status-completed-foreground hover:bg-status-completed/80",
        revisions: "border-transparent bg-status-revisions text-status-revisions-foreground hover:bg-status-revisions/80",
        delivered: "border-transparent bg-status-delivered text-status-delivered-foreground hover:bg-status-delivered/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
