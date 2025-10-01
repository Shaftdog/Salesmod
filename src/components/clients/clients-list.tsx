
"use client";

import * as React from "react";
import type { Client } from "@/lib/types";
import { useSearch } from "@/contexts/search-context";
import { ClientCard } from "./client-card";
import { Button } from "../ui/button";
import Link from "next/link";

type ClientsListProps = {
    clients: Client[];
};

export function ClientsList({ clients }: ClientsListProps) {
    const { searchTerm } = useSearch();

    const filteredClients = React.useMemo(() => {
        if (!searchTerm) return clients;
        
        const lowercasedTerm = searchTerm.toLowerCase();
        return clients.filter(client => {
            const values = [
                client.companyName,
                client.primaryContact,
                client.email,
                client.phone,
            ].filter(Boolean).map(v => v.toLowerCase());

            return values.some(v => v.includes(lowercasedTerm));
        });

    }, [clients, searchTerm]);


    if (!filteredClients.length) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-semibold">No Clients Found</h3>
                {searchTerm ? (
                     <p className="text-muted-foreground text-sm mt-1">
                        No clients found matching &quot;{searchTerm}&quot;.
                    </p>
                ) : (
                    <>
                        <p className="text-muted-foreground text-sm mt-1">
                            Get started by adding a new client.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="#">New Client</Link>
                        </Button>
                    </>
                )}
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
                <ClientCard key={client.id} client={client} />
            ))}
        </div>
    );
}
