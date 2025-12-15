"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToggleGroupProps {
  type: "single" | "multiple"
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface ToggleGroupItemProps {
  value: string
  className?: string
  children: React.ReactNode
  "aria-label"?: string
}

const ToggleGroupContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: "",
  onValueChange: () => {},
})

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ type, value, defaultValue = "", onValueChange, className, children }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const currentValue = value ?? internalValue

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (onValueChange) {
          onValueChange(newValue)
        } else {
          setInternalValue(newValue)
        }
      },
      [onValueChange]
    )

    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-muted p-1",
          className
        )}
      >
        <ToggleGroupContext.Provider
          value={{ value: currentValue, onValueChange: handleValueChange }}
        >
          {children}
        </ToggleGroupContext.Provider>
      </div>
    )
  }
)
ToggleGroup.displayName = "ToggleGroup"

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext)
    const isSelected = context.value === value

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isSelected}
        data-state={isSelected ? "on" : "off"}
        onClick={() => context.onValueChange(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isSelected
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem }
