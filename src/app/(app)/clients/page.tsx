
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clients } from "@/lib/data";
import Link from "next/link";
import { ClientsList } from "@/components/clients/clients-list";

export default function ClientsPage() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Clients</CardTitle>
                    <CardDescription>
                        Manage your clients and view their details.
                    </CardDescription>
                </div>
                 <Button asChild size="sm" className="gap-1">
                    <Link href="#">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            New Client
                        </span>
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <ClientsList clients={clients} />
            </CardContent>
        </Card>
    );
}
