"use client";

import { useState } from "react";
import { useOrderDocuments, useDeleteDocument, OrderDocument } from "@/lib/hooks/use-order-documents";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  File,
  Download,
  Trash2,
  Loader2,
  ExternalLink,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DocumentViewerDialog } from "./document-viewer-dialog";
import {
  getFileIcon,
  formatFileSize,
  getDocumentTypeLabel,
  getDocumentTypeColor,
} from "@/lib/utils/document-helpers";

interface OrderDocumentsSectionProps {
  orderId: string;
  onUpload?: () => void;
  variant?: 'card' | 'inline';
}

export function OrderDocumentsSection({ orderId, onUpload, variant = 'card' }: OrderDocumentsSectionProps) {
  const { data: documents, isLoading, error } = useOrderDocuments(orderId);
  const deleteDocument = useDeleteDocument(orderId);
  const { toast } = useToast();
  const [documentToDelete, setDocumentToDelete] = useState<OrderDocument | null>(null);
  const [documentToView, setDocumentToView] = useState<OrderDocument | null>(null);

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument.mutateAsync(documentToDelete.id);
      toast({
        title: "Document Deleted",
        description: `"${documentToDelete.file_name}" has been deleted`,
      });
    } catch (err) {
      console.error("Document deletion failed:", {
        documentId: documentToDelete.id,
        error: err,
      });
      toast({
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setDocumentToDelete(null);
    }
  };

  // Loading state
  if (isLoading) {
    const loadingContent = (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

    if (variant === 'inline') {
      return loadingContent;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>{loadingContent}</CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    const errorContent = (
      <p className="text-sm text-destructive">Failed to load documents</p>
    );

    if (variant === 'inline') {
      return <div className="py-4">{errorContent}</div>;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>{errorContent}</CardContent>
      </Card>
    );
  }

  // Documents list content
  const documentsContent = (
    <>
      {documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <button
                type="button"
                className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                onClick={() => setDocumentToView(doc)}
                aria-label={`View document: ${doc.file_name}`}
              >
                {getFileIcon(doc.mime_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {doc.file_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>-</span>
                    <span>
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </span>
                    {doc.uploader?.full_name && (
                      <>
                        <span>-</span>
                        <span>by {doc.uploader.full_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <Badge className={getDocumentTypeColor(doc.document_type)}>
                  {getDocumentTypeLabel(doc.document_type)}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDocumentToView(doc)}
                  title="View"
                  aria-label={`View ${doc.file_name}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {doc.url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in new tab"
                      aria-label={`Open ${doc.file_name} in new tab`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {doc.url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={doc.url}
                      download={doc.file_name}
                      title="Download"
                      aria-label={`Download ${doc.file_name}`}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDocumentToDelete(doc)}
                  title="Delete"
                  aria-label={`Delete ${doc.file_name}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No documents have been uploaded for this order.
          </p>
          {onUpload && (
            <Button variant="outline" onClick={onUpload} className="mt-4">
              <File className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          )}
        </div>
      )}
    </>
  );

  // Delete confirmation dialog
  const deleteDialog = (
    <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{documentToDelete?.file_name}&quot;? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteDocument.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Document viewer dialog
  const viewerDialog = (
    <DocumentViewerDialog
      open={!!documentToView}
      onOpenChange={(open) => !open && setDocumentToView(null)}
      document={documentToView}
    />
  );

  // Render based on variant
  if (variant === 'inline') {
    return (
      <>
        <div className="space-y-4">
          {/* Inline header - matches card variant styling */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Documents</h3>
              <p className="text-sm text-muted-foreground">
                {documents && documents.length > 0
                  ? `${documents.length} document${documents.length === 1 ? "" : "s"} uploaded`
                  : "No documents yet"}
              </p>
            </div>
            {onUpload && (
              <Button onClick={onUpload}>
                <File className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            )}
          </div>
          {documentsContent}
        </div>
        {deleteDialog}
        {viewerDialog}
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                {documents && documents.length > 0
                  ? `${documents.length} document${documents.length === 1 ? "" : "s"} uploaded`
                  : "No documents uploaded yet"}
              </CardDescription>
            </div>
            {onUpload && (
              <Button onClick={onUpload}>
                <File className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>{documentsContent}</CardContent>
      </Card>
      {deleteDialog}
      {viewerDialog}
    </>
  );
}
