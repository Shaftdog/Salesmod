"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDeal, useUpdateDeal } from "@/hooks/use-deals";
import { useDealActivities } from "@/hooks/use-activities";
import { useClients } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DealActivityTimeline } from "@/components/activities/deal-activity-timeline";
import { DealForm } from "@/components/deals/deal-form";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  TrendingUp,
  User,
  Building2,
  Edit,
  Phone,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const stageColors: Record<string, string> = {
  lead: "bg-gray-100 text-gray-800 border-gray-300",
  qualified: "bg-blue-100 text-blue-800 border-blue-300",
  proposal: "bg-purple-100 text-purple-800 border-purple-300",
  negotiation: "bg-orange-100 text-orange-800 border-orange-300",
  won: "bg-green-100 text-green-800 border-green-300",
  lost: "bg-red-100 text-red-800 border-red-300",
};

const stageLabels: Record<string, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.id as string;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: deal, isLoading: dealLoading } = useDeal(dealId);
  const { data: activities = [], isLoading: activitiesLoading } = useDealActivities(dealId);
  const { clients, isLoading: clientsLoading } = useClients();
  const updateDeal = useUpdateDeal();

  const handleUpdateDeal = async (data: any) => {
    try {
      // Transform camelCase to snake_case for database
      const dbData = {
        title: data.title,
        description: data.description,
        client_id: data.clientId,
        value: data.value,
        probability: data.probability,
        stage: data.stage,
        expected_close_date: data.expectedCloseDate?.toISOString(),
      };

      await updateDeal.mutateAsync({
        id: dealId,
        ...dbData,
      });
      toast.success("Deal updated successfully");
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update deal");
    }
  };

  if (dealLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-semibold">Deal Not Found</h2>
        <p className="text-muted-foreground">The deal you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/deals")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Deals
        </Button>
      </div>
    );
  }

  const weightedValue = deal.value ? (deal.value * deal.probability) / 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/deals")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{deal.title}</h1>
            <p className="text-muted-foreground">Deal Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Deal
          </Button>
        </div>
      </div>

      {/* Edit Deal Dialog */}
      <DealForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateDeal}
        clients={clients}
        deal={deal}
        isLoading={updateDeal.isPending}
      />

      {/* Deal Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Deal Information</CardTitle>
              <Badge className={stageColors[deal.stage]}>
                {stageLabels[deal.stage]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {deal.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{deal.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deal Value</p>
                  <p className="text-lg font-semibold">
                    {deal.value ? formatCurrency(deal.value) : "Not set"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Probability</p>
                  <p className="text-lg font-semibold">{deal.probability}%</p>
                  {deal.value && (
                    <p className="text-xs text-muted-foreground">
                      Weighted: {formatCurrency(weightedValue)}
                    </p>
                  )}
                </div>
              </div>

              {deal.expectedCloseDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expected Close</p>
                    <p className="text-sm font-semibold">
                      {format(new Date(deal.expectedCloseDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}

              {deal.actualCloseDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Actual Close</p>
                    <p className="text-sm font-semibold">
                      {format(new Date(deal.actualCloseDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {deal.lostReason && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Lost Reason</h4>
                <p className="text-sm">{deal.lostReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* People & Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle>People & Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deal.client && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <p className="text-sm font-semibold">{deal.client.companyName}</p>
                </div>
              </div>
            )}

            {deal.contact && (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact</p>
                    <p className="text-sm font-semibold">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </p>
                    {deal.contact.title && (
                      <p className="text-xs text-muted-foreground">{deal.contact.title}</p>
                    )}
                  </div>
                </div>
                {deal.contact.email && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`mailto:${deal.contact.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      {deal.contact.email}
                    </a>
                  </Button>
                )}
                {deal.contact.phone && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`tel:${deal.contact.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      {deal.contact.phone}
                    </a>
                  </Button>
                )}
              </div>
            )}

            {deal.assignee && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                  <p className="text-sm font-semibold">{deal.assignee.name}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardContent className="pt-6">
          <DealActivityTimeline
            dealId={dealId}
            activities={activities}
            isLoading={activitiesLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
