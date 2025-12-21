"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Clock, CheckCircle2, XCircle, Loader2, Download } from "lucide-react";
import { MigrationWizard } from "@/components/migrations/migration-wizard";
import { SourceSelector } from "@/components/migrations/source-selector";
import { UploadAndPreview } from "@/components/migrations/upload-and-preview";
import { FieldMapper } from "@/components/migrations/field-mapper";
import { DryRunResults } from "@/components/migrations/dry-run-results";
import { MigrationProgress } from "@/components/migrations/migration-progress";
import { MigrationResults } from "@/components/migrations/migration-results";
import { formatDistanceToNow } from "date-fns";

export default function MigrationsPage() {
  const [showWizard, setShowWizard] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!showWizard) {
      fetchHistory();
    }
  }, [showWizard]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/migrations/history');
      const data = await response.json();
      setHistory(data.jobs || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadErrors = async (jobId: string) => {
    try {
      const response = await fetch(`/api/migrations/errors?jobId=${jobId}&format=csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `migration_errors_${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading errors:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Database className="h-8 w-8" />
            Data Migrations
          </h1>
          <p className="text-muted-foreground mt-2">
            Import data from Asana, HubSpot, or CSV files into your system
          </p>
        </div>
        <Button onClick={() => setShowWizard(!showWizard)}>
          {showWizard ? 'View History' : 'New Import'}
        </Button>
      </div>

      <Tabs value={showWizard ? 'wizard' : 'history'} onValueChange={(v) => setShowWizard(v === 'wizard')}>
        <TabsList>
          <TabsTrigger value="wizard">Import Wizard</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="wizard" className="mt-6">
          <MigrationWizard>
            {({ state, setState, currentStep, nextStep, prevStep, resetWizard }) => (
              <>
                {currentStep === 1 && (
                  <SourceSelector
                    state={state}
                    setState={setState}
                    onNext={nextStep}
                  />
                )}

                {currentStep === 2 && (
                  <UploadAndPreview
                    state={state}
                    setState={setState}
                    onNext={nextStep}
                    onPrev={prevStep}
                  />
                )}

                {currentStep === 3 && (
                  <FieldMapper
                    state={state}
                    setState={setState}
                    onNext={nextStep}
                    onPrev={prevStep}
                  />
                )}

                {currentStep === 4 && (
                  <DryRunResults
                    state={state}
                    setState={setState}
                    onNext={nextStep}
                    onPrev={prevStep}
                  />
                )}

                {currentStep === 5 && (
                  <MigrationProgress
                    state={state}
                    setState={setState}
                    onNext={nextStep}
                  />
                )}

                {currentStep === 6 && (
                  <MigrationResults
                    state={state}
                    onReset={resetWizard}
                  />
                )}
              </>
            )}
          </MigrationWizard>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                View past imports and download error reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No import history yet</p>
                  <Button onClick={() => setShowWizard(true)} className="mt-4">
                    Start Your First Import
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Inserted</TableHead>
                        <TableHead className="text-right">Updated</TableHead>
                        <TableHead className="text-right">Errors</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((job) => {
                        const totals = job.totals || {};
                        return (
                          <TableRow key={job.id}>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(job.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {job.source}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{job.entity}</TableCell>
                            <TableCell>{getStatusBadge(job.status)}</TableCell>
                            <TableCell className="text-right font-medium">{totals.total || 0}</TableCell>
                            <TableCell className="text-right text-green-600">{totals.inserted || 0}</TableCell>
                            <TableCell className="text-right text-blue-600">{totals.updated || 0}</TableCell>
                            <TableCell className="text-right text-red-600">{totals.errors || 0}</TableCell>
                            <TableCell>
                              {(totals.errors || 0) > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadErrors(job.id)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
