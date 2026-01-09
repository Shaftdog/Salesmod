"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, User, Mail, Phone } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface OrderContact {
  contactId: string;
  roleCode: string;
  roleLabel: string;
  roleCategory?: string;
  isPrimary: boolean;
  contact: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    title: string | null;
  } | null;
}

interface OrderContactsSectionProps {
  orderId: string;
}

const ROLE_OPTIONS = [
  { value: "borrower", label: "Borrower" },
  { value: "loan_officer", label: "Loan Officer" },
  { value: "processor", label: "Processor" },
  { value: "property_contact", label: "Property Contact" },
  { value: "realtor", label: "Realtor" },
  { value: "listing_agent", label: "Listing Agent" },
  { value: "buying_agent", label: "Buying Agent" },
  { value: "cc", label: "CC (Email Recipient)" },
  { value: "orderer", label: "Orderer" },
];

const ROLE_COLORS: Record<string, string> = {
  borrower: "bg-blue-100 text-blue-800",
  loan_officer: "bg-purple-100 text-purple-800",
  processor: "bg-indigo-100 text-indigo-800",
  property_contact: "bg-green-100 text-green-800",
  realtor: "bg-orange-100 text-orange-800",
  listing_agent: "bg-orange-100 text-orange-800",
  buying_agent: "bg-orange-100 text-orange-800",
  cc: "bg-gray-100 text-gray-800",
  orderer: "bg-teal-100 text-teal-800",
};

export function OrderContactsSection({ orderId }: OrderContactsSectionProps) {
  const [contacts, setContacts] = useState<OrderContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [newContact, setNewContact] = useState({
    fullName: "",
    title: "",
    email: "",
    phone: "",
    role: "cc",
  });

  const fetchContacts = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/contacts`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchContacts();
    }
  }, [orderId]);

  const handleAddContact = async () => {
    if (!newContact.fullName) {
      toast.error("Full name is required");
      return;
    }
    if (!newContact.email && !newContact.phone) {
      toast.error("Email or phone is required");
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: [{
            fullName: newContact.fullName,
            title: newContact.title || null,
            email: newContact.email || null,
            phone: newContact.phone || null,
            role: newContact.role,
          }],
        }),
      });

      if (response.ok) {
        toast.success("Contact added successfully");
        setAddDialogOpen(false);
        setNewContact({ fullName: "", title: "", email: "", phone: "", role: "cc" });
        fetchContacts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add contact");
      }
    } catch (error) {
      toast.error("Failed to add contact");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteContact = async (contactId: string, roleCode: string) => {
    setDeleting(contactId);
    try {
      const response = await fetch(
        `/api/orders/${orderId}/contacts?contactId=${contactId}&roleCode=${roleCode}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Contact removed");
        fetchContacts();
      } else {
        toast.error("Failed to remove contact");
      }
    } catch (error) {
      toast.error("Failed to remove contact");
    } finally {
      setDeleting(null);
    }
  };

  const getRoleLabel = (roleCode: string) => {
    const role = ROLE_OPTIONS.find(r => r.value === roleCode);
    return role?.label || roleCode.replace(/_/g, " ");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Related Contacts</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Related Contacts</CardTitle>
              <CardDescription>
                People associated with this order (borrower, loan officer, CC recipients, etc.)
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No contacts linked to this order yet.</p>
              <p className="text-sm">Add contacts to track everyone involved.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((oc) => (
                  <TableRow key={`${oc.contactId}-${oc.roleCode}`}>
                    <TableCell className="font-medium">
                      {oc.contact?.fullName || "Unknown"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {oc.contact?.title || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={ROLE_COLORS[oc.roleCode] || "bg-gray-100"}
                      >
                        {getRoleLabel(oc.roleCode)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {oc.contact?.email ? (
                        <a
                          href={`mailto:${oc.contact.email}`}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {oc.contact.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {oc.contact?.phone || oc.contact?.mobile ? (
                        <a
                          href={`tel:${oc.contact.phone || oc.contact.mobile}`}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {oc.contact.phone || oc.contact.mobile}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteContact(oc.contactId, oc.roleCode)}
                        disabled={deleting === oc.contactId}
                      >
                        {deleting === oc.contactId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact to Order</DialogTitle>
            <DialogDescription>
              Link a contact to this order. They will be associated with the specified role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={newContact.fullName}
                onChange={(e) => setNewContact({ ...newContact, fullName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newContact.title}
                onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                placeholder="e.g., Loan Officer, Account Manager, VP Operations"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={newContact.role}
                onValueChange={(value) => setNewContact({ ...newContact, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <p className="text-xs text-muted-foreground">* Email or phone is required</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContact} disabled={adding}>
              {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
