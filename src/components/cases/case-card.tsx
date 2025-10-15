"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge, CasePriorityBadge } from "./case-status-badge";
import type { Case } from "@/lib/types";
import { Building2, FileText, User, Calendar, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type CaseCardProps = {
  case: Case;
  onEdit?: (caseItem: Case) => void;
};

export function CaseCard({ case: caseItem, onEdit }: CaseCardProps) {
  // Helper function to format case type for display
  const formatCaseType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
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
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(caseItem)}
            >
              Edit
            </Button>
          )}
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

          {/* View Details Link */}
          <div className="pt-2">
            <Link href={`/cases/${caseItem.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                View Details
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



