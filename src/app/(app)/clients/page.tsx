
"use client";
import { PlusCircle, Combine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ClientsList } from "@/components/clients/clients-list";
import { MergeClientsDialog } from "@/components/clients/merge-clients-dialog";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { useSearch } from "@/contexts/search-context";
import { useEffect, useRef, useState, useMemo } from "react";
import { useClients } from "@/hooks/use-clients";
import { RoleFilter } from "@/components/shared/role-filter";

export default function ClientsPage() {
    const { searchTerm, setSearchTerm } = useSearch();
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [showMergeDialog, setShowMergeDialog] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { clients, isLoading } = useClients();

    // Filter clients by role
    const filteredClients = useMemo(() => {
      if (!clients) return [];
      if (selectedRoles.length === 0) return clients;
      
      return clients.filter(client => 
        client.primaryRoleCode && selectedRoles.includes(client.primaryRoleCode)
      );
    }, [clients, selectedRoles]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    return (
        <Card>
            <CardHeader className="flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <CardTitle>Clients</CardTitle>
                    <CardDescription>
                        Manage your clients and view their details.
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-[200px] lg:w-[336px]">
                        <Input
                          ref={searchInputRef}
                          placeholder="Search clients..."
                          className="w-full pr-12"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:block">
                            <Kbd>⌘K</Kbd>
                        </div>
                    </div>
                    <RoleFilter
                      selectedRoles={selectedRoles}
                      onChange={setSelectedRoles}
                    />
                    <Button onClick={() => setShowMergeDialog(true)} size="sm" variant="outline" className="gap-1">
                        <Combine className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Find Duplicates
                        </span>
                    </Button>
                    <Button asChild size="sm" className="gap-1">
                        <Link href="/clients/new">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                New Client
                            </span>
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ClientsList clients={filteredClients} isLoading={isLoading} />
            </CardContent>

            {/* Merge Clients Dialog */}
            <MergeClientsDialog
                open={showMergeDialog}
                onOpenChange={setShowMergeDialog}
            />
        </Card>
    );
}
