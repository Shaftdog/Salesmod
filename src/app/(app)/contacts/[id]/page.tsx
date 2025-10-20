"use client";

import { useParams } from "next/navigation";
import { useContactDetail, useContactHistory } from "@/hooks/use-contact-detail";
import { useActivities } from "@/hooks/use-activities";
import { useUpdateContact } from "@/hooks/use-contacts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { CompanyHistoryTimeline } from "@/components/contacts/company-history-timeline";
import { TransferCompanyDialog } from "@/components/contacts/transfer-company-dialog";
import { ContactForm } from "@/components/contacts/contact-form";
import { RoleBadge } from "@/components/shared/role-badge";
import { 
  ArrowLeft,
  Mail, 
  Phone, 
  Smartphone, 
  Building2, 
  Edit,
  Star,
  Briefcase,
  Calendar,
  Package,
  Target,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { toast } = useToast();
  const { mutateAsync: updateContact, isPending: isUpdating } = useUpdateContact();

  const { data: contact, isLoading: contactLoading } = useContactDetail(contactId);
  const { data: companyHistory, isLoading: historyLoading } = useContactHistory(contactId);
  const { data: activities, isLoading: activitiesLoading } = useActivities({ contactId });

  if (contactLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <Card className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-2">Contact Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The contact you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/contacts">
          <Button>Back to Contacts</Button>
        </Link>
      </Card>
    );
  }

  const fullName = `${contact.first_name} ${contact.last_name}`;

  const handleEdit = async (data: any) => {
    try {
      await updateContact({
        id: contactId,
        first_name: data.firstName,
        last_name: data.lastName,
        title: data.title,
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        department: data.department,
        notes: data.notes,
        is_primary: data.isPrimary,
        primary_role_code: data.primaryRoleCode || null,
      });
      toast({
        title: "Contact Updated",
        description: `${data.firstName} ${data.lastName} has been updated.`,
      });
      setShowEditDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/contacts" className="hover:text-primary">
          Contacts
        </Link>
        <span>/</span>
        <span className="text-foreground">{fullName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/contacts">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{fullName}</h1>
                {contact.is_primary && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Primary Contact
                  </Badge>
                )}
                <RoleBadge 
                  code={contact.primary_role_code} 
                  label={contact.role?.label} 
                />
              </div>
              {contact.title && (
                <p className="text-lg text-muted-foreground mt-1">
                  {contact.title}
                  {contact.client && (
                    <> @ <Link href={`/clients/${contact.client.id}`} className="hover:text-primary">
                      {contact.client.company_name}
                    </Link></>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Contact Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {contact.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                  {contact.email}
                </a>
              </div>
            </div>
          )}

          {contact.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Office Phone</p>
                <a href={`tel:${contact.phone}`} className="hover:underline">
                  {contact.phone}
                </a>
              </div>
            </div>
          )}

          {contact.mobile && (
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Mobile Phone</p>
                <a href={`tel:${contact.mobile}`} className="hover:underline">
                  {contact.mobile}
                </a>
              </div>
            </div>
          )}

          {contact.department && (
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p>{contact.department}</p>
              </div>
            </div>
          )}

          {contact.client && (
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Current Company</p>
                <Link href={`/clients/${contact.client.id}`} className="text-primary hover:underline">
                  {contact.client.company_name}
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">
            Activity ({contact.activityCount})
          </TabsTrigger>
          <TabsTrigger value="history">
            Company History
          </TabsTrigger>
          <TabsTrigger value="related">
            Related Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          {activitiesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <ActivityTimeline
              contactId={contactId}
              activities={activities || []}
              isLoading={activitiesLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Employment History</h3>
              <p className="text-sm text-muted-foreground">
                Track of companies {contact.first_name} has worked at
              </p>
            </div>
            <Button onClick={() => setShowTransferDialog(true)} variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Transfer Company
            </Button>
          </div>

          {historyLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <CompanyHistoryTimeline
              history={companyHistory || []}
              currentCompanyId={contact.client_id || undefined}
            />
          )}
        </TabsContent>

        <TabsContent value="related" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No orders associated with this contact yet.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No deals associated with this contact yet.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transfer Company Dialog */}
      <TransferCompanyDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        contact={contact}
      />

      {/* Edit Contact Dialog */}
      <ContactForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={handleEdit}
        contact={{
          id: contact.id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          title: contact.title || undefined,
          email: contact.email || undefined,
          phone: contact.phone || undefined,
          mobile: contact.mobile || undefined,
          department: contact.department || undefined,
          notes: contact.notes || undefined,
          isPrimary: contact.is_primary,
          clientId: contact.client_id || '',
          createdAt: contact.created_at,
          updatedAt: contact.updated_at,
        }}
        isLoading={isUpdating}
      />
    </div>
  );
}

