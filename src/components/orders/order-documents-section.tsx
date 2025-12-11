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
  FileImage,
  FileSpreadsheet,
  File,
  Download,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OrderDocumentsSectionProps {
  orderId: string;
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

export function OrderDocumentsSection({ orderId }: OrderDocumentsSectionProps) {
  const { data: documents, isLoading, error } = useOrderDocuments(orderId);
  const deleteDocument = useDeleteDocument(orderId);
  const { toast } = useToast();
  const [documentToDelete, setDocumentToDelete] = useState<OrderDocument | null>(null);

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument.mutateAsync(documentToDelete.id);
      toast({
        title: "Document Deleted",
        description: `"${documentToDelete.file_name}" has been deleted`,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setDocumentToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load documents</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {documents && documents.length > 0
              ? `${documents.length} document${documents.length === 1 ? "" : "s"} uploaded`
              : "No documents uploaded yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(doc.mime_type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                        </span>
                        {doc.uploader?.full_name && (
                          <>
                            <span>•</span>
                            <span>by {doc.uploader.full_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={documentTypeColors[doc.document_type] || "bg-gray-500"}>
                      {documentTypeLabels[doc.document_type] || doc.document_type}
                    </Badge>
                    {doc.url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" title="Open">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {doc.url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={doc.url} download={doc.file_name} title="Download">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDocumentToDelete(doc)}
                      title="Delete"
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
              <p className="text-xs text-muted-foreground mt-1">
                Use the "Upload Document" button to add files.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.file_name}"? This action cannot
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
    </>
  );
}
