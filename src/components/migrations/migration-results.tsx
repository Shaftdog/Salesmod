"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, AlertCircle, Download, RotateCcw, ExternalLink } from "lucide-react";
import { WizardState } from "./migration-wizard";
import Link from "next/link";

interface MigrationResultsProps {
  state: WizardState;
  onReset: () => void;
}

export function MigrationResults({ state, onReset }: MigrationResultsProps) {
  const [errors, setErrors] = useState<any[]>([]);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.jobId) {
      fetchJobData();
    }
  }, [state.jobId]);

  const fetchJobData = async () => {
    try {
      // Fetch both status and errors
      const [statusResponse, errorsResponse] = await Promise.all([
        fetch(`/api/migrations/status?jobId=${state.jobId}`),
        fetch(`/api/migrations/errors?jobId=${state.jobId}`)
      ]);

      const statusData = await statusResponse.json();
      const errorsData = await errorsResponse.json();

      setJobStatus(statusData);
      setErrors(errorsData.errors || []);
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrors = async () => {
    try {
      const response = await fetch(`/api/migrations/errors?jobId=${state.jobId}&format=csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `migration_errors_${state.jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading errors:', error);
    }
  };

  // Get actual totals from job status
  const totals = jobStatus?.totals || {
    total: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const hasErrors = errors.length > 0;
  const isSuccess = !hasErrors;

  const getViewLink = () => {
    switch (state.entity) {
      case 'orders':
        return '/orders';
      case 'contacts':
        return '/clients'; // Contacts are viewed under clients
      case 'clients':
        return '/clients';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className={isSuccess ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            {isSuccess ? (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            ) : (
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {isSuccess ? 'Import Completed Successfully!' : 'Import Completed with Errors'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isSuccess
                  ? 'All records were imported successfully'
                  : `${totals.inserted + totals.updated} records imported, ${errors.length} records failed`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Import Summary</CardTitle>
          <CardDescription>Final results of your data import</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{totals.total}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Records</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{totals.inserted}</div>
              <div className="text-sm text-muted-foreground mt-1">Inserted</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{totals.updated}</div>
              <div className="text-sm text-muted-foreground mt-1">Updated</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-600">{totals.skipped}</div>
              <div className="text-sm text-muted-foreground mt-1">Skipped</div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{totals.errors}</div>
              <div className="text-sm text-muted-foreground mt-1">Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errors Table */}
      {hasErrors && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-red-600">Import Errors</CardTitle>
                <CardDescription>Records that failed to import</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadErrors}>
                <Download className="h-4 w-4 mr-2" />
                Download Full Error Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{errors.length} Record(s) Failed</AlertTitle>
              <AlertDescription>
                Review the errors below and fix the issues in your source data. You can then re-import just the failed records.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Error Message</TableHead>
                    <TableHead>Field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.slice(0, 25).map((error, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{error.row_index}</TableCell>
                      <TableCell className="text-sm">{error.error_message}</TableCell>
                      <TableCell className="font-mono text-sm">{error.field || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {errors.length > 25 && (
              <p className="text-sm text-muted-foreground mt-3">
                Showing first 25 of {errors.length} errors. Download the full report to see all errors.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onReset} variant="outline" className="flex-1">
          <RotateCcw className="h-4 w-4 mr-2" />
          Import Another File
        </Button>

        <Link href={getViewLink()} className="flex-1">
          <Button className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Imported {state.entity}
          </Button>
        </Link>

        <Link href="/migrations" className="flex-1">
          <Button variant="secondary" className="w-full">
            View Import History
          </Button>
        </Link>
      </div>
    </div>
  );
}


