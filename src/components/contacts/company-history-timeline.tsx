"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar } from "lucide-react";
import type { CompanyHistory } from "@/hooks/use-contact-detail";
import { format, parseISO } from "date-fns";
import Link from "next/link";

interface CompanyHistoryTimelineProps {
  history: CompanyHistory[];
  currentCompanyId?: string;
}

export function CompanyHistoryTimeline({ history, currentCompanyId }: CompanyHistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No company history available</p>
        <p className="text-sm mt-2">
          Company changes will appear here when the contact is transferred
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item, index) => {
        const isCurrent = item.end_date === null;
        const startDate = item.start_date ? format(parseISO(item.start_date), 'MMM yyyy') : 'Unknown';
        const endDate = item.end_date ? format(parseISO(item.end_date), 'MMM yyyy') : 'Present';

        return (
          <Card key={`${item.company_id}-${item.start_date}`} className={isCurrent ? 'border-primary' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  {index < history.length - 1 && (
                    <div className="w-0.5 h-16 bg-border mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        <Link 
                          href={`/clients/${item.company_id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {item.company_name}
                        </Link>
                      </h3>
                      {isCurrent && (
                        <Badge variant="default">Current</Badge>
                      )}
                      {item.is_primary && !isCurrent && (
                        <Badge variant="secondary">Was Primary</Badge>
                      )}
                    </div>
                  </div>

                  {item.title && (
                    <p className="text-muted-foreground">{item.title}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{startDate} - {endDate}</span>
                    </div>
                    
                    {item.role && item.role !== 'other' && (
                      <Badge variant="outline" className="capitalize text-xs">
                        {item.role}
                      </Badge>
                    )}
                  </div>

                  {item.reason_for_leaving && (
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-sm">
                        <span className="font-medium">Reason for leaving:</span> {item.reason_for_leaving}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

