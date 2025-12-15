import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Contact } from "@/lib/types";
import { Mail, Phone, Smartphone, Edit, Trash2, Star, AlertTriangle, AlertCircle, BadgeCheck, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

type ContactCardProps = {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
};

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const fullName = `${contact.firstName} ${contact.lastName}`;
  const hasHardBounce = contact.tags?.includes('email_bounced_hard');
  const hasSoftBounce = contact.tags?.includes('email_bounced_soft');
  const isApolloVerified = contact.tags?.includes('apollo-verified');
  const isResearchFound = contact.tags?.includes('research-found');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{fullName}</h4>
              {contact.isPrimary && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Primary
                </Badge>
              )}
              {hasHardBounce && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Hard Bounce
                </Badge>
              )}
              {hasSoftBounce && !hasHardBounce && (
                <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  Soft Bounce
                </Badge>
              )}
              {isApolloVerified && (
                <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {isResearchFound && !isApolloVerified && (
                <Badge variant="outline" className="gap-1 text-cyan-600 border-cyan-600">
                  <Search className="h-3 w-3" />
                  Research
                </Badge>
              )}
            </div>
            {contact.title && (
              <p className="text-sm text-muted-foreground">{contact.title}</p>
            )}
            {contact.department && (
              <p className="text-xs text-muted-foreground">{contact.department}</p>
            )}
            
            <div className="pt-2 space-y-1">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${contact.email}`} 
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${contact.phone}`} 
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.mobile && (
                <div className="flex items-center gap-2 text-sm">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${contact.mobile}`} 
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {contact.mobile}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit(contact);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(contact);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

