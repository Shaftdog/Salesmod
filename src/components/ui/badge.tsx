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
        // Production Kanban stage variants
        INTAKE: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80",
        SCHEDULING: "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-100/80",
        SCHEDULED: "border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80",
        INSPECTED: "border-transparent bg-cyan-100 text-cyan-800 hover:bg-cyan-100/80",
        FINALIZATION: "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100/80",
        READY_FOR_DELIVERY: "border-transparent bg-lime-100 text-lime-800 hover:bg-lime-100/80",
        DELIVERED: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80",
        CORRECTION: "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-100/80",
        REVISION: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
        WORKFILE: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-100/80",
        cancelled: "border-transparent bg-red-100 text-red-800 hover:bg-red-100/80",
        on_hold: "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-100/80",
        // Legacy variants (kept for backwards compatibility)
        new: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80",
        assigned: "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-100/80",
        scheduled: "border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80",
        "in_progress": "border-transparent bg-cyan-100 text-cyan-800 hover:bg-cyan-100/80",
        "in_review": "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100/80",
        completed: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80",
        revisions: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
        delivered: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80",
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
