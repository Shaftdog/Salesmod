"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, CheckCircle2, ChevronDown, Loader2, Download } from "lucide-react";
import { WizardState } from "./migration-wizard";
import { DuplicateStrategy } from "@/lib/migrations/types";
import { useToast } from "@/hooks/use-toast";

interface DryRunResultsProps {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onNext: () => void;
  onPrev: () => void;
}

export function DryRunResults({ state, setState, onNext, onPrev }: DryRunResultsProps) {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!state.dryRunResult) {
      runDryRun();
    } else {
      setLoading(false);
    }
  }, []);

  const runDryRun = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/migrations/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: await state.file!.text(),
          mappings: state.mappings,
          entity: state.entity,
          duplicateStrategy: state.duplicateStrategy,
        }),
      });

      if (!response.ok) {
        throw new Error('Dry run failed');
      }

      const result = await response.json();
      setState((prev) => ({ ...prev, dryRunResult: result }));
    } catch (error: any) {
      console.error('Dry run error:', error);
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !state.dryRunResult) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Validating Data...</h3>
            <p className="text-sm text-muted-foreground">
              This may take a moment for large files
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { total, wouldInsert, wouldUpdate, wouldSkip, errors, duplicates } = state.dryRunResult;
  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Validation Results</CardTitle>
          <CardDescription>
            Review the dry run results before importing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">New Inserts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{wouldInsert}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{wouldUpdate}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{errors.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Duplicate Strategy */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Duplicate Handling Strategy</Label>
            <RadioGroup
              value={state.duplicateStrategy}
              onValueChange={(value) => {
                setState((prev) => ({ ...prev, duplicateStrategy: value as DuplicateStrategy }));
                // Re-run dry run with new strategy
                runDryRun();
              }}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="update" id="update" />
                <Label htmlFor="update" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Update Existing</div>
                  <div className="text-sm text-muted-foreground">Upsert - update records if they exist</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="skip" id="skip" />
                <Label htmlFor="skip" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Skip Duplicates</div>
                  <div className="text-sm text-muted-foreground">Keep existing records, skip imports</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="create" id="create" />
                <Label htmlFor="create" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Create New</div>
                  <div className="text-sm text-muted-foreground">Always create new records</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Validation Errors */}
          {hasErrors && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-red-50 rounded-lg hover:bg-red-100">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-600">
                    {errors.length} Validation Error{errors.length !== 1 ? 's' : ''} Found
                  </span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 border rounded-lg overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.rowIndex}</TableCell>
                          <TableCell className="font-mono text-sm">{error.field}</TableCell>
                          <TableCell className="text-sm">{error.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {errors.length >= 25 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing first 25 errors. Fix these and re-upload to see more.
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Duplicate Matches */}
          {duplicates.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-600">
                    {duplicates.length} Duplicate{duplicates.length !== 1 ? 's' : ''} Detected
                  </span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 border rounded-lg overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Matched On</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {duplicates.map((dup, index) => (
                        <TableRow key={index}>
                          <TableCell>{dup.rowIndex}</TableCell>
                          <TableCell className="font-mono text-sm">{dup.matchedOn}</TableCell>
                          <TableCell className="text-sm">
                            {state.duplicateStrategy === 'update' && 'Will update existing'}
                            {state.duplicateStrategy === 'skip' && 'Will skip'}
                            {state.duplicateStrategy === 'create' && 'Will create new'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {duplicates.length >= 25 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing first 25 duplicates.
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Success Message */}
          {!hasErrors && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Validation Passed!</AlertTitle>
              <AlertDescription>
                All records passed validation. Ready to import {wouldInsert} new record(s)
                {wouldUpdate > 0 && ` and update ${wouldUpdate} existing record(s)`}.
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for Errors */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors Found</AlertTitle>
              <AlertDescription>
                Please fix the errors in your CSV file and re-upload, or proceed to import only valid records.
                Records with errors will be logged and skipped.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Previous
        </Button>
        <Button onClick={onNext}>
          Proceed with Import
        </Button>
      </div>
    </div>
  );
}

