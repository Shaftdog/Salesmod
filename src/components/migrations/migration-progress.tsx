"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { WizardState } from "./migration-wizard";
import { useToast } from "@/hooks/use-toast";

interface MigrationProgressProps {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onNext: () => void;
}

export function MigrationProgress({ state, setState, onNext }: MigrationProgressProps) {
  const [status, setStatus] = useState<any>(null);
  const [polling, setPolling] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!state.jobId) {
      startMigration();
    } else {
      pollStatus();
    }

    // Set a timeout to stop polling after 10 minutes to prevent infinite loops
    timeoutRef.current = setTimeout(() => {
      console.log('Migration polling timeout - stopping');
      setPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startMigration = async () => {
    try {
      // Debug logging
      console.log('🚀 Migration Start Debug:', {
        fileDataLength: state.fileData?.length,
        fileDataPreview: state.fileData?.substring(0, 200),
        fileHash: state.previewData?.fileHash,
        mappingsCount: state.mappings?.length,
        entity: state.entity,
      });

      const response = await fetch('/api/migrations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: state.fileData,
          fileHash: state.previewData!.fileHash,
          mappings: state.mappings,
          entity: state.entity,
          source: state.source,
          duplicateStrategy: state.duplicateStrategy,
          options: state.options,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to start migration');
      }

      const { jobId } = result;
      setState((prev) => ({ ...prev, jobId }));
      pollStatus(jobId);
    } catch (error: any) {
      console.error('Migration start error:', error);
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to start migration",
        variant: "destructive",
      });
    }
  };

  const pollStatus = (jobId?: string) => {
    const id = jobId || state.jobId;
    if (!id) return;

    const poll = async () => {
      try {
        const response = await fetch(`/api/migrations/status?jobId=${id}`);
        
        // Handle 404 - job not found (likely completed and cleaned up)
        if (response.status === 404) {
          console.log('Job not found (404) - assuming completed');
          setPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          setStatus({ status: 'completed', totals: { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 }, progress: 100 });
          setState((prev) => ({ ...prev, completed: true }));
          setTimeout(() => onNext(), 1000);
          return;
        }

        const statusData = await response.json();
        setStatus(statusData);

        if (statusData.status === 'completed' || statusData.status === 'failed' || statusData.status === 'cancelled') {
          setPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          if (statusData.status === 'completed') {
            setState((prev) => ({ ...prev, completed: true }));
            setTimeout(() => onNext(), 1000);
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
        // Stop polling on network errors to prevent infinite loops
        setPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    };

    // Poll immediately
    poll();

    // Then poll every 1.5 seconds
    intervalRef.current = setInterval(poll, 1500);
  };

  const handleCancel = async () => {
    if (!state.jobId) return;

    try {
      const response = await fetch('/api/migrations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: state.jobId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel migration');
      }

      setPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      toast({
        title: "Migration Cancelled",
        description: "The migration has been cancelled. Records already processed will remain.",
      });

      // Update status to reflect cancellation
      setStatus((prev: any) => ({
        ...prev,
        status: 'cancelled',
      }));
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast({
        title: "Cancel Failed",
        description: error.message || "Failed to cancel migration",
        variant: "destructive",
      });
    }
  };

  const totals = status?.totals || { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 };
  const progress = status?.progress || 0;
  const isRunning = polling && (status?.status === 'pending' || status?.status === 'processing');

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isRunning ? 'Migration in Progress...' : 
           status?.status === 'completed' ? 'Migration Complete!' : 
           'Migration Status'}
        </CardTitle>
        <CardDescription>
          {isRunning ? 'Please wait while we import your data' : 
           status?.status === 'completed' ? 'Your data has been successfully imported' : 
           'Checking migration status...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totals.inserted + totals.updated + totals.skipped + totals.errors}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-green-600">Inserted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totals.inserted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-blue-600">Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totals.updated}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-red-600">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totals.errors}</div>
            </CardContent>
          </Card>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
          {isRunning && (
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg font-medium">Processing records...</span>
            </div>
          )}
          {status?.status === 'completed' && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">✓ Complete</div>
              <p className="text-sm text-muted-foreground">Redirecting to results...</p>
            </div>
          )}
          {status?.status === 'failed' && (
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-2">✗ Failed</div>
              <p className="text-sm text-muted-foreground">{status.error_message}</p>
            </div>
          )}
        </div>

        {/* Cancel Button */}
        {isRunning && (
          <div className="flex justify-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Cancel Import</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Import?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will stop the migration process. Records already imported will remain in the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Import</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>Cancel Import</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

