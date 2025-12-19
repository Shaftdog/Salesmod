"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  ExternalLink,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";

interface DocumentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    document_type: string;
    url?: string | null;
  } | null;
}

const documentTypeLabels: Record<string, string> = {
  engagement_letter: "Engagement Letter",
  order_form: "Order Form",
  client_instructions: "Client Instructions",
  title_report: "Title Report",
  prior_appraisal: "Prior Appraisal",
  purchase_contract: "Purchase Contract",
  contract_addenda: "Contract Addenda",
  flood_certification: "Flood Certification",
  plans: "Plans",
  building_specs: "Building Specs",
  construction_budget: "Construction Budget",
  permits: "Permits",
  rental_data: "Rental Data",
  other: "Other",
};

const documentTypeColors: Record<string, string> = {
  engagement_letter: "bg-blue-500",
  order_form: "bg-indigo-500",
  client_instructions: "bg-purple-500",
  title_report: "bg-green-500",
  prior_appraisal: "bg-teal-500",
  purchase_contract: "bg-orange-500",
  contract_addenda: "bg-amber-500",
  flood_certification: "bg-cyan-500",
  plans: "bg-sky-500",
  building_specs: "bg-violet-500",
  construction_budget: "bg-emerald-500",
  permits: "bg-rose-500",
  rental_data: "bg-pink-500",
  other: "bg-gray-500",
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <FileImage className="h-5 w-5 text-purple-500" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function DocumentViewerDialog({
  open,
  onOpenChange,
  document,
}: DocumentViewerDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);

  if (!document) return null;

  const isImage = document.mime_type.startsWith("image/");
  const isPdf = document.mime_type === "application/pdf";
  const canPreview = isImage || isPdf;

  const handleZoomIn = () => setImageZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setImageZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setImageRotation((prev) => (prev + 90) % 360);

  const resetControls = () => {
    setImageZoom(100);
    setImageRotation(0);
    setIsLoading(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetControls();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {getFileIcon(document.mime_type)}
              <div className="min-w-0">
                <DialogTitle className="truncate">{document.file_name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(document.file_size)}
                  </span>
                  <Badge
                    className={`${documentTypeColors[document.document_type] || "bg-gray-500"} text-xs`}
                  >
                    {documentTypeLabels[document.document_type] || document.document_type}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isImage && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={imageZoom <= 50}
                    title="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">
                    {imageZoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={imageZoom >= 200}
                    title="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRotate}
                    title="Rotate"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              {document.url && (
                <>
                  <Button variant="outline" size="icon" asChild title="Open in new tab">
                    <a href={document.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild title="Download">
                    <a href={document.url} download={document.file_name}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto bg-muted/30 rounded-lg">
          {!document.url ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <p className="text-muted-foreground">Document URL not available</p>
            </div>
          ) : canPreview ? (
            <div className="relative w-full h-full min-h-[500px]">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {isImage ? (
                <div className="flex items-center justify-center p-4 h-full overflow-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={document.url}
                    alt={document.file_name}
                    className="max-w-full transition-transform duration-200"
                    style={{
                      transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                    }}
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                  />
                </div>
              ) : (
                <iframe
                  src={document.url}
                  className="w-full h-full min-h-[500px] border-0"
                  title={document.file_name}
                  onLoad={() => setIsLoading(false)}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4">
              <div className="p-4 bg-muted rounded-full">
                {getFileIcon(document.mime_type)}
              </div>
              <div className="text-center">
                <p className="font-medium">{document.file_name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Preview not available for this file type
                </p>
              </div>
              {document.url && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" asChild>
                    <a href={document.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                  <Button asChild>
                    <a href={document.url} download={document.file_name}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
