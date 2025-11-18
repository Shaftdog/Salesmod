"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DISPOSITION_LABELS } from '@/lib/campaigns/types';

interface DispositionChartProps {
  dispositions: Record<string, number>;
}

const DISPOSITION_COLORS: Record<string, string> = {
  HAS_ACTIVE_PROFILE: 'bg-green-500',
  NO_ACTIVE_PROFILE: 'bg-orange-500',
  INTERESTED: 'bg-blue-500',
  NEEDS_MORE_INFO: 'bg-yellow-500',
  NOT_INTERESTED: 'bg-red-500',
  OUT_OF_OFFICE: 'bg-gray-500',
  ESCALATE_UNCLEAR: 'bg-purple-500',
};

export function DispositionChart({ dispositions }: DispositionChartProps) {
  const entries = Object.entries(dispositions)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a);

  const total = entries.reduce((sum, [_, count]) => sum + count, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Disposition</CardTitle>
          <CardDescription>Classification of responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No responses yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Disposition</CardTitle>
        <CardDescription>Classification of {total} responses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map(([disposition, count]) => {
          const percentage = (count / total) * 100;
          const label = DISPOSITION_LABELS[disposition as keyof typeof DISPOSITION_LABELS] || disposition;
          const color = DISPOSITION_COLORS[disposition] || 'bg-gray-500';

          return (
            <div key={disposition} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{count}</span>
                  <Badge variant="secondary" className="font-mono">
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
