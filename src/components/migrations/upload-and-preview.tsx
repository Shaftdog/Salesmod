"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { WizardState } from "./migration-wizard";
import { useToast } from "@/hooks/use-toast";

interface UploadAndPreviewProps {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onNext: () => void;
  onPrev: () => void;
}

export function UploadAndPreview({ state, setState, onNext, onPrev }: UploadAndPreviewProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV or TSV file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // CRITICAL FIX: Read file contents FIRST before sending to API
      // File stream can only be read once!
      const fileContents = await file.text();
      
      // Debug logging
      console.log('📁 File Upload Debug:', {
        fileName: file.name,
        fileSize: file.size,
        fileDataLength: fileContents.length,
        fileDataPreview: fileContents.substring(0, 200),
      });

      // Now send the file data (as string) to preview API
      const formData = new FormData();
      formData.append('file', new Blob([fileContents], { type: 'text/csv' }), file.name);

      const response = await fetch('/api/migrations/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse CSV');
      }

      const previewData = await response.json();

      setState((prev) => ({
        ...prev,
        file,
        fileData: fileContents, // Use the data we already read
        previewData,
        // Clear downstream state when uploading new file
        mappings: [],
        dryRunResult: null,
        jobId: null,
        completed: false,
      }));

      toast({
        title: "File Uploaded Successfully",
        description: `Parsed ${previewData.totalCount} rows from ${file.name}`,
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: error.message || 'Failed to upload file',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Upload your CSV file to preview the data and map fields.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!state.file ? (
            <div>
              <div
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                  ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                  ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && document.getElementById('file-input')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {uploading ? 'Uploading...' : 'Drop your CSV file here'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  or use the button below (Maximum 50MB)
                </p>
              </div>
              
              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-input')?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose CSV File
                </Button>
              </div>
              
              <input
                id="file-input"
                type="file"
                accept=".csv,.tsv"
                onChange={handleFileInput}
                className="hidden"
                disabled={uploading}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">{state.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(state.file.size / 1024).toFixed(2)} KB • {state.previewData?.totalCount} rows
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState((prev) => ({ ...prev, file: null, fileData: null, previewData: null }))}
                >
                  Remove
                </Button>
              </div>

              {/* Detected Preset */}
              {state.previewData?.suggestedPreset && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Detected preset: <strong>{state.previewData.suggestedPreset}</strong>. 
                    Field mappings will be pre-filled in the next step.
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview Table */}
              {state.previewData && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Data Preview (first 10 rows)</h3>
                    <Badge variant="secondary">
                      {state.previewData.headers.length} columns
                    </Badge>
                  </div>
                  
                  <div className="border rounded-lg overflow-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          {state.previewData.headers.map((header, index) => (
                            <TableHead key={index} className="whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.previewData.sampleRows.slice(0, 10).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                            {state.previewData!.headers.map((header, colIndex) => (
                              <TableCell key={colIndex} className="whitespace-nowrap">
                                <div className="max-w-xs truncate">
                                  {row[header] !== undefined && row[header] !== null ? String(row[header]) : '-'}
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {state.previewData.totalCount > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing 10 of {state.previewData.totalCount} rows
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={!state.previewData}>
          Next: Map Fields
        </Button>
      </div>
    </div>
  );
}


