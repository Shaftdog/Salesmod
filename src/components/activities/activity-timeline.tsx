"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityForm } from "./activity-form";
import type { Activity } from "@/lib/types";
import { Phone, Mail, Users, FileText, ClipboardList, PlusCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { format } from "date-fns";
import { useCreateActivity } from "@/hooks/use-activities";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-appraisers";
import ReactMarkdown from "react-markdown";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const activityIcons: Record<string, any> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  task: ClipboardList,
  research: Search,
};

const activityColors: Record<string, string> = {
  call: "bg-blue-500",
  email: "bg-green-500",
  meeting: "bg-purple-500",
  note: "bg-yellow-500",
  task: "bg-orange-500",
  research: "bg-cyan-500",
};

// Component to show email activity with expandable full content
function EmailActivityContent({ activity }: { activity: Activity }) {
  const [isOpen, setIsOpen] = useState(false);
  const [emailData, setEmailData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchEmail = async () => {
    if (hasFetched || !activity.gmailMessageId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/integrations/gmail/messages/${activity.gmailMessageId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch email');
      }
      const data = await response.json();
      setEmailData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !hasFetched) {
      fetchEmail();
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <div className="mt-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground">
            {isOpen ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide email content
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show email content
              </>
            )}
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full mt-2" />
        ) : error || !emailData ? (
          <p className="text-sm text-muted-foreground mt-2">
            {error || 'Unable to load email content'}
          </p>
        ) : (
          <div className="mt-3 p-4 bg-muted/50 rounded-lg border">
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="font-medium text-muted-foreground w-16">From:</span>
                <span>{emailData.from_name ? `${emailData.from_name} <${emailData.from_email}>` : emailData.from_email}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-muted-foreground w-16">Subject:</span>
                <span>{emailData.subject}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-muted-foreground w-16">Date:</span>
                <span>{format(new Date(emailData.received_at), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
              {emailData.category && (
                <div className="flex gap-2">
                  <span className="font-medium text-muted-foreground w-16">Category:</span>
                  <Badge variant="outline" className="text-xs">{emailData.category}</Badge>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              {emailData.body_html ? (
                <div
                  className="prose prose-sm max-w-none text-sm [&_*]:text-sm"
                  dangerouslySetInnerHTML={{ __html: emailData.body_html }}
                />
              ) : emailData.body_text ? (
                <pre className="whitespace-pre-wrap font-sans text-sm">{emailData.body_text}</pre>
              ) : (
                <p className="text-sm text-muted-foreground">{emailData.snippet}</p>
              )}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

type ActivityTimelineProps = {
  clientId?: string;
  contactId?: string;
  activities: Activity[];
  isLoading?: boolean;
};

export function ActivityTimeline({ clientId, contactId, activities, isLoading }: ActivityTimelineProps) {
  const [showForm, setShowForm] = useState(false);
  const { mutateAsync: createActivity, isPending: isCreating } = useCreateActivity();
  const { data: currentUser } = useCurrentUser();

  const handleSubmit = async (data: any) => {
    if (!currentUser) return;

    await createActivity({
      client_id: clientId || null,
      contact_id: contactId || null,
      activity_type: data.activityType,
      subject: data.subject,
      description: data.description,
      status: data.status,
      completed_at: data.status === 'completed' ? new Date().toISOString() : null,
      duration_minutes: data.durationMinutes,
      outcome: data.outcome,
      created_by: currentUser.id,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Activity Timeline</h3>
        <Button onClick={() => setShowForm(true)} size="sm" variant="outline">
          <PlusCircle className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No activities yet. Log your first interaction to get started.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.activityType] || FileText;
            const colorClass = activityColors[activity.activityType] || "bg-gray-500";
            const hasEmail = activity.activityType === 'email' && activity.gmailMessageId;

            return (
              <div key={activity.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`rounded-full p-2 ${colorClass} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {activity !== activities[activities.length - 1] && (
                    <div className="w-0.5 flex-1 bg-border mt-2" />
                  )}
                </div>

                <Card className="flex-1 mb-4">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="capitalize">
                            {activity.activityType}
                          </Badge>
                          {activity.status === 'scheduled' && (
                            <Badge variant="outline">Scheduled</Badge>
                          )}
                          {activity.durationMinutes && (
                            <span className="text-xs text-muted-foreground">
                              {activity.durationMinutes} min
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold">{activity.subject}</h4>

                        {hasEmail ? (
                          <EmailActivityContent activity={activity} />
                        ) : (
                          activity.description && (
                            <div className="text-sm text-muted-foreground mt-2 prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-foreground">
                              <ReactMarkdown>{activity.description}</ReactMarkdown>
                            </div>
                          )
                        )}

                        {activity.outcome && (
                          <div className="mt-2">
                            <span className="text-xs font-medium">Outcome: </span>
                            <span className="text-xs text-muted-foreground">{activity.outcome}</span>
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{activity.creator?.name || "Unknown"}</span>
                          <span>•</span>
                          <span>{format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                          {activity.contact && (
                            <>
                              <span>•</span>
                              <span>with {activity.contact.firstName} {activity.contact.lastName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <ActivityForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmit}
        isLoading={isCreating}
      />
    </div>
  );
}

