import { useQuery } from '@tanstack/react-query';
import type { ProductionMetrics } from '@/app/api/production/dashboard-metrics/route';

async function fetchProductionMetrics(): Promise<ProductionMetrics> {
  const response = await fetch('/api/production/dashboard-metrics');

  if (!response.ok) {
    throw new Error('Failed to fetch production metrics');
  }

  return response.json();
}

export function useProductionMetrics() {
  return useQuery({
    queryKey: ['production-metrics'],
    queryFn: fetchProductionMetrics,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

/**
 * Format turn time for display
 */
export function formatTurnTime(
  turnTime: { weeks: number; days: number; hours: number } | null
): string {
  if (!turnTime) return 'N/A';

  const parts: string[] = [];

  if (turnTime.weeks > 0) {
    parts.push(`${turnTime.weeks}wk`);
  }
  if (turnTime.days > 0) {
    parts.push(`${turnTime.days}d`);
  }
  if (turnTime.hours > 0 && turnTime.weeks === 0) {
    parts.push(`${turnTime.hours}hr`);
  }

  return parts.length > 0 ? parts.join(', ') : '< 1hr';
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
