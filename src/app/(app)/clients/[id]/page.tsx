"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient } from "@/hooks/use-clients";
import { useContacts } from "@/hooks/use-contacts";
import { useActivities } from "@/hooks/use-activities";
import { useClientTags, useTags, useAddTagToClient, useRemoveTagFromClient } from "@/hooks/use-tags";
import { useOrders } from "@/hooks/use-orders";
import { useDeals } from "@/hooks/use-deals";
import { ContactsList } from "@/components/contacts/contacts-list";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { TagSelector } from "@/components/tags/tag-selector";
import { OrdersList } from "@/components/orders/orders-list";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Briefcase, DollarSign, FileText, Mail, Phone, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useMemo, useState } from "react";
import { GenerateDraftDialog } from "@/components/ai/generate-draft-dialog";
import { DraftsList } from "@/components/ai/drafts-list";
import { ClientIntelligencePanel } from "@/components/ai/client-intelligence-panel";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(clientId);
  const { data: activities = [], isLoading: activitiesLoading } = useActivities(clientId);
  const { data: clientTags = [], isLoading: tagsLoading } = useClientTags(clientId);
  const { data: allTags = [] } = useTags();
  const { orders } = useOrders();
  const { data: deals = [], isLoading: dealsLoading } = useDeals(clientId);
  
  const { mutateAsync: addTag } = useAddTagToClient();
  const { mutateAsync: removeTag } = useRemoveTagFromClient();

  const [generateDraftOpen, setGenerateDraftOpen] = useState(false);

  const clientOrders = useMemo(() => {
    return orders.filter(order => order.clientId === clientId);
  }, [orders, clientId]);

  const handleAddTag = async (tagId: string) => {
    await addTag({ clientId, tagId });
  };

  const handleRemoveTag = async (tagId: string) => {
    await removeTag({ clientId, tagId });
  };

  if (clientLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client not found</p>
        <Button asChild className="mt-4">
          <Link href="/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

  const primaryContact = contacts.find(c => c.isPrimary);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{client.companyName}</h1>
            <p className="text-muted-foreground mt-1">{client.primaryContact}</p>
          </div>
          <Button asChild>
            <Link href={`/orders/new?clientId=${client.id}`}>
              + New Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">{client.activeOrders || 0}</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(client.totalRevenue || 0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="text-2xl font-bold">{contacts.length}</p>
              </div>
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activities</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                {client.email}
              </a>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <a href={`tel:${client.phone}`} className="hover:underline">
                {client.phone}
              </a>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p>{client.address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Terms</p>
              <p>{client.paymentTerms} days</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Tags</p>
            <TagSelector
              clientId={clientId}
              allTags={allTags}
              clientTags={clientTags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">
            Contacts ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="activities">
            Activity ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="deals">
            Deals ({deals.length})
          </TabsTrigger>
          <TabsTrigger value="orders">
            Orders ({clientOrders.length})
          </TabsTrigger>
          <TabsTrigger value="ai-assistant">
            <Sparkles className="h-4 w-4 mr-1" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <ContactsList
            clientId={clientId}
            contacts={contacts}
            isLoading={contactsLoading}
          />
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <ActivityTimeline
            clientId={clientId}
            activities={activities}
            isLoading={activitiesLoading}
          />
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <div className="grid gap-3">
            {dealsLoading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : deals.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <p>No deals yet for this client.</p>
              </Card>
            ) : (
              deals.map(deal => (
                <div key={deal.id} className="p-4 border rounded-lg">
                  <h4 className="font-semibold">{deal.title}</h4>
                  <p className="text-sm text-muted-foreground capitalize">Stage: {deal.stage}</p>
                  {deal.value && <p className="text-sm">Value: {formatCurrency(deal.value)}</p>}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <OrdersList orders={clientOrders} />
        </TabsContent>

        <TabsContent value="ai-assistant" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Assistant</CardTitle>
                  <CardDescription>
                    Generate personalized communications and get AI-powered suggestions
                  </CardDescription>
                </div>
                <Button onClick={() => setGenerateDraftOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Draft
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <DraftsList clientId={clientId} />
            </div>
            <div>
              <ClientIntelligencePanel clientId={clientId} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Generate Draft Dialog */}
      <GenerateDraftDialog
        open={generateDraftOpen}
        onOpenChange={setGenerateDraftOpen}
        clientId={clientId}
        clientName={client?.companyName || "Client"}
      />
    </div>
  );
}
