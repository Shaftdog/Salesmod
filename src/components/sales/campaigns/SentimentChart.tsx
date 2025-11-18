"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smile, Meh, Frown } from 'lucide-react';

interface SentimentChartProps {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export function SentimentChart({ sentiment }: SentimentChartProps) {
  const total = sentiment.positive + sentiment.neutral + sentiment.negative;

  const positivePercent = total > 0 ? (sentiment.positive / total) * 100 : 0;
  const neutralPercent = total > 0 ? (sentiment.neutral / total) * 100 : 0;
  const negativePercent = total > 0 ? (sentiment.negative / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Sentiment</CardTitle>
        <CardDescription>
          Sentiment analysis of {total} responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Horizontal Bar */}
        <div className="h-8 flex rounded-lg overflow-hidden">
          {sentiment.positive > 0 && (
            <div
              className="bg-green-500 hover:bg-green-600 transition-colors cursor-pointer flex items-center justify-center"
              style={{ width: `${positivePercent}%` }}
              title={`${sentiment.positive} positive (${positivePercent.toFixed(1)}%)`}
            >
              {positivePercent > 15 && (
                <span className="text-xs font-medium text-white">
                  {positivePercent.toFixed(0)}%
                </span>
              )}
            </div>
          )}
          {sentiment.neutral > 0 && (
            <div
              className="bg-yellow-500 hover:bg-yellow-600 transition-colors cursor-pointer flex items-center justify-center"
              style={{ width: `${neutralPercent}%` }}
              title={`${sentiment.neutral} neutral (${neutralPercent.toFixed(1)}%)`}
            >
              {neutralPercent > 15 && (
                <span className="text-xs font-medium text-white">
                  {neutralPercent.toFixed(0)}%
                </span>
              )}
            </div>
          )}
          {sentiment.negative > 0 && (
            <div
              className="bg-red-500 hover:bg-red-600 transition-colors cursor-pointer flex items-center justify-center"
              style={{ width: `${negativePercent}%` }}
              title={`${sentiment.negative} negative (${negativePercent.toFixed(1)}%)`}
            >
              {negativePercent > 15 && (
                <span className="text-xs font-medium text-white">
                  {negativePercent.toFixed(0)}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Smile className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sentiment.positive}</p>
              <p className="text-xs text-muted-foreground">Positive</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <Meh className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sentiment.neutral}</p>
              <p className="text-xs text-muted-foreground">Neutral</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <Frown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sentiment.negative}</p>
              <p className="text-xs text-muted-foreground">Negative</p>
            </div>
          </div>
        </div>

        {total === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No responses yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
