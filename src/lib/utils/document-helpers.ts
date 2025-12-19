import { FileText, FileImage, FileSpreadsheet, File } from "lucide-react";
import { createElement } from "react";

/**
 * Document type constants for the order documents system
 */
export const DOCUMENT_TYPES = [
  "engagement_letter",
  "order_form",
  "client_instructions",
  "title_report",
  "prior_appraisal",
  "purchase_contract",
  "contract_addenda",
  "flood_certification",
  "plans",
  "building_specs",
  "construction_budget",
  "permits",
  "rental_data",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/**
 * Human-readable labels for document types
 */
export const documentTypeLabels: Record<DocumentType, string> = {
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

/**
 * Background colors for document type badges
 */
export const documentTypeColors: Record<DocumentType, string> = {
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

/**
 * Get the document type label, with fallback for unknown types
 */
export function getDocumentTypeLabel(type: string): string {
  return documentTypeLabels[type as DocumentType] || type;
}

/**
 * Get the document type color, with fallback for unknown types
 */
export function getDocumentTypeColor(type: string): string {
  return documentTypeColors[type as DocumentType] || "bg-gray-500";
}

/**
 * File icon configuration based on MIME type
 */
export type FileIconType = "image" | "pdf" | "spreadsheet" | "word" | "generic";

export function getFileIconType(mimeType: string): FileIconType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "spreadsheet";
  if (mimeType.includes("word") || mimeType.includes("document")) return "word";
  return "generic";
}

export const fileIconConfig: Record<FileIconType, { icon: typeof FileText; className: string }> = {
  image: { icon: FileImage, className: "h-5 w-5 text-purple-500" },
  pdf: { icon: FileText, className: "h-5 w-5 text-red-500" },
  spreadsheet: { icon: FileSpreadsheet, className: "h-5 w-5 text-green-500" },
  word: { icon: FileText, className: "h-5 w-5 text-blue-500" },
  generic: { icon: File, className: "h-5 w-5 text-gray-500" },
};

/**
 * Get file icon element for a MIME type
 */
export function getFileIcon(mimeType: string) {
  const iconType = getFileIconType(mimeType);
  const config = fileIconConfig[iconType];
  return createElement(config.icon, { className: config.className });
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Check if a file can be previewed inline (images and PDFs only)
 * Note: SVG files are excluded from image preview for security reasons
 */
export function canPreviewFile(mimeType: string): boolean {
  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/") && !mimeType.includes("svg");
  return isPdf || isImage;
}

/**
 * Check if a file is a previewable image (excludes SVG for security)
 */
export function isPreviewableImage(mimeType: string): boolean {
  return mimeType.startsWith("image/") && !mimeType.includes("svg");
}

/**
 * Check if a file is a PDF
 */
export function isPdfFile(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

/**
 * Zoom control constants
 */
export const ZOOM_MIN = 50;
export const ZOOM_MAX = 200;
export const ZOOM_STEP = 25;
export const ZOOM_DEFAULT = 100;

/**
 * Large file size threshold (10MB) - files above this may load slowly
 */
export const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;

/**
 * Check if a file is considered large
 */
export function isLargeFile(bytes: number): boolean {
  return bytes > LARGE_FILE_THRESHOLD;
}
