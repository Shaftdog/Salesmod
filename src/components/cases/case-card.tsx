"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge, CasePriorityBadge } from "./case-status-badge";
import type { Case } from "@/lib/types";
import { Building2, FileText, User, Calendar, ExternalLink, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CreateRevisionButton } from "./create-revision-button";

type CaseCardProps = {
  case: Case;
  onEdit?: (caseItem: Case) => void;
  onDelete?: (caseItem: Case) => void;
};

export function CaseCard({ case: caseItem, onEdit, onDelete }: CaseCardProps) {
  // Helper function to format case type for display
  const formatCaseType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="group hover:shadow-md transition-shadow relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                <Link
                  href={`/cases/${caseItem.id}`}
                  className="hover:underline"
                >
                  {caseItem.subject}
                </Link>
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {caseItem.caseNumber}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {caseItem.description || "No description provided"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(caseItem)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(caseItem);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Status and Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <CaseStatusBadge status={caseItem.status} />
            <CasePriorityBadge priority={caseItem.priority} />
            <Badge variant="outline" className="text-xs">
              {formatCaseType(caseItem.caseType)}
            </Badge>
          </div>

          {/* Related Info */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {caseItem.client && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{caseItem.client.companyName}</span>
              </div>
            )}
            {caseItem.order && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Order #{caseItem.order.orderNumber}</span>
              </div>
            )}
            {caseItem.assignee && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Assigned to {caseItem.assignee.name}</span>
              </div>
            )}
            {caseItem.creator && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Created by {caseItem.creator.name}{" "}
                  {formatDistanceToNow(new Date(caseItem.createdAt), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>

          {/* Resolution info for resolved/closed cases */}
          {(caseItem.status === 'resolved' || caseItem.status === 'closed') && caseItem.resolution && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Resolution:</strong> {caseItem.resolution}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <Link href={`/cases/${caseItem.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                View Details
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {caseItem.orderId && (
              <CreateRevisionButton caseItem={caseItem} variant="outline" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



