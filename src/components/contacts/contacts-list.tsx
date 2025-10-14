"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContactCard } from "./contact-card";
import { ContactForm } from "./contact-form";
import type { Contact } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { useCreateContact, useUpdateContact, useDeleteContact } from "@/hooks/use-contacts";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-appraisers";

type ContactsListProps = {
  clientId: string;
  contacts: Contact[];
  isLoading?: boolean;
};

export function ContactsList({ clientId, contacts, isLoading }: ContactsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  const { mutateAsync: createContact, isPending: isCreating } = useCreateContact();
  const { mutateAsync: updateContact, isPending: isUpdating } = useUpdateContact();
  const { mutateAsync: deleteContact } = useDeleteContact();
  const { data: currentUser } = useCurrentUser();

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
      await deleteContact(contact.id);
    }
  };

  const handleSubmit = async (data: any) => {
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
    } else {
      await createContact({
        client_id: clientId,
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
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contacts</h3>
        <Button onClick={handleAdd} size="sm" variant="outline">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No contacts yet. Add your first contact to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

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

