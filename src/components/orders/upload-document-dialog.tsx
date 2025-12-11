"use client";

import { useState, useRef } from "react";
import { Order } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileIcon, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadDocuments } from "@/lib/hooks/use-order-documents";

interface UploadDocumentDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const documentTypes = [
  { value: "engagement_letter", label: "Engagement Letter" },
  { value: "order_form", label: "Order Form" },
  { value: "client_instructions", label: "Client Instructions" },
  { value: "title_report", label: "Title Report" },
  { value: "prior_appraisal", label: "Prior Appraisal(s) on the Subject" },
  { value: "purchase_contract", label: "Purchase Contract" },
  { value: "contract_addenda", label: "Contract Addenda" },
  { value: "flood_certification", label: "Flood Certification" },
  { value: "plans", label: "Plans" },
  { value: "building_specs", label: "Building Specifications" },
  { value: "construction_budget", label: "Construction Budget" },
  { value: "permits", label: "Permits" },
  { value: "rental_data", label: "Rental Data" },
  { value: "other", label: "Other" },
];

export function UploadDocumentDialog({
  order,
  open,
  onOpenChange,
}: UploadDocumentDialogProps) {
  const [documentType, setDocumentType] = useState("engagement_letter");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const uploadDocuments = useUploadDocuments();

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    
    const fileArray = Array.from(newFiles);
    setFiles((prev) => [...prev, ...fileArray]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadDocuments.mutateAsync({
        orderId: order.id,
        files,
        documentType,
      });

      toast({
        title: "Documents Uploaded",
        description: `Successfully uploaded ${files.length} document(s)`,
      });

      setFiles([]);
      setDocumentType("engagement_letter");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload documents",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload documents for order {order.orderNumber}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="documentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Files</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, Word, Excel, Images (max 10MB each)
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({files.length})</Label>
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFiles([]);
                setDocumentType("engagement_letter");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploadDocuments.isPending || files.length === 0}>
              {uploadDocuments.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {uploadDocuments.isPending ? 'Uploading...' : `Upload${files.length > 0 ? ` (${files.length})` : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

