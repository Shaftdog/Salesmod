"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Expand, Pencil, MoreHorizontal, Filter } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  filterCount?: number;
  className?: string;
  onClick?: () => void;
  highlight?: "red" | "green" | "yellow" | "blue" | "purple" | "orange" | null;
}

export function MetricCard({
  title,
  value,
  filterCount = 0,
  className,
  onClick,
  highlight = null,
}: MetricCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const highlightClasses = {
    red: "border-red-500/50 bg-red-500/10",
    green: "border-green-500/50 bg-green-500/10",
    yellow: "border-yellow-500/50 bg-yellow-500/10",
    blue: "border-blue-500/50 bg-blue-500/10",
    purple: "border-purple-500/50 bg-purple-500/10",
    orange: "border-orange-500/50 bg-orange-500/10",
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-4 min-h-[140px]",
        "bg-zinc-900/80 border border-zinc-700/50 rounded-lg",
        "transition-all duration-200 cursor-pointer",
        "hover:border-zinc-600 hover:bg-zinc-800/80",
        highlight && highlightClasses[highlight],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Action buttons on hover */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button className="p-1 hover:bg-zinc-700 rounded transition-colors">
            <Expand className="h-3.5 w-3.5 text-zinc-400" />
          </button>
          <button className="p-1 hover:bg-zinc-700 rounded transition-colors">
            <Pencil className="h-3.5 w-3.5 text-zinc-400" />
          </button>
          <button className="p-1 hover:bg-zinc-700 rounded transition-colors">
            <MoreHorizontal className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        </div>
      )}

      {/* Title */}
      <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider text-center mb-3">
        {title}
      </h3>

      {/* Value */}
      <div className="text-4xl font-light text-white text-center">
        {value}
      </div>

      {/* Filter indicator */}
      {filterCount > 0 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-zinc-500">
          <Filter className="h-3 w-3" />
          <span>{filterCount} Filters</span>
        </div>
      )}
    </div>
  );
}

interface MetricGridProps {
  children: React.ReactNode;
  className?: string;
}

export function MetricGrid({ children, className }: MetricGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
