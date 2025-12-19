"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  AlertTriangle,
} from "lucide-react";
import {
  getFileIcon,
  formatFileSize,
  getDocumentTypeLabel,
  getDocumentTypeColor,
  canPreviewFile,
  isPreviewableImage,
  isPdfFile,
  isLargeFile,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  ZOOM_DEFAULT,
} from "@/lib/utils/document-helpers";

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

export function DocumentViewerDialog({
  open,
  onOpenChange,
  document,
}: DocumentViewerDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageZoom, setImageZoom] = useState(ZOOM_DEFAULT);
  const [imageRotation, setImageRotation] = useState(0);
  const [loadError, setLoadError] = useState(false);

  // Reset controls when dialog closes or document changes
  const resetControls = useCallback(() => {
    setImageZoom(ZOOM_DEFAULT);
    setImageRotation(0);
    setIsLoading(true);
    setLoadError(false);
  }, []);

  useEffect(() => {
    if (!open) {
      // Delay reset to allow dialog animation to complete
      const timer = setTimeout(resetControls, 200);
      return () => clearTimeout(timer);
    }
  }, [open, resetControls]);

  // Reset when document changes while dialog is open
  useEffect(() => {
    if (open && document) {
      resetControls();
    }
  }, [document?.id, open, resetControls]);

  if (!document) return null;

  const isImage = isPreviewableImage(document.mime_type);
  const isPdf = isPdfFile(document.mime_type);
  const canPreview = canPreviewFile(document.mime_type);
  const isLarge = isLargeFile(document.file_size);

  const handleZoomIn = () => setImageZoom((prev) => Math.min(prev + ZOOM_STEP, ZOOM_MAX));
  const handleZoomOut = () => setImageZoom((prev) => Math.max(prev - ZOOM_STEP, ZOOM_MIN));
  const handleRotate = () => setImageRotation((prev) => (prev + 90) % 360);

  const handleLoadError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
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
                  {isLarge && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Large file
                    </Badge>
                  )}
                  <Badge
                    className={`${getDocumentTypeColor(document.document_type)} text-xs`}
                  >
                    {getDocumentTypeLabel(document.document_type)}
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
                    disabled={imageZoom <= ZOOM_MIN}
                    title="Zoom out"
                    aria-label="Zoom out"
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
                    disabled={imageZoom >= ZOOM_MAX}
                    title="Zoom in"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRotate}
                    title="Rotate"
                    aria-label="Rotate image 90 degrees"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              {document.url && (
                <>
                  <Button variant="outline" size="icon" asChild title="Open in new tab">
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${document.file_name} in new tab`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild title="Download">
                    <a
                      href={document.url}
                      download={document.file_name}
                      aria-label={`Download ${document.file_name}`}
                    >
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
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center">
                <p className="font-medium">Failed to load document</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The document could not be loaded. It may have expired or be unavailable.
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" asChild>
                  <a href={document.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Try Opening Directly
                  </a>
                </Button>
              </div>
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
                  {/* Using native img for rotation/zoom transforms not supported by next/image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={document.url}
                    alt={document.file_name}
                    className="max-w-full transition-transform duration-200"
                    style={{
                      transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                    }}
                    onLoad={() => setIsLoading(false)}
                    onError={handleLoadError}
                  />
                </div>
              ) : (
                <iframe
                  src={document.url}
                  className="w-full h-full min-h-[500px] border-0"
                  title={document.file_name}
                  onLoad={() => setIsLoading(false)}
                  onError={handleLoadError}
                  // Security: Sandbox restricts iframe capabilities
                  // - No sandbox attrs = most secure but breaks PDF viewing
                  // - allow-same-origin needed for browser PDF viewer
                  // - allow-popups for PDF links (without escape-sandbox for security)
                  sandbox="allow-same-origin allow-popups"
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
