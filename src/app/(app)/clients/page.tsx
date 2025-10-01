
"use client";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clients } from "@/lib/data";
import Link from "next/link";
import { ClientsList } from "@/components/clients/clients-list";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/contexts/search-context";

export default function ClientsPage() {
    const { searchTerm, setSearchTerm } = useSearch();

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
                      placeholder="Search clients (⌘K)..."
                      className="w-full md:w-[200px] lg:w-[336px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                <ClientsList clients={clients} />
            </CardContent>
        </Card>
    );
}
