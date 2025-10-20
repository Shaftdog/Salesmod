"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  status: 'verified' | 'partial' | 'unverified' | 'pending' | null;
  source?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function VerificationBadge({ 
  status, 
  source, 
  className = '', 
  showIcon = true,
  size = 'md'
}: VerificationBadgeProps) {
  if (!status) {
    return null;
  }

  const getBadgeConfig = () => {
    switch (status) {
      case 'verified':
        return {
          variant: 'default' as const,
          className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Verified'
        };
      case 'partial':
        return {
          variant: 'default' as const,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
          icon: <AlertTriangle className="h-3 w-3" />,
          text: 'Partial'
        };
      case 'unverified':
        return {
          variant: 'default' as const,
          className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
          icon: <XCircle className="h-3 w-3" />,
          text: 'Unverified'
        };
      case 'pending':
        return {
          variant: 'default' as const,
          className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
          icon: <Clock className="h-3 w-3" />,
          text: 'Pending'
        };
      default:
        return {
          variant: 'outline' as const,
          className: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: <Info className="h-3 w-3" />,
          text: 'Unknown'
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && config.icon}
      <span className={showIcon ? 'ml-1' : ''}>
        {config.text}
        {source && (
          <span className="ml-1 text-xs opacity-75">
            ({source})
          </span>
        )}
      </span>
    </Badge>
  );
}
