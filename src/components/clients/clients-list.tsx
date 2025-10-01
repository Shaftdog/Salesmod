
"use client";

import * as React from "react";
import type { Client } from "@/lib/types";
import { useSearch } from "@/contexts/search-context";
import { ClientCard } from "./client-card";

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
        return <p className="text-center text-muted-foreground py-12">No clients found.</p>;
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
                <ClientCard key={client.id} client={client} />
            ))}
        </div>
    );
}
