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
import { RoleBadge } from "@/components/shared/role-badge";
import { RoleSelect } from "@/components/shared/role-select";
import { useClients } from "@/hooks/use-clients";
import { useToast } from "@/hooks/use-toast";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const { data: client, isLoading: clientLoading } = useClient(clientId);
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(clientId);
  const { data: activities = [], isLoading: activitiesLoading } = useActivities(clientId);
  const { data: clientTags = [], isLoading: tagsLoading } = useClientTags(clientId);
  const { data: allTags = [] } = useTags();
  const { orders } = useOrders();
  const { deals = [], isLoading: dealsLoading } = useDeals(clientId);
  
  const { mutateAsync: addTag } = useAddTagToClient();
  const { mutateAsync: removeTag } = useRemoveTagFromClient();
  const { updateClient } = useClients();
  const { toast } = useToast();

  const [generateDraftOpen, setGenerateDraftOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const clientOrders = useMemo(() => {
    return orders.filter(order => order.clientId === clientId);
  }, [orders, clientId]);

  const activeOrders = useMemo(() => {
    return clientOrders.filter(order => 
      !['completed', 'delivered', 'cancelled'].includes(order.status)
    );
  }, [clientOrders]);

  const activeOrdersCount = useMemo(() => {
    return activeOrders.length;
  }, [activeOrders]);

  const totalRevenue = useMemo(() => {
    return clientOrders
      .filter(order => ['completed', 'delivered'].includes(order.status))
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  }, [clientOrders]);

  const displayedOrders = useMemo(() => {
    return showOnlyActive ? activeOrders : clientOrders;
  }, [showOnlyActive, activeOrders, clientOrders]);

  const handleAddTag = async (tagId: string) => {
    await addTag({ clientId, tagId });
  };

  const handleRemoveTag = async (tagId: string) => {
    await removeTag({ clientId, tagId });
  };

  const handleRoleChange = async (roleCode: string) => {
    try {
      await updateClient({
        id: clientId,
        primary_role_code: roleCode || null,
      });
      toast({
        title: "Role Updated",
        description: "Client role has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role.",
        variant: "destructive",
      });
    }
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{client.companyName}</h1>
              <RoleBadge 
                code={client.primaryRoleCode} 
                label={client.role?.label} 
              />
            </div>
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
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => {
            setShowOnlyActive(true);
            setActiveTab("orders");
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">{activeOrdersCount}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
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
            <div>
              <p className="text-sm text-muted-foreground mb-2">Role</p>
              <RoleSelect
                value={client.primaryRoleCode}
                onChange={handleRoleChange}
                placeholder="Select company role..."
              />
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Tags</p>
            <TagSelector
              entityId={clientId}
              entityType="client"
              allTags={allTags}
              assignedTags={clientTags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
          <TabsTrigger 
            value="orders"
            onClick={() => {
              if (activeTab === "orders") {
                setShowOnlyActive(false);
              }
            }}
          >
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
          {showOnlyActive && (
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Showing {activeOrdersCount} active order{activeOrdersCount !== 1 ? 's' : ''} only
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowOnlyActive(false)}
              >
                Show All Orders ({clientOrders.length})
              </Button>
            </div>
          )}
          <OrdersList orders={displayedOrders} />
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
