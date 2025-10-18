"use client";

import { useState, useMemo } from "react";
import { useContacts } from "@/hooks/use-contacts";
import { ContactCard } from "@/components/contacts/contact-card";
import { ContactForm } from "@/components/contacts/contact-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PlusCircle, 
  Search, 
  Users, 
  Building2, 
  Mail,
  Phone 
} from "lucide-react";
import { useCreateContact, useUpdateContact, useDeleteContact } from "@/hooks/use-contacts";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  const { data: contacts, isLoading } = useContacts();
  const { mutateAsync: createContact, isPending: isCreating } = useCreateContact();
  const { mutateAsync: updateContact, isPending: isUpdating } = useUpdateContact();
  const { mutateAsync: deleteContact } = useDeleteContact();
  const { toast } = useToast();
  const router = useRouter();

  // Filter contacts based on search term
  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!searchTerm) return contacts;

    const search = searchTerm.toLowerCase();
    return contacts.filter(contact => {
      return (
        contact.firstName?.toLowerCase().includes(search) ||
        contact.lastName?.toLowerCase().includes(search) ||
        contact.email?.toLowerCase().includes(search) ||
        contact.title?.toLowerCase().includes(search) ||
        contact.department?.toLowerCase().includes(search) ||
        contact.client?.company_name?.toLowerCase().includes(search)
      );
    });
  }, [contacts, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!contacts) return { total: 0, primary: 0, withEmail: 0, withPhone: 0 };
    
    return {
      total: contacts.length,
      primary: contacts.filter(c => c.isPrimary).length,
      withEmail: contacts.filter(c => c.email).length,
      withPhone: contacts.filter(c => c.phone || c.mobile).length,
    };
  }, [contacts]);

  const handleAdd = () => {
    setEditingContact(null);
    setShowForm(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDelete = async (contact: Contact) => {
    if (window.confirm(`Delete ${contact.firstName} ${contact.lastName}?`)) {
      try {
        await deleteContact(contact.id);
        toast({
          title: "Contact Deleted",
          description: `${contact.firstName} ${contact.lastName} has been deleted.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete contact",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingContact) {
        await updateContact({
          id: editingContact.id,
          first_name: data.firstName,
          last_name: data.lastName,
          title: data.title,
          email: data.email,
          phone: data.phone,
          mobile: data.mobile,
          department: data.department,
          notes: data.notes,
          is_primary: data.isPrimary,
        });
        toast({
          title: "Contact Updated",
          description: `${data.firstName} ${data.lastName} has been updated.`,
        });
      } else {
        // For new contacts, need to associate with a client
        // In a real implementation, you'd have a client selector in the form
        toast({
          title: "Info",
          description: "Please create contacts from the client detail page for now.",
          variant: "default",
        });
      }
      setShowForm(false);
      setEditingContact(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save contact",
        variant: "destructive",
      });
    }
  };

  const handleContactClick = (contact: Contact) => {
    router.push(`/contacts/${contact.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8" />
            Contacts
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all your business contacts across clients
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Primary Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.primary}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withEmail}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Phone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withPhone}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts by name, email, title, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          {searchTerm ? (
            <>
              <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
              <p className="text-muted-foreground mb-4">
                No contacts match your search &quot;{searchTerm}&quot;
              </p>
              <Button onClick={() => setSearchTerm("")} variant="outline">
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
              <p className="text-muted-foreground mb-4">
                Add contacts from client pages to get started
              </p>
              <Link href="/clients">
                <Button>
                  <Building2 className="h-4 w-4 mr-2" />
                  View Clients
                </Button>
              </Link>
            </>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <div key={contact.id} className="space-y-2">
              <div 
                onClick={() => handleContactClick(contact)}
                className="cursor-pointer"
              >
                <ContactCard
                  contact={contact}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
              
              {/* Company Link */}
              {contact.client && (
                <Link
                  href={`/clients/${contact.client.id}`}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary pl-4"
                >
                  <Building2 className="h-3 w-3" />
                  {contact.client.company_name}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search Results Count */}
      {searchTerm && filteredContacts.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredContacts.length} of {contacts?.length} contacts
        </p>
      )}

      {/* Contact Form Dialog */}
      <ContactForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmit}
        contact={editingContact || undefined}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
}

