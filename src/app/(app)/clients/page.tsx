
"use client";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ClientsList } from "@/components/clients/clients-list";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/contexts/search-context";
import { useEffect, useRef, useState, useMemo } from "react";
import { useClients } from "@/hooks/use-clients";
import { RoleFilter } from "@/components/shared/role-filter";

export default function ClientsPage() {
    const { searchTerm, setSearchTerm } = useSearch();
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
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
                    <Input
                      ref={searchInputRef}
                      placeholder="Search clients (⌘K)..."
                      className="w-full md:w-[200px] lg:w-[336px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <RoleFilter 
                      selectedRoles={selectedRoles} 
                      onChange={setSelectedRoles} 
                    />
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
        </Card>
    );
}
