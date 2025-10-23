"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, AlertTriangle, Link2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImportMetrics } from "@/lib/migrations/types";

export type ImportMetricsProps = {
  jobId?: string;
  metrics?: ImportMetrics;
  suggestBackfill?: boolean;
  onRunBackfill?: () => Promise<void>;
};

export default function ImportRunMetrics({ 
  jobId, 
  metrics: initialMetrics, 
  suggestBackfill, 
  onRunBackfill 
}: ImportMetricsProps) {
  const [metrics, setMetrics] = useState<ImportMetrics | null>(initialMetrics || null);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const { toast } = useToast();

  // Poll for metrics if jobId is provided
  useEffect(() => {
    if (!jobId || initialMetrics) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/migrations/status?jobId=${jobId}`);
        const data = await response.json();
        
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        
        // Stop polling when job is completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          return;
        }
        
        // Continue polling every 2 seconds
        setTimeout(pollStatus, 2000);
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    };

    pollStatus();
  }, [jobId, initialMetrics]);

  const handleRunBackfill = async () => {
    if (!onRunBackfill) return;
    
    setBackfillLoading(true);
    toast({ 
      title: "Backfill started", 
      description: "Refresh in ~30s to see results" 
    });
    
    try {
      await onRunBackfill();
    } finally {
      setBackfillLoading(false);
    }
  };

  if (!metrics) {
    return (
      <Card className="mb-4 border-2">
        <CardContent className="py-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading import metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pct = Math.round((metrics.link_rate || 0) * 100);
  const ok = pct >= 90;

  return (
    <Card className="mb-4 border-2">
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <h3 className="text-base font-semibold">Import Metrics</h3>
            <Badge variant={ok ? "default" : "destructive"}>
              Auto-link: {metrics.properties.linked}/{metrics.properties.link_attempted} ({pct}%)
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">Job: {metrics.job_id}</span>
        </div>

        <div className="mt-3">
          <Progress value={pct} />
        </div>

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-muted-foreground">Rows Read</span><div className="font-medium">{metrics.totals.read}</div></div>
          <div><span className="text-muted-foreground">Created / Updated</span><div className="font-medium">{metrics.totals.created} / {metrics.totals.updated}</div></div>
          <div><span className="text-muted-foreground">Deduped</span><div className="font-medium">{metrics.totals.deduped}</div></div>
          <div><span className="text-muted-foreground">Skipped (no external id)</span><div className="font-medium">{metrics.totals.skipped_no_external_id}</div></div>
        </div>

        <Separator className="my-3" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-muted-foreground">Properties Upserted</span><div className="font-medium">{metrics.properties.upserts}</div></div>
          <div><span className="text-muted-foreground">Linked / Unlinked</span><div className="font-medium">{metrics.properties.linked} / {metrics.properties.unlinked}</div></div>
          <div><span className="text-muted-foreground">Address Verified</span><div className="font-medium">{metrics.address_validation.verified}</div></div>
          <div><span className="text-muted-foreground">Partial / Failed</span><div className="font-medium">{metrics.address_validation.partial} / {metrics.address_validation.failed}</div></div>
        </div>

        {!ok && (
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={handleRunBackfill} size="sm" disabled={backfillLoading}>
              {backfillLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Run Backfill
            </Button>
            <p className="text-sm text-muted-foreground">
              Link rate is below 90%. Backfill will re-verify addresses and attach remaining orders.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
